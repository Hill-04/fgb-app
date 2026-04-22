import type { Prisma, PrismaClient } from '@prisma/client'

import { prisma } from '@/lib/db'
import {
  calculateInvoiceTotals,
  generateFinancialInvoiceNumber,
  getDefaultDueDate,
  getEffectiveInvoiceStatus,
  normalizeInvoiceItemSourceType,
  normalizePaymentStatus,
  recalculateFinancialInvoice,
  serializeInvoice,
} from '@/lib/finance'
import { FINANCIAL_INVOICE_INCLUDE } from '@/lib/finance-server'

type PrismaLike = PrismaClient | Prisma.TransactionClient

type CreateInvoiceFromRegistrationOptions = {
  createdByUserId?: string | null
  context?: string
}

const registrationInvoiceLocks = new Map<string, Promise<any>>()

export class RegistrationInvoiceGenerationError extends Error {
  status: number

  constructor(message: string, status = 400) {
    super(message)
    this.name = 'RegistrationInvoiceGenerationError'
    this.status = status
  }
}

export class FinancialInvoiceOperationError extends Error {
  status: number

  constructor(message: string, status = 400) {
    super(message)
    this.name = 'FinancialInvoiceOperationError'
    this.status = status
  }
}

export type InvoiceEditPolicy = {
  status: string
  hasConfirmedPayment: boolean
  canEditDueDate: boolean
  canEditNotes: boolean
  canAddItem: boolean
  canRemoveManualItem: boolean
  canVoid: boolean
  canIssue: boolean
  canPay: boolean
  lockedReason?: string
}

export function getInvoiceEditPolicy(invoice: {
  status: string
  dueDate?: Date | string | null
  balanceCents: number
  payments?: Array<{ amountCents: number; status: string }>
}): InvoiceEditPolicy {
  const status = getEffectiveInvoiceStatus(invoice)
  const hasConfirmedPayment = Boolean(
    invoice.payments?.some(
      (payment) => normalizePaymentStatus(payment.status) === 'CONFIRMED' && payment.amountCents > 0
    )
  )
  const isOpenLike = status === 'OPEN' || status === 'OVERDUE'

  return {
    status,
    hasConfirmedPayment,
    canEditDueDate: status === 'DRAFT' || isOpenLike || status === 'PARTIAL',
    canEditNotes: status !== 'VOID',
    canAddItem: status === 'DRAFT' || (isOpenLike && !hasConfirmedPayment),
    canRemoveManualItem: status === 'DRAFT' || (isOpenLike && !hasConfirmedPayment),
    canVoid: (status === 'DRAFT' || isOpenLike) && !hasConfirmedPayment,
    canIssue: status === 'DRAFT',
    canPay: (isOpenLike || status === 'PARTIAL') && invoice.balanceCents > 0,
    lockedReason:
      status === 'PAID'
        ? 'Fatura paga nao permite edicao financeira.'
        : status === 'VOID'
          ? 'Fatura cancelada nao permite edicao.'
          : hasConfirmedPayment
            ? 'Fatura com pagamento confirmado tem composicao bloqueada.'
            : undefined,
  }
}

function assertInvoiceOperation(condition: boolean, message: string) {
  if (!condition) throw new FinancialInvoiceOperationError(message)
}

async function createInvoiceAuditLog(
  tx: Prisma.TransactionClient,
  data: {
    invoiceId: string
    action: string
    description: string
    createdByUserId?: string | null
    metadata?: Record<string, unknown>
  }
) {
  return tx.financialAuditLog.create({
    data: {
      invoiceId: data.invoiceId,
      action: data.action,
      description: data.description,
      createdByUserId: data.createdByUserId || null,
      metadataJson: data.metadata ? JSON.stringify(data.metadata) : null,
    },
  })
}

export async function updateFinancialInvoiceFields(
  invoiceId: string,
  input: { dueDate?: string | Date | null; notes?: string | null },
  options: { createdByUserId?: string | null } = {}
) {
  return prisma.$transaction(async (tx) => {
    const invoice = await tx.financialInvoice.findUnique({
      where: { id: invoiceId },
      include: { payments: true },
    })
    if (!invoice) throw new FinancialInvoiceOperationError('Fatura nao encontrada.', 404)

    const policy = getInvoiceEditPolicy(invoice)
    const data: Prisma.FinancialInvoiceUpdateInput = {}
    const metadata: Record<string, unknown> = {}

    if ('dueDate' in input) {
      assertInvoiceOperation(policy.canEditDueDate, 'O vencimento nao pode ser alterado no status atual da fatura.')
      data.dueDate = input.dueDate ? new Date(input.dueDate) : null
      metadata.previousDueDate = invoice.dueDate?.toISOString() || null
      metadata.nextDueDate = data.dueDate instanceof Date ? data.dueDate.toISOString() : null
    }

    if ('notes' in input) {
      assertInvoiceOperation(policy.canEditNotes, 'As observacoes nao podem ser alteradas no status atual da fatura.')
      data.notes = typeof input.notes === 'string' ? input.notes : null
      metadata.previousNotes = invoice.notes
      metadata.nextNotes = data.notes
    }

    assertInvoiceOperation(Object.keys(data).length > 0, 'Nenhum campo valido para atualizar.')

    await tx.financialInvoice.update({ where: { id: invoiceId }, data })
    await createInvoiceAuditLog(tx, {
      invoiceId,
      action: 'UPDATED',
      description: 'Campos administrativos da fatura atualizados.',
      createdByUserId: options.createdByUserId,
      metadata,
    })

    return tx.financialInvoice.findUniqueOrThrow({
      where: { id: invoiceId },
      include: FINANCIAL_INVOICE_INCLUDE,
    })
  })
}

export async function addFinancialInvoiceItem(
  invoiceId: string,
  input: {
    description: string
    quantity?: number
    unitValueCents?: number
    amountCents?: number
    sourceType?: string
    feeKey?: string | null
  },
  options: { createdByUserId?: string | null } = {}
) {
  return prisma.$transaction(async (tx) => {
    const invoice = await tx.financialInvoice.findUnique({
      where: { id: invoiceId },
      include: { payments: true },
    })
    if (!invoice) throw new FinancialInvoiceOperationError('Fatura nao encontrada.', 404)

    const policy = getInvoiceEditPolicy(invoice)
    assertInvoiceOperation(policy.canAddItem, 'Nao e permitido adicionar itens no status atual da fatura.')

    const sourceType = normalizeInvoiceItemSourceType(input.sourceType || 'MANUAL')
    assertInvoiceOperation(
      sourceType !== 'REGISTRATION_FEE',
      'Itens originados de inscricao devem ser gerados pelo fluxo de inscricao.'
    )

    const description = String(input.description || '').trim()
    assertInvoiceOperation(Boolean(description), 'Informe a descricao do item.')

    const quantity = Math.max(1, Number(input.quantity || 1))
    const rawUnitValueCents = Math.max(0, Number(input.unitValueCents ?? input.amountCents ?? 0))
    assertInvoiceOperation(rawUnitValueCents > 0, 'Informe um valor valido para o item.')

    const sign = sourceType === 'DISCOUNT' ? -1 : 1
    const unitValueCents = sign * rawUnitValueCents
    const totalCents = unitValueCents * quantity

    const item = await tx.financialInvoiceItem.create({
      data: {
        invoiceId,
        description,
        quantity,
        unitValueCents,
        totalCents,
        sourceType,
        feeKey: input.feeKey ? String(input.feeKey).trim().toUpperCase() : null,
      },
    })

    await createInvoiceAuditLog(tx, {
      invoiceId,
      action:
        sourceType === 'DISCOUNT'
          ? 'DISCOUNT_APPLIED'
          : sourceType === 'ADJUSTMENT'
            ? 'ADJUSTMENT_APPLIED'
            : 'ITEM_ADDED',
      description:
        sourceType === 'DISCOUNT'
          ? 'Desconto adicionado a fatura.'
          : sourceType === 'ADJUSTMENT'
            ? 'Ajuste financeiro adicionado a fatura.'
            : 'Item manual adicionado a fatura.',
      createdByUserId: options.createdByUserId,
      metadata: {
        itemId: item.id,
        description,
        quantity,
        unitValueCents,
        totalCents,
        sourceType,
      },
    })

    await recalculateFinancialInvoice(tx, invoiceId, { keepDraft: invoice.status === 'DRAFT' })
    return tx.financialInvoice.findUniqueOrThrow({
      where: { id: invoiceId },
      include: FINANCIAL_INVOICE_INCLUDE,
    })
  })
}

export async function removeFinancialInvoiceItem(
  invoiceId: string,
  itemId: string,
  options: { createdByUserId?: string | null } = {}
) {
  return prisma.$transaction(async (tx) => {
    const item = await tx.financialInvoiceItem.findFirst({
      where: { id: itemId, invoiceId },
      include: { invoice: { include: { payments: true } } },
    })
    if (!item) throw new FinancialInvoiceOperationError('Item da fatura nao encontrado.', 404)

    const policy = getInvoiceEditPolicy(item.invoice)
    assertInvoiceOperation(policy.canRemoveManualItem, 'Nao e permitido remover itens no status atual da fatura.')
    assertInvoiceOperation(
      !item.registrationFeeId && item.sourceType !== 'REGISTRATION_FEE',
      'Itens originados da inscricao nao podem ser removidos manualmente.'
    )

    await tx.financialInvoiceItem.delete({ where: { id: item.id } })
    await createInvoiceAuditLog(tx, {
      invoiceId,
      action: item.sourceType === 'DISCOUNT' ? 'DISCOUNT_REMOVED' : 'ITEM_REMOVED',
      description: 'Item manual removido da fatura.',
      createdByUserId: options.createdByUserId,
      metadata: {
        itemId: item.id,
        description: item.description,
        totalCents: item.totalCents,
        sourceType: item.sourceType,
      },
    })

    await recalculateFinancialInvoice(tx, invoiceId, { keepDraft: item.invoice.status === 'DRAFT' })
    return tx.financialInvoice.findUniqueOrThrow({
      where: { id: invoiceId },
      include: FINANCIAL_INVOICE_INCLUDE,
    })
  })
}

export async function voidFinancialInvoice(
  invoiceId: string,
  input: { reason?: string | null },
  options: { createdByUserId?: string | null } = {}
) {
  return prisma.$transaction(async (tx) => {
    const invoice = await tx.financialInvoice.findUnique({
      where: { id: invoiceId },
      include: { payments: true },
    })
    if (!invoice) throw new FinancialInvoiceOperationError('Fatura nao encontrada.', 404)

    const policy = getInvoiceEditPolicy(invoice)
    assertInvoiceOperation(policy.canVoid, 'Esta fatura nao pode ser cancelada no status atual.')

    const reason = String(input.reason || '').trim()
    assertInvoiceOperation(Boolean(reason), 'Informe o motivo do cancelamento.')

    await createInvoiceAuditLog(tx, {
      invoiceId,
      action: 'VOIDED',
      description: reason,
      createdByUserId: options.createdByUserId,
      metadata: {
        previousStatus: invoice.status,
        totalCents: invoice.totalCents,
        paidCents: invoice.paidCents,
        balanceCents: invoice.balanceCents,
      },
    })

    return tx.financialInvoice.update({
      where: { id: invoiceId },
      data: { status: 'VOID' },
      include: FINANCIAL_INVOICE_INCLUDE,
    })
  })
}

function isUniqueConstraintError(error: any) {
  return error?.code === 'P2002' || String(error?.message || '').includes('FinancialInvoice_active_registration_unique')
}

export async function assertRegistrationHasBillableFees(registrationId: string, db: PrismaLike = prisma) {
  const registration = await db.registration.findUnique({
    where: { id: registrationId },
    select: {
      id: true,
      fees: {
        select: {
          id: true,
          status: true,
          totalValue: true,
        },
      },
    },
  })

  if (!registration) {
    throw new RegistrationInvoiceGenerationError('Inscricao nao encontrada.', 404)
  }

  const billableFees = registration.fees.filter((fee) => fee.status !== 'WAIVED' && fee.totalValue > 0)
  if (billableFees.length === 0) {
    throw new RegistrationInvoiceGenerationError(
      'A inscricao nao possui taxas validas para faturamento. Gere ou revise as taxas antes de confirmar.',
      400
    )
  }

  return { registrationId, billableFeeCount: billableFees.length }
}

async function findActiveRegistrationInvoice(registrationId: string, db: PrismaLike = prisma) {
  return db.financialInvoice.findFirst({
    where: { registrationId, status: { not: 'VOID' } },
    include: FINANCIAL_INVOICE_INCLUDE,
    orderBy: { createdAt: 'desc' },
  })
}

async function createInvoiceFromRegistrationUnsafe(
  registrationId: string,
  options: CreateInvoiceFromRegistrationOptions = {}
) {
  return prisma.$transaction(async (tx) => {
    const existingInvoice = await findActiveRegistrationInvoice(registrationId, tx)
    if (existingInvoice) {
      await tx.financialAuditLog.create({
        data: {
          invoiceId: existingInvoice.id,
          action: 'AUTO_GENERATION_SKIPPED',
          description:
            existingInvoice.status === 'DRAFT'
              ? 'Geracao automatica ignorada: ja existe fatura ativa em rascunho para esta inscricao.'
              : 'Geracao automatica ignorada: ja existe fatura ativa para esta inscricao.',
          createdByUserId: options.createdByUserId || null,
          metadataJson: JSON.stringify({
            registrationId,
            context: options.context || 'AUTO_CONFIRMATION',
            existingStatus: existingInvoice.status,
            knownConcurrencyRisk: 'Aplicacao tambem possui indice unico parcial para reduzir duplicidade em confirmacoes simultaneas.',
          }),
        },
      })

      return {
        action: existingInvoice.status === 'DRAFT' ? 'existing_draft' : 'existing_active',
        invoice: serializeInvoice(existingInvoice),
      }
    }

    const registration = await tx.registration.findUnique({
      where: { id: registrationId },
      include: {
        team: { select: { id: true, name: true } },
        championship: { select: { id: true, name: true } },
        fees: { orderBy: { createdAt: 'asc' } },
      },
    })

    if (!registration) {
      throw new RegistrationInvoiceGenerationError('Inscricao nao encontrada.', 404)
    }

    const billableFees = registration.fees.filter((fee) => fee.status !== 'WAIVED' && fee.totalValue > 0)
    if (billableFees.length === 0) {
      throw new RegistrationInvoiceGenerationError(
        'A inscricao nao possui taxas validas para faturamento. Gere ou revise as taxas antes de confirmar.',
        400
      )
    }

    const issueDate = new Date()
    const items = billableFees.map((fee) => ({
      registrationFeeId: fee.id,
      feeKey: fee.feeKey,
      description: fee.feeLabel,
      quantity: fee.quantity,
      unitValueCents: Math.round(fee.unitValue * 100),
      totalCents: Math.round(fee.totalValue * 100),
      sourceType: 'REGISTRATION_FEE',
    }))
    const totals = calculateInvoiceTotals(items, [], 0)
    const number = await generateFinancialInvoiceNumber(tx, issueDate)

    const invoice = await tx.financialInvoice.create({
      data: {
        number,
        teamId: registration.teamId,
        championshipId: registration.championshipId,
        registrationId: registration.id,
        status: 'OPEN',
        issueDate,
        dueDate: getDefaultDueDate(issueDate),
        subtotalCents: totals.subtotalCents,
        discountCents: totals.discountCents,
        totalCents: totals.totalCents,
        paidCents: 0,
        balanceCents: totals.balanceCents,
        notes: `Fatura gerada automaticamente a partir da inscricao de ${registration.team.name} em ${registration.championship.name}.`,
        items: { create: items },
        auditLogs: {
          create: {
            action: 'CREATED_FROM_REGISTRATION_AUTO',
            description: 'Fatura criada automaticamente a partir da confirmacao da inscricao.',
            createdByUserId: options.createdByUserId || null,
            metadataJson: JSON.stringify({
              registrationId: registration.id,
              context: options.context || 'AUTO_CONFIRMATION',
              totalCents: totals.totalCents,
              itemCount: items.length,
              teamId: registration.teamId,
              championshipId: registration.championshipId,
            }),
          },
        },
      },
      include: FINANCIAL_INVOICE_INCLUDE,
    })

    return {
      action: 'created',
      invoice: serializeInvoice(invoice),
    }
  })
}

export async function createInvoiceFromRegistration(
  registrationId: string,
  options: CreateInvoiceFromRegistrationOptions = {}
) {
  const existingLock = registrationInvoiceLocks.get(registrationId)
  if (existingLock) {
    return existingLock
  }

  const task = createInvoiceFromRegistrationUnsafe(registrationId, options).catch(async (error) => {
    if (isUniqueConstraintError(error)) {
      const existingInvoice = await findActiveRegistrationInvoice(registrationId)
      if (existingInvoice) {
        return {
          action: existingInvoice.status === 'DRAFT' ? 'existing_draft' : 'existing_active',
          invoice: serializeInvoice(existingInvoice),
        }
      }
    }

    throw error
  }).finally(() => {
    registrationInvoiceLocks.delete(registrationId)
  })

  registrationInvoiceLocks.set(registrationId, task)
  return task
}
