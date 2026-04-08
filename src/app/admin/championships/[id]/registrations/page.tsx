'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { Plus, Edit2, Trash2, Shield, Loader2 } from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

type Category = { id: string; name: string }
type Team = { id: string; name: string }

type Registration = {
  id: string
  team: { id: string; name: string }
  categories: Category[]
  status: 'PENDING' | 'CONFIRMED'
}

type Championship = {
  id: string
  name: string
  regDeadline: string | null
  status: string
}

export default function RegistrationsPage() {
  const params = useParams()
  const id = params.id as string

  // State
  const [registrations, setRegistrations] = useState<Registration[]>([])
  const [allTeams, setAllTeams] = useState<Team[]>([])
  const [allCategories, setAllCategories] = useState<Category[]>([])
  const [championship, setChampionship] = useState<Championship | null>(null)
  
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingReg, setEditingReg] = useState<Registration | null>(null)
  
  // Form State
  const [formTeamId, setFormTeamId] = useState('')
  const [formCategoryIds, setFormCategoryIds] = useState<string[]>([])
  const [formStatus, setFormStatus] = useState<'PENDING' | 'CONFIRMED'>('PENDING')
  const [formError, setFormError] = useState('')
  const [submitLoading, setSubmitLoading] = useState(false)

  // ─── Fetch Data ─────────────────────────────────────────────────────────────

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [regRes, teamRes, champRes, catRes] = await Promise.all([
        fetch(`/api/championships/${id}/registrations`),
        fetch('/api/admin/teams'),
        fetch(`/api/championships/${id}`),
        fetch(`/api/championships/${id}/categories`)
      ])
      
      if (regRes.ok) setRegistrations(await regRes.json())
      if (teamRes.ok) setAllTeams(await teamRes.json())
      if (champRes.ok) setChampionship(await champRes.json())
      if (catRes.ok) setAllCategories(await catRes.json())
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // ─── Actions ────────────────────────────────────────────────────────────────

  const openEdit = (reg: Registration) => {
    setEditingReg(reg)
    setFormTeamId(reg.team.id)
    setFormCategoryIds(reg.categories.map(c => c.id))
    setFormStatus(reg.status)
    setFormError('')
    setShowModal(true)
  }

  const openNew = () => {
    setEditingReg(null)
    setFormTeamId('')
    setFormCategoryIds([])
    setFormStatus('PENDING')
    setFormError('')
    setShowModal(true)
  }

  const handleDelete = async (regId: string) => {
    if (!confirm('Deseja realmente excluir esta inscrição?')) return
    
    try {
      const res = await fetch(`/api/championships/${id}/registrations/${regId}`, {
        method: 'DELETE'
      })
      if (res.ok) fetchData()
      else alert('Erro ao excluir inscrição')
    } catch (error) {
      console.error('Delete error:', error)
    }
  }

  const handleSubmit = async () => {
    if (!formTeamId) { setFormError('Selecione uma equipe'); return }
    if (formCategoryIds.length === 0) { setFormError('Selecione ao menos uma categoria'); return }
    
    setSubmitLoading(true)
    setFormError('')
    
    try {
      const url = editingReg 
        ? `/api/championships/${id}/registrations/${editingReg.id}`
        : `/api/championships/${id}/registrations`
      
      const res = await fetch(url, {
        method: editingReg ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teamId: formTeamId,
          categoryIds: formCategoryIds,
          status: formStatus
        })
      })

      if (res.ok) {
        setShowModal(false)
        fetchData()
      } else {
        const d = await res.json()
        setFormError(d.error || 'Erro ao salvar inscrição')
      }
    } catch (error) {
      setFormError('Erro de conexão')
    } finally {
      setSubmitLoading(false)
    }
  }

  // ─── Render Helpers ────────────────────────────────────────────────────────

  if (loading || !championship) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="w-10 h-10 text-[var(--verde)] animate-spin" />
        <p className="text-[10px] font-black text-[var(--gray)] uppercase tracking-widest">Carregando inscrições...</p>
      </div>
    )
  }

  const today = new Date()
  const regStatus = championship.regDeadline
    ? new Date(championship.regDeadline) > today
      ? { label: 'Inscrições Abertas', color: 'text-green-600 bg-green-50 border-green-200' }
      : { label: 'Inscrições Encerradas', color: 'text-red-600 bg-red-50 border-red-200' }
    : { label: 'Prazo não definido', color: 'text-orange-600 bg-orange-50 border-orange-200' }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="fgb-display text-4xl text-[var(--black)] leading-none">
            Inscrições
          </h2>
          <p className="fgb-label text-[var(--gray)] mt-1" style={{ fontSize: 10, letterSpacing: 2 }}>
            {registrations.length} equipe(s) inscrita(s)
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full border shadow-sm ${regStatus.color}`}>
            {regStatus.label}
          </span>
          <button
            onClick={openNew}
            className="bg-[var(--amarelo)] hover:bg-[#E66000] text-[var(--black)] font-black text-[10px] uppercase tracking-widest px-5 h-10 rounded-xl flex items-center gap-2 transition-all shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Adicionar Inscrição
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="fgb-card bg-white mt-8 overflow-hidden shadow-sm">
        <table className="w-full">
          <thead className="bg-[var(--gray-l)]">
            <tr className="border-b border-[var(--border)]">
              <th className="text-[9px] font-black uppercase tracking-widest text-[var(--gray)] text-left px-6 py-4">Equipe</th>
              <th className="text-[9px] font-black uppercase tracking-widest text-[var(--gray)] text-left px-6 py-4">Categorias</th>
              <th className="text-[9px] font-black uppercase tracking-widest text-[var(--gray)] text-left px-6 py-4">Status</th>
              <th className="text-[9px] font-black uppercase tracking-widest text-[var(--gray)] text-right px-6 py-4">Ações</th>
            </tr>
          </thead>
          <tbody>
            {registrations.map((reg) => (
              <tr key={reg.id} className="border-b border-[var(--border)] hover:bg-[var(--gray-l)] transition-colors group">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-orange-50 flex items-center justify-center border border-orange-100">
                      <Shield className="w-4 h-4 text-orange-600" />
                    </div>
                    <span className="text-sm font-black uppercase text-[var(--black)] group-hover:text-green-600 transition-colors">{reg.team.name}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-wrap gap-1">
                    {reg.categories.map(c => (
                      <span key={c.id} className="text-[8px] font-black uppercase tracking-widest bg-white border border-[var(--border)] px-2 py-1 rounded-lg text-[var(--gray)] shadow-sm">
                        {c.name}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border shadow-sm ${
                    reg.status === 'CONFIRMED'
                      ? 'text-green-600 bg-green-50 border-green-200'
                      : 'text-orange-600 bg-orange-50 border-orange-200'
                  }`}>
                    {reg.status === 'CONFIRMED' ? 'Confirmado' : 'Pendente'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => openEdit(reg)}
                      className="w-8 h-8 rounded-xl hover:bg-orange-50 flex items-center justify-center text-[var(--gray)] hover:text-orange-600 transition-all"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(reg.id)}
                      className="w-8 h-8 rounded-xl hover:bg-red-50 flex items-center justify-center text-[var(--gray)] hover:text-red-500 transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {registrations.length === 0 && (
          <div className="p-16 text-center">
            <p className="text-[10px] font-black uppercase tracking-widest text-[var(--gray)]">
              Nenhuma inscrição ainda
            </p>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-lg fgb-card bg-white overflow-hidden shadow-2xl animate-in zoom-in-95">
            <div className="p-8 border-b border-[var(--border)] bg-[var(--gray-l)]">
              <h3 className="fgb-display text-2xl text-[var(--black)] leading-none">
                {editingReg ? 'Editar Inscrição' : 'Nova Inscrição'}
              </h3>
              <p className="fgb-label text-[var(--gray)] mt-1" style={{ fontSize: 10, letterSpacing: 2 }}>
                Dados da inscrição manual
              </p>
            </div>
            <div className="p-8 space-y-6">
              {/* Select Equipe */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-[var(--gray)]">
                  Equipe
                </label>
                <select
                  disabled={!!editingReg}
                  value={formTeamId}
                  onChange={e => setFormTeamId(e.target.value)}
                  className="w-full bg-[var(--gray-l)] border border-[var(--border)] h-12 rounded-xl px-4 text-sm text-[var(--black)] focus:outline-none focus:border-[var(--verde)] disabled:opacity-50 appearance-none font-bold"
                >
                  <option value="" className="bg-white">Selecionar equipe...</option>
                  {allTeams.map(t => (
                    <option key={t.id} value={t.id} className="bg-white">{t.name}</option>
                  ))}
                </select>
              </div>

              {/* Categorias */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-[var(--gray)]">
                  Categorias
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {allCategories.map(cat => (
                    <label
                      key={cat.id}
                      className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer transition-all shadow-sm ${
                        formCategoryIds.includes(cat.id)
                          ? 'bg-green-50 border-green-200 text-green-700'
                          : 'bg-white border-[var(--border)] text-[var(--gray)] hover:border-gray-400'
                      }`}
                    >
                      <input
                        type="checkbox"
                        className="hidden"
                        checked={formCategoryIds.includes(cat.id)}
                        onChange={e => {
                          if (e.target.checked) {
                            setFormCategoryIds(prev => [...prev, cat.id])
                          } else {
                            setFormCategoryIds(prev => prev.filter(id => id !== cat.id))
                          }
                        }}
                      />
                      <span className="text-[10px] font-black uppercase tracking-widest">
                        {cat.name}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Status */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-[var(--gray)]">
                  Status
                </label>
                <div className="flex gap-2">
                  {(['PENDING', 'CONFIRMED'] as const).map(s => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setFormStatus(s)}
                      className={`flex-1 h-11 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all shadow-sm ${
                        formStatus === s
                          ? s === 'CONFIRMED' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-orange-50 border-orange-200 text-orange-600'
                          : 'bg-white border-[var(--border)] text-[var(--gray)] hover:border-gray-400'
                      }`}
                    >
                      {s === 'PENDING' ? 'Pendente' : 'Confirmado'}
                    </button>
                  ))}
                </div>
              </div>

              {formError && (
                <p className="text-red-600 text-[10px] font-black uppercase tracking-widest bg-red-50 p-4 rounded-xl border border-red-200">
                  {formError}
                </p>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 h-12 font-black text-[10px] uppercase tracking-widest text-[var(--gray)] hover:text-[var(--black)] transition-all rounded-xl border border-[var(--border)] shadow-sm bg-white"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={submitLoading}
                  className="flex-1 bg-[var(--amarelo)] hover:bg-[#E66000] text-[var(--black)] font-black text-[10px] uppercase tracking-widest h-12 rounded-xl transition-all disabled:opacity-50 shadow-sm"
                >
                  {submitLoading ? 'Salvando...' : 'Salvar Inscrição'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
