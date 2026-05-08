'use client'
import { useEffect, useState } from 'react'
import { Plus, CheckCircle, Clock, AlertTriangle } from 'lucide-react'

type Fee = {
  id: string; teamId: string; type: string; description: string
  amount: number; dueDate: string; paidAt: string | null; paidAmount: number | null
  status: string; season: number; notes: string | null
  team: { id: string; name: string } | null
}
type Team = { id: string; name: string }

const STATUS_CONFIG: Record<string, { label: string; cls: string }> = {
  PENDING:     { label: 'Pendente',   cls: 'bg-yellow-100 text-yellow-700' },
  PAID:        { label: 'Pago',       cls: 'bg-green-100 text-green-700' },
  OVERDUE:     { label: 'Vencido',    cls: 'bg-red-100 text-red-700' },
  EXEMPT:      { label: 'Isento',     cls: 'bg-gray-100 text-gray-500' },
  NEGOTIATING: { label: 'Negociando', cls: 'bg-blue-100 text-blue-700' },
}

const FEE_TYPES = ['REGISTRATION', 'ANNUAL', 'ATHLETE', 'REFEREE', 'PENALTY', 'OTHER']

export default function FeesPage() {
  const [fees, setFees] = useState<Fee[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [filterTeam, setFilterTeam] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [showNew, setShowNew] = useState(false)
  const [newForm, setNewForm] = useState({
    teamId: '', type: 'ANNUAL', description: '', amount: '', dueDate: '', notes: '',
  })

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/club-fees?season=2026').then(r => r.json()).catch(() => []),
      fetch('/api/admin/teams').then(r => r.json()).catch(() => []),
    ]).then(([f, t]) => { setFees(Array.isArray(f) ? f : []); setTeams(Array.isArray(t) ? t : []) })
      .finally(() => setLoading(false))
  }, [])

  async function createFee() {
    if (!newForm.teamId || !newForm.amount || !newForm.dueDate || !newForm.description) return
    const res = await fetch('/api/admin/club-fees', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...newForm, season: 2026 }),
    })
    const fee = await res.json()
    setFees(prev => [...prev, fee])
    setNewForm({ teamId: '', type: 'ANNUAL', description: '', amount: '', dueDate: '', notes: '' })
    setShowNew(false)
  }

  async function markPaid(id: string) {
    const amountStr = prompt('Valor pago (R$):')
    if (!amountStr) return
    const res = await fetch(`/api/admin/club-fees/${id}/pay`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paidAmount: Number(amountStr) }),
    })
    if (res.ok) {
      const updated = await res.json()
      setFees(prev => prev.map(f => f.id === id ? { ...f, ...updated } : f))
    }
  }

  const filtered = fees.filter(f => {
    const mt = !filterTeam || f.teamId === filterTeam
    const ms = !filterStatus || f.status === filterStatus
    return mt && ms
  })

  const inputCls = 'h-9 rounded-xl border border-[var(--border)] bg-white px-3 text-sm focus:outline-none focus:border-[var(--verde)]'

  const pending = filtered.filter(f => f.status === 'PENDING').length
  const overdue = filtered.filter(f => f.status === 'OVERDUE' || (f.status === 'PENDING' && new Date(f.dueDate) < new Date())).length
  const paid = filtered.filter(f => f.status === 'PAID').length

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--verde)]">Gestão</p>
          <h1 className="fgb-display mt-1 text-3xl text-[var(--black)]">Taxas de Clube</h1>
          <p className="mt-1 text-sm text-[var(--gray)]">Temporada 2026</p>
        </div>
        <button onClick={() => setShowNew(!showNew)}
          className="inline-flex h-11 items-center gap-2 rounded-xl bg-[var(--verde)] px-5 text-[10px] font-black uppercase tracking-widest text-white">
          <Plus className="h-4 w-4" /> Nova taxa
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          { label: 'Total', value: filtered.length, cls: 'bg-white' },
          { label: 'Pendentes', value: pending, cls: 'bg-yellow-50' },
          { label: 'Vencidas', value: overdue, cls: 'bg-red-50' },
          { label: 'Pagas', value: paid, cls: 'bg-green-50' },
        ].map(s => (
          <div key={s.label} className={`rounded-2xl border border-[var(--border)] p-4 ${s.cls}`}>
            <p className="text-[10px] font-black uppercase tracking-widest text-[var(--gray)]">{s.label}</p>
            <p className="fgb-display mt-2 text-3xl text-[var(--black)]">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-3">
        <select value={filterTeam} onChange={e => setFilterTeam(e.target.value)} className={`${inputCls} w-48`}>
          <option value="">Todos os clubes</option>
          {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className={`${inputCls} w-40`}>
          <option value="">Todos os status</option>
          {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
      </div>

      {showNew && (
        <div className="rounded-[20px] border border-[var(--border)] bg-white p-5 shadow-sm">
          <p className="mb-4 text-[10px] font-black uppercase tracking-widest text-[var(--gray)]">Nova Taxa</p>
          <div className="grid gap-3 sm:grid-cols-3">
            <select value={newForm.teamId} onChange={e => setNewForm(p => ({ ...p, teamId: e.target.value }))}
              className="h-10 w-full rounded-xl border border-[var(--border)] bg-white px-3 text-sm focus:outline-none">
              <option value="">Clube *</option>
              {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
            <select value={newForm.type} onChange={e => setNewForm(p => ({ ...p, type: e.target.value }))}
              className="h-10 w-full rounded-xl border border-[var(--border)] bg-white px-3 text-sm focus:outline-none">
              {FEE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <input value={newForm.description} onChange={e => setNewForm(p => ({ ...p, description: e.target.value }))}
              placeholder="Descrição *" className="h-10 w-full rounded-xl border border-[var(--border)] bg-white px-3 text-sm focus:outline-none" />
            <input type="number" value={newForm.amount} onChange={e => setNewForm(p => ({ ...p, amount: e.target.value }))}
              placeholder="Valor R$ *" className="h-10 w-full rounded-xl border border-[var(--border)] bg-white px-3 text-sm focus:outline-none" />
            <input type="date" value={newForm.dueDate} onChange={e => setNewForm(p => ({ ...p, dueDate: e.target.value }))}
              className="h-10 w-full rounded-xl border border-[var(--border)] bg-white px-3 text-sm focus:outline-none" />
            <input value={newForm.notes} onChange={e => setNewForm(p => ({ ...p, notes: e.target.value }))}
              placeholder="Observações" className="h-10 w-full rounded-xl border border-[var(--border)] bg-white px-3 text-sm focus:outline-none" />
          </div>
          <div className="mt-3 flex gap-3">
            <button onClick={createFee}
              className="h-10 rounded-xl bg-[var(--verde)] px-6 text-[10px] font-black uppercase tracking-widest text-white">
              Criar taxa
            </button>
            <button onClick={() => setShowNew(false)}
              className="h-10 rounded-xl border border-[var(--border)] px-6 text-[10px] font-black uppercase tracking-widest text-[var(--gray)]">
              Cancelar
            </button>
          </div>
        </div>
      )}

      <div className="rounded-[24px] border border-[var(--border)] bg-white shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-sm text-[var(--gray)]">Carregando...</div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center text-sm text-[var(--gray)]">Nenhuma taxa encontrada.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--gray-l)]">
                {['Clube', 'Descrição', 'Valor', 'Vencimento', 'Status', 'Ações'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-[var(--gray)]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {filtered.map(f => {
                const isOverdue = f.status === 'PENDING' && new Date(f.dueDate) < new Date()
                const cfg = isOverdue ? { label: 'Vencido', cls: 'bg-red-100 text-red-700' } : (STATUS_CONFIG[f.status] || STATUS_CONFIG.PENDING)
                return (
                  <tr key={f.id} className={`hover:bg-[var(--gray-l)]/50 ${isOverdue ? 'bg-red-50/30' : ''}`}>
                    <td className="px-4 py-3 font-bold text-[var(--black)]">{f.team?.name || '—'}</td>
                    <td className="px-4 py-3 text-[var(--gray)]">{f.description}</td>
                    <td className="px-4 py-3 font-bold text-[var(--black)]">R$ {f.amount.toFixed(2)}</td>
                    <td className="px-4 py-3 text-[var(--gray)]">{new Date(f.dueDate).toLocaleDateString('pt-BR')}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-black uppercase ${cfg.cls}`}>
                        {cfg.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {f.status !== 'PAID' && (
                        <button onClick={() => markPaid(f.id)}
                          className="h-8 rounded-lg border border-[var(--border)] px-3 text-[9px] font-black uppercase tracking-widest text-[var(--verde)] hover:border-[var(--verde)]">
                          Confirmar pag.
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
