import type { Prisma, PrismaClient } from '@prisma/client'

import { prisma } from '@/lib/db'
import {
  calculateInvoiceTotals,
  generateFinancialInvoiceNumber,
  getDefaultDueDate,
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
