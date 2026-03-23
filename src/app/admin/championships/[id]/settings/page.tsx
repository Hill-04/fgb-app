'use client'

import { useState, useEffect, useCallback, use } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Settings, Shield, Loader2, AlertTriangle, CheckCircle2, X } from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

type Championship = {
  id: string
  name: string
  year: number
  description: string | null
  sex: string
  format: string
  turns: number
  phases: number
  fieldControl: string
  tiebreakers: string
  hasRelegation: boolean
  relegationDown: number
  promotionUp: number
  hasPlayoffs: boolean
  playoffTeams: number
  playoffFormat: string
  hasThirdPlace: boolean
  hasBlocks: boolean
  minTeamsPerCat: number
  startDate: string | null
  endDate: string | null
  regDeadline: string
  status: string
}

type Toast = { msg: string; type: 'success' | 'error' } | null

// ─── Component Helpers ───────────────────────────────────────────────────────

function FieldGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">
        {label}
      </label>
      {children}
    </div>
  )
}

function Toggle({ enabled, onClick }: { enabled: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`relative w-11 h-6 rounded-full transition-all duration-300 ${
        enabled ? 'bg-[#FF6B00]' : 'bg-white/10'
      }`}
    >
      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-300 ${
        enabled ? 'left-6' : 'left-1'
      }`} />
    </button>
  )
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function ChampionshipSettingsPage({
  params: paramsPromise,
}: {
  params: Promise<{ id: string }>
}) {
  const params = use(paramsPromise)
  const id = params.id
  const router = useRouter()

  const [form, setForm] = useState<Championship | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [toast, setToast] = useState<Toast>(null)

  // ─── Data Fetching ─────────────────────────────────────────────────────────

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/championships/${id}`)
      if (res.ok) {
        const data = await res.json()
        setForm(data)
      }
    } catch (error) {
      console.error('Error fetching settings:', error)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // ─── Actions ────────────────────────────────────────────────────────────────

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  const handleSave = async (section: string) => {
    if (!form) return
    setSaving(section)

    // Prepare fields based on section
    let payload: Partial<Championship> = {}
    
    if (section === 'general') {
      payload = { name: form.name, year: Number(form.year), sex: form.sex, status: form.status }
    } else if (section === 'dates') {
      payload = { 
        regDeadline: form.regDeadline, 
        startDate: form.startDate ? new Date(form.startDate).toISOString() : null, 
        endDate: form.endDate ? new Date(form.endDate).toISOString() : null 
      }
    } else if (section === 'format') {
      payload = { 
        format: form.format, 
        turns: Number(form.turns), 
        phases: Number(form.phases), 
        minTeamsPerCat: Number(form.minTeamsPerCat),
        fieldControl: form.fieldControl
      }
    } else if (section === 'playoffs') {
      payload = { 
        hasPlayoffs: form.hasPlayoffs, 
        playoffTeams: Number(form.playoffTeams), 
        playoffFormat: form.playoffFormat, 
        hasThirdPlace: form.hasThirdPlace 
      }
    } else if (section === 'relegation') {
      payload = { 
        hasRelegation: form.hasRelegation, 
        relegationDown: Number(form.relegationDown), 
        promotionUp: Number(form.promotionUp) 
      }
    }

    try {
      const res = await fetch(`/api/championships/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (res.ok) showToast('Alterações salvas com sucesso!')
      else showToast('Erro ao salvar configurações', 'error')
    } catch (error) {
      showToast('Erro de conexão', 'error')
    } finally {
      setSaving(null)
    }
  }

  const handleArchive = async () => {
    if (!confirm('Deseja realmente ARQUIVAR este campeonato?')) return
    try {
      const res = await fetch(`/api/championships/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'ARCHIVED' })
      })
      if (res.ok) window.location.href = '/admin/championships'
    } catch (error) {
      showToast('Erro ao arquivar', 'error')
    }
  }

  const handleDelete = async () => {
    if (!confirm('!!! ALERTA CRÍTICO !!!\nDeseja realmente EXCLUIR este campeonato e TODOS os seus dados relacionados (jogos, inscrições, categorias)? Esta ação é IRREVERSÍVEL.')) return
    try {
      const res = await fetch(`/api/championships/${id}`, { method: 'DELETE' })
      if (res.ok) window.location.href = '/admin/championships'
    } catch (error) {
      showToast('Erro ao excluir', 'error')
    }
  }

  // ─── Render ─────────────────────────────────────────────────────────────────

  if (loading || !form) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="w-10 h-10 text-[#FF6B00] animate-spin" />
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Carregando configurações...</p>
      </div>
    )
  }

  return (
    <div className="space-y-8 pb-20 max-w-5xl animate-in fade-in duration-500">
      
      {/* SEÇÃO 1: Informações Gerais */}
      <div className="bg-[#141414] border border-white/[0.08] rounded-3xl p-8 space-y-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
             <div className="w-10 h-10 rounded-xl bg-[#FF6B00]/10 flex items-center justify-center">
                <Settings className="w-5 h-5 text-[#FF6B00]" />
             </div>
             <div>
                <h3 className="text-xl font-black italic uppercase text-white tracking-tight leading-none">
                  Informações Gerais
                </h3>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mt-1.5">
                  Identificação básica do campeonato
                </p>
             </div>
          </div>
          <button
            onClick={() => handleSave('general')}
            disabled={saving === 'general'}
            className="bg-[#FF6B00] hover:bg-[#E66000] text-white font-black text-[10px] uppercase tracking-widest px-6 h-10 rounded-xl transition-all disabled:opacity-50 shadow-lg shadow-orange-600/20"
          >
            {saving === 'general' ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FieldGroup label="Nome do Campeonato">
            <input 
              value={form.name} 
              onChange={e => setForm(p => p ? ({...p, name: e.target.value}) : null)}
              className="w-full bg-white/[0.03] border border-white/10 h-12 rounded-xl px-4 text-sm font-bold text-white focus:outline-none focus:border-[#FF6B00] transition-all" 
            />
          </FieldGroup>
          <FieldGroup label="Ano">
            <input 
              type="number" 
              value={form.year} 
              onChange={e => setForm(p => p ? ({...p, year: Number(e.target.value)}) : null)}
              className="w-full bg-white/[0.03] border border-white/10 h-12 rounded-xl px-4 text-sm font-bold text-white focus:outline-none focus:border-[#FF6B00] transition-all" 
            />
          </FieldGroup>
          <FieldGroup label="Gênero">
            <select 
              value={form.sex} 
              onChange={e => setForm(p => p ? ({...p, sex: e.target.value}) : null)}
              className="w-full bg-white/[0.03] border border-white/10 h-12 rounded-xl px-4 text-sm font-bold text-white focus:outline-none focus:border-[#FF6B00] appearance-none"
            >
              <option value="masculino" className="bg-[#0A0A0A]">Masculino</option>
              <option value="feminino" className="bg-[#0A0A0A]">Feminino</option>
              <option value="misto" className="bg-[#0A0A0A]">Misto</option>
            </select>
          </FieldGroup>
          <FieldGroup label="Status">
            <select 
              value={form.status} 
              onChange={e => setForm(p => p ? ({...p, status: e.target.value}) : null)}
              className="w-full bg-white/[0.03] border border-white/10 h-12 rounded-xl px-4 text-sm font-bold text-white focus:outline-none focus:border-[#FF6B00] appearance-none"
            >
              <option value="DRAFT" className="bg-[#0A0A0A]">Rascunho</option>
              <option value="REGISTRATION_OPEN" className="bg-[#0A0A0A]">Inscrições Abertas</option>
              <option value="REGISTRATION_CLOSED" className="bg-[#0A0A0A]">Inscrições Encerradas</option>
              <option value="ONGOING" className="bg-[#0A0A0A]">Em Andamento</option>
              <option value="FINISHED" className="bg-[#0A0A0A]">Encerrado</option>
            </select>
          </FieldGroup>
        </div>
      </div>

      {/* SEÇÃO 2: Datas */}
      <div className="bg-[#141414] border border-white/[0.08] rounded-3xl p-8 space-y-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-black italic uppercase text-white tracking-tight">Cronograma</h3>
          <button
            onClick={() => handleSave('dates')}
            disabled={saving === 'dates'}
            className="bg-[#FF6B00] hover:bg-[#E66000] text-white font-black text-[10px] uppercase tracking-widest px-6 h-10 rounded-xl transition-all disabled:opacity-50 shadow-lg shadow-orange-600/20"
          >
            {saving === 'dates' ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <FieldGroup label="Prazo Inscrições">
            <input 
              type="date" 
              value={form.regDeadline ? form.regDeadline.split('T')[0] : ''} 
              onChange={e => setForm(p => p ? ({...p, regDeadline: e.target.value}) : null)}
              className="w-full bg-white/[0.03] border border-white/10 h-12 rounded-xl px-4 text-sm font-bold text-white focus:outline-none focus:border-[#FF6B00]" 
            />
          </FieldGroup>
          <FieldGroup label="Data Início">
            <input 
              type="date" 
              value={form.startDate ? form.startDate.split('T')[0] : ''} 
              onChange={e => setForm(p => p ? ({...p, startDate: e.target.value}) : null)}
              className="w-full bg-white/[0.03] border border-white/10 h-12 rounded-xl px-4 text-sm font-bold text-white focus:outline-none focus:border-[#FF6B00]" 
            />
          </FieldGroup>
          <FieldGroup label="Data Fim">
            <input 
              type="date" 
              value={form.endDate ? form.endDate.split('T')[0] : ''} 
              onChange={e => setForm(p => p ? ({...p, endDate: e.target.value}) : null)}
              className="w-full bg-white/[0.03] border border-white/10 h-12 rounded-xl px-4 text-sm font-bold text-white focus:outline-none focus:border-[#FF6B00]" 
            />
          </FieldGroup>
        </div>
      </div>

      {/* SEÇÃO 3: Formato de Competição */}
      <div className="bg-[#141414] border border-white/[0.08] rounded-3xl p-8 space-y-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-black italic uppercase text-white tracking-tight">Formato e Regras</h3>
          <button
            onClick={() => handleSave('format')}
            disabled={saving === 'format'}
            className="bg-[#FF6B00] hover:bg-[#E66000] text-white font-black text-[10px] uppercase tracking-widest px-6 h-10 rounded-xl transition-all disabled:opacity-50 shadow-lg shadow-orange-600/20"
          >
            {saving === 'format' ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <FieldGroup label="Tipo de Torneio">
            <select 
              value={form.format} 
              onChange={e => setForm(p => p ? ({...p, format: e.target.value}) : null)}
              className="w-full bg-white/[0.03] border border-white/10 h-12 rounded-xl px-4 text-sm font-bold text-white focus:outline-none focus:border-[#FF6B00] appearance-none"
            >
              <option value="todos_contra_todos" className="bg-[#0A0A0A]">Todos contra todos</option>
              <option value="grupos_e_mata_mata" className="bg-[#0A0A0A]">Grupos e Mata-mata</option>
              <option value="eliminatoria_simples" className="bg-[#0A0A0A]">Eliminatória Simples</option>
            </select>
          </FieldGroup>
          <FieldGroup label="Turnos (Fase Regular)">
            <input 
              type="number" 
              value={form.turns} 
              onChange={e => setForm(p => p ? ({...p, turns: Number(e.target.value)}) : null)}
              className="w-full bg-white/[0.03] border border-white/10 h-12 rounded-xl px-4 text-sm font-bold text-white focus:outline-none focus:border-[#FF6B00]" 
            />
          </FieldGroup>
          <FieldGroup label="Phases/Etapas">
            <input 
              type="number" 
              value={form.phases} 
              onChange={e => setForm(p => p ? ({...p, phases: Number(e.target.value)}) : null)}
              className="w-full bg-white/[0.03] border border-white/10 h-12 rounded-xl px-4 text-sm font-bold text-white focus:outline-none focus:border-[#FF6B00]" 
            />
          </FieldGroup>
          <FieldGroup label="Equipes Mín. p/ Categoria">
            <input 
              type="number" 
              value={form.minTeamsPerCat} 
              onChange={e => setForm(p => p ? ({...p, minTeamsPerCat: Number(e.target.value)}) : null)}
              className="w-full bg-white/[0.03] border border-white/10 h-12 rounded-xl px-4 text-sm font-bold text-white focus:outline-none focus:border-[#FF6B00]" 
            />
          </FieldGroup>
          <FieldGroup label="Mando de Quadra">
            <select 
              value={form.fieldControl} 
              onChange={e => setForm(p => p ? ({...p, fieldControl: e.target.value}) : null)}
              className="w-full bg-white/[0.03] border border-white/10 h-12 rounded-xl px-4 text-sm font-bold text-white focus:outline-none focus:border-[#FF6B00] appearance-none"
            >
              <option value="alternado" className="bg-[#0A0A0A]">Alternado (Inscrição)</option>
              <option value="fixo" className="bg-[#0A0A0A]">Fixo (Sede Única)</option>
              <option value="neutro" className="bg-[#0A0A0A]">Neutro / Aleatório</option>
            </select>
          </FieldGroup>
        </div>
      </div>

      {/* SEÇÃO 4: Playoffs */}
      <div className="bg-[#141414] border border-white/[0.08] rounded-3xl p-8 space-y-6 shadow-2xl relative overflow-hidden">
        {/* Glow if enabled */}
        {form.hasPlayoffs && <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/5 blur-[100px]" />}
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
             <h3 className="text-xl font-black italic uppercase text-white tracking-tight">Fase de Playoffs</h3>
             <Toggle 
               enabled={form.hasPlayoffs} 
               onClick={() => setForm(p => p ? ({...p, hasPlayoffs: !p.hasPlayoffs}) : null)} 
             />
          </div>
          <button
            onClick={() => handleSave('playoffs')}
            disabled={saving === 'playoffs'}
            className="bg-[#FF6B00] hover:bg-[#E66000] text-white font-black text-[10px] uppercase tracking-widest px-6 h-10 rounded-xl transition-all disabled:opacity-50 shadow-lg shadow-orange-600/20"
          >
            {saving === 'playoffs' ? 'Salvando...' : 'Salvar'}
          </button>
        </div>

        {form.hasPlayoffs && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in slide-in-from-top-4 duration-300">
            <FieldGroup label="Equipes Participantes">
              <input 
                type="number" 
                value={form.playoffTeams} 
                onChange={e => setForm(p => p ? ({...p, playoffTeams: Number(e.target.value)}) : null)}
                className="w-full bg-white/[0.03] border border-white/10 h-12 rounded-xl px-4 text-sm font-bold text-white focus:outline-none focus:border-[#FF6B00]" 
              />
            </FieldGroup>
            <FieldGroup label="Formato dos Playoffs">
              <select 
                value={form.playoffFormat} 
                onChange={e => setForm(p => p ? ({...p, playoffFormat: e.target.value}) : null)}
                className="w-full bg-white/[0.03] border border-white/10 h-12 rounded-xl px-4 text-sm font-bold text-white focus:outline-none focus:border-[#FF6B00] appearance-none"
              >
                <option value="melhor_de_1" className="bg-[#0A0A0A]">Jogo Único</option>
                <option value="melhor_de_3" className="bg-[#0A0A0A]">Melhor de 3</option>
              </select>
            </FieldGroup>
            <div className="flex items-center gap-4 pt-6">
               <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Disputa de 3º Lugar?</label>
               <Toggle 
                 enabled={form.hasThirdPlace} 
                 onClick={() => setForm(p => p ? ({...p, hasThirdPlace: !p.hasThirdPlace}) : null)} 
               />
            </div>
          </div>
        )}
      </div>

       {/* SEÇÃO 5: Rebaixamento/Promoção */}
       <div className="bg-[#141414] border border-white/[0.08] rounded-3xl p-8 space-y-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
             <h3 className="text-xl font-black italic uppercase text-white tracking-tight">Série e Acesso</h3>
             <Toggle 
               enabled={form.hasRelegation} 
               onClick={() => setForm(p => p ? ({...p, hasRelegation: !p.hasRelegation}) : null)} 
             />
          </div>
          <button
            onClick={() => handleSave('relegation')}
            disabled={saving === 'relegation'}
            className="bg-[#FF6B00] hover:bg-[#E66000] text-white font-black text-[10px] uppercase tracking-widest px-6 h-10 rounded-xl transition-all disabled:opacity-50 shadow-lg shadow-orange-600/20"
          >
            {saving === 'relegation' ? 'Salvando...' : 'Salvar'}
          </button>
        </div>

        {form.hasRelegation && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in slide-in-from-top-4 duration-300">
            <FieldGroup label="Equipes Rebaixadas">
              <input 
                type="number" 
                value={form.relegationDown} 
                onChange={e => setForm(p => p ? ({...p, relegationDown: Number(e.target.value)}) : null)}
                className="w-full bg-white/[0.03] border border-white/10 h-12 rounded-xl px-4 text-sm font-bold text-white focus:outline-none focus:border-[#FF6B00]" 
              />
            </FieldGroup>
            <FieldGroup label="Equipes Promovidas">
              <input 
                type="number" 
                value={form.promotionUp} 
                onChange={e => setForm(p => p ? ({...p, promotionUp: Number(e.target.value)}) : null)}
                className="w-full bg-white/[0.03] border border-white/10 h-12 rounded-xl px-4 text-sm font-bold text-white focus:outline-none focus:border-[#FF6B00]" 
              />
            </FieldGroup>
          </div>
        )}
      </div>

      {/* SEÇÃO 6: Zona de Perigo */}
      <div className="bg-red-500/5 border border-red-500/20 rounded-3xl p-8 space-y-6 shadow-xl">
        <div className="flex items-center gap-3">
          <AlertTriangle className="w-6 h-6 text-red-400" />
          <div>
            <h3 className="text-xl font-black italic uppercase text-red-400 tracking-tight">
              Zona de Perigo
            </h3>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-red-500/50 mt-1">
              Ações irreversíveis que impactam o histórico
            </p>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-4 pt-2">
          <button
            onClick={handleArchive}
            className="px-6 h-11 rounded-2xl border border-yellow-500/40 text-yellow-500 text-[10px] font-black uppercase tracking-widest hover:bg-yellow-500/10 transition-all flex items-center gap-2"
          >
            Arquivar Campeonato
          </button>
          <button
            onClick={handleDelete}
            className="px-6 h-11 rounded-2xl bg-red-600/10 border border-red-500/40 text-red-500 text-[10px] font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all flex items-center gap-2 shadow-lg shadow-red-900/20"
          >
            Excluir Permanentemente
          </button>
        </div>
      </div>

      {/* Toast Feedback */}
      {toast && (
        <div className={`fixed bottom-8 right-8 z-[100] px-6 py-4 rounded-[24px] shadow-2xl flex items-center gap-4 animate-in slide-in-from-right-10 duration-500 border border-white/10 backdrop-blur-xl ${
          toast.type === 'success' ? 'bg-green-500/90' : 'bg-red-500/90'
        }`}>
          {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-white" /> : <X className="w-5 h-5 text-white" />}
          <span className="text-[10px] font-black uppercase tracking-widest text-white">{toast.msg}</span>
        </div>
      )}

    </div>
  )
}
