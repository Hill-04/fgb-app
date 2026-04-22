import Link from 'next/link'
import { Plus } from 'lucide-react'

import { InvoiceStatusBadge } from '@/components/finance/invoice-status-badge'
import { prisma } from '@/lib/db'
import { formatCurrencyCentsBRL, getEffectiveInvoiceStatus } from '@/lib/finance'

export const dynamic = 'force-dynamic'

export default async function AdminFinancialInvoicesPage() {
  const invoices = await prisma.financialInvoice.findMany({
    include: {
      team: { select: { id: true, name: true } },
      championship: { select: { id: true, name: true, year: true } },
    },
    orderBy: [{ issueDate: 'desc' }, { createdAt: 'desc' }],
  })

  return (
    <div className="space-y-7 pb-10">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[var(--verde)]">Financeiro</p>
          <h1 className="fgb-display mt-2 text-4xl leading-none text-[var(--black)]">Faturas</h1>
          <p className="mt-2 text-sm text-[var(--gray)]">Cobrancas oficiais da FGB com saldos em centavos e baixa manual.</p>
        </div>
        <Link href="/admin/financeiro/faturas/nova" className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-[var(--black)] px-5 text-[10px] font-black uppercase tracking-widest text-white transition hover:bg-black/85">
          <Plus className="h-4 w-4" />
          Nova fatura
        </Link>
      </div>

      <div className="overflow-hidden rounded-[32px] border border-[var(--border)] bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-[var(--gray-l)]">
              <tr className="border-b border-[var(--border)]">
                <th className="px-6 py-4 text-left text-[9px] font-black uppercase tracking-widest text-[var(--gray)]">Numero</th>
                <th className="px-6 py-4 text-left text-[9px] font-black uppercase tracking-widest text-[var(--gray)]">Equipe</th>
                <th className="px-6 py-4 text-left text-[9px] font-black uppercase tracking-widest text-[var(--gray)]">Campeonato</th>
                <th className="px-6 py-4 text-left text-[9px] font-black uppercase tracking-widest text-[var(--gray)]">Status</th>
                <th className="px-6 py-4 text-right text-[9px] font-black uppercase tracking-widest text-[var(--gray)]">Total</th>
                <th className="px-6 py-4 text-right text-[9px] font-black uppercase tracking-widest text-[var(--gray)]">Pendente</th>
              </tr>
            </thead>
            <tbody>
              {invoices.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center text-sm font-semibold text-[var(--gray)]">Nenhuma fatura criada ainda.</td>
                </tr>
              ) : invoices.map((invoice) => {
                const effectiveStatus = getEffectiveInvoiceStatus(invoice)
                return (
                  <tr key={invoice.id} className="border-b border-[var(--border)] transition hover:bg-[var(--gray-l)]">
                    <td className="px-6 py-4">
                      <Link href={`/admin/financeiro/faturas/${invoice.id}`} className="font-black text-[var(--black)] hover:text-[var(--verde)]">{invoice.number}</Link>
                      <p className="mt-1 text-xs text-[var(--gray)]">Emitida em {invoice.issueDate.toLocaleDateString('pt-BR')}</p>
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-[var(--black)]">{invoice.team.name}</td>
                    <td className="px-6 py-4 text-sm text-[var(--gray)]">{invoice.championship?.name || 'Sem campeonato'}</td>
                    <td className="px-6 py-4"><InvoiceStatusBadge status={effectiveStatus} /></td>
                    <td className="px-6 py-4 text-right font-black text-[var(--black)]">{formatCurrencyCentsBRL(invoice.totalCents)}</td>
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
