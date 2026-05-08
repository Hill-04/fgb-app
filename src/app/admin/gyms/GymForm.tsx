'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Team = { id: string; name: string }
type Gym = {
  id?: string; name: string; city: string; state?: string | null; address?: string | null
  capacity?: number | null; courts?: number; phone?: string | null; observations?: string | null
  canHost?: boolean; isActive?: boolean; teamId?: string | null
}

export default function GymForm({ teams, gym }: { teams: Team[]; gym?: Gym }) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: gym?.name || '',
    city: gym?.city || '',
    state: gym?.state || 'RS',
    address: gym?.address || '',
    capacity: gym?.capacity?.toString() || '',
    courts: (gym?.courts ?? 1).toString(),
    phone: gym?.phone || '',
    observations: gym?.observations || '',
    canHost: gym?.canHost ?? true,
    isActive: gym?.isActive ?? true,
    teamId: gym?.teamId || '',
  })

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(p => ({ ...p, [k]: e.target.value }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const url = gym?.id ? `/api/admin/gyms/${gym.id}` : '/api/admin/gyms'
    const method = gym?.id ? 'PATCH' : 'POST'
    await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    router.push('/admin/gyms')
    router.refresh()
  }

  const inputCls = 'h-10 rounded-xl border border-[var(--border)] bg-white px-3 text-sm w-full focus:outline-none focus:border-[var(--verde)]'
  const labelCls = 'text-[10px] font-black uppercase tracking-widest text-[var(--gray)]'

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="rounded-[20px] border border-[var(--border)] bg-white p-5 shadow-sm">
        <p className="mb-4 text-[10px] font-black uppercase tracking-widest text-[var(--gray)]">Dados do Ginásio</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className={labelCls}>Nome *</label>
            <input required value={form.name} onChange={set('name')} className={`mt-1 ${inputCls}`} />
          </div>
          <div>
            <label className={labelCls}>Cidade *</label>
            <input required value={form.city} onChange={set('city')} className={`mt-1 ${inputCls}`} />
          </div>
          <div>
            <label className={labelCls}>Estado</label>
            <input value={form.state} onChange={set('state')} className={`mt-1 ${inputCls}`} />
          </div>
          <div className="sm:col-span-2">
            <label className={labelCls}>Endereço</label>
            <input value={form.address} onChange={set('address')} className={`mt-1 ${inputCls}`} />
          </div>
          <div>
            <label className={labelCls}>Capacidade</label>
            <input type="number" value={form.capacity} onChange={set('capacity')} className={`mt-1 ${inputCls}`} />
          </div>
          <div>
            <label className={labelCls}>Nº de Quadras</label>
            <input type="number" min={1} value={form.courts} onChange={set('courts')} className={`mt-1 ${inputCls}`} />
          </div>
          <div>
            <label className={labelCls}>Telefone</label>
            <input value={form.phone} onChange={set('phone')} className={`mt-1 ${inputCls}`} />
          </div>
          <div>
            <label className={labelCls}>Clube responsável</label>
            <select value={form.teamId} onChange={set('teamId')} className={`mt-1 ${inputCls}`}>
              <option value="">Sem clube</option>
              {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className={labelCls}>Observações</label>
            <textarea value={form.observations} onChange={set('observations')} rows={2}
              className="mt-1 w-full rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm focus:outline-none focus:border-[var(--verde)]" />
          </div>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.canHost} onChange={e => setForm(p => ({ ...p, canHost: e.target.checked }))} className="h-4 w-4" />
              <span className="text-sm text-[var(--black)]">Pode sediar jogos</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.isActive} onChange={e => setForm(p => ({ ...p, isActive: e.target.checked }))} className="h-4 w-4" />
              <span className="text-sm text-[var(--black)]">Ativo</span>
            </label>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <button type="button" onClick={() => router.back()}
          className="h-11 rounded-xl border border-[var(--border)] px-6 text-[10px] font-black uppercase tracking-widest text-[var(--gray)] hover:border-[var(--black)]">
          Cancelar
        </button>
        <button type="submit" disabled={saving}
          className="h-11 flex-1 rounded-xl bg-[var(--verde)] text-[10px] font-black uppercase tracking-widest text-white hover:bg-[var(--verde)]/90 disabled:opacity-60">
          {saving ? 'Salvando...' : 'Salvar'}
        </button>
      </div>
    </form>
  )
}
