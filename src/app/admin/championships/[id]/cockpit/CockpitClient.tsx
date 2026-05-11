'use client'

import { useState, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Search, Filter, CheckCircle2, AlertCircle, FileText, ChevronDown, ChevronRight } from 'lucide-react'
import { bulkApproveAction, bulkSendInvoiceAction } from './cockpit-actions'

type Props = {
  championshipId: string
  championship: any
  kpis: { totalTeams: number; confirmed: number; pending: number; blockedCount: number; overdueInvoices: number }
  filters: { category?: string; status?: string; payment?: string; search?: string }
}

export default function CockpitClient({ championshipId, championship, kpis, filters }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [selectedRegIds, setSelectedRegIds] = useState<Set<string>>(new Set())
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const [activeCategory, setActiveCategory] = useState<string | undefined>(
    filters.category ?? championship.categories[0]?.id
  )
  const [isPending, startTransition] = useTransition()

  const updateFilter = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value) params.set(key, value)
    else params.delete(key)
    router.push(`?${params.toString()}`)
  }

  const activeRegistrations: any[] = championship.categories
    .find((c: any) => c.id === activeCategory)
    ?.registrations
    .map((r: any) => r.registration)
    .filter((r: any) => {
      if (filters.status && r.status !== filters.status) return false
      if (filters.search && !r.team.name.toLowerCase().includes(filters.search.toLowerCase())) return false
      return true
    }) ?? []

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleSelect = (id: string) => {
    setSelectedRegIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleBulkApprove = () => {
    startTransition(async () => {
      await bulkApproveAction({ championshipId, registrationIds: [...selectedRegIds] })
      setSelectedRegIds(new Set())
      router.refresh()
    })
  }

  const handleBulkSendInvoice = () => {
    startTransition(async () => {
      await bulkSendInvoiceAction({ championshipId, registrationIds: [...selectedRegIds] })
      setSelectedRegIds(new Set())
      router.refresh()
    })
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-5">
        <KPICard label="Equipes" value={kpis.totalTeams} icon={<FileText size={20} />} color="emerald" />
        <KPICard label="Confirmadas" value={kpis.confirmed} icon={<CheckCircle2 size={20} />} color="emerald" />
        <KPICard label="Pendentes" value={kpis.pending} icon={<AlertCircle size={20} />} color="amber" />
        <KPICard label="Bloqueios" value={kpis.blockedCount} icon={<Filter size={20} />} color="slate" />
        <KPICard label="Faturas atrasadas" value={kpis.overdueInvoices} icon={<AlertCircle size={20} />} color="red" />
      </div>

      <div className="mb-4 flex gap-2 overflow-x-auto">
        {championship.categories.map((cat: any) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium ${
              activeCategory === cat.id
                ? 'bg-fgb-green-700 text-white'
                : 'bg-white text-slate-700 hover:bg-slate-100'
            }`}
          >
            {cat.name} ({cat.registrations.length})
          </button>
        ))}
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3 rounded-lg bg-white p-4 shadow-sm">
        <div className="relative min-w-[200px] flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar equipe..."
            defaultValue={filters.search}
            onChange={(e) => updateFilter('search', e.target.value || null)}
            className="w-full rounded-lg border border-slate-200 py-2 pl-10 pr-3 text-sm"
          />
        </div>
        <select
          value={filters.status ?? ''}
          onChange={(e) => updateFilter('status', e.target.value || null)}
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
        >
          <option value="">Todos status</option>
          <option value="PENDING">Pendente</option>
          <option value="CONFIRMED">Confirmado</option>
          <option value="REJECTED">Rejeitado</option>
        </select>

        {selectedRegIds.size > 0 && (
          <div className="ml-auto flex gap-2">
            <span className="self-center text-sm text-slate-600">{selectedRegIds.size} selecionadas</span>
            <button
              onClick={handleBulkApprove}
              disabled={isPending}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              Aprovar
            </button>
            <button
              onClick={handleBulkSendInvoice}
              disabled={isPending}
              className="rounded-lg bg-fgb-green-700 px-4 py-2 text-sm font-medium text-white hover:bg-fgb-green-800 disabled:opacity-50"
            >
              Emitir fatura
            </button>
          </div>
        )}
      </div>

      <div className="rounded-lg bg-white shadow-sm">
        <table className="w-full">
          <thead className="border-b border-slate-200 text-xs uppercase text-slate-500">
            <tr>
              <th className="w-10 p-3"></th>
              <th className="w-8 p-3"></th>
              <th className="p-3 text-left">Equipe</th>
              <th className="p-3 text-left">Atletas</th>
              <th className="p-3 text-left">Bloqueios</th>
              <th className="p-3 text-left">Pagamento</th>
              <th className="p-3 text-left">Status</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {activeRegistrations.map((reg: any) => (
              <ExpandableRow
                key={reg.id}
                reg={reg}
                isExpanded={expandedIds.has(reg.id)}
                isSelected={selectedRegIds.has(reg.id)}
                onToggleExpand={() => toggleExpand(reg.id)}
                onToggleSelect={() => toggleSelect(reg.id)}
                championshipId={championshipId}
              />
            ))}
            {activeRegistrations.length === 0 && (
              <tr>
                <td colSpan={8} className="p-8 text-center text-sm text-slate-400">
                  Nenhuma inscrição nessa categoria com esses filtros.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function KPICard({ label, value, icon, color }: { label: string; value: number; icon: React.ReactNode; color: string }) {
  const colorClass = {
    emerald: 'text-emerald-700 bg-emerald-50',
    amber: 'text-amber-700 bg-amber-50',
    slate: 'text-slate-700 bg-slate-100',
    red: 'text-red-700 bg-red-50',
  }[color] ?? 'text-slate-700 bg-slate-50'

  return (
    <div className={`rounded-lg p-4 ${colorClass}`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase">{label}</span>
        {icon}
      </div>
      <div className="mt-2 text-2xl font-bold">{value}</div>
    </div>
  )
}

function ExpandableRow({ reg, isExpanded, isSelected, onToggleExpand, onToggleSelect, championshipId }: {
  reg: any
  isExpanded: boolean
  isSelected: boolean
  onToggleExpand: () => void
  onToggleSelect: () => void
  championshipId: string
}) {
  const statusColor = {
    PENDING: 'bg-amber-100 text-amber-700',
    CONFIRMED: 'bg-emerald-100 text-emerald-700',
    REJECTED: 'bg-red-100 text-red-700',
  }[reg.status as string] ?? 'bg-slate-100 text-slate-700'

  const lastInvoice = reg.financialInvoices[0]

  return (
    <>
      <tr className="border-b border-slate-100 hover:bg-slate-50">
        <td className="p-3">
          <input type="checkbox" checked={isSelected} onChange={onToggleSelect} />
        </td>
        <td className="p-3">
          <button onClick={onToggleExpand} className="text-slate-400 hover:text-slate-700">
            {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </button>
        </td>
        <td className="p-3">
          <div className="font-medium text-slate-900">{reg.team.name}</div>
          <div className="text-xs text-slate-500">Treinador: {reg.coachName || '—'}</div>
        </td>
        <td className="p-3 text-sm">{reg.athletePlayers.length}</td>
        <td className="p-3 text-sm">{reg.blockedDates.length}</td>
        <td className="p-3 text-sm">
          {lastInvoice ? (
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
              lastInvoice.status === 'PAID' ? 'bg-emerald-100 text-emerald-700' :
              lastInvoice.status === 'OVERDUE' ? 'bg-red-100 text-red-700' :
              'bg-amber-100 text-amber-700'
            }`}>
              {lastInvoice.status}
            </span>
          ) : (
            <span className="text-slate-400">—</span>
          )}
        </td>
        <td className="p-3">
          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColor}`}>
            {reg.status}
          </span>
        </td>
        <td className="p-3 text-right">
          <a
            href={`/admin/championships/${championshipId}/registrations/${reg.id}`}
            className="text-sm font-medium text-fgb-green-700 hover:underline"
          >
            Ver detalhes
          </a>
        </td>
      </tr>

      {isExpanded && (
        <tr className="border-b border-slate-100 bg-slate-50">
          <td colSpan={8} className="p-4">
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <h4 className="mb-2 text-xs font-semibold uppercase text-slate-500">Atletas inscritos</h4>
                {reg.athletePlayers.slice(0, 5).map((a: any) => (
                  <div key={a.id} className="text-slate-700">{a.athleteName}</div>
                ))}
                {reg.athletePlayers.length > 5 && (
                  <div className="text-slate-400">+{reg.athletePlayers.length - 5} outros...</div>
                )}
              </div>
              <div>
                <h4 className="mb-2 text-xs font-semibold uppercase text-slate-500">Datas bloqueadas</h4>
                {reg.blockedDates.map((b: any) => (
                  <div key={b.id} className="text-slate-700">
                    {new Date(b.startDate).toLocaleDateString('pt-BR')}
                    {b.endDate && b.endDate !== b.startDate
                      ? ` — ${new Date(b.endDate).toLocaleDateString('pt-BR')}`
                      : ''}
                    {b.reason ? ` (${b.reason})` : ''}
                  </div>
                ))}
                {reg.blockedDates.length === 0 && <span className="text-slate-400">Nenhum</span>}
              </div>
              <div>
                <h4 className="mb-2 text-xs font-semibold uppercase text-slate-500">Contato</h4>
                <div className="text-slate-700">{reg.coachName || '—'}</div>
                <div className="text-slate-500">{reg.coachPhone || ''}</div>
                <div className="text-slate-500">{reg.coachEmail || ''}</div>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  )
}
