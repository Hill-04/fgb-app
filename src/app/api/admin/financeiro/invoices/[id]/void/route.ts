import { NextRequest, NextResponse } from 'next/server'

import { prisma } from '@/lib/db'
import { FINANCIAL_INVOICE_INCLUDE, requireAdminSession } from '@/lib/finance-server'
import { getEffectiveInvoiceStatus, serializeInvoice } from '@/lib/finance'

type Params = {
  params: Promise<{ id: string }>
}

export async function POST(request: NextRequest, { params }: Params) {
  try {
    const session = await requireAdminSession()
    if (!session) return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })
    const { id } = await params
    const body = await request.json().catch(() => ({}))

    const invoice = await prisma.financialInvoice.findUnique({ where: { id } })
    if (!invoice) {
      return NextResponse.json({ error: 'Fatura nao encontrada.' }, { status: 404 })
    }

    if (getEffectiveInvoiceStatus(invoice) === 'PAID') {
      return NextResponse.json({ error: 'Fatura paga nao pode ser cancelada no MVP.' }, { status: 400 })
    }

    const updated = await prisma.$transaction(async (tx) => {
      await tx.financialAuditLog.create({
        data: {
          invoiceId: id,
          action: 'VOIDED',
          description: body.reason || 'Fatura cancelada manualmente.',
          createdByUserId: (session.user as any)?.id || null,
        },
      })

      return tx.financialInvoice.update({
        where: { id },
        data: { status: 'VOID' },
        include: FINANCIAL_INVOICE_INCLUDE,
      })
    })

    return NextResponse.json(serializeInvoice(updated))
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Erro ao cancelar fatura.' }, { status: error.message === 'Unauthorized' ? 401 : 500 })
  }
}
