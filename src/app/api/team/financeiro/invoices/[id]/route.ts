import { NextRequest, NextResponse } from 'next/server'

import { prisma } from '@/lib/db'
import { requireTeamSession } from '@/lib/finance-server'
import { serializeInvoice } from '@/lib/finance'

type Params = {
  params: Promise<{ id: string }>
}

export async function GET(_request: NextRequest, { params }: Params) {
  try {
    const teamSession = await requireTeamSession()
    if (!teamSession) return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })
    const { teamId } = teamSession
    const { id } = await params

    const invoice = await prisma.financialInvoice.findFirst({
      where: { id, teamId },
      include: {
        team: { select: { id: true, name: true, city: true, state: true } },
        championship: { select: { id: true, name: true, year: true } },
        registration: { select: { id: true, status: true } },
        items: { orderBy: { createdAt: 'asc' } },
        payments: { orderBy: { paidAt: 'desc' } },
        auditLogs: { orderBy: { createdAt: 'desc' } },
      },
    })

    if (!invoice) {
      return NextResponse.json({ error: 'Fatura nao encontrada.' }, { status: 404 })
    }

    return NextResponse.json(serializeInvoice(invoice))
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Erro ao carregar fatura.' }, { status: error.message === 'Unauthorized' ? 401 : 500 })
  }
}
