'use client'

import { useState, useEffect, useCallback, use } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Settings, Shield, Loader2, AlertTriangle, CheckCircle2, X } from 'lucide-react'
import { CourtsField } from '@/components/championship/CourtsField'
import { TimeWindowField } from '@/components/championship/TimeWindowField'
import { BlockFormat } from '@/lib/championship/time-window'

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
  numberOfCourts: number
  dayStartTime: string
  regularDayEndTime: string
  extendedDayEndTime: string
  slotDurationMinutes: number
  minRestSlotsPerTeam: number
  maxGamesPerTeamPerDay: number
  scheduleOptimizationMode: string
  blockFormat: BlockFormat
}

type Toast = { msg: string; type: 'success' | 'error' } | null

// ─── Component Helpers ───────────────────────────────────────────────────────

function FieldGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[10px] font-black uppercase tracking-widest text-[var(--gray)]">
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
      className={`relative w-11 h-6 rounded-full transition-all duration-300 shadow-inner border border-[var(--border)] ${
        enabled ? 'bg-green-500 border-green-600' : 'bg-[var(--gray-l)]'
      }`}
    >
      <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all duration-300 shadow-sm ${
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
        fieldControl: form.fieldControl,
        numberOfCourts: Number(form.numberOfCourts),
        dayStartTime: form.dayStartTime,
        regularDayEndTime: form.regularDayEndTime,
        extendedDayEndTime: form.extendedDayEndTime,
        slotDurationMinutes: Number(form.slotDurationMinutes),
        minRestSlotsPerTeam: Number(form.minRestSlotsPerTeam),
        maxGamesPerTeamPerDay: Number(form.maxGamesPerTeamPerDay),
        blockFormat: form.blockFormat
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

  const handleOpenRegistrations = async () => {
    if (!form) return
    setSaving('open')
    try {
      const res = await fetch(`/api/championships/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'REGISTRATION_OPEN' })
      })
      if (res.ok) {
        setForm((current) => current ? ({ ...current, status: 'REGISTRATION_OPEN' }) : current)
        showToast('Inscrições abertas no site!')
      } else {
        showToast('Erro ao abrir inscrições', 'error')
      }
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
        <Loader2 className="w-10 h-10 text-[var(--verde)] animate-spin" />
        <p className="text-[10px] font-black text-[var(--gray)] uppercase tracking-widest">Carregando configurações...</p>
      </div>
    )
  }

  return (
    <div className="space-y-8 pb-20 max-w-5xl animate-in fade-in duration-500 font-sans">
      
      {/* SEÇÃO 1: Informações Gerais */}
      <div className="fgb-card bg-white p-8 space-y-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
             <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center border border-orange-100">
                <Settings className="w-5 h-5 text-orange-600" />
             </div>
             <div>
                <h3 className="fgb-display text-xl text-[var(--black)] leading-none">
                  Informações Gerais
                </h3>
                <p className="fgb-label text-[var(--gray)] mt-1.5" style={{ fontSize: 10, letterSpacing: 2 }}>
                  Identificação básica do campeonato
                </p>
             </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <a
              href={`/campeonatos/${id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 h-10 rounded-xl border border-[var(--border)] bg-white text-[10px] font-black uppercase tracking-widest text-[var(--gray)] hover:text-[var(--black)] hover:border-[var(--black)] transition-all shadow-sm"
            >
              Ver no site
            </a>
            {form.status !== 'REGISTRATION_OPEN' && (
              <button
                onClick={handleOpenRegistrations}
                disabled={saving === 'open'}
                className="bg-[var(--verde)] hover:bg-[var(--verde-dark)] text-white font-black text-[10px] uppercase tracking-widest px-5 h-10 rounded-xl transition-all disabled:opacity-50 shadow-sm"
              >
                {saving === 'open' ? 'Abrindo...' : 'Abrir inscrições'}
              </button>
            )}
            <button
              onClick={() => handleSave('general')}
              disabled={saving === 'general'}
              className="bg-[var(--amarelo)] hover:bg-[#E66000] text-[var(--black)] font-black text-[10px] uppercase tracking-widest px-6 h-10 rounded-xl transition-all disabled:opacity-50 shadow-sm"
            >
              {saving === 'general' ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FieldGroup label="Nome do Campeonato">
            <input 
              value={form.name} 
              onChange={e => setForm(p => p ? ({...p, name: e.target.value}) : null)}
              className="w-full bg-[var(--gray-l)] border border-[var(--border)] h-12 rounded-xl px-4 text-sm font-bold text-[var(--black)] focus:outline-none focus:border-[var(--verde)] transition-all" 
            />
          </FieldGroup>
          <FieldGroup label="Ano">
            <input 
              type="number" 
              value={form.year} 
              onChange={e => setForm(p => p ? ({...p, year: Number(e.target.value)}) : null)}
              className="w-full bg-[var(--gray-l)] border border-[var(--border)] h-12 rounded-xl px-4 text-sm font-bold text-[var(--black)] focus:outline-none focus:border-[var(--verde)] transition-all" 
            />
          </FieldGroup>
          <FieldGroup label="Gênero">
            <select 
              value={form.sex} 
              onChange={e => setForm(p => p ? ({...p, sex: e.target.value}) : null)}
              className="w-full bg-[var(--gray-l)] border border-[var(--border)] h-12 rounded-xl px-4 text-sm font-bold text-[var(--black)] focus:outline-none focus:border-[var(--verde)] appearance-none"
            >
              <option value="masculino" className="bg-white">Masculino</option>
              <option value="feminino" className="bg-white">Feminino</option>
              <option value="misto" className="bg-white">Misto</option>
            </select>
          </FieldGroup>
          <FieldGroup label="Status">
            <select 
              value={form.status} 
              onChange={e => setForm(p => p ? ({...p, status: e.target.value}) : null)}
              className="w-full bg-[var(--gray-l)] border border-[var(--border)] h-12 rounded-xl px-4 text-sm font-bold text-[var(--black)] focus:outline-none focus:border-[var(--verde)] appearance-none"
            >
              <option value="DRAFT" className="bg-white">Rascunho</option>
              <option value="REGISTRATION_OPEN" className="bg-white">Inscrições Abertas</option>
              <option value="REGISTRATION_CLOSED" className="bg-white">Inscrições Encerradas</option>
              <option value="ONGOING" className="bg-white">Em Andamento</option>
              <option value="FINISHED" className="bg-white">Encerrado</option>
            </select>
          </FieldGroup>
        </div>
      </div>

      {/* SEÇÃO 2: Datas */}
      <div className="fgb-card bg-white p-8 space-y-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h3 className="fgb-display text-xl text-[var(--black)] leading-none">Cronograma</h3>
          <button
            onClick={() => handleSave('dates')}
            disabled={saving === 'dates'}
            className="bg-[var(--amarelo)] hover:bg-[#E66000] text-[var(--black)] font-black text-[10px] uppercase tracking-widest px-6 h-10 rounded-xl transition-all disabled:opacity-50 shadow-sm"
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
              className="w-full bg-[var(--gray-l)] border border-[var(--border)] h-12 rounded-xl px-4 text-sm font-bold text-[var(--black)] focus:outline-none focus:border-[var(--verde)]" 
            />
          </FieldGroup>
          <FieldGroup label="Data Início">
            <input 
              type="date" 
              value={form.startDate ? form.startDate.split('T')[0] : ''} 
              onChange={e => setForm(p => p ? ({...p, startDate: e.target.value}) : null)}
              className="w-full bg-[var(--gray-l)] border border-[var(--border)] h-12 rounded-xl px-4 text-sm font-bold text-[var(--black)] focus:outline-none focus:border-[var(--verde)]" 
            />
          </FieldGroup>
          <FieldGroup label="Data Fim">
            <input 
              type="date" 
              value={form.endDate ? form.endDate.split('T')[0] : ''} 
              onChange={e => setForm(p => p ? ({...p, endDate: e.target.value}) : null)}
              className="w-full bg-[var(--gray-l)] border border-[var(--border)] h-12 rounded-xl px-4 text-sm font-bold text-[var(--black)] focus:outline-none focus:border-[var(--verde)]" 
            />
          </FieldGroup>
        </div>
      </div>

      {/* SEÇÃO 3: Formato de Competição */}
      <div className="fgb-card bg-white p-8 space-y-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h3 className="fgb-display text-xl text-[var(--black)] leading-none">Formato e Regras</h3>
          <button
            onClick={() => handleSave('format')}
            disabled={saving === 'format'}
            className="bg-[var(--amarelo)] hover:bg-[#E66000] text-[var(--black)] font-black text-[10px] uppercase tracking-widest px-6 h-10 rounded-xl transition-all disabled:opacity-50 shadow-sm"
          >
            {saving === 'format' ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <FieldGroup label="Tipo de Torneio">
            <select 
              value={form.format} 
              onChange={e => setForm(p => p ? ({...p, format: e.target.value}) : null)}
              className="w-full bg-[var(--gray-l)] border border-[var(--border)] h-12 rounded-xl px-4 text-sm font-bold text-[var(--black)] focus:outline-none focus:border-[var(--verde)] appearance-none"
            >
              <option value="todos_contra_todos" className="bg-white">Todos contra todos</option>
              <option value="grupos_e_mata_mata" className="bg-white">Grupos e Mata-mata</option>
              <option value="eliminatoria_simples" className="bg-white">Eliminatória Simples</option>
            </select>
          </FieldGroup>
          <FieldGroup label="Turnos (Fase Regular)">
            <input 
              type="number" 
              value={form.turns} 
              onChange={e => setForm(p => p ? ({...p, turns: Number(e.target.value)}) : null)}
              className="w-full bg-[var(--gray-l)] border border-[var(--border)] h-12 rounded-xl px-4 text-sm font-bold text-[var(--black)] focus:outline-none focus:border-[var(--verde)]" 
            />
          </FieldGroup>
          <FieldGroup label="Phases/Etapas">
            <input 
              type="number" 
              value={form.phases} 
              onChange={e => setForm(p => p ? ({...p, phases: Number(e.target.value)}) : null)}
              className="w-full bg-[var(--gray-l)] border border-[var(--border)] h-12 rounded-xl px-4 text-sm font-bold text-[var(--black)] focus:outline-none focus:border-[var(--verde)]" 
            />
          </FieldGroup>
          <FieldGroup label="Equipes Mín. p/ Categoria">
            <input 
              type="number" 
              value={form.minTeamsPerCat} 
              onChange={e => setForm(p => p ? ({...p, minTeamsPerCat: Number(e.target.value)}) : null)}
              className="w-full bg-[var(--gray-l)] border border-[var(--border)] h-12 rounded-xl px-4 text-sm font-bold text-[var(--black)] focus:outline-none focus:border-[var(--verde)]" 
            />
          </FieldGroup>
          <FieldGroup label="Mando de Quadra">
            <select 
              value={form.fieldControl} 
              onChange={e => setForm(p => p ? ({...p, fieldControl: e.target.value}) : null)}
              className="w-full bg-[var(--gray-l)] border border-[var(--border)] h-12 rounded-xl px-4 text-sm font-bold text-[var(--black)] focus:outline-none focus:border-[var(--verde)] appearance-none"
            >
              <option value="alternado" className="bg-white">Alternado (Inscrição)</option>
              <option value="fixo" className="bg-white">Fixo (Sede Única)</option>
              <option value="neutro" className="bg-white">Neutro / Aleatório</option>
            </select>
          </FieldGroup>
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--gray-l)]/70 p-4">
          <p className="text-[10px] font-black uppercase tracking-widest text-[var(--gray)]">
            Regra das fases
          </p>
          <p className="mt-2 text-sm leading-relaxed text-[var(--black)]">
            Em formatos de todos contra todos, cada fase replica o ciclo completo da categoria. Ex.: 3 fases significa 3 encontros distribuídos entre as mesmas equipes, com intervalo equilibrado entre as etapas.
          </p>
        </div>

        <div className="pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <CourtsField 
              value={form.numberOfCourts ?? 1} 
              onChange={(val) => setForm(p => p ? ({...p, numberOfCourts: val}) : null)}
            />
            <FieldGroup label="Máx. jogos por equipe no dia">
              <input
                type="number"
                min={1}
                max={6}
                value={form.maxGamesPerTeamPerDay ?? 2}
                onChange={e => setForm(p => p ? ({...p, maxGamesPerTeamPerDay: Number(e.target.value)}) : null)}
                className="w-full bg-[var(--gray-l)] border border-[var(--border)] h-12 rounded-xl px-4 text-sm font-bold text-[var(--black)] focus:outline-none focus:border-[var(--verde)]"
              />
            </FieldGroup>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <FieldGroup label="Estratégia da IA">
              <div className="flex h-12 items-center rounded-xl border border-[var(--border)] bg-[var(--gray-l)] px-4 text-sm font-bold text-[var(--black)]">
                Menos viagens
              </div>
            </FieldGroup>
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--gray-l)]/70 p-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-[var(--gray)]">
                Estratégia atual
              </p>
              <p className="mt-2 text-sm leading-relaxed text-[var(--black)]">
                A IA prioriza menos viagens, agrupando o máximo de jogos por etapa e usando sexta apenas quando necessário.
              </p>
            </div>
          </div>
          
          <TimeWindowField 
            value={{
              dayStartTime: form.dayStartTime,
              regularDayEndTime: form.regularDayEndTime,
              extendedDayEndTime: form.extendedDayEndTime,
              slotDurationMinutes: form.slotDurationMinutes,
              minRestSlotsPerTeam: form.minRestSlotsPerTeam,
              blockFormat: form.blockFormat as BlockFormat
            }} 
            onChange={(val) => setForm(p => p ? ({...p, ...val}) : null)}
          />
        </div>
      </div>

      {/* SEÇÃO 4: Playoffs */}
      <div className="fgb-card bg-white p-8 space-y-6 shadow-sm relative overflow-hidden">
        {/* Glow if enabled */}
        {form.hasPlayoffs && <div className="absolute top-0 right-0 w-64 h-64 bg-orange-100 blur-[100px]" />}
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
             <h3 className="fgb-display text-xl text-[var(--black)] leading-none">Fase de Playoffs</h3>
             <Toggle 
               enabled={form.hasPlayoffs} 
               onClick={() => setForm(p => p ? ({...p, hasPlayoffs: !p.hasPlayoffs}) : null)} 
             />
          </div>
          <button
            onClick={() => handleSave('playoffs')}
            disabled={saving === 'playoffs'}
            className="bg-[var(--amarelo)] hover:bg-[#E66000] text-[var(--black)] font-black text-[10px] uppercase tracking-widest px-6 h-10 rounded-xl transition-all disabled:opacity-50 shadow-sm"
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
                className="w-full bg-[var(--gray-l)] border border-[var(--border)] h-12 rounded-xl px-4 text-sm font-bold text-[var(--black)] focus:outline-none focus:border-[var(--verde)]" 
              />
            </FieldGroup>
            <FieldGroup label="Formato dos Playoffs">
              <select 
                value={form.playoffFormat} 
                onChange={e => setForm(p => p ? ({...p, playoffFormat: e.target.value}) : null)}
                className="w-full bg-[var(--gray-l)] border border-[var(--border)] h-12 rounded-xl px-4 text-sm font-bold text-[var(--black)] focus:outline-none focus:border-[var(--verde)] appearance-none"
              >
                <option value="melhor_de_1" className="bg-white">Jogo Único</option>
                <option value="melhor_de_3" className="bg-white">Melhor de 3</option>
              </select>
            </FieldGroup>
            <div className="flex items-center gap-4 pt-6">
               <label className="text-[10px] font-black uppercase tracking-widest text-[var(--gray)]">Disputa de 3º Lugar?</label>
               <Toggle 
                 enabled={form.hasThirdPlace} 
                 onClick={() => setForm(p => p ? ({...p, hasThirdPlace: !p.hasThirdPlace}) : null)} 
               />
            </div>
          </div>
        )}
      </div>

       {/* SEÇÃO 5: Rebaixamento/Promoção */}
       <div className="fgb-card bg-white p-8 space-y-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
             <h3 className="fgb-display text-xl text-[var(--black)] leading-none">Série e Acesso</h3>
             <Toggle 
               enabled={form.hasRelegation} 
               onClick={() => setForm(p => p ? ({...p, hasRelegation: !p.hasRelegation}) : null)} 
             />
          </div>
          <button
            onClick={() => handleSave('relegation')}
            disabled={saving === 'relegation'}
            className="bg-[var(--amarelo)] hover:bg-[#E66000] text-[var(--black)] font-black text-[10px] uppercase tracking-widest px-6 h-10 rounded-xl transition-all disabled:opacity-50 shadow-sm"
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
                className="w-full bg-[var(--gray-l)] border border-[var(--border)] h-12 rounded-xl px-4 text-sm font-bold text-[var(--black)] focus:outline-none focus:border-[var(--verde)]" 
              />
            </FieldGroup>
            <FieldGroup label="Equipes Promovidas">
              <input 
                type="number" 
                value={form.promotionUp} 
                onChange={e => setForm(p => p ? ({...p, promotionUp: Number(e.target.value)}) : null)}
                className="w-full bg-[var(--gray-l)] border border-[var(--border)] h-12 rounded-xl px-4 text-sm font-bold text-[var(--black)] focus:outline-none focus:border-[var(--verde)]" 
              />
            </FieldGroup>
          </div>
        )}
      </div>

      {/* SEÇÃO 6: Zona de Perigo */}
      <div className="bg-red-50 border border-red-200 rounded-3xl p-8 space-y-6 shadow-sm">
        <div className="flex items-center gap-3">
          <AlertTriangle className="w-6 h-6 text-red-600" />
          <div>
            <h3 className="fgb-display text-xl text-red-600 leading-none">
              Zona de Perigo
            </h3>
            <p className="fgb-label text-red-500/70 mt-1" style={{ fontSize: 10, letterSpacing: 2 }}>
              Ações irreversíveis que impactam o histórico
            </p>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-4 pt-2">
          <button
            onClick={handleArchive}
            className="px-6 h-11 rounded-2xl border border-orange-200 bg-white text-orange-600 text-[10px] font-black uppercase tracking-widest hover:bg-orange-50 transition-all flex items-center gap-2 shadow-sm"
          >
            Arquivar Campeonato
          </button>
          <button
            onClick={handleDelete}
            className="px-6 h-11 rounded-2xl bg-red-100 border border-red-200 text-red-700 text-[10px] font-black uppercase tracking-widest hover:bg-red-600 hover:text-white hover:border-red-600 transition-all flex items-center gap-2 shadow-sm"
          >
            Excluir Permanentemente
          </button>
        </div>
      </div>

      {/* Toast Feedback */}
      {toast && (
        <div className={`fixed bottom-8 right-8 z-[100] px-6 py-4 rounded-[24px] shadow-sm flex items-center gap-4 animate-in slide-in-from-right-10 duration-500 border backdrop-blur-xl ${
          toast.type === 'success' ? 'bg-green-100 border-green-200 text-green-800' : 'bg-red-100 border-red-200 text-red-800'
        }`}>
          {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <X className="w-5 h-5" />}
          <span className="text-[10px] font-black uppercase tracking-widest">{toast.msg}</span>
        </div>
      )}

    </div>
  )
}
