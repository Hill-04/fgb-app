import { NextResponse } from 'next/server'

import { prisma } from '@/lib/db'
import { getDefaultFinancePeriod, getEffectiveInvoiceStatus } from '@/lib/finance'
import { requireAdminSession } from '@/lib/finance-server'

export async function GET(request: Request) {
  const session = await requireAdminSession()
  if (!session) return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const year = Number(searchParams.get('year')) || getDefaultFinancePeriod().year
  const period = getDefaultFinancePeriod(new Date(Date.UTC(year, 0, 1)))

  const invoices = await prisma.financialInvoice.findMany({
    where: {
      issueDate: {
        gte: period.start,
        lte: period.end,
      },
    },
    include: {
      team: { select: { id: true, name: true } },
      championship: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  const activeInvoices = invoices.filter((invoice) => invoice.status !== 'VOID')
  const overdueInvoices = activeInvoices.filter((invoice) => getEffectiveInvoiceStatus(invoice) === 'OVERDUE')
  const pendingInvoices = activeInvoices.filter((invoice) => invoice.balanceCents > 0)
  const delinquentTeams = new Set(overdueInvoices.map((invoice) => invoice.teamId))

  const byChampionship = Object.values(
    activeInvoices.reduce((acc, invoice) => {
      const key = invoice.championship?.id || 'none'
      acc[key] ||= {
        id: invoice.championship?.id || null,
        name: invoice.championship?.name || 'Sem campeonato',
        totalCents: 0,
        pendingCents: 0,
        count: 0,
      }
      acc[key].totalCents += invoice.totalCents
      acc[key].pendingCents += invoice.balanceCents
      acc[key].count += 1
      return acc
    }, {} as Record<string, any>)
  )

  const byTeam = Object.values(
    pendingInvoices.reduce((acc, invoice) => {
      acc[invoice.teamId] ||= {
        id: invoice.teamId,
        name: invoice.team.name,
        pendingCents: 0,
        overdueCents: 0,
        count: 0,
      }
      acc[invoice.teamId].pendingCents += invoice.balanceCents
      if (getEffectiveInvoiceStatus(invoice) === 'OVERDUE') {
        acc[invoice.teamId].overdueCents += invoice.balanceCents
      }
      acc[invoice.teamId].count += 1
      return acc
    }, {} as Record<string, any>)
  ).sort((left: any, right: any) => right.pendingCents - left.pendingCents).slice(0, 8)

  return NextResponse.json({
    period: {
      year,
      start: period.start,
      end: period.end,
      label: `Temporada ${year}`,
    },
    summary: {
      totalInvoicedCents: activeInvoices.reduce((sum, invoice) => sum + invoice.totalCents, 0),
      totalPendingCents: pendingInvoices.reduce((sum, invoice) => sum + invoice.balanceCents, 0),
      totalOverdueCents: overdueInvoices.reduce((sum, invoice) => sum + invoice.balanceCents, 0),
      delinquentTeams: delinquentTeams.size,
      invoiceCount: activeInvoices.length,
    },
    recentInvoices: invoices.slice(0, 8).map((invoice) => ({
      ...invoice,
      effectiveStatus: getEffectiveInvoiceStatus(invoice),
    })),
    byChampionship,
    byTeam,
  })
}
