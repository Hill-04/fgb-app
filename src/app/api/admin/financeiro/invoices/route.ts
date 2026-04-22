import { NextResponse } from 'next/server'

import { prisma } from '@/lib/db'
import {
  calculateInvoiceTotals,
  generateFinancialInvoiceNumber,
  getDefaultDueDate,
  normalizeInvoiceStatus,
  serializeInvoice,
} from '@/lib/finance'
import {
  FINANCIAL_INVOICE_INCLUDE,
  normalizeInvoiceItemsInput,
  requireAdminSession,
} from '@/lib/finance-server'

export async function GET(request: Request) {
  const session = await requireAdminSession()
  if (!session) return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')
  const teamId = searchParams.get('teamId')
  const championshipId = searchParams.get('championshipId')

  const invoices = await prisma.financialInvoice.findMany({
    where: {
      ...(status ? { status: status.toUpperCase() } : {}),
      ...(teamId ? { teamId } : {}),
      ...(championshipId ? { championshipId } : {}),
    },
    include: FINANCIAL_INVOICE_INCLUDE,
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(invoices.map(serializeInvoice))
}

export async function POST(request: Request) {
  const session = await requireAdminSession()
  if (!session) return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })

  try {
    const body = await request.json()
    const issueDate = new Date()
    const status = normalizeInvoiceStatus(body.status === 'OPEN' ? 'OPEN' : 'DRAFT')
    const items = normalizeInvoiceItemsInput(Array.isArray(body.items) ? body.items : [])

    if (!body.teamId && !body.registrationId) {
      return NextResponse.json({ error: 'Informe uma equipe ou inscricao.' }, { status: 400 })
    }

    if (items.length === 0) {
      return NextResponse.json({ error: 'Adicione ao menos um item valido.' }, { status: 400 })
    }

    const registration = body.registrationId
      ? await prisma.registration.findUnique({
          where: { id: String(body.registrationId) },
          select: { id: true, teamId: true, championshipId: true },
        })
      : null

    if (body.registrationId && !registration) {
      return NextResponse.json({ error: 'Inscricao nao encontrada.' }, { status: 404 })
    }

    const teamId = registration?.teamId || String(body.teamId)
    const championshipId = registration?.championshipId || (body.championshipId ? String(body.championshipId) : null)
    const discountCents = Math.max(0, Number(body.discountCents || 0))
    const totals = calculateInvoiceTotals(items, [], discountCents)

    const invoice = await prisma.$transaction(async (tx) => {
      const number = await generateFinancialInvoiceNumber(tx, issueDate)
      const created = await tx.financialInvoice.create({
        data: {
          number,
          teamId,
          championshipId,
          registrationId: registration?.id || (body.registrationId ? String(body.registrationId) : null),
          status,
          issueDate,
          dueDate: body.dueDate ? new Date(body.dueDate) : getDefaultDueDate(issueDate),
          subtotalCents: totals.subtotalCents,
          discountCents: totals.discountCents,
          totalCents: totals.totalCents,
          paidCents: 0,
          balanceCents: totals.totalCents,
          notes: body.notes ? String(body.notes) : null,
          items: {
            create: items,
          },
          auditLogs: {
            create: {
              action: 'CREATE',
              description: status === 'OPEN' ? 'Fatura criada e aberta.' : 'Fatura criada em rascunho.',
              createdByUserId: (session.user as any)?.id || null,
            },
          },
        },
        include: FINANCIAL_INVOICE_INCLUDE,
      })

      return created
    })

    return NextResponse.json(serializeInvoice(invoice), { status: 201 })
  } catch (error) {
    console.error('[FINANCE][INVOICES][POST]', error)
    return NextResponse.json({ error: 'Erro ao criar fatura.' }, { status: 500 })
  }
}
