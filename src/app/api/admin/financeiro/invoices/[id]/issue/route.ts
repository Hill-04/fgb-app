import { NextRequest, NextResponse } from 'next/server'

import { prisma } from '@/lib/db'
import { FINANCIAL_INVOICE_INCLUDE, requireAdminSession } from '@/lib/finance-server'
import { getEffectiveInvoiceStatus, serializeInvoice } from '@/lib/finance'

type Params = {
  params: Promise<{ id: string }>
}

export async function POST(_request: NextRequest, { params }: Params) {
  try {
    const session = await requireAdminSession()
    if (!session) return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })
    const { id } = await params

    const invoice = await prisma.financialInvoice.findUnique({ where: { id } })
    if (!invoice) {
      return NextResponse.json({ error: 'Fatura nao encontrada.' }, { status: 404 })
    }

    if (getEffectiveInvoiceStatus(invoice) === 'VOID') {
      return NextResponse.json({ error: 'Fatura cancelada nao pode ser emitida.' }, { status: 400 })
    }

    const updated = await prisma.$transaction(async (tx) => {
      await tx.financialAuditLog.create({
        data: {
          invoiceId: id,
          action: 'ISSUED',
          description: 'Fatura emitida manualmente.',
          createdByUserId: (session.user as any)?.id || null,
        },
      })

      return tx.financialInvoice.update({
        where: { id },
        data: { status: invoice.status === 'DRAFT' ? 'OPEN' : invoice.status },
        include: FINANCIAL_INVOICE_INCLUDE,
      })
    })

    return NextResponse.json(serializeInvoice(updated))
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Erro ao emitir fatura.' }, { status: error.message === 'Unauthorized' ? 401 : 500 })
  }
}
