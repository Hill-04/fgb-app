import { NextRequest, NextResponse } from 'next/server'

import { prisma } from '@/lib/db'
import { FINANCIAL_INVOICE_INCLUDE, requireAdminSession } from '@/lib/finance-server'
import { centsFromAmount, getEffectiveInvoiceStatus, normalizePaymentStatus, recalculateFinancialInvoice, serializeInvoice } from '@/lib/finance'

type Params = {
  params: Promise<{ id: string }>
}

export async function POST(request: NextRequest, { params }: Params) {
  try {
    const session = await requireAdminSession()
    if (!session) return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })
    const { id } = await params
    const body = await request.json()

    const invoice = await prisma.financialInvoice.findUnique({ where: { id } })
    if (!invoice) {
      return NextResponse.json({ error: 'Fatura nao encontrada.' }, { status: 404 })
    }

    const effectiveStatus = getEffectiveInvoiceStatus(invoice)
    if (effectiveStatus === 'DRAFT' || effectiveStatus === 'VOID' || effectiveStatus === 'PAID') {
      return NextResponse.json({ error: 'Esta fatura nao aceita baixa manual no status atual.' }, { status: 400 })
    }

    const amountCents = body.amountCents != null ? Number(body.amountCents) : centsFromAmount(Number(body.amount || 0))
    if (!Number.isFinite(amountCents) || amountCents <= 0) {
      return NextResponse.json({ error: 'Informe um valor de pagamento valido.' }, { status: 400 })
    }

    if (amountCents > invoice.balanceCents) {
      return NextResponse.json({ error: 'O pagamento nao pode exceder o saldo da fatura.' }, { status: 400 })
    }

    const updated = await prisma.$transaction(async (tx) => {
      await tx.financialPayment.create({
        data: {
          invoiceId: id,
          amountCents,
          method: body.method || 'MANUAL',
          status: normalizePaymentStatus(body.status || 'CONFIRMED'),
          paidAt: body.paidAt ? new Date(body.paidAt) : new Date(),
          reference: body.reference || null,
          notes: body.notes || null,
          createdByUserId: (session.user as any)?.id || null,
        },
      })

      await tx.financialAuditLog.create({
        data: {
          invoiceId: id,
          action: 'PAYMENT_CONFIRMED',
          description: 'Baixa manual registrada.',
          createdByUserId: (session.user as any)?.id || null,
          metadataJson: JSON.stringify({ amountCents, method: body.method || 'MANUAL' }),
        },
      })

      await recalculateFinancialInvoice(tx, id)

      return tx.financialInvoice.findUniqueOrThrow({
        where: { id },
        include: FINANCIAL_INVOICE_INCLUDE,
      })
    })

    return NextResponse.json(serializeInvoice(updated))
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Erro ao registrar pagamento.' }, { status: error.message === 'Unauthorized' ? 401 : 500 })
  }
}
