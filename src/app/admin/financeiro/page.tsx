import Link from 'next/link'
import { AlertTriangle, CheckCircle2, FileText, Receipt, Trophy, Users, Wallet } from 'lucide-react'

import { FinanceEmptyState } from '@/components/finance/finance-empty-state'
import { FinanceErrorState } from '@/components/finance/finance-error-state'
import { FinanceKpiCard } from '@/components/finance/finance-kpi-card'
import { FinancePageHeader } from '@/components/finance/finance-page-header'
import { InvoiceStatusBadge } from '@/components/finance/invoice-status-badge'
import { prisma } from '@/lib/db'
import { formatCurrencyCentsBRL, getDefaultFinancePeriod, getEffectiveInvoiceStatus } from '@/lib/finance'

export const dynamic = 'force-dynamic'

export default async function AdminFinanceiroPage() {
  try {
    const period = getDefaultFinancePeriod()
    const invoices = await prisma.financialInvoice.findMany({
      where: {
        issueDate: { gte: period.start, lte: period.end },
      },
      include: {
        team: { select: { id: true, name: true } },
        championship: { select: { id: true, name: true } },
      },
      orderBy: [{ issueDate: 'desc' }, { createdAt: 'desc' }],
    })

  const activeInvoices = invoices.filter((invoice) => invoice.status !== 'VOID')
  const overdueInvoices = activeInvoices.filter((invoice) => getEffectiveInvoiceStatus(invoice) === 'OVERDUE')
  const pendingInvoices = activeInvoices.filter((invoice) => invoice.balanceCents > 0)
  const paidInvoices = activeInvoices.filter((invoice) => getEffectiveInvoiceStatus(invoice) === 'PAID')
  const delinquentTeams = new Set(overdueInvoices.map((invoice) => invoice.teamId))
  const recentInvoices = invoices.slice(0, 8)

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
  ).sort((left: any, right: any) => right.totalCents - left.totalCents).slice(0, 5)

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
  ).sort((left: any, right: any) => right.pendingCents - left.pendingCents).slice(0, 5)

  const cards = [
    {
      label: 'Total faturado',
      value: formatCurrencyCentsBRL(activeInvoices.reduce((sum, invoice) => sum + invoice.totalCents, 0)),
      detail: `${activeInvoices.length} fatura(s) na temporada`,
      icon: Receipt,
      tone: 'green',
    },
    {
      label: 'Total pendente',
      value: formatCurrencyCentsBRL(pendingInvoices.reduce((sum, invoice) => sum + invoice.balanceCents, 0)),
      detail: `${pendingInvoices.length} fatura(s) com saldo`,
      icon: Wallet,
      tone: 'yellow',
    },
    {
      label: 'Total vencido',
      value: formatCurrencyCentsBRL(overdueInvoices.reduce((sum, invoice) => sum + invoice.balanceCents, 0)),
      detail: `${delinquentTeams.size} equipe(s) inadimplente(s)`,
      icon: AlertTriangle,
      tone: 'red',
    },
    {
      label: 'Recebidas',
      value: paidInvoices.length,
      detail: `${formatCurrencyCentsBRL(paidInvoices.reduce((sum, invoice) => sum + invoice.paidCents, 0))} confirmado`,
      icon: CheckCircle2,
      tone: 'black',
    },
  ]

    return (
      <div className="space-y-8 pb-10">
        <FinancePageHeader
          eyebrow={`Temporada ${period.year}`}
          badge="Fonte de verdade: faturas"
          title="Financeiro FGB"
          description="Central de comando para acompanhar faturamento, pendencias e inadimplencia por equipe ou campeonato."
          primaryHref="/admin/financeiro/faturas/nova"
          primaryLabel="Nova fatura"
          secondaryHref="/admin/financeiro/taxas"
          secondaryLabel="Regimento de taxas"
        />

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {cards.map((card) => (
            <FinanceKpiCard key={card.label} {...card} tone={card.tone as any} />
          ))}
        </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="overflow-hidden rounded-[32px] border border-[var(--border)] bg-white shadow-sm">
          <div className="flex items-center justify-between gap-4 border-b border-[var(--border)] bg-[var(--gray-l)] px-6 py-5">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[var(--verde)]">Ultimas movimentacoes</p>
              <h2 className="fgb-display text-2xl leading-none text-[var(--black)]">Faturas recentes</h2>
            </div>
            <Link href="/admin/financeiro/faturas" className="text-[10px] font-black uppercase tracking-widest text-[var(--verde)] hover:underline">
              Ver todas
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  <th className="px-6 py-4 text-left text-[9px] font-black uppercase tracking-widest text-[var(--gray)]">Numero</th>
                  <th className="px-6 py-4 text-left text-[9px] font-black uppercase tracking-widest text-[var(--gray)]">Equipe</th>
                  <th className="px-6 py-4 text-left text-[9px] font-black uppercase tracking-widest text-[var(--gray)]">Status</th>
                  <th className="px-6 py-4 text-right text-[9px] font-black uppercase tracking-widest text-[var(--gray)]">Saldo</th>
                </tr>
              </thead>
              <tbody>
                {recentInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8">
                      <FinanceEmptyState
                        icon={Receipt}
                        title="Nenhuma fatura na temporada"
                        description="Quando a primeira cobranca for criada, ela aparece aqui com status, equipe e saldo."
                        actionHref="/admin/financeiro/faturas/nova"
                        actionLabel="Criar fatura"
                      />
                    </td>
                  </tr>
                ) : recentInvoices.map((invoice) => {
                  const effectiveStatus = getEffectiveInvoiceStatus(invoice)
                  return (
                    <tr key={invoice.id} className="border-b border-[var(--border)] hover:bg-[var(--gray-l)]">
                      <td className="px-6 py-4">
                        <Link href={`/admin/financeiro/faturas/${invoice.id}`} className="font-black text-[var(--black)] hover:text-[var(--verde)]">{invoice.number}</Link>
                        <p className="mt-1 text-xs text-[var(--gray)]">{invoice.championship?.name || 'Sem campeonato'}</p>
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-[var(--black)]">{invoice.team.name}</td>
                      <td className="px-6 py-4"><InvoiceStatusBadge status={effectiveStatus} /></td>
                      <td className="px-6 py-4 text-right font-black text-[var(--black)]">{formatCurrencyCentsBRL(invoice.balanceCents)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-[28px] border border-[var(--border)] bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-3">
              <Trophy className="h-5 w-5 text-[var(--verde)]" />
              <h2 className="fgb-display text-xl leading-none text-[var(--black)]">Por campeonato</h2>
            </div>
            <div className="space-y-3">
              {byChampionship.length === 0 ? <p className="text-sm text-[var(--gray)]">Sem faturamento no periodo.</p> : byChampionship.map((item: any) => (
                <div key={item.id || 'none'} className="rounded-2xl border border-[var(--border)] bg-[var(--gray-l)] p-4">
                  <p className="text-sm font-black text-[var(--black)]">{item.name}</p>
                  <p className="mt-1 text-xs font-semibold text-[var(--gray)]">{item.count} fatura(s) | pendente {formatCurrencyCentsBRL(item.pendingCents)}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[28px] border border-[var(--border)] bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-3">
              <Users className="h-5 w-5 text-[var(--red)]" />
              <h2 className="fgb-display text-xl leading-none text-[var(--black)]">Equipes com saldo</h2>
            </div>
            <div className="space-y-3">
              {byTeam.length === 0 ? <p className="text-sm text-[var(--gray)]">Nenhuma pendencia aberta.</p> : byTeam.map((item: any) => (
                <div key={item.id} className="rounded-2xl border border-[var(--border)] bg-[var(--gray-l)] p-4">
                  <p className="text-sm font-black text-[var(--black)]">{item.name}</p>
                  <p className="mt-1 text-xs font-semibold text-[var(--gray)]">{item.count} fatura(s) | {formatCurrencyCentsBRL(item.pendingCents)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-[28px] border border-dashed border-[var(--border)] bg-white/70 p-5">
        <div className="flex items-center gap-3">
          <FileText className="h-5 w-5 text-[var(--gray)]" />
          <p className="text-xs font-semibold leading-5 text-[var(--gray)]">
            O dashboard abre sempre na temporada atual ({period.year}) para evitar leitura financeira sem recorte temporal.
          </p>
        </div>
      </section>
      </div>
    )
  } catch (error: any) {
    console.error('[FINANCE][DASHBOARD]', error)
    return (
      <div className="space-y-8 pb-10">
        <FinancePageHeader
          eyebrow="Central financeira"
          badge="Falha de carregamento"
          title="Financeiro FGB"
          description="A navegacao permanece ativa, mas os dados financeiros nao puderam ser carregados."
          primaryHref="/admin/dashboard"
          primaryLabel="Voltar ao painel"
        />
        <FinanceErrorState detail={error?.message} />
      </div>
    )
  }
}
