import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Download, ShieldCheck, Wallet } from 'lucide-react'

import { AdminInvoiceEditForm } from '@/components/finance/admin-invoice-edit-form'
import { AdminInvoiceItemsManager } from '@/components/finance/admin-invoice-items-manager'
import { AdminInvoicePaymentForm } from '@/components/finance/admin-invoice-payment-form'
import { FinanceErrorState } from '@/components/finance/finance-error-state'
import { InvoiceStatusBadge } from '@/components/finance/invoice-status-badge'
import { InvoiceTimeline } from '@/components/finance/invoice-timeline'
import { prisma } from '@/lib/db'
import { formatCurrencyCentsBRL, getEffectiveInvoiceStatus } from '@/lib/finance'
import { getInvoiceEditPolicy } from '@/lib/finance-invoice-service'

export const dynamic = 'force-dynamic'

type PageProps = {
  params: Promise<{ id: string }>
}

function formatDate(date?: Date | null) {
  return date ? date.toLocaleDateString('pt-BR') : 'Sem data'
}

export default async function AdminFinancialInvoiceDetailPage({ params }: PageProps) {
  const { id } = await params
  try {
    const invoice = await prisma.financialInvoice.findUnique({
      where: { id },
      include: {
        team: { select: { id: true, name: true, city: true, state: true } },
        championship: { select: { id: true, name: true, year: true } },
        registration: { select: { id: true, status: true } },
        items: { orderBy: { createdAt: 'asc' } },
        payments: { orderBy: { paidAt: 'desc' } },
        auditLogs: {
          orderBy: { createdAt: 'desc' },
          include: { createdBy: { select: { id: true, name: true, email: true } } },
        },
      },
    })

    if (!invoice) notFound()

    const effectiveStatus = getEffectiveInvoiceStatus(invoice)
    const editPolicy = getInvoiceEditPolicy(invoice)
    const dueDateInput = invoice.dueDate ? invoice.dueDate.toISOString().slice(0, 10) : ''
    const serializedItems = invoice.items.map((item) => ({
      id: item.id,
      registrationFeeId: item.registrationFeeId,
      feeKey: item.feeKey,
      description: item.description,
      quantity: item.quantity,
      unitValueCents: item.unitValueCents,
      totalCents: item.totalCents,
      sourceType: item.sourceType,
    }))

    return (
      <div className="space-y-7 pb-10">
        <div className="relative overflow-hidden rounded-[36px] border border-[var(--border)] bg-white p-6 shadow-sm">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-2 bg-gradient-to-r from-[var(--verde)] via-[var(--yellow)] to-[var(--red)]" />
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <InvoiceStatusBadge status={effectiveStatus} />
            <span className="rounded-full border border-[var(--border)] bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-[var(--gray)]">
              {invoice.number}
            </span>
          </div>
          <h1 className="fgb-display text-4xl leading-none text-[var(--black)]">Fatura da equipe</h1>
          <p className="mt-2 text-sm text-[var(--gray)]">
            {invoice.team.name} {invoice.championship ? `| ${invoice.championship.name}` : '| Sem campeonato'}
          </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/admin/financeiro/faturas" className="inline-flex h-11 items-center rounded-2xl border border-[var(--border)] bg-white px-5 text-[10px] font-black uppercase tracking-widest text-[var(--black)] hover:bg-[var(--gray-l)]">
              Voltar
            </Link>
            <Link href={`/api/admin/financeiro/invoices/${invoice.id}/pdf`} target="_blank" className="inline-flex h-11 items-center gap-2 rounded-2xl bg-[var(--black)] px-5 text-[10px] font-black uppercase tracking-widest text-white hover:bg-black/85">
              <Download className="h-4 w-4" />
              PDF
            </Link>
          </div>
        </div>
      </div>

      <section className="grid gap-4 md:grid-cols-4">
        {[
          { label: 'Total', value: formatCurrencyCentsBRL(invoice.totalCents), tone: 'black' },
          { label: 'Pago', value: formatCurrencyCentsBRL(invoice.paidCents), tone: 'green' },
          { label: 'Pendente', value: formatCurrencyCentsBRL(invoice.balanceCents), tone: 'red' },
          { label: 'Vencimento', value: formatDate(invoice.dueDate), tone: 'yellow' },
        ].map((item) => (
          <div key={item.label} className="rounded-[26px] border border-[var(--border)] bg-white p-5 shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--gray)]">{item.label}</p>
            <p className={`mt-2 text-2xl font-black ${item.tone === 'red' ? 'text-[var(--red)]' : item.tone === 'green' ? 'text-[var(--verde)]' : 'text-[var(--black)]'}`}>
              {item.value}
            </p>
          </div>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <AdminInvoiceItemsManager
            invoiceId={invoice.id}
            items={serializedItems}
            canAddItem={editPolicy.canAddItem}
            canRemoveManualItem={editPolicy.canRemoveManualItem}
            lockedReason={editPolicy.lockedReason}
          />

          <div className="rounded-[32px] border border-[var(--border)] bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center gap-3">
              <Wallet className="h-5 w-5 text-[var(--verde)]" />
              <h2 className="fgb-display text-2xl leading-none text-[var(--black)]">Pagamentos</h2>
            </div>
            {invoice.payments.length === 0 ? (
              <p className="text-sm font-semibold text-[var(--gray)]">Nenhum pagamento registrado.</p>
            ) : (
              <div className="space-y-3">
                {invoice.payments.map((payment) => (
                  <div key={payment.id} className="rounded-2xl border border-[var(--border)] bg-[var(--gray-l)] p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-black text-[var(--black)]">{formatCurrencyCentsBRL(payment.amountCents)}</p>
                      <span className="rounded-full border border-green-200 bg-green-50 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-green-700">
                        {payment.status}
                      </span>
                    </div>
                    <p className="mt-1 text-xs font-semibold text-[var(--gray)]">{formatDate(payment.paidAt)} | {payment.reference || payment.method}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-[30px] border border-[var(--border)] bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--verde)]/10 text-[var(--verde)]">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[var(--gray)]">Politica de edicao</p>
                <h2 className="fgb-display text-2xl leading-none text-[var(--black)]">Acoes permitidas</h2>
              </div>
            </div>
            <div className="grid gap-2 text-sm font-semibold text-[var(--gray)]">
              <p>Vencimento: <strong className="text-[var(--black)]">{editPolicy.canEditDueDate ? 'permitido' : 'bloqueado'}</strong></p>
              <p>Composicao: <strong className="text-[var(--black)]">{editPolicy.canAddItem ? 'permitida' : 'bloqueada'}</strong></p>
              <p>Cancelamento: <strong className="text-[var(--black)]">{editPolicy.canVoid ? 'permitido' : 'bloqueado'}</strong></p>
              {editPolicy.lockedReason ? <p className="rounded-2xl bg-[var(--gray-l)] p-3 text-xs">{editPolicy.lockedReason}</p> : null}
            </div>
          </div>

          <AdminInvoiceEditForm
            invoiceId={invoice.id}
            dueDate={dueDateInput}
            notes={invoice.notes || ''}
            canEditDueDate={editPolicy.canEditDueDate}
            canEditNotes={editPolicy.canEditNotes}
            lockedReason={editPolicy.lockedReason}
          />

          <AdminInvoicePaymentForm
            invoiceId={invoice.id}
            status={effectiveStatus}
            balanceCents={invoice.balanceCents}
            canVoid={editPolicy.canVoid}
          />

          <InvoiceTimeline logs={invoice.auditLogs} />
        </div>
      </section>
    </div>
    )
  } catch (error: any) {
    console.error('[FINANCE][INVOICE_DETAIL]', error)
    return (
      <div className="space-y-7 pb-10">
        <Link href="/admin/financeiro/faturas" className="inline-flex h-11 items-center rounded-2xl border border-[var(--border)] bg-white px-5 text-[10px] font-black uppercase tracking-widest text-[var(--black)] hover:bg-[var(--gray-l)]">
          Voltar para faturas
        </Link>
        <FinanceErrorState detail={error?.message} />
      </div>
    )
  }
}
