import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { Wallet } from 'lucide-react'

import { InvoiceStatusBadge } from '@/components/finance/invoice-status-badge'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { formatCurrencyCentsBRL, getEffectiveInvoiceStatus } from '@/lib/finance'

export const dynamic = 'force-dynamic'

export default async function TeamFinanceiroPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  const teamId = (session.user as any)?.teamId
  if (!teamId) redirect('/team/create')

  const invoices = await prisma.financialInvoice.findMany({
    where: { teamId },
    include: {
      championship: { select: { id: true, name: true, year: true } },
    },
    orderBy: [{ issueDate: 'desc' }, { createdAt: 'desc' }],
  })

  const pendingTotal = invoices.filter((invoice) => invoice.status !== 'VOID').reduce((sum, invoice) => sum + invoice.balanceCents, 0)
  const overdueTotal = invoices.filter((invoice) => getEffectiveInvoiceStatus(invoice) === 'OVERDUE').reduce((sum, invoice) => sum + invoice.balanceCents, 0)

  return (
    <div className="space-y-8 pb-10">
      <section className="relative overflow-hidden rounded-[36px] border border-[var(--border)] bg-[var(--black)] p-6 text-white shadow-premium md:p-8">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(245,194,0,0.22),transparent_34%),radial-gradient(circle_at_bottom_left,rgba(27,115,64,0.38),transparent_34%)]" />
        <div className="relative">
          <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-[var(--yellow)]">
            Area da equipe
          </span>
          <h1 className="fgb-display mt-4 text-4xl leading-none text-white md:text-5xl">Financeiro</h1>
          <p className="mt-3 max-w-2xl text-sm font-medium leading-6 text-white/68">
            Consulte faturas, vencimentos e comprovantes oficiais da FGB em um fluxo simples.
          </p>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-[28px] border border-[var(--border)] bg-white p-5 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--gray)]">Faturas</p>
          <p className="mt-2 text-4xl font-black text-[var(--black)]">{invoices.length}</p>
        </div>
        <div className="rounded-[28px] border border-[var(--border)] bg-white p-5 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--gray)]">Total pendente</p>
          <p className="mt-2 text-3xl font-black text-[var(--red)]">{formatCurrencyCentsBRL(pendingTotal)}</p>
        </div>
        <div className="rounded-[28px] border border-[var(--border)] bg-white p-5 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--gray)]">Vencido</p>
          <p className="mt-2 text-3xl font-black text-[var(--black)]">{formatCurrencyCentsBRL(overdueTotal)}</p>
        </div>
      </section>

      <div className="overflow-hidden rounded-[32px] border border-[var(--border)] bg-white shadow-sm">
        <div className="flex items-center gap-3 border-b border-[var(--border)] bg-[var(--gray-l)] px-6 py-5">
          <Wallet className="h-5 w-5 text-[var(--verde)]" />
          <h2 className="fgb-display text-2xl leading-none text-[var(--black)]">Minhas faturas</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-[var(--border)]">
                <th className="px-6 py-4 text-left text-[9px] font-black uppercase tracking-widest text-[var(--gray)]">Numero</th>
                <th className="px-6 py-4 text-left text-[9px] font-black uppercase tracking-widest text-[var(--gray)]">Campeonato</th>
                <th className="px-6 py-4 text-left text-[9px] font-black uppercase tracking-widest text-[var(--gray)]">Status</th>
                <th className="px-6 py-4 text-right text-[9px] font-black uppercase tracking-widest text-[var(--gray)]">Vencimento</th>
                <th className="px-6 py-4 text-right text-[9px] font-black uppercase tracking-widest text-[var(--gray)]">Saldo</th>
              </tr>
            </thead>
            <tbody>
              {invoices.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center text-sm font-semibold text-[var(--gray)]">Nenhuma fatura para a equipe.</td>
                </tr>
              ) : invoices.map((invoice) => {
                const effectiveStatus = getEffectiveInvoiceStatus(invoice)
                return (
                  <tr key={invoice.id} className="border-b border-[var(--border)] hover:bg-[var(--gray-l)]">
                    <td className="px-6 py-4">
                      <Link href={`/team/financeiro/faturas/${invoice.id}`} className="font-black text-[var(--black)] hover:text-[var(--verde)]">{invoice.number}</Link>
                    </td>
                    <td className="px-6 py-4 text-sm text-[var(--gray)]">{invoice.championship?.name || 'Sem campeonato'}</td>
                    <td className="px-6 py-4"><InvoiceStatusBadge status={effectiveStatus} /></td>
                    <td className="px-6 py-4 text-right text-sm font-semibold text-[var(--black)]">{invoice.dueDate ? invoice.dueDate.toLocaleDateString('pt-BR') : 'Sem data'}</td>
                    <td className="px-6 py-4 text-right font-black text-[var(--red)]">{formatCurrencyCentsBRL(invoice.balanceCents)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
