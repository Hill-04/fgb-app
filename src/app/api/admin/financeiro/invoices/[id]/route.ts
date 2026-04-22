import { NextRequest, NextResponse } from 'next/server'

import { prisma } from '@/lib/db'
import { FINANCIAL_INVOICE_INCLUDE, getFinancialInvoiceById, requireAdminSession } from '@/lib/finance-server'
import { calculateInvoiceTotals, getEffectiveInvoiceStatus, serializeInvoice } from '@/lib/finance'

type Params = {
  params: Promise<{ id: string }>
}

export async function GET(_request: NextRequest, { params }: Params) {
  try {
    const session = await requireAdminSession()
    if (!session) return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })
    const { id } = await params
    const invoice = await getFinancialInvoiceById(id)

    if (!invoice) {
      return NextResponse.json({ error: 'Fatura nao encontrada.' }, { status: 404 })
    }

    return NextResponse.json(serializeInvoice(invoice))
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Erro ao carregar fatura.' }, { status: error.message === 'Unauthorized' ? 401 : 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const session = await requireAdminSession()
    if (!session) return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })
    const { id } = await params
    const body = await request.json()

    const invoice = await prisma.financialInvoice.findUnique({
      where: { id },
      include: { items: true, payments: true },
    })

    if (!invoice) {
      return NextResponse.json({ error: 'Fatura nao encontrada.' }, { status: 404 })
    }

    const effectiveStatus = getEffectiveInvoiceStatus(invoice)
    if (effectiveStatus === 'PAID' || effectiveStatus === 'VOID') {
      return NextResponse.json({ error: 'Faturas pagas ou canceladas nao podem ser editadas no MVP.' }, { status: 400 })
    }

    const discountCents = Math.max(0, Number(body.discountCents ?? invoice.discountCents ?? 0))
    const totals = calculateInvoiceTotals(
      invoice.items.map((item) => ({ totalCents: item.totalCents })),
      invoice.payments.map((payment) => ({ amountCents: payment.amountCents, status: payment.status })),
      discountCents
    )

    const updated = await prisma.$transaction(async (tx) => {
      await tx.financialAuditLog.create({
        data: {
          invoiceId: id,
          action: 'UPDATED',
          description: 'Dados gerais da fatura atualizados.',
          createdByUserId: (session.user as any)?.id || null,
          metadataJson: JSON.stringify({
            dueDate: body.dueDate ?? null,
            discountCents,
          }),
        },
      })

      return tx.financialInvoice.update({
        where: { id },
        data: {
          dueDate: body.dueDate ? new Date(body.dueDate) : invoice.dueDate,
          notes: typeof body.notes === 'string' ? body.notes : invoice.notes,
          discountCents,
          subtotalCents: totals.subtotalCents,
          totalCents: totals.totalCents,
          paidCents: totals.paidCents,
          balanceCents: totals.balanceCents,
        },
        include: FINANCIAL_INVOICE_INCLUDE,
      })
    })

    return NextResponse.json(serializeInvoice(updated))
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Erro ao atualizar fatura.' }, { status: error.message === 'Unauthorized' ? 401 : 500 })
  }
}
