import Link from 'next/link'
import { ArrowRight, AlertTriangle, CheckCircle2, FileText, Receipt, Trophy, Users, Wallet } from 'lucide-react'

import { InvoiceStatusBadge } from '@/components/finance/invoice-status-badge'
import { prisma } from '@/lib/db'
import { formatCurrencyCentsBRL, getDefaultFinancePeriod, getEffectiveInvoiceStatus } from '@/lib/finance'

export const dynamic = 'force-dynamic'

export default async function AdminFinanceiroPage() {
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
      <section className="relative overflow-hidden rounded-[36px] border border-[var(--border)] bg-[var(--black)] p-6 text-white shadow-premium md:p-8">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(245,194,0,0.24),transparent_34%),radial-gradient(circle_at_bottom_left,rgba(27,115,64,0.42),transparent_34%)]" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-[var(--yellow)]">
                Temporada {period.year}
              </span>
              <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-white/70">
                Fonte de verdade: faturas
              </span>
            </div>
            <h1 className="fgb-display max-w-3xl text-4xl leading-none text-white md:text-6xl">Financeiro FGB</h1>
            <p className="mt-4 max-w-2xl text-sm font-medium leading-6 text-white/68">
              Painel operacional para acompanhar faturamento, pendencias e inadimplencia por equipe ou campeonato.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/admin/financeiro/faturas/nova" className="inline-flex h-11 items-center gap-2 rounded-2xl bg-[var(--yellow)] px-5 text-[10px] font-black uppercase tracking-widest text-[var(--black)] transition hover:-translate-y-0.5">
              Nova fatura
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/admin/financeiro/taxas" className="inline-flex h-11 items-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-5 text-[10px] font-black uppercase tracking-widest text-white transition hover:bg-white/15">
              Regimento de taxas
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon
          return (
            <div key={card.label} className="rounded-[28px] border border-[var(--border)] bg-white p-5 shadow-sm">
              <div className="mb-5 flex items-center justify-between gap-4">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--gray)]">{card.label}</p>
                <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${
                  card.tone === 'green' ? 'bg-green-50 text-green-700' :
                  card.tone === 'yellow' ? 'bg-yellow-50 text-yellow-700' :
                  card.tone === 'red' ? 'bg-red-50 text-red-700' :
                  'bg-[var(--gray-l)] text-[var(--black)]'
                }`}>
                  <Icon className="h-5 w-5" />
                </div>
              </div>
              <p className="fgb-display text-3xl leading-none text-[var(--black)]">{card.value}</p>
              <p className="mt-2 text-xs font-semibold text-[var(--gray)]">{card.detail}</p>
            </div>
          )
        })}
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
                    <td colSpan={4} className="px-6 py-14 text-center text-sm font-semibold text-[var(--gray)]">Nenhuma fatura nesta temporada.</td>
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
}
