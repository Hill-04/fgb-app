'use client'

import { useState } from 'react'
import {
  Sparkles, X, CheckCircle2, AlertCircle, Loader2,
  ArrowRight, TriangleAlert
} from 'lucide-react'

type AISchedulingModalProps = {
  championshipId: string
  championshipName: string
  onClose: () => void
  onApplied: () => void
}

type CategoryResult = {
  id: string
  name: string
  teams: number
  gamesCount: number
}

type GameEntry = {
  categoryId: string
  homeTeamId: string
  awayTeamId: string
  round: number
  phase: number
  dateTime: string
}

type ValidationIssue = {
  type: 'error' | 'warning' | 'info'
  field: string
  message: string
  suggestion: string
}

type ValidationResult = {
  viable: boolean
  issues: ValidationIssue[]
  summary: {
    totalTeams: number
    totalCategories: number
    totalGames: number
    estimatedDays: number
    periodDays: number
    gamesPerDay: number
    turns: number
    format: string
    hasPlayoffs: boolean
  }
  aiMessage: string
}

type Step = 'idle' | 'validating' | 'diagnosis' | 'simulating' | 'preview' | 'review' | 'applying' | 'done' | 'error'

type SimulationResult = {
  success: boolean
  totalGames: number
  summary: string
  totalBlockedDates?: number
  totalDays?: number
  schedulePreview?: {
    date: string
    dayOfWeek: string
    gamesCount: number
    timeSlots: {
      time: string
      categoryId: string
      categoryName?: string
      homeTeamId: string
      awayTeamId: string
      round: number
    }[]
  }[]
  categories: CategoryResult[]
  games: GameEntry[]
  aiOptimization?: {
    available: boolean
    provider: string
    suggestion: string | null
    error?: string
  }
}

export function AISchedulingModal({
  championshipId,
  championshipName,
  onClose,
  onApplied,
}: AISchedulingModalProps) {
  const [step, setStep] = useState<Step>('idle')
  const [validation, setValidation] = useState<ValidationResult | null>(null)
  const [simulation, setSimulation] = useState<SimulationResult | null>(null)
  const [errorMsg, setErrorMsg] = useState('')

  // Step 1: Validar configurações
  const handleStart = async () => {
    setStep('validating')
    setErrorMsg('')
    try {
      const res = await fetch('/api/scheduling/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ championshipId })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro ao validar configurações')
      setValidation(data)
      setStep('diagnosis')
    } catch (err: any) {
      setErrorMsg(err.message)
      setStep('error')
    }
  }

  // Step 2: Simular calendário (só chamado após diagnóstico positivo)
  const handleSimulate = async () => {
    setStep('simulating')
    setErrorMsg('')
    try {
      const res = await fetch('/api/scheduling/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ championshipId })
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Erro ao simular agendamento')
      }
      const data = await res.json()
      setSimulation(data)
      setStep('preview')
    } catch (err: any) {
      setErrorMsg(err.message)
      setStep('error')
    }
  }

  // Step 3: Aplicar calendário
  const handleApply = async () => {
    if (!simulation) return
    setStep('applying')
    try {
      const res = await fetch('/api/scheduling/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          championshipId,
          games: simulation.games ?? []
        })
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Erro ao aplicar o calendário')
      }
      setStep('done')
    } catch (err: any) {
      setErrorMsg(err.message)
      setStep('error')
    }
  }

  const issueColors = {
    error: { bg: 'bg-red-500/5', border: 'border-red-500/20', text: 'text-red-400', label: '✗ Erro' },
    warning: { bg: 'bg-yellow-500/5', border: 'border-yellow-500/20', text: 'text-yellow-400', label: '⚠ Atenção' },
    info: { bg: 'bg-blue-500/5', border: 'border-blue-500/20', text: 'text-blue-400', label: 'ℹ Info' },
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <div className="w-full max-w-2xl bg-[#0F0F0F] border border-white/10 rounded-[40px] overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between p-8 border-b border-white/5 bg-white/[0.02] flex-shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#FF6B00]/20 flex items-center justify-center border border-[#FF6B00]/20 shadow-lg shadow-orange-600/10">
              <Sparkles className="w-6 h-6 text-[#FF6B00]" />
            </div>
            <div>
              <h3 className="text-2xl font-black italic uppercase text-white tracking-tight leading-none">
                Organizar com IA
              </h3>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mt-2">
                {championshipName}
              </p>
            </div>
          </div>
          {/* Step indicator */}
          <div className="flex items-center gap-2 mr-4">
            {(['diagnosis', 'preview', 'review'] as Step[]).map((s, i) => (
              <div key={s} className={`w-1.5 h-1.5 rounded-full transition-all ${
                step === s ? 'bg-[#FF6B00] w-3' :
                ['preview', 'review', 'applying', 'done'].includes(step) && i < (['diagnosis', 'preview', 'review']).indexOf(step) ? 'bg-[#FF6B00]/50' :
                'bg-white/10'
              }`} />
            ))}
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-2xl hover:bg-white/5 flex items-center justify-center text-slate-500 hover:text-white transition-all border border-transparent hover:border-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-8">

          {/* ——— IDLE ——— */}
          {step === 'idle' && (
            <div className="text-center space-y-6 animate-in zoom-in-95 duration-500">
              <div className="relative inline-block">
                <div className="absolute inset-0 bg-[#FF6B00] blur-[40px] opacity-20 animate-pulse" />
                <div className="relative w-20 h-20 rounded-3xl bg-gradient-to-br from-[#FF6B00] to-[#E66000] flex items-center justify-center mx-auto shadow-2xl">
                  <Sparkles className="w-10 h-10 text-white" />
                </div>
              </div>
              <div>
                <p className="text-white font-black italic uppercase text-xl tracking-tight mb-2">
                  Organizar com IA
                </p>
                <p className="text-slate-500 text-sm leading-relaxed max-w-sm mx-auto">
                  A IA vai analisar as configurações, verificar a viabilidade e gerar o calendário com jogos nos fins de semana.
                </p>
              </div>
              <div className="grid grid-cols-3 gap-2 max-w-xs mx-auto">
                {[
                  { icon: '📋', label: 'Analisa configs' },
                  { icon: '⚠️', label: 'Detecta problemas' },
                  { icon: '📅', label: 'Gera calendário' },
                ].map((item, i) => (
                  <div key={i} className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3 text-center">
                    <p className="text-xl mb-1">{item.icon}</p>
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">{item.label}</p>
                  </div>
                ))}
              </div>
              <button
                onClick={handleStart}
                className="w-full max-w-xs mx-auto block bg-[#FF6B00] hover:bg-[#E66000] text-white font-black text-[10px] uppercase tracking-widest h-12 rounded-xl transition-all shadow-lg shadow-orange-600/20 active:scale-95"
              >
                Iniciar Análise →
              </button>
            </div>
          )}

          {/* ——— VALIDATING ——— */}
          {step === 'validating' && (
            <div className="text-center space-y-4 py-16 animate-in fade-in duration-300">
              <Loader2 className="w-10 h-10 text-[#FF6B00] animate-spin mx-auto" />
              <p className="text-sm font-black italic uppercase text-white tracking-tight">
                Analisando configurações...
              </p>
              <p className="text-xs text-slate-500">Verificando viabilidade do campeonato</p>
            </div>
          )}

          {/* ——— DIAGNOSIS ——— */}
          {step === 'diagnosis' && validation && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">

              {/* Mensagem principal */}
              <div className={`rounded-2xl p-4 ${validation.viable
                ? 'bg-green-500/10 border border-green-500/20'
                : 'bg-red-500/10 border border-red-500/20'}`}>
                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    validation.viable ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                    {validation.viable
                      ? <CheckCircle2 className="w-4 h-4 text-green-400" />
                      : <AlertCircle className="w-4 h-4 text-red-400" />}
                  </div>
                  <div>
                    <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${
                      validation.viable ? 'text-green-400' : 'text-red-400'}`}>
                      {validation.viable ? 'Campeonato Viável' : 'Problemas Encontrados'}
                    </p>
                    <p className="text-xs text-slate-300 leading-relaxed">{validation.aiMessage}</p>
                  </div>
                </div>
              </div>

              {/* Resumo do campeonato */}
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3 text-center">
                  <p className="text-[8px] font-black uppercase tracking-widest text-slate-600 mb-1">Jogos</p>
                  <p className="text-xl font-black text-white">{validation.summary.totalGames}</p>
                </div>
                <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3 text-center">
                  <p className="text-[8px] font-black uppercase tracking-widest text-slate-600 mb-1">Dias Est.</p>
                  <p className="text-xl font-black text-white">{validation.summary.estimatedDays || '—'}</p>
                </div>
                <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3 text-center">
                  <p className="text-[8px] font-black uppercase tracking-widest text-slate-600 mb-1">Categorias</p>
                  <p className="text-xl font-black text-white">{validation.summary.totalCategories}</p>
                </div>
              </div>

              {/* Lista de issues */}
              {validation.issues.length > 0 && (
                <div className="space-y-2 max-h-52 overflow-y-auto custom-scrollbar pr-1">
                  {validation.issues.map((issue, i) => {
                    const colors = issueColors[issue.type]
                    return (
                      <div key={i} className={`rounded-xl p-3 border ${colors.bg} ${colors.border}`}>
                        <p className={`text-[9px] font-black uppercase tracking-widest mb-1 ${colors.text}`}>
                          {colors.label}
                        </p>
                        <p className="text-[11px] text-slate-300 mb-1 leading-snug">{issue.message}</p>
                        <p className="text-[10px] text-slate-500 italic">💡 {issue.suggestion}</p>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Ações */}
              <div className="flex gap-3 pt-1">
                <button
                  onClick={onClose}
                  className="flex-1 h-11 text-[10px] font-black uppercase tracking-widest text-slate-400 bg-white/[0.03] border border-white/[0.08] rounded-xl hover:text-white transition-all"
                >
                  {validation.viable ? 'Cancelar' : 'Ir para Configurações'}
                </button>

                {validation.viable ? (
                  <button
                    onClick={handleSimulate}
                    className="flex-1 h-11 text-[10px] font-black uppercase tracking-widest text-white bg-[#FF6B00] hover:bg-[#E66000] rounded-xl transition-all inline-flex items-center justify-center gap-2 shadow-lg shadow-orange-600/20 active:scale-95"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    Gerar Calendário →
                  </button>
                ) : (
                  <button
                    onClick={() => setStep('idle')}
                    className="flex-1 h-11 text-[10px] font-black uppercase tracking-widest text-slate-400 bg-white/[0.03] border border-white/[0.08] rounded-xl hover:text-white transition-all"
                  >
                    ← Recomeçar
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ——— SIMULATING ——— */}
          {step === 'simulating' && (
            <div className="text-center space-y-6 py-16 animate-in fade-in duration-300">
              <div className="relative w-16 h-16 mx-auto">
                <Loader2 className="w-16 h-16 text-[#FF6B00] animate-spin" />
                <Sparkles className="w-6 h-6 text-[#FF6B00] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
              </div>
              <div className="space-y-2">
                <p className="text-lg font-black italic uppercase text-white tracking-tight animate-pulse">
                  Gerando calendário...
                </p>
                <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.3em]">
                  Distribuindo jogos em blocos de fins de semana
                </p>
              </div>
            </div>
          )}

          {/* ——— PREVIEW ——— */}
          {step === 'preview' && simulation && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-5 duration-500">

              {/* Resultado principal */}
              <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-green-400 mb-1">
                  Calendário gerado com sucesso
                </p>
                <p className="text-2xl font-black text-white">{simulation.totalGames} jogos</p>
                <p className="text-xs text-slate-400 mt-1">{simulation.summary}</p>
              </div>

              {/* Cards por categoria */}
              <div className="grid grid-cols-2 gap-2 max-h-44 overflow-y-auto custom-scrollbar">
                {simulation.categories?.map((cat) => (
                  <div key={cat.id} className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3">
                    <p className="text-[9px] font-black uppercase tracking-widest text-[#FF6B00] mb-1 truncate">
                      {cat.name}
                    </p>
                    <p className="text-sm font-black text-white">{cat.gamesCount} jogos</p>
                    <p className="text-[9px] text-slate-500">{cat.teams} equipes</p>
                  </div>
                ))}
              </div>

              {/* Sugestão IA */}
              {simulation.aiOptimization?.available && (
                <div className="bg-[#FF6B00]/5 border border-[#FF6B00]/20 rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-3.5 h-3.5 text-[#FF6B00]" />
                    <p className="text-[9px] font-black uppercase tracking-widest text-[#FF6B00]">
                      Sugestão IA · {simulation.aiOptimization.provider}
                    </p>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {simulation.aiOptimization.suggestion}
                  </p>
                </div>
              )}

              {/* Botões */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setStep('diagnosis')}
                  className="flex-1 h-11 text-[10px] font-black uppercase tracking-widest text-slate-400 bg-white/[0.03] border border-white/[0.08] rounded-xl hover:text-white transition-all"
                >
                  ← Voltar
                </button>
                <button
                  onClick={() => setStep('review')}
                  className="flex-1 h-11 text-[10px] font-black uppercase tracking-widest text-white bg-[#FF6B00] hover:bg-[#E66000] rounded-xl transition-all"
                >
                  Revisar Calendário →
                </button>
              </div>
            </div>
          )}

          {/* ——— REVIEW ——— */}
          {step === 'review' && simulation && (
            <div className="space-y-4 animate-in fade-in duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-black italic uppercase text-white tracking-tight">
                    Revisar Calendário
                  </p>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    {simulation.totalGames} jogos em {simulation.totalDays} dias
                    {simulation.totalBlockedDates && simulation.totalBlockedDates > 0
                      ? ` · ${simulation.totalBlockedDates} restrições consideradas`
                      : ''}
                  </p>
                </div>
                <button
                  onClick={() => setStep('preview')}
                  className="text-[9px] font-black uppercase tracking-widest text-slate-500 hover:text-white transition-colors"
                >
                  ← Voltar
                </button>
              </div>

              {/* Lista de dias com jogos */}
              <div className="max-h-80 overflow-y-auto space-y-3 pr-1 custom-scrollbar">
                {simulation.schedulePreview?.map((day, i) => (
                  <div key={i} className="bg-white/[0.02] border border-white/[0.08] rounded-2xl overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06] bg-white/[0.02]">
                      <p className="text-[10px] font-black uppercase tracking-widest text-white">
                        {new Date(day.date + 'T12:00:00').toLocaleDateString('pt-BR', {
                          weekday: 'long', day: '2-digit', month: 'long'
                        })}
                      </p>
                      <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 bg-white/[0.04] px-2 py-1 rounded-full">
                        {day.gamesCount} jogos
                      </span>
                    </div>
                    <div className="divide-y divide-white/[0.04]">
                      {day.timeSlots?.map((slot, j) => {
                        const categoryData = simulation.categories?.find(c => c.id === slot.categoryId)
                        return (
                          <div key={j} className="px-4 py-2.5 flex items-center gap-4 hover:bg-white/[0.02] transition-colors group">
                            <span className="text-[11px] font-black text-[#FF6B00] w-12 flex-shrink-0">
                              {slot.time}
                            </span>
                            <div className="flex-1 flex items-center gap-3 min-w-0">
                              <span className="text-[8px] font-bold text-slate-600 bg-white/[0.05] px-1.5 py-0.5 rounded border border-white/[0.05] uppercase tracking-widest flex-shrink-0">
                                {slot.categoryName || categoryData?.name || 'Cat.'}
                              </span>
                              <p className="text-[10px] font-bold text-white uppercase tracking-tight truncate">
                                Rodada {slot.round}
                              </p>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {/* Ações de aprovação */}
              <div className="bg-[#FF6B00]/10 border border-[#FF6B00]/20 rounded-2xl p-4">
                <p className="text-[9px] font-black uppercase tracking-widest text-[#FF6B00] mb-3 text-center">
                  Ao aprovar, os jogos serão criados e disponibilizados para as equipes
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setStep('preview')}
                    className="flex-1 h-11 text-[10px] font-black uppercase tracking-widest text-slate-400 bg-white/[0.03] border border-white/[0.08] rounded-xl hover:text-white transition-all"
                  >
                    Regerar
                  </button>
                  <button
                    onClick={handleApply}
                    className="flex-1 h-11 text-[10px] font-black uppercase tracking-widest text-white bg-[#FF6B00] hover:bg-[#E66000] rounded-xl transition-all inline-flex items-center justify-center gap-2 shadow-lg shadow-orange-600/20"
                  >
                    ✓ Aprovar e Aplicar
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ——— APPLYING ——— */}
          {step === 'applying' && (
            <div className="text-center space-y-6 py-16">
              <Loader2 className="w-14 h-14 text-[#FF6B00] animate-spin mx-auto" />
              <div className="space-y-2">
                <p className="text-lg font-black italic uppercase text-white tracking-tight">Efetivando...</p>
                <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.3em]">Gravando jogos no banco de dados</p>
              </div>
            </div>
          )}

          {/* ——— DONE ——— */}
          {step === 'done' && (
            <div className="space-y-6 py-10 animate-in zoom-in-95 duration-500">
              <div className="text-center">
                <div className="w-24 h-24 rounded-[40px] bg-green-500/20 border border-green-500/20 flex items-center justify-center mx-auto shadow-2xl shadow-green-500/10 mb-6">
                  <CheckCircle2 className="w-12 h-12 text-green-500" />
                </div>
                <p className="text-2xl font-black italic uppercase text-white tracking-tight">Calendário Aplicado!</p>
                <p className="text-sm text-slate-400 font-medium mt-2">Os jogos foram criados com sucesso no banco de dados.</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 h-12 text-[10px] font-black uppercase tracking-widest text-slate-400 bg-white/[0.03] border border-white/[0.08] rounded-xl hover:text-white transition-all"
                >
                  Fechar
                </button>
                <button
                  onClick={() => { onApplied(); onClose() }}
                  className="flex-1 h-12 text-[10px] font-black uppercase tracking-widest text-white bg-[#FF6B00] hover:bg-[#E66000] rounded-xl transition-all flex items-center justify-center gap-2"
                >
                  Ver Jogos <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* ——— ERROR ——— */}
          {step === 'error' && (
            <div className="py-10 space-y-6 animate-in fade-in duration-300">
              <div className="bg-red-500/5 border border-red-500/20 rounded-[32px] p-10 flex flex-col items-center gap-6 text-center">
                <div className="w-16 h-16 rounded-2xl bg-red-500/20 flex items-center justify-center">
                  <AlertCircle className="w-8 h-8 text-red-500" />
                </div>
                <div>
                  <h4 className="text-xl font-black italic uppercase text-red-500 tracking-tight mb-2">
                    Falha na Operação
                  </h4>
                  <p className="text-sm text-slate-400 max-w-sm font-medium">{errorMsg}</p>
                </div>
              </div>
              <button
                onClick={() => setStep('idle')}
                className="w-full h-14 bg-white/5 hover:bg-white/10 text-white font-black text-xs uppercase tracking-widest rounded-2xl transition-all border border-white/10"
              >
                Tentar Novamente
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
