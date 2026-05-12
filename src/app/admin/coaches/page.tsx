'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Plus, Pencil, User, Trash2, CreditCard } from 'lucide-react'

const ROLE_LABELS: Record<string, string> = {
  'Técnico': 'Técnico',
  'Técnico Auxiliar': 'Técnico Auxiliar',
  'Preparador Físico': 'Preparador Físico',
  'Fisioterapeuta': 'Fisioterapeuta',
  'Médico': 'Médico',
  'Dirigente': 'Dirigente',
  'Massagista': 'Massagista',
  'Outros': 'Outros',
}

type Coach = {
  id: string
  name: string
  role: string
  email: string | null
  mobile: string | null
  photoUrl: string | null
  isActive: boolean
  situation: string
  team: { id: string; name: string } | null
}

export default function CoachesPage() {
  const [coaches, setCoaches] = useState<Coach[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterRole, setFilterRole] = useState('')

  useEffect(() => {
    fetch('/api/admin/coaches')
      .then(r => r.json())
      .then(setCoaches)
      .finally(() => setLoading(false))
  }, [])

  async function deleteCoach(id: string, name: string) {
    if (!confirm(`Excluir ${name}?`)) return
    await fetch(`/api/admin/coaches/${id}`, { method: 'DELETE' })
    setCoaches(prev => prev.filter(c => c.id !== id))
  }

  const filtered = coaches.filter(c => {
    const matchSearch = !search || c.name.toLowerCase().includes(search.toLowerCase())
    const matchRole = !filterRole || c.role === filterRole
    return matchSearch && matchRole
  })

  const inputCls = 'h-10 rounded-xl border border-[var(--border)] bg-white px-3 text-sm focus:outline-none focus:border-[var(--verde)]'

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--verde)]">Cadastros</p>
          <h1 className="fgb-display mt-1 text-3xl text-[var(--black)]">Comissão Técnica</h1>
          <p className="mt-1 text-sm text-[var(--gray)]">Técnicos, auxiliares e demais membros credenciados</p>
        </div>
        <Link href="/admin/coaches/new"
          className="inline-flex h-11 items-center gap-2 rounded-xl bg-[var(--verde)] px-5 text-[10px] font-black uppercase tracking-widest text-white hover:bg-[var(--verde)]/90">
          <Plus className="h-4 w-4" /> Novo membro
        </Link>
      </div>

      <div className="flex flex-wrap gap-3">
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por nome..." className={`${inputCls} w-56`} />
        <select value={filterRole} onChange={e => setFilterRole(e.target.value)} className={`${inputCls} w-44`}>
          <option value="">Todas as funções</option>
          {Object.keys(ROLE_LABELS).map(r => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>

      <div className="rounded-[24px] border border-[var(--border)] bg-white shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-sm text-[var(--gray)]">Carregando...</div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center text-sm text-[var(--gray)]">Nenhum membro encontrado.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--gray-l)]">
                <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-[var(--gray)]">Membro</th>
                <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-[var(--gray)]">Função</th>
                <th className="hidden md:table-cell px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-[var(--gray)]">Clube</th>
                <th className="hidden md:table-cell px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-[var(--gray)]">Contato</th>
                <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-[var(--gray)]">Situação</th>
                <th className="px-4 py-3 text-right text-[10px] font-black uppercase tracking-widest text-[var(--gray)]">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {filtered.map(c => (
                <tr key={c.id} className="hover:bg-[var(--gray-l)]/50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-[var(--gray-l)] border border-[var(--border)] flex items-center justify-center overflow-hidden shrink-0">
                        {c.photoUrl ? <img src={c.photoUrl} alt={c.name} className="h-full w-full object-cover" /> : <User className="h-4 w-4 text-[var(--gray)]" />}
                      </div>
                      <span className="font-bold text-[var(--black)]">{c.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[var(--gray)]">{c.role}</td>
                  <td className="hidden md:table-cell px-4 py-3 text-[var(--gray)]">{c.team?.name || '—'}</td>
                  <td className="hidden md:table-cell px-4 py-3 text-[var(--gray)]">{c.mobile || c.email || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-black uppercase ${
                      c.situation === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-fgb-ink-100 text-fgb-ink-500'
                    }`}>
                      {c.situation === 'ACTIVE' ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <Link href={`/admin/coaches/${c.id}`}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border)] hover:border-[var(--verde)] hover:text-[var(--verde)] transition-colors">
                        <Pencil className="h-3.5 w-3.5" />
                      </Link>
                      <button onClick={() => deleteCoach(c.id, c.name)}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border)] hover:border-red-400 hover:text-red-500 transition-colors">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
