'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { FlaskConical, Trash2, Play, Loader2, CheckCircle2, XCircle, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'

type StepStatus = 'idle' | 'loading' | 'done' | 'error'

type Step = {
  step: number
  label: string
  status: StepStatus
  detail?: string
  summary?: {
    championshipId: string
    championshipName: string
    totalGames: number
    gamesCompleted: number
    leaders: { sub17: string; sub15: string; sub13: string }
  }
}

const INITIAL_STEPS: Step[] = [
  { step: 1, label: 'Criar Campeonato', status: 'idle' },
  { step: 2, label: 'Inscrever Equipes', status: 'idle' },
  { step: 3, label: 'Validar Categorias', status: 'idle' },
  { step: 4, label: 'Gerar Confrontos da Fase 1', status: 'idle' },
  { step: 5, label: 'Definir Datas e Locais', status: 'idle' },
  { step: 6, label: 'Simular Resultados', status: 'idle' },
  { step: 7, label: 'Resumo Final', status: 'idle' },
]

export default function SimulationPage() {
  const [steps, setSteps] = useState<Step[]>(INITIAL_STEPS)
  const [running, setRunning] = useState(false)
  const [cleaning, setCleaning] = useState(false)
  const [done, setDone] = useState(false)
  const [summary, setSummary] = useState<Step['summary'] | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const updateStep = (data: Partial<Step> & { step: number }) => {
    setSteps(prev => prev.map(s => s.step === data.step ? { ...s, ...data } : s))
    if (data.summary) setSummary(data.summary)
  }

  const runSimulation = async () => {
    setRunning(true)
    setDone(false)
    setSummary(null)
    setSteps(INITIAL_STEPS)

    abortRef.current = new AbortController()

    try {
      const res = await fetch('/api/admin/simulation/run', {
        method: 'POST',
        signal: abortRef.current.signal
      })

      if (!res.body) throw new Error('No response body')

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done: streamDone, value } = await reader.read()
        if (streamDone) break
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (!line.trim()) continue
          try {
            const data = JSON.parse(line) as Partial<Step> & { step: number }
            updateStep(data)
          } catch { /* ignore malformed */ }
        }
      }

      setDone(true)
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error('Simulation error:', err)
      }
    } finally {
      setRunning(false)
    }
  }

  const cleanSimulation = async () => {
    if (!confirm('Tem certeza que deseja limpar todos os dados da simulação?')) return
    setCleaning(true)
    try {
      await fetch('/api/admin/simulation/clean', { method: 'DELETE' })
      setSteps(INITIAL_STEPS)
      setDone(false)
      setSummary(null)
    } catch (err) {
      console.error('Clean error:', err)
    } finally {
      setCleaning(false)
    }
  }

  const allDone = steps.every(s => s.status === 'done' || s.status === 'error')

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
              <FlaskConical className="w-5 h-5 text-purple-400" />
            </div>
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">FGB Championship App</span>
          </div>
          <h1 className="text-4xl font-display font-black tracking-tighter text-white uppercase italic">
            Simulação de Campeonato
          </h1>
          <p className="text-slate-500 text-sm mt-2 max-w-xl">
            Executa um campeonato completo automaticamente — ideal para demonstrações e testes do sistema.
            Usa equipes <strong className="text-slate-300">reais</strong> do banco de dados.
          </p>
        </div>

        <div className="flex gap-3">
          <Button
            onClick={cleanSimulation}
            disabled={cleaning || running}
            variant="ghost"
            className="text-red-500/70 hover:text-red-500 hover:bg-red-500/10 border border-red-500/20 rounded-xl h-12 px-6 font-bold"
          >
            {cleaning ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
            Limpar Simulação
          </Button>

          <Button
            onClick={runSimulation}
            disabled={running || cleaning}
            className="bg-purple-600 hover:bg-purple-500 text-white font-black uppercase tracking-wider h-12 px-8 rounded-xl shadow-lg shadow-purple-600/20 transition-all hover:scale-105 active:scale-95"
          >
            {running ? (
              <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Simulando...</>
            ) : (
              <><Play className="w-5 h-5 mr-2" />Rodar Simulação Completa</>
            )}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Steps */}
        <div className="lg:col-span-3 space-y-3">
          <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em]">Progresso</p>

          {steps.map((step, idx) => {
            const isActive = step.status === 'loading'
            const isDone = step.status === 'done'
            const isError = step.status === 'error'
            const isIdle = step.status === 'idle'

            return (
              <div
                key={step.step}
                className={cn(
                  'flex items-start gap-4 p-5 rounded-2xl border transition-all duration-500',
                  isDone ? 'bg-green-500/5 border-green-500/20' :
                  isActive ? 'bg-purple-500/10 border-purple-500/40 shadow-[0_0_30px_rgba(168,85,247,0.1)]' :
                  isError ? 'bg-red-500/5 border-red-500/20' :
                  'bg-white/[0.02] border-white/5'
                )}
              >
                {/* Icon */}
                <div className={cn(
                  'w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all duration-300',
                  isDone ? 'bg-green-500/15' :
                  isActive ? 'bg-purple-500/20' :
                  isError ? 'bg-red-500/15' :
                  'bg-white/5'
                )}>
                  {isDone ? <CheckCircle2 className="w-5 h-5 text-green-400" /> :
                   isActive ? <Loader2 className="w-5 h-5 text-purple-400 animate-spin" /> :
                   isError ? <XCircle className="w-5 h-5 text-red-400" /> :
                   <Clock className="w-5 h-5 text-slate-600" />}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <span className={cn(
                      'text-[9px] font-black uppercase tracking-widest',
                      isDone ? 'text-green-500' : isActive ? 'text-purple-400' : isError ? 'text-red-400' : 'text-slate-600'
                    )}>
                      Etapa {step.step}
                    </span>
                    {isDone && <span className="text-[9px] font-black text-green-500 uppercase">✅ Concluído</span>}
                    {isError && <span className="text-[9px] font-black text-red-500 uppercase">❌ Erro</span>}
                  </div>
                  <p className={cn(
                    'font-bold text-sm mt-0.5',
                    isDone ? 'text-white' : isActive ? 'text-white' : 'text-slate-500'
                  )}>
                    {step.label}
                  </p>
                  {step.detail && (
                    <p className="text-[11px] text-slate-400 mt-1 font-medium leading-relaxed">
                      {step.detail}
                    </p>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-2 space-y-6">
          {/* Info Card */}
          <div className="bg-[#0A0A0A] border-white/5 rounded-3xl border p-6 space-y-5">
            <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em]">Configuração da Simulação</p>

            <div className="space-y-3 text-[11px]">
              {[
                { label: 'Campeonato', value: 'Simulação Estadual 2026' },
                { label: 'Formato', value: 'Todos contra Todos' },
                { label: 'Categorias', value: 'Sub 13, Sub 15, Sub 17' },
                { label: 'Total de Equipes', value: '9 equipes reais' },
                { label: 'Total de Jogos', value: '27 jogos (6+15+6)' },
                { label: 'Período', value: 'Maio – Outubro 2026' },
              ].map(item => (
                <div key={item.label} className="flex justify-between items-center py-2 border-b border-white/5 last:border-0">
                  <span className="text-slate-500 font-bold uppercase tracking-tight">{item.label}</span>
                  <span className="text-white font-black">{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Summary Card (shown after simulation) */}
          {done && summary && (
            <div className="bg-purple-500/10 border border-purple-500/20 rounded-3xl p-6 space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-purple-400" />
                <p className="text-[10px] font-black text-purple-400 uppercase tracking-[0.2em]">Simulação Completa!</p>
              </div>

              <div className="space-y-3 text-[11px]">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 font-bold">Jogos Realizados</span>
                  <span className="text-white font-black text-lg">{summary.gamesCompleted}/{summary.totalGames}</span>
                </div>
                <div className="border-t border-white/5 pt-3 space-y-2">
                  <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-2">Líderes por Categoria</p>
                  <div className="flex justify-between"><span className="text-slate-400">Sub 17</span><span className="text-purple-300 font-bold">{summary.leaders.sub17}</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Sub 15</span><span className="text-purple-300 font-bold">{summary.leaders.sub15}</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Sub 13</span><span className="text-purple-300 font-bold">{summary.leaders.sub13}</span></div>
                </div>
              </div>

              <div className="flex gap-2">
                <Link href="/admin/standings" className="flex-1">
                  <Button variant="outline" className="w-full text-purple-400 border-purple-500/30 hover:bg-purple-500/10 rounded-xl h-9 text-xs font-bold">
                    Ver Classificação
                  </Button>
                </Link>
                <Link href="/admin/results" className="flex-1">
                  <Button variant="outline" className="w-full text-purple-400 border-purple-500/30 hover:bg-purple-500/10 rounded-xl h-9 text-xs font-bold">
                    Ver Resultados
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
