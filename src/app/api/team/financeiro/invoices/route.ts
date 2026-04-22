import { NextRequest, NextResponse } from 'next/server'

import { prisma } from '@/lib/db'
import { requireTeamSession } from '@/lib/finance-server'
import { getEffectiveInvoiceStatus, serializeInvoice } from '@/lib/finance'

export async function GET(request: NextRequest) {
  try {
    const teamSession = await requireTeamSession()
    if (!teamSession) return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })
    const { teamId } = teamSession
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    const invoices = await prisma.financialInvoice.findMany({
      where: {
        teamId,
        ...(status ? { status } : {}),
      },
      include: {
        team: { select: { id: true, name: true, city: true, state: true } },
        championship: { select: { id: true, name: true, year: true } },
        registration: { select: { id: true, status: true } },
        items: { orderBy: { createdAt: 'asc' } },
        payments: { orderBy: { paidAt: 'desc' } },
        auditLogs: { orderBy: { createdAt: 'desc' } },
      },
      orderBy: [{ issueDate: 'desc' }, { createdAt: 'desc' }],
    })

    return NextResponse.json(invoices.map((invoice) => serializeInvoice({ ...invoice, status: getEffectiveInvoiceStatus(invoice) })))
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Erro ao carregar faturas.' }, { status: error.message === 'Unauthorized' ? 401 : 500 })
  }
}
