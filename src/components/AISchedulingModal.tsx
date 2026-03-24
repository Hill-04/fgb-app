'use client'

import { useState } from 'react'
import { Sparkles, X, CheckCircle2, AlertCircle, Loader2, Calendar, MapPin, Info, ArrowRight } from 'lucide-react'

type AISchedulingModalProps = {
  championshipId: string
  championshipName: string
  onClose: () => void
  onApplied: () => void
}

type SimulationResult = {
  viableCategories: { id: string; title: string; teamsCount: number }[]
  blocks: {
    id: string
    title: string
    reason: string
    categories: string[]
    phases: {
      name: string
      date: string
      location: string
      city: string
      matches: { homeTeamId: string; awayTeamId: string; categoryId: string; phase: number }[]
    }[]
  }[]
  summary: {
    totalMatches: number
    totalTravelSaved: string
    costSavingsTips: string[]
  }
}

export function AISchedulingModal({
  championshipId,
  championshipName,
  onClose,
  onApplied,
}: AISchedulingModalProps) {
  const [step, setStep] = useState<'idle' | 'simulating' | 'preview' | 'applying' | 'done' | 'error'>('idle')
  const [simulation, setSimulation] = useState<SimulationResult | null>(null)
  const [errorMsg, setErrorMsg] = useState('')

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

  const handleApply = async () => {
    if (!simulation) return
    setStep('applying')
    try {
      const res = await fetch('/api/scheduling/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          championshipId, 
          blocks: simulation.blocks, 
          viableCategories: simulation.viableCategories 
        })
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Erro ao aplicar o calendário')
      }
      setStep('done')
      setTimeout(() => {
        onApplied()
        onClose()
      }, 2000)
    } catch (err: any) {
      setErrorMsg(err.message)
      setStep('error')
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <div className="w-full max-w-4xl bg-[#0F0F0F] border border-white/10 rounded-[40px] overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between p-8 border-b border-white/5 bg-white/[0.02]">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#FF6B00]/20 flex items-center justify-center border border-[#FF6B00]/20 shadow-lg shadow-orange-600/10">
              <Sparkles className="w-6 h-6 text-[#FF6B00]" />
            </div>
            <div>
              <h3 className="text-2xl font-black italic uppercase text-white tracking-tight leading-none">
                Organizar com IA
              </h3>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mt-2">
                Campeonato: <span className="text-slate-300">{championshipName}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-2xl hover:bg-white/5 flex items-center justify-center text-slate-500 hover:text-white transition-all border border-transparent hover:border-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Container */}
        <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">

          {/* IDLE: Initial State */}
          {step === 'idle' && (
            <div className="text-center py-10 space-y-8 animate-in zoom-in-95 duration-500">
              <div className="relative inline-block">
                 <div className="absolute inset-0 bg-[#FF6B00] blur-[40px] opacity-20 animate-pulse" />
                 <div className="relative w-28 h-28 rounded-[38px] bg-gradient-to-br from-[#FF6B00] to-[#E66000] flex items-center justify-center mx-auto shadow-2xl">
                    <Sparkles className="w-14 h-14 text-white" />
                 </div>
              </div>
              <div className="max-w-md mx-auto space-y-3">
                <h4 className="text-2xl font-black italic uppercase text-white tracking-tight">
                  Inteligência Logística
                </h4>
                <p className="text-sm text-slate-400 font-medium">
                  Nossa IA vai processar todas as categorias, sedes sugeridas e restrições de horários dos times para gerar o melhor calendário possível.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto pt-4">
                 {[
                   { icon: Calendar, text: "Otimização de Datas" },
                   { icon: MapPin, text: "Redução de Viagens" },
                   { icon: Info, text: "Sugestão de Blocos" }
                 ].map((item, i) => (
                   <div key={i} className="bg-white/5 rounded-2xl p-4 border border-white/5">
                      <item.icon className="w-5 h-5 text-[#FF6B00] mx-auto mb-2" />
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-300">{item.text}</p>
                   </div>
                 ))}
              </div>
              <button
                onClick={handleSimulate}
                className="bg-[#FF6B00] hover:bg-[#E66000] text-white font-black text-xs uppercase tracking-[0.2em] px-12 h-14 rounded-2xl transition-all shadow-xl shadow-orange-600/20 active:scale-95"
              >
                Gerar Calendário Otimizado
              </button>
            </div>
          )}

          {/* SIMULATING: Loading State */}
          {step === 'simulating' && (
            <div className="text-center space-y-8 py-20">
              <div className="relative w-20 h-20 mx-auto">
                 <Loader2 className="w-20 h-20 text-[#FF6B00] animate-spin" />
                 <Sparkles className="w-8 h-8 text-[#FF6B00] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
              </div>
              <div className="space-y-2">
                <p className="text-xl font-black italic uppercase text-white tracking-tight animate-pulse">
                  Processando Logística...
                </p>
                <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.3em] max-w-xs mx-auto">
                  Organizando categorias, times e ginásios em tempo real
                </p>
              </div>
            </div>
          )}

          {/* PREVIEW: Show simulation results */}
          {step === 'preview' && simulation && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-500">
              
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                 <div className="bg-white/[0.03] border border-white/10 rounded-3xl p-6">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Total de Jogos</p>
                    <p className="text-3xl font-black italic text-[#FF6B00]">{simulation.summary.totalMatches}</p>
                 </div>
                 <div className="bg-white/[0.03] border border-white/10 rounded-3xl p-6 md:col-span-2">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 font-mono">Insight Logístico</p>
                    <p className="text-sm font-bold text-white leading-relaxed">{simulation.summary.totalTravelSaved}</p>
                 </div>
              </div>

              {/* Tips Section */}
              <div className="bg-blue-500/5 border border-blue-500/10 rounded-3xl p-6 flex items-start gap-4">
                 <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                 <div className="space-y-2">
                    <p className="text-[10px] font-black uppercase tracking-widest text-blue-400">Sugestões de Economia</p>
                    <ul className="space-y-1.5">
                       {simulation.summary.costSavingsTips.map((tip, i) => (
                         <li key={i} className="text-xs text-slate-400 flex items-center gap-2">
                            <span className="w-1 h-1 rounded-full bg-blue-500/50" /> {tip}
                         </li>
                       ))}
                    </ul>
                 </div>
              </div>

              {/* Blocks & Matches Detail */}
              <div className="space-y-4">
                <h5 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 ml-2">Distribuição por Blocos</h5>
                <div className="space-y-4">
                  {simulation.blocks.map((block) => (
                    <div key={block.id} className="bg-white/[0.02] border border-white/5 rounded-3xl overflow-hidden">
                      <div className="bg-white/[0.03] px-6 py-4 flex justify-between items-center border-b border-white/5">
                        <div className="flex items-center gap-3">
                           <span className="text-[10px] font-black bg-[#FF6B00] text-white px-2 py-0.5 rounded-lg uppercase">{block.id}</span>
                           <h6 className="text-xs font-black uppercase text-white tracking-widest">{block.title}</h6>
                        </div>
                        <span className="text-[9px] font-bold text-slate-500 uppercase">{block.reason}</span>
                      </div>
                      <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                         {block.phases.map((phase, pi) => (
                           <div key={pi} className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 space-y-3">
                              <div className="flex justify-between items-start">
                                 <div>
                                    <p className="text-xs font-black text-white uppercase">{phase.name}</p>
                                    <p className="text-[9px] text-slate-500 font-bold uppercase mt-1">{phase.city} • {phase.location}</p>
                                 </div>
                                 <span className="text-[9px] font-black text-[#FF6B00]">{phase.matches.length} JOGOS</span>
                              </div>
                              <div className="space-y-1.5 border-t border-white/5 pt-3">
                                 {phase.matches.slice(0, 3).map((m, mi) => (
                                   <div key={mi} className="flex items-center gap-2 text-[10px] text-slate-400 font-medium">
                                      <span className="w-1.5 h-1.5 rounded-full bg-white/10" />
                                      Equipe {mi + 1} vs Equipe {mi + 2}
                                   </div>
                                 ))}
                                 {phase.matches.length > 3 && (
                                   <p className="text-[9px] text-slate-600 italic font-bold ml-3">+ {phase.matches.length - 3} partidas neste bloco</p>
                                 )}
                              </div>
                           </div>
                         ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Botões de Ação */}
              <div className="flex gap-4 pt-6 border-t border-white/5 sticky bottom-0 bg-[#0F0F0F] pb-2">
                <button
                  onClick={() => setStep('idle')}
                  className="flex-1 h-14 font-black text-xs uppercase tracking-widest text-slate-500 hover:text-white transition-all bg-white/5 rounded-2xl border border-white/5"
                >
                  Regerar Simulação
                </button>
                <button
                  onClick={handleApply}
                  className="flex-[2] bg-[#FF6B00] hover:bg-[#E66000] text-white font-black text-xs uppercase tracking-[0.2em] h-14 rounded-2xl transition-all shadow-xl shadow-orange-600/20 active:scale-95 flex items-center justify-center gap-3"
                >
                  <CheckCircle2 className="w-5 h-5" /> Aplicar Calendário Oficial
                </button>
              </div>
            </div>
          )}

          {/* APPLYING: Saving matches */}
          {step === 'applying' && (
            <div className="text-center space-y-8 py-20">
              <Loader2 className="w-16 h-16 text-[#FF6B00] animate-spin mx-auto" />
              <div className="space-y-2">
                 <p className="text-xl font-black italic uppercase text-white tracking-tight">Efetivando Calendário...</p>
                 <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.3em]">Gravando jogos e tabelas no banco de dados</p>
              </div>
            </div>
          )}

          {/* DONE: Success */}
          {step === 'done' && (
            <div className="text-center space-y-6 py-20 animate-in zoom-in-95 duration-500">
              <div className="w-24 h-24 rounded-[40px] bg-green-500/20 border border-green-500/20 flex items-center justify-center mx-auto shadow-2xl shadow-green-500/10">
                 <CheckCircle2 className="w-12 h-12 text-green-500" />
              </div>
              <div className="space-y-2">
                 <p className="text-2xl font-black italic uppercase text-white tracking-tight">Competição Organizada!</p>
                 <p className="text-sm text-slate-400 font-medium">Os jogos foram criados com sucesso. Redirecionando para o painel principal...</p>
              </div>
            </div>
          )}

          {/* ERROR: Failure */}
          {step === 'error' && (
            <div className="py-10 space-y-6 animate-in fade-in duration-300">
              <div className="bg-red-500/5 border border-red-500/20 rounded-[32px] p-10 flex flex-col items-center gap-6 text-center">
                <div className="w-16 h-16 rounded-2xl bg-red-500/20 flex items-center justify-center">
                   <AlertCircle className="w-8 h-8 text-red-500" />
                </div>
                <div>
                  <h4 className="text-xl font-black italic uppercase text-red-500 tracking-tight mb-2">
                    Falha na Simulação
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
