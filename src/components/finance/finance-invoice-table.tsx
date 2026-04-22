'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Search, SlidersHorizontal } from 'lucide-react'

import { InvoiceStatusBadge } from '@/components/finance/invoice-status-badge'
import { Input } from '@/components/ui/input'
import { formatCurrencyCentsBRL } from '@/lib/finance'

type FinanceInvoiceRow = {
  id: string
  number: string
  teamName: string
  championshipName: string
  issueDateLabel: string
  dueDateLabel: string
  effectiveStatus: string
  totalCents: number
  paidCents: number
  balanceCents: number
  href: string
}

type FinanceInvoiceTableProps = {
  invoices: FinanceInvoiceRow[]
  compact?: boolean
  showTeam?: boolean
  title?: string
}

const statusOptions = [
  { value: 'ALL', label: 'Todos' },
  { value: 'OPEN', label: 'Abertas' },
  { value: 'PARTIAL', label: 'Parciais' },
  { value: 'PAID', label: 'Pagas' },
  { value: 'OVERDUE', label: 'Vencidas' },
  { value: 'DRAFT', label: 'Rascunhos' },
  { value: 'VOID', label: 'Canceladas' },
]

export function FinanceInvoiceTable({ invoices, compact = false, showTeam = true, title = 'Faturas' }: FinanceInvoiceTableProps) {
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('ALL')

  const filteredInvoices = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    return invoices.filter((invoice) => {
      const matchesStatus = status === 'ALL' || invoice.effectiveStatus === status
      const matchesQuery =
        !normalizedQuery ||
        invoice.number.toLowerCase().includes(normalizedQuery) ||
        invoice.teamName.toLowerCase().includes(normalizedQuery) ||
        invoice.championshipName.toLowerCase().includes(normalizedQuery)

      return matchesStatus && matchesQuery
    })
  }, [invoices, query, status])

  return (
    <div className="overflow-hidden rounded-[32px] border border-[var(--border)] bg-white shadow-sm">
      <div className="border-b border-[var(--border)] bg-[var(--gray-l)] px-5 py-5 md:px-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[var(--verde)]">Controle oficial</p>
            <h2 className="fgb-display mt-1 text-2xl leading-none text-[var(--black)]">{title}</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-[minmax(180px,260px)_160px]">
            <label className="relative block">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--gray)]" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Buscar fatura/equipe"
                className="h-11 rounded-2xl bg-white pl-9"
              />
            </label>
            <label className="relative block">
              <SlidersHorizontal className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--gray)]" />
              <select
                value={status}
                onChange={(event) => setStatus(event.target.value)}
                className="h-11 w-full rounded-2xl border border-[var(--border)] bg-white pl-9 pr-3 text-xs font-black uppercase tracking-widest text-[var(--black)]"
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </label>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="border-b border-[var(--border)]">
              <th className="px-6 py-4 text-left text-[9px] font-black uppercase tracking-widest text-[var(--gray)]">Fatura</th>
              {showTeam ? <th className="px-6 py-4 text-left text-[9px] font-black uppercase tracking-widest text-[var(--gray)]">Equipe</th> : null}
              <th className="px-6 py-4 text-left text-[9px] font-black uppercase tracking-widest text-[var(--gray)]">Status</th>
              {!compact ? <th className="px-6 py-4 text-right text-[9px] font-black uppercase tracking-widest text-[var(--gray)]">Vencimento</th> : null}
              <th className="px-6 py-4 text-right text-[9px] font-black uppercase tracking-widest text-[var(--gray)]">Pago</th>
              <th className="px-6 py-4 text-right text-[9px] font-black uppercase tracking-widest text-[var(--gray)]">Pendente</th>
            </tr>
          </thead>
          <tbody>
            {filteredInvoices.length === 0 ? (
              <tr>
                <td colSpan={showTeam ? 6 : 5} className="px-6 py-14 text-center text-sm font-semibold text-[var(--gray)]">
                  Nenhuma fatura encontrada com os filtros atuais.
                </td>
              </tr>
            ) : filteredInvoices.map((invoice) => (
              <tr key={invoice.id} className="border-b border-[var(--border)] transition hover:bg-[var(--gray-l)]">
                <td className="px-6 py-4">
                  <Link href={invoice.href} className="font-black text-[var(--black)] hover:text-[var(--verde)]">{invoice.number}</Link>
                  <p className="mt-1 text-xs font-semibold text-[var(--gray)]">{invoice.championshipName}</p>
                  {!compact ? <p className="mt-1 text-[10px] font-black uppercase tracking-widest text-[var(--gray)]">Emitida em {invoice.issueDateLabel}</p> : null}
                </td>
                {showTeam ? <td className="px-6 py-4 text-sm font-semibold text-[var(--black)]">{invoice.teamName}</td> : null}
                <td className="px-6 py-4"><InvoiceStatusBadge status={invoice.effectiveStatus} /></td>
                {!compact ? <td className="px-6 py-4 text-right text-sm font-bold text-[var(--black)]">{invoice.dueDateLabel}</td> : null}
                <td className="px-6 py-4 text-right font-black text-[var(--verde)]">{formatCurrencyCentsBRL(invoice.paidCents)}</td>
                <td className="px-6 py-4 text-right">
                  <span className="font-black text-[var(--red)]">{formatCurrencyCentsBRL(invoice.balanceCents)}</span>
                  <p className="mt-1 text-[10px] font-bold text-[var(--gray)]">Total {formatCurrencyCentsBRL(invoice.totalCents)}</p>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
