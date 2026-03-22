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
        <Loader2 className="w-10 h-10 text-[#FF6B00] animate-spin" />
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Carregando inscrições...</p>
      </div>
    )
  }

  const today = new Date()
  const regStatus = championship.regDeadline
    ? new Date(championship.regDeadline) > today
      ? { label: 'Inscrições Abertas', color: 'text-green-400 bg-green-500/10 border-green-500/20' }
      : { label: 'Inscrições Encerradas', color: 'text-red-400 bg-red-500/10 border-red-500/20' }
    : { label: 'Prazo não definido', color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20' }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-4xl font-black italic uppercase text-white tracking-tight">
            Inscrições
          </h2>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 mt-1">
            {registrations.length} equipe(s) inscrita(s)
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full border ${regStatus.color}`}>
            {regStatus.label}
          </span>
          <button
            onClick={openNew}
            className="bg-[#FF6B00] hover:bg-[#E66000] text-white font-black text-[10px] uppercase tracking-widest px-5 h-10 rounded-xl flex items-center gap-2 transition-all"
          >
            <Plus className="w-4 h-4" />
            Adicionar Inscrição
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-[#141414] border border-white/[0.08] rounded-3xl overflow-hidden shadow-2xl">
        <table className="w-full">
          <thead className="bg-white/[0.02]">
            <tr className="border-b border-white/5">
              <th className="text-[9px] font-black uppercase tracking-widest text-slate-500 text-left px-6 py-4">Equipe</th>
              <th className="text-[9px] font-black uppercase tracking-widest text-slate-500 text-left px-6 py-4">Categorias</th>
              <th className="text-[9px] font-black uppercase tracking-widest text-slate-500 text-left px-6 py-4">Status</th>
              <th className="text-[9px] font-black uppercase tracking-widest text-slate-500 text-right px-6 py-4">Ações</th>
            </tr>
          </thead>
          <tbody>
            {registrations.map((reg) => (
              <tr key={reg.id} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors group">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#FF6B00]/10 flex items-center justify-center">
                      <Shield className="w-4 h-4 text-[#FF6B00]" />
                    </div>
                    <span className="text-sm font-black uppercase text-white group-hover:text-[#FF6B00] transition-colors">{reg.team.name}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-wrap gap-1">
                    {reg.categories.map(c => (
                      <span key={c.id} className="text-[8px] font-black uppercase tracking-widest bg-white/[0.04] border border-white/[0.08] px-2 py-1 rounded-lg text-slate-300">
                        {c.name}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border ${
                    reg.status === 'CONFIRMED'
                      ? 'text-green-400 bg-green-500/10 border-green-500/20'
                      : 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20'
                  }`}>
                    {reg.status === 'CONFIRMED' ? 'Confirmado' : 'Pendente'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => openEdit(reg)}
                      className="w-8 h-8 rounded-xl hover:bg-[#FF6B00]/10 flex items-center justify-center text-slate-400 hover:text-[#FF6B00] transition-all"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(reg.id)}
                      className="w-8 h-8 rounded-xl hover:bg-red-500/10 flex items-center justify-center text-slate-400 hover:text-red-500 transition-all"
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
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-600">
              Nenhuma inscrição ainda
            </p>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-xl p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-[#0A0A0A] border border-white/10 rounded-[32px] overflow-hidden shadow-2xl animate-in zoom-in-95">
            <div className="p-8 border-b border-white/5 bg-white/[0.01]">
              <h3 className="text-2xl font-black italic uppercase text-white tracking-tight">
                {editingReg ? 'Editar Inscrição' : 'Nova Inscrição'}
              </h3>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mt-1">
                Dados da inscrição manual
              </p>
            </div>
            <div className="p-8 space-y-6">
              {/* Select Equipe */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Equipe
                </label>
                <select
                  disabled={!!editingReg}
                  value={formTeamId}
                  onChange={e => setFormTeamId(e.target.value)}
                  className="w-full bg-white/[0.03] border border-white/10 h-12 rounded-xl px-4 text-sm text-white focus:outline-none focus:border-[#FF6B00] disabled:opacity-50 appearance-none font-bold"
                >
                  <option value="" className="bg-[#0A0A0A]">Selecionar equipe...</option>
                  {allTeams.map(t => (
                    <option key={t.id} value={t.id} className="bg-[#0A0A0A]">{t.name}</option>
                  ))}
                </select>
              </div>

              {/* Categorias */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Categorias
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {allCategories.map(cat => (
                    <label
                      key={cat.id}
                      className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer transition-all ${
                        formCategoryIds.includes(cat.id)
                          ? 'bg-[#FF6B00]/10 border-[#FF6B00]/30 text-[#FF6B00]'
                          : 'bg-white/[0.02] border-white/[0.08] text-slate-400 hover:border-white/20'
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
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Status
                </label>
                <div className="flex gap-2">
                  {(['PENDING', 'CONFIRMED'] as const).map(s => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setFormStatus(s)}
                      className={`flex-1 h-11 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all ${
                        formStatus === s
                          ? 'bg-[#FF6B00]/10 border-[#FF6B00]/30 text-[#FF6B00]'
                          : 'bg-white/[0.02] border-white/10 text-slate-500 hover:border-white/20'
                      }`}
                    >
                      {s === 'PENDING' ? 'Pendente' : 'Confirmado'}
                    </button>
                  ))}
                </div>
              </div>

              {formError && (
                <p className="text-red-400 text-[10px] font-black uppercase tracking-widest bg-red-500/10 p-4 rounded-xl border border-red-500/20">
                  {formError}
                </p>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 h-12 font-black text-[10px] uppercase tracking-widest text-slate-400 hover:text-white transition-all rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={submitLoading}
                  className="flex-1 bg-[#FF6B00] hover:bg-[#E66000] text-white font-black text-[10px] uppercase tracking-widest h-12 rounded-xl transition-all disabled:opacity-50 shadow-lg shadow-orange-600/20"
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
