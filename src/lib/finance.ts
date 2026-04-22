import type { Prisma } from '@prisma/client'

export const INVOICE_STATUSES = ['DRAFT', 'OPEN', 'PARTIAL', 'PAID', 'OVERDUE', 'VOID'] as const
export const PAYMENT_STATUSES = ['CONFIRMED', 'REVERSED'] as const
export const INVOICE_ITEM_SOURCE_TYPES = ['REGISTRATION_FEE', 'MANUAL', 'DISCOUNT', 'ADJUSTMENT'] as const

export type InvoiceStatus = (typeof INVOICE_STATUSES)[number]
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number]
export type InvoiceItemSourceType = (typeof INVOICE_ITEM_SOURCE_TYPES)[number]

export const DEFAULT_INVOICE_DUE_DAYS = 15

export function centsFromAmount(value: number) {
  if (!Number.isFinite(value)) return 0
  return Math.max(0, Math.round(value * 100))
}

export function centsFromCurrencyInput(value: unknown) {
  if (typeof value === 'number') return centsFromAmount(value)
  const raw = String(value || '')
    .replace(/[^\d,.-]/g, '')
  const normalized = raw.includes(',')
    ? raw.replace(/\./g, '').replace(',', '.')
    : raw.replace(/\.(?=\d{3}(\D|$))/g, '')
  return centsFromAmount(Number(normalized))
}

export function formatCurrencyCentsBRL(valueCents: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format((valueCents || 0) / 100)
}

export function getFinanceSeasonYear(date = new Date()) {
  return date.getFullYear()
}

export function getDefaultFinancePeriod(date = new Date()) {
  const year = getFinanceSeasonYear(date)
  return {
    year,
    start: new Date(Date.UTC(year, 0, 1, 0, 0, 0)),
    end: new Date(Date.UTC(year, 11, 31, 23, 59, 59, 999)),
  }
}

export function getDefaultDueDate(issueDate = new Date()) {
  const dueDate = new Date(issueDate)
  dueDate.setDate(dueDate.getDate() + DEFAULT_INVOICE_DUE_DAYS)
  return dueDate
}

export function normalizeInvoiceStatus(status?: string | null): InvoiceStatus {
  const normalized = String(status || 'DRAFT').toUpperCase()
  return INVOICE_STATUSES.includes(normalized as InvoiceStatus) ? normalized as InvoiceStatus : 'DRAFT'
}

export function normalizePaymentStatus(status?: string | null): PaymentStatus {
  const normalized = String(status || 'CONFIRMED').toUpperCase()
  return PAYMENT_STATUSES.includes(normalized as PaymentStatus) ? normalized as PaymentStatus : 'CONFIRMED'
}

export function normalizeInvoiceItemSourceType(sourceType?: string | null): InvoiceItemSourceType {
  const normalized = String(sourceType || 'MANUAL').toUpperCase()
  return INVOICE_ITEM_SOURCE_TYPES.includes(normalized as InvoiceItemSourceType)
    ? normalized as InvoiceItemSourceType
    : 'MANUAL'
}

export function getEffectiveInvoiceStatus(invoice: {
  status: string
  dueDate?: Date | string | null
  balanceCents: number
}) {
  const status = normalizeInvoiceStatus(invoice.status)
  if (status === 'VOID' || status === 'DRAFT' || status === 'PAID') return status

  const dueDate = invoice.dueDate ? new Date(invoice.dueDate) : null
  if (dueDate && dueDate.getTime() < Date.now() && invoice.balanceCents > 0) {
    return 'OVERDUE' satisfies InvoiceStatus
  }

  return status
}

export function getInvoiceStatusLabel(status: string) {
  const normalized = normalizeInvoiceStatus(status)
  const labels: Record<InvoiceStatus, string> = {
    DRAFT: 'Rascunho',
    OPEN: 'Aberta',
    PARTIAL: 'Parcial',
    PAID: 'Paga',
    OVERDUE: 'Vencida',
    VOID: 'Cancelada',
  }
  return labels[normalized]
}

export function getInvoiceStatusClassName(status: string) {
  const normalized = normalizeInvoiceStatus(status)
  const classes: Record<InvoiceStatus, string> = {
    DRAFT: 'border-slate-200 bg-slate-100 text-slate-600',
    OPEN: 'border-yellow-200 bg-yellow-50 text-yellow-800',
    PARTIAL: 'border-orange-200 bg-orange-50 text-orange-700',
    PAID: 'border-green-200 bg-green-50 text-green-700',
    OVERDUE: 'border-red-200 bg-red-50 text-red-700',
    VOID: 'border-slate-300 bg-slate-200 text-slate-700',
  }
  return classes[normalized]
}

export function calculateInvoiceTotals(
  items: Array<{ totalCents: number }>,
  payments: Array<{ amountCents: number; status: string }>,
  discountCents = 0
) {
  const positiveItemsCents = items.reduce((sum, item) => sum + Math.max(0, item.totalCents || 0), 0)
  const negativeItemsCents = items.reduce((sum, item) => sum + Math.min(0, item.totalCents || 0), 0)
  const subtotalCents = positiveItemsCents
  const explicitDiscountCents = Math.min(Math.max(0, discountCents || 0), subtotalCents)
  const totalCents = Math.max(0, subtotalCents + negativeItemsCents - explicitDiscountCents)
  const paidCents = payments
    .filter((payment) => normalizePaymentStatus(payment.status) === 'CONFIRMED')
    .reduce((sum, payment) => sum + Math.max(0, payment.amountCents || 0), 0)
  const balanceCents = Math.max(0, totalCents - paidCents)

  return {
    subtotalCents,
    discountCents: explicitDiscountCents,
    totalCents,
    paidCents,
    balanceCents,
  }
}

export function resolveStatusAfterPayment(currentStatus: string, totalCents: number, paidCents: number, balanceCents: number) {
  const normalized = normalizeInvoiceStatus(currentStatus)
  if (normalized === 'VOID' || normalized === 'DRAFT') return normalized
  if (totalCents > 0 && balanceCents === 0) return 'PAID' satisfies InvoiceStatus
  if (paidCents > 0) return 'PARTIAL' satisfies InvoiceStatus
  return getEffectiveInvoiceStatus({ status: 'OPEN', balanceCents, dueDate: null })
}

export function buildInvoiceItemTotal(quantity: number, unitValueCents: number) {
  return Math.max(1, quantity || 1) * Math.max(0, unitValueCents || 0)
}

export async function generateFinancialInvoiceNumber(
  tx: Prisma.TransactionClient,
  issueDate = new Date()
) {
  const year = getFinanceSeasonYear(issueDate)
  const prefix = `FGB-${year}-`
  const latest = await tx.financialInvoice.findFirst({
    where: { number: { startsWith: prefix } },
    orderBy: { number: 'desc' },
    select: { number: true },
  })

  const latestSequence = latest?.number ? Number(latest.number.slice(prefix.length)) || 0 : 0
  return `${prefix}${String(latestSequence + 1).padStart(6, '0')}`
}

export async function recalculateFinancialInvoice(
  tx: Prisma.TransactionClient,
  invoiceId: string,
  options: { keepDraft?: boolean } = {}
) {
  const invoice = await tx.financialInvoice.findUnique({
    where: { id: invoiceId },
    include: {
      items: { select: { totalCents: true } },
      payments: { select: { amountCents: true, status: true } },
    },
  })

  if (!invoice) throw new Error('INVOICE_NOT_FOUND')

  const totals = calculateInvoiceTotals(invoice.items, invoice.payments, invoice.discountCents)
  const currentStatus = normalizeInvoiceStatus(invoice.status)
  const nextStatus =
    options.keepDraft && currentStatus === 'DRAFT'
      ? 'DRAFT'
      : resolveStatusAfterPayment(currentStatus === 'DRAFT' ? 'OPEN' : currentStatus, totals.totalCents, totals.paidCents, totals.balanceCents)

  return tx.financialInvoice.update({
    where: { id: invoiceId },
    data: {
      ...totals,
      status: nextStatus,
    },
  })
}

export function serializeInvoice(invoice: any) {
  const effectiveStatus = getEffectiveInvoiceStatus(invoice)
  return {
    ...invoice,
    effectiveStatus,
    statusLabel: getInvoiceStatusLabel(effectiveStatus),
  }
}
