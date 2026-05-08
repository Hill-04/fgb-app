'use client'
import { useEffect, useState } from 'react'
import { Plus, Pencil, Check, X } from 'lucide-react'

type Category = { id: string; name: string; remuneration: number; isActive: boolean }

export default function RefereeCategoriesPage() {
  const [cats, setCats] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({ name: '', remuneration: '', isActive: true })
  const [newForm, setNewForm] = useState({ name: '', remuneration: '0' })
  const [showNew, setShowNew] = useState(false)

  useEffect(() => {
    fetch('/api/admin/referee-categories').then(r => r.json()).then(setCats).finally(() => setLoading(false))
  }, [])

  async function saveEdit(id: string) {
    const res = await fetch(`/api/admin/referee-categories/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: editForm.name, remuneration: Number(editForm.remuneration), isActive: editForm.isActive }),
    })
    const updated = await res.json()
    setCats(prev => prev.map(c => c.id === id ? updated : c))
    setEditingId(null)
  }

  async function createCat() {
    if (!newForm.name.trim()) return
    const res = await fetch('/api/admin/referee-categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newForm.name, remuneration: Number(newForm.remuneration) }),
    })
    const cat = await res.json()
    setCats(prev => [...prev, cat])
    setNewForm({ name: '', remuneration: '0' })
    setShowNew(false)
  }

  async function deleteCat(id: string) {
    if (!confirm('Excluir categoria?')) return
    await fetch(`/api/admin/referee-categories/${id}`, { method: 'DELETE' })
    setCats(prev => prev.filter(c => c.id !== id))
  }

  const inputCls = 'h-9 rounded-lg border border-[var(--border)] bg-white px-3 text-sm focus:outline-none focus:border-[var(--verde)]'

  return (
    <div className="max-w-2xl space-y-6 pb-12">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--verde)]">Árbitros</p>
          <h1 className="fgb-display mt-1 text-2xl text-[var(--black)]">Categorias de Arbitragem</h1>
        </div>
        <button onClick={() => setShowNew(true)}
          className="inline-flex h-10 items-center gap-2 rounded-xl bg-[var(--verde)] px-4 text-[10px] font-black uppercase tracking-widest text-white hover:bg-[var(--verde)]/90">
          <Plus className="h-3.5 w-3.5" /> Nova categoria
        </button>
      </div>

      <div className="rounded-[24px] border border-[var(--border)] bg-white shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-sm text-[var(--gray)]">Carregando...</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--gray-l)]">
                <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-[var(--gray)]">Categoria</th>
                <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-[var(--gray)]">Remuneração / jogo</th>
                <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-[var(--gray)]">Ativo</th>
                <th className="px-4 py-3 text-right text-[10px] font-black uppercase tracking-widest text-[var(--gray)]">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {showNew && (
                <tr className="bg-[var(--verde)]/5">
                  <td className="px-4 py-2"><input autoFocus value={newForm.name} onChange={e => setNewForm(p => ({ ...p, name: e.target.value }))} placeholder="Nome da categoria" className={`${inputCls} w-full`} /></td>
                  <td className="px-4 py-2"><input type="number" value={newForm.remuneration} onChange={e => setNewForm(p => ({ ...p, remuneration: e.target.value }))} className={`${inputCls} w-28`} /></td>
                  <td className="px-4 py-2 text-[var(--gray)]">—</td>
                  <td className="px-4 py-2 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={createCat} className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--verde)] text-white"><Check className="h-3.5 w-3.5" /></button>
                      <button onClick={() => setShowNew(false)} className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border)]"><X className="h-3.5 w-3.5" /></button>
                    </div>
                  </td>
                </tr>
              )}
              {cats.map(c => (
                <tr key={c.id} className="hover:bg-[var(--gray-l)]/50">
                  <td className="px-4 py-3">
                    {editingId === c.id ? (
                      <input value={editForm.name} onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))} className={`${inputCls} w-full`} />
                    ) : (
                      <span className="font-bold text-[var(--black)]">{c.name}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {editingId === c.id ? (
                      <input type="number" value={editForm.remuneration} onChange={e => setEditForm(p => ({ ...p, remuneration: e.target.value }))} className={`${inputCls} w-28`} />
                    ) : (
                      <span className="text-[var(--gray)]">R$ {c.remuneration.toFixed(2)}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {editingId === c.id ? (
                      <input type="checkbox" checked={editForm.isActive} onChange={e => setEditForm(p => ({ ...p, isActive: e.target.checked }))} className="h-4 w-4" />
                    ) : (
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-black uppercase ${c.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {c.isActive ? 'Sim' : 'Não'}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {editingId === c.id ? (
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => saveEdit(c.id)} className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--verde)] text-white"><Check className="h-3.5 w-3.5" /></button>
                        <button onClick={() => setEditingId(null)} className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border)]"><X className="h-3.5 w-3.5" /></button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => { setEditingId(c.id); setEditForm({ name: c.name, remuneration: c.remuneration.toString(), isActive: c.isActive }) }}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border)] hover:border-[var(--verde)] hover:text-[var(--verde)]">
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button onClick={() => deleteCat(c.id)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border)] hover:border-red-400 hover:text-red-500">
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {cats.length === 0 && !showNew && (
                <tr><td colSpan={4} className="px-4 py-8 text-center text-sm text-[var(--gray)]">Nenhuma categoria cadastrada.</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
