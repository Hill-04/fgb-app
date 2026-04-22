import { getServerSession } from 'next-auth'

import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { normalizeInvoiceItemSourceType, serializeInvoice } from '@/lib/finance'

export const FINANCIAL_INVOICE_INCLUDE = {
  team: { select: { id: true, name: true, city: true, state: true } },
  championship: { select: { id: true, name: true, year: true } },
  registration: { select: { id: true, status: true } },
  items: { orderBy: { createdAt: 'asc' as const } },
  payments: { orderBy: { paidAt: 'desc' as const } },
  auditLogs: {
    orderBy: { createdAt: 'desc' as const },
    include: { createdBy: { select: { id: true, name: true, email: true } } },
  },
}

export async function requireAdminSession() {
  const session = await getServerSession(authOptions)
  if (!session || !(session.user as any)?.isAdmin) return null
  return session
}

export async function requireTeamSession() {
  const session = await getServerSession(authOptions)
  const teamId = (session?.user as any)?.teamId
  if (!session || !teamId) return null
  return { session, teamId }
}

export async function getFinancialInvoiceById(id: string) {
  const invoice = await prisma.financialInvoice.findUnique({
    where: { id },
    include: FINANCIAL_INVOICE_INCLUDE,
  })

  return invoice ? serializeInvoice(invoice) : null
}

export function normalizeInvoiceItemsInput(items: any[]) {
  return items
    .map((item) => {
      const quantity = Math.max(1, Number(item.quantity || 1))
      const unitValueCents = Math.max(0, Number(item.unitValueCents || 0))
      const sourceType = normalizeInvoiceItemSourceType(
        item.sourceType || (item.registrationFeeId ? 'REGISTRATION_FEE' : 'MANUAL')
      )
      const sign = sourceType === 'DISCOUNT' ? -1 : 1
      const totalCents = sign * Math.max(0, Number(item.totalCents ?? quantity * unitValueCents))

      return {
        registrationFeeId: item.registrationFeeId ? String(item.registrationFeeId) : null,
        feeKey: item.feeKey ? String(item.feeKey).trim().toUpperCase() : null,
        description: String(item.description || item.feeLabel || '').trim(),
        quantity,
        unitValueCents,
        totalCents,
        sourceType,
      }
    })
    .filter((item) => item.description && item.totalCents !== 0)
}
