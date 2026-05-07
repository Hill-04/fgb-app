import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { FileText, Wallet } from 'lucide-react'

import { FinanceEmptyState } from '@/components/finance/finance-empty-state'
import { FinanceErrorState } from '@/components/finance/finance-error-state'
import { FinanceKpiCard } from '@/components/finance/finance-kpi-card'
import { FinancePageHeader } from '@/components/finance/finance-page-header'
import { FinanceInvoiceTable } from '@/components/finance/finance-invoice-table'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { formatCurrencyCentsBRL, getEffectiveInvoiceStatus } from '@/lib/finance'

export const dynamic = 'force-dynamic'

export default async function TeamFinanceiroPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  const teamId = (session.user as any)?.teamId
  if (!teamId) redirect('/team/create')

  try {
    const invoices = await prisma.financialInvoice.findMany({
      where: { teamId },
      include: {
        championship: { select: { id: true, name: true, year: true } },
      },
      orderBy: [{ issueDate: 'desc' }, { createdAt: 'desc' }],
    })

    const pendingTotal = invoices.filter((invoice) => invoice.status !== 'VOID').reduce((sum, invoice) => sum + invoice.balanceCents, 0)
    const overdueTotal = invoices.filter((invoice) => getEffectiveInvoiceStatus(invoice) === 'OVERDUE').reduce((sum, invoice) => sum + invoice.balanceCents, 0)
    const nextDue = invoices
      .filter((invoice) => invoice.balanceCents > 0 && invoice.dueDate)
      .sort((left, right) => Number(left.dueDate) - Number(right.dueDate))[0]
    const invoiceRows = invoices.map((invoice) => ({
      id: invoice.id,
      number: invoice.number,
      teamName: 'Minha equipe',
      championshipName: invoice.championship?.name || 'Fatura institucional FGB',
      issueDateLabel: invoice.issueDate.toLocaleDateString('pt-BR'),
      dueDateLabel: invoice.dueDate ? invoice.dueDate.toLocaleDateString('pt-BR') : 'Sem data',
      effectiveStatus: getEffectiveInvoiceStatus(invoice),
      totalCents: invoice.totalCents,
      paidCents: invoice.paidCents,
      balanceCents: invoice.balanceCents,
      href: `/team/financeiro/faturas/${invoice.id}`,
    }))

    return (
      <div className="space-y-8 pb-10">
        <FinancePageHeader
          eyebrow="Area da equipe"
          badge="Faturas oficiais"
          title="Financeiro"
          description="O essencial para a equipe: o que deve, quando vence, status e PDF oficial da fatura."
        />

      <section className="grid gap-4 md:grid-cols-3">
        <FinanceKpiCard label="Faturas" value={invoices.length} detail="documentos financeiros emitidos" icon={FileText} tone="black" />
        <FinanceKpiCard label="Total pendente" value={formatCurrencyCentsBRL(pendingTotal)} detail="saldo aberto da equipe" icon={Wallet} tone="red" />
        <FinanceKpiCard label="Proximo vencimento" value={nextDue?.dueDate ? nextDue.dueDate.toLocaleDateString('pt-BR') : 'Sem prazo'} detail={`Vencido: ${formatCurrencyCentsBRL(overdueTotal)}`} icon={Wallet} tone="yellow" />
      </section>

        {invoiceRows.length === 0 ? (
          <FinanceEmptyState
            icon={Wallet}
            title="Nenhuma fatura emitida"
            description="Quando a FGB emitir uma cobranca para sua equipe, ela aparecera aqui com status, vencimento e PDF."
          />
        ) : (
          <FinanceInvoiceTable invoices={invoiceRows} title="Minhas faturas" showTeam={false} compact />
        )}
    </div>
    )
  } catch (error: any) {
    console.error('[TEAM][FINANCE]', error)
    return (
      <div className="space-y-8 pb-10">
        <FinancePageHeader
          eyebrow="Area da equipe"
          badge="Falha de carregamento"
          title="Financeiro"
          description="Nao foi possivel carregar suas faturas agora, mas a navegacao da equipe continua disponivel."
        />
        <FinanceErrorState detail={error?.message} />
      </div>
    )
  }
}
