import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { Download } from 'lucide-react'

import { InvoiceStatusBadge } from '@/components/finance/invoice-status-badge'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { formatCurrencyCentsBRL, getEffectiveInvoiceStatus } from '@/lib/finance'

export const dynamic = 'force-dynamic'

type PageProps = {
  params: Promise<{ id: string }>
}

export default async function TeamFinancialInvoiceDetailPage({ params }: PageProps) {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  const teamId = (session.user as any)?.teamId
  if (!teamId) redirect('/team/create')

  const { id } = await params
  const invoice = await prisma.financialInvoice.findFirst({
    where: { id, teamId },
    include: {
      championship: { select: { id: true, name: true, year: true } },
      items: { orderBy: { createdAt: 'asc' } },
      payments: { orderBy: { paidAt: 'desc' } },
    },
  })

  if (!invoice) notFound()

  const effectiveStatus = getEffectiveInvoiceStatus(invoice)

  return (
    <div className="space-y-7 pb-10">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <InvoiceStatusBadge status={effectiveStatus} />
          <h1 className="fgb-display mt-3 text-4xl leading-none text-[var(--black)]">{invoice.number}</h1>
          <p className="mt-2 text-sm text-[var(--gray)]">{invoice.championship?.name || 'Fatura institucional FGB'}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link href="/team/financeiro" className="inline-flex h-11 items-center rounded-2xl border border-[var(--border)] bg-white px-5 text-[10px] font-black uppercase tracking-widest text-[var(--black)] hover:bg-[var(--gray-l)]">
            Voltar
          </Link>
          <Link href={`/api/team/financeiro/invoices/${invoice.id}/pdf`} target="_blank" className="inline-flex h-11 items-center gap-2 rounded-2xl bg-[var(--black)] px-5 text-[10px] font-black uppercase tracking-widest text-white hover:bg-black/85">
            <Download className="h-4 w-4" />
            PDF
          </Link>
        </div>
      </div>

      <section className="grid gap-4 md:grid-cols-4">
        {[
          { label: 'Total', value: formatCurrencyCentsBRL(invoice.totalCents), tone: 'black' },
          { label: 'Pago', value: formatCurrencyCentsBRL(invoice.paidCents), tone: 'green' },
          { label: 'Pendente', value: formatCurrencyCentsBRL(invoice.balanceCents), tone: 'red' },
          { label: 'Vencimento', value: invoice.dueDate ? invoice.dueDate.toLocaleDateString('pt-BR') : 'Sem data', tone: 'black' },
        ].map((item) => (
          <div key={item.label} className="rounded-[26px] border border-[var(--border)] bg-white p-5 shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--gray)]">{item.label}</p>
            <p className={`mt-2 text-2xl font-black ${item.tone === 'red' ? 'text-[var(--red)]' : item.tone === 'green' ? 'text-[var(--verde)]' : 'text-[var(--black)]'}`}>
              {item.value}
            </p>
          </div>
        ))}
      </section>

      <div className="overflow-hidden rounded-[32px] border border-[var(--border)] bg-white shadow-sm">
        <div className="border-b border-[var(--border)] bg-[var(--gray-l)] px-6 py-5">
          <h2 className="fgb-display text-2xl leading-none text-[var(--black)]">Itens da fatura</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-[var(--border)]">
                <th className="px-6 py-4 text-left text-[9px] font-black uppercase tracking-widest text-[var(--gray)]">Item</th>
                <th className="px-6 py-4 text-right text-[9px] font-black uppercase tracking-widest text-[var(--gray)]">Qtd</th>
                <th className="px-6 py-4 text-right text-[9px] font-black uppercase tracking-widest text-[var(--gray)]">Unitario</th>
                <th className="px-6 py-4 text-right text-[9px] font-black uppercase tracking-widest text-[var(--gray)]">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((item) => (
                <tr key={item.id} className="border-b border-[var(--border)]">
                  <td className="px-6 py-4 font-semibold text-[var(--black)]">{item.description}</td>
                  <td className="px-6 py-4 text-right font-semibold">{item.quantity}</td>
                  <td className="px-6 py-4 text-right font-semibold">{formatCurrencyCentsBRL(item.unitValueCents)}</td>
                  <td className="px-6 py-4 text-right font-black text-[var(--black)]">{formatCurrencyCentsBRL(item.totalCents)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
