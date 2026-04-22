import { NextRequest, NextResponse } from 'next/server'

import { prisma } from '@/lib/db'
import { buildInvoicePdfBuffer } from '@/lib/finance-pdf'
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

    const buffer = await buildInvoicePdfBuffer(serializeInvoice(invoice))

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="fatura-${invoice.number}.pdf"`,
      },
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Erro ao gerar PDF.' }, { status: error.message === 'Unauthorized' ? 401 : 500 })
  }
}
