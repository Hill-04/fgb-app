import Link from 'next/link'
import { Plus, Receipt } from 'lucide-react'

import { FinanceEmptyState } from '@/components/finance/finance-empty-state'
import { FinanceErrorState } from '@/components/finance/finance-error-state'
import { FinanceInvoiceTable } from '@/components/finance/finance-invoice-table'
import { prisma } from '@/lib/db'
import { getEffectiveInvoiceStatus } from '@/lib/finance'

export const dynamic = 'force-dynamic'

export default async function AdminFinancialInvoicesPage() {
  try {
    const invoices = await prisma.financialInvoice.findMany({
      include: {
        team: { select: { id: true, name: true } },
        championship: { select: { id: true, name: true, year: true } },
      },
      orderBy: [{ issueDate: 'desc' }, { createdAt: 'desc' }],
    })

    const invoiceRows = invoices.map((invoice) => ({
      id: invoice.id,
      number: invoice.number,
      teamName: invoice.team.name,
      championshipName: invoice.championship?.name || 'Sem campeonato',
      issueDateLabel: invoice.issueDate.toLocaleDateString('pt-BR'),
      dueDateLabel: invoice.dueDate ? invoice.dueDate.toLocaleDateString('pt-BR') : 'Sem data',
      effectiveStatus: getEffectiveInvoiceStatus(invoice),
      totalCents: invoice.totalCents,
      paidCents: invoice.paidCents,
      balanceCents: invoice.balanceCents,
      href: `/admin/financeiro/faturas/${invoice.id}`,
    }))

    return (
      <div className="space-y-7 pb-10">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[var(--verde)]">Financeiro</p>
            <h1 className="fgb-display mt-2 text-4xl leading-none text-[var(--black)]">Faturas</h1>
            <p className="mt-2 text-sm text-[var(--gray)]">Cobrancas oficiais da FGB com filtros simples e leitura gerencial rapida.</p>
          </div>
          <Link href="/admin/financeiro/faturas/nova" className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-[var(--black)] px-5 text-[10px] font-black uppercase tracking-widest text-white transition hover:bg-black/85">
            <Plus className="h-4 w-4" />
            Nova fatura
          </Link>
        </div>

        {invoiceRows.length === 0 ? (
          <FinanceEmptyState
            icon={Receipt}
            title="Nenhuma fatura criada"
            description="Crie a primeira cobranca oficial para acompanhar status, vencimento e saldo por equipe."
            actionHref="/admin/financeiro/faturas/nova"
            actionLabel="Criar fatura"
          />
        ) : (
          <FinanceInvoiceTable invoices={invoiceRows} title="Mapa de faturas" />
        )}
      </div>
    )
  } catch (error: any) {
    console.error('[FINANCE][INVOICES]', error)
    return (
      <div className="space-y-7 pb-10">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[var(--red)]">Financeiro</p>
          <h1 className="fgb-display mt-2 text-4xl leading-none text-[var(--black)]">Faturas</h1>
        </div>
        <FinanceErrorState detail={error?.message} />
      </div>
    )
  }
}
