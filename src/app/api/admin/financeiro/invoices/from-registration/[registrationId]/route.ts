import { NextRequest, NextResponse } from 'next/server'

import { prisma } from '@/lib/db'
import { FINANCIAL_INVOICE_INCLUDE, requireAdminSession } from '@/lib/finance-server'
import { calculateInvoiceTotals, getDefaultDueDate, generateFinancialInvoiceNumber, serializeInvoice } from '@/lib/finance'

type Params = {
  params: Promise<{ registrationId: string }>
}

export async function POST(_request: NextRequest, { params }: Params) {
  try {
    const session = await requireAdminSession()
    if (!session) return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })
    const { registrationId } = await params

    const registration = await prisma.registration.findUnique({
      where: { id: registrationId },
      include: {
        team: { select: { id: true, name: true } },
        championship: { select: { id: true, name: true } },
        fees: { orderBy: { createdAt: 'asc' } },
      },
    })

    if (!registration) {
      return NextResponse.json({ error: 'Inscricao nao encontrada.' }, { status: 404 })
    }

    const existingInvoice = await prisma.financialInvoice.findFirst({
      where: { registrationId, status: { not: 'VOID' } },
      select: { id: true, number: true },
    })

    if (existingInvoice) {
      return NextResponse.json(
        { error: 'Ja existe uma fatura ativa para esta inscricao.', invoiceId: existingInvoice.id, number: existingInvoice.number },
        { status: 409 }
      )
    }

    const billableFees = registration.fees.filter((fee) => fee.status !== 'WAIVED' && fee.totalValue > 0)
    if (billableFees.length === 0) {
      return NextResponse.json({ error: 'Esta inscricao nao possui taxas faturaveis.' }, { status: 400 })
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

    const invoice = await prisma.$transaction(async (tx) => {
      const number = await generateFinancialInvoiceNumber(tx, issueDate)

      return tx.financialInvoice.create({
        data: {
          number,
          teamId: registration.teamId,
          championshipId: registration.championshipId,
          registrationId: registration.id,
          status: 'OPEN',
          issueDate,
          dueDate: getDefaultDueDate(issueDate),
          subtotalCents: totals.subtotalCents,
          totalCents: totals.totalCents,
          paidCents: 0,
          balanceCents: totals.balanceCents,
          notes: `Fatura gerada a partir das taxas da inscricao de ${registration.team.name} em ${registration.championship.name}.`,
          items: { create: items },
          auditLogs: {
            create: {
              action: 'CREATED_FROM_REGISTRATION',
              description: 'Fatura criada a partir das taxas da inscricao.',
              createdByUserId: (session.user as any)?.id || null,
              metadataJson: JSON.stringify({ registrationId }),
            },
          },
        },
        include: FINANCIAL_INVOICE_INCLUDE,
      })
    })

    return NextResponse.json(serializeInvoice(invoice), { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Erro ao gerar fatura da inscricao.' }, { status: error.message === 'Unauthorized' ? 401 : 500 })
  }
}
