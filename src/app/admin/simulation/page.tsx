'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { FlaskConical, Trash2, Play, Loader2, CheckCircle2, XCircle, Clock, Search, Filter, Shield, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'

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
    isSimulation: boolean
  }
}

type Team = {
  id: string
  name: string
  city: string
  logoUrl?: string
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

const ALL_CATEGORIES = ['Sub 11', 'Sub 12', 'Sub 13', 'Sub 14', 'Sub 15', 'Sub 16', 'Sub 17', 'Sub 18', 'Sub 19', 'Sub 20']

export default function SimulationPage() {
  const [steps, setSteps] = useState<Step[]>(INITIAL_STEPS)
  const [running, setRunning] = useState(false)
  const [cleaning, setCleaning] = useState(false)
  const [done, setDone] = useState(false)
  const [summary, setSummary] = useState<Step['summary'] | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  // Configuration State
  const [showConfig, setShowConfig] = useState(true)
  const [name, setName] = useState('Simulação Estadual 2026')
  const [sex, setSex] = useState('masculino')
  const [selectedCategories, setSelectedCategories] = useState(['Sub 13', 'Sub 15', 'Sub 17'])
  const [teams, setTeams] = useState<Team[]>([])
  const [selectedTeamIds, setSelectedTeamIds] = useState<string[]>([])
  const [fetchingTeams, setFetchingTeams] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchTeams()
  }, [])

  const fetchTeams = async () => {
    try {
      const res = await fetch('/api/teams')
      const data = await res.json()
      setTeams(data.teams || [])
      // Pre-select some teams for convenience
      setSelectedTeamIds(data.teams?.slice(0, 8).map((t: any) => t.id) || [])
    } catch (err) {
      console.error('Failed to fetch teams:', err)
    } finally {
      setFetchingTeams(false)
    }
  }

  const updateStep = (data: Partial<Step> & { step: number }) => {
    if (data.step === -1) {
      setSteps(prev => prev.map(s => s.status === 'loading' ? { ...s, status: 'error', detail: data.detail } : s))
      setRunning(false)
      return
    }
    setSteps(prev => prev.map(s => s.step === data.step ? { ...s, ...data } : s))
    if (data.summary) setSummary(data.summary as any)
  }

  const runSimulation = async () => {
    setRunning(true)
    setDone(false)
    setSummary(null)
    setSteps(INITIAL_STEPS)
    setShowConfig(false)

    abortRef.current = new AbortController()

    const config = {
      name,
      sex,
      categories: selectedCategories,
      teamIds: selectedTeamIds
    }

    try {
      const res = await fetch('/api/admin/simulation/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config }),
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
      setShowConfig(true)
    } catch (err) {
      console.error('Clean error:', err)
    } finally {
      setCleaning(false)
    }
  }

  const toggleTeam = (id: string) => {
    setSelectedTeamIds(prev =>
      prev.includes(id) ? prev.filter(tid => tid !== id) : [...prev, id]
    )
  }

  const toggleCategory = (cat: string) => {
    setSelectedCategories(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    )
  }

  const filteredTeams = teams.filter(t => 
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    t.city.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-12 animate-in fade-in duration-700 max-w-[1440px] mx-auto pb-20">
      {/* Header - High End Glassmorphism */}
      <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-10 bg-white p-10 rounded-[40px] border border-[var(--border)] shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[var(--verde)]/5 blur-[100px] rounded-full -mr-48 -mt-48" />
        
        <div className="relative z-10 space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[var(--verde)] to-[var(--verde-dark)] shadow-[0_8px_20px_rgba(27,115,64,0.3)] flex items-center justify-center transition-transform hover:rotate-6">
              <FlaskConical className="w-7 h-7 text-white" />
            </div>
            <div>
              <p className="fgb-label text-[var(--gray)]" style={{ fontSize: 9, letterSpacing: '0.3em' }}>LABORATÓRIO EXPERIMENTAL</p>
              <h1 className="fgb-display text-5xl text-[var(--black)] mt-1">FGB Labs: Simulation Engine</h1>
            </div>
          </div>
          <p className="fgb-label text-[var(--gray)] max-w-2xl text-[13px] leading-relaxed italic" style={{ textTransform: 'none', letterSpacing: 0, opacity: 0.8 }}>
            Projete cenários competitivos complexos, teste limites de agendamento e valide o motor de IA em tempo real.
            <span className="block mt-1 font-bold text-[var(--verde)]">Ambientado para Dados Persistentes v4.5</span>
          </p>
        </div>

        <div className="flex flex-wrap gap-4 w-full xl:w-auto relative z-10">
          {!running && !showConfig && (
            <Button
              onClick={() => setShowConfig(true)}
              className="flex-1 sm:flex-none h-14 px-8 bg-white border-2 border-[var(--verde)] text-[var(--verde)] hover:bg-[var(--verde)]/5 font-bold uppercase tracking-widest rounded-2xl transition-all"
            >
              Nova Configuração
            </Button>
          )}
          
          <Button
            onClick={cleanSimulation}
            disabled={cleaning || running}
            className="flex-1 sm:flex-none h-14 px-8 bg-white border-2 border-[var(--red)] text-[var(--red)] hover:bg-[var(--red)]/5 font-bold uppercase tracking-widest rounded-2xl transition-all"
          >
            {cleaning ? <Loader2 className="w-5 h-5 mr-3 animate-spin" /> : <Trash2 className="w-5 h-5 mr-3" />}
            Limpar Lab
          </Button>

          {showConfig && (
            <Button
              onClick={runSimulation}
              disabled={running || cleaning || selectedTeamIds.length < 2 || selectedCategories.length === 0}
              className="flex-[2] sm:flex-none h-14 px-10 bg-[var(--yellow)] text-[var(--black)] hover:bg-[var(--yellow-dark)] font-black uppercase tracking-widest rounded-2xl shadow-[0_8px_25px_rgba(245,194,0,0.3)] transition-all hover:-translate-y-1 active:translate-y-0"
            >
              {running ? (
                <><Loader2 className="w-6 h-6 mr-3 animate-spin" />Sintonizando IA...</>
              ) : (
                <><Play className="w-6 h-6 mr-3 fill-current" />Gerar Universo</>
              )}
            </Button>
          )}
        </div>
      </div>

      {showConfig ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 animate-in slide-in-from-bottom-8 duration-700">
          {/* Main Config Area */}
          <div className="lg:col-span-8 space-y-10">
            {/* Panel 1: Basics */}
            <section className="bg-white rounded-[40px] border border-[var(--border)] shadow-sm overflow-hidden group hover:shadow-md transition-shadow">
              <div className="p-8 border-b border-[var(--border)] bg-[var(--bg-admin)]/50 flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                  <Shield className="w-5 h-5 text-blue-600" />
                </div>
                <h2 className="fgb-display text-xl text-[var(--black)]">Parâmetros do Cenário</h2>
              </div>
              
              <div className="p-10 space-y-10">
                <div className="space-y-3">
                  <label className="fgb-label text-[var(--gray)]" style={{ fontSize: 9, letterSpacing: '0.15em' }}>TÍTULO DA SIMULAÇÃO</label>
                  <Input 
                    value={name} 
                    onChange={e => setName(e.target.value)}
                    className="h-16 px-6 bg-[var(--bg-admin)] border-2 border-transparent focus:border-[var(--verde)] rounded-[20px] text-lg font-bold transition-all shadow-inner"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="space-y-4">
                    <label className="fgb-label text-[var(--gray)]" style={{ fontSize: 9, letterSpacing: '0.15em' }}>GENÊRO</label>
                    <div className="flex gap-3 bg-[var(--bg-admin)] p-1.5 rounded-[22px] border border-[var(--border)]">
                      {['masculino', 'feminino'].map(s => (
                        <button
                          key={s}
                          onClick={() => setSex(s)}
                          className={cn(
                            "flex-1 h-12 rounded-[16px] fgb-label uppercase transition-all font-black text-[10px]",
                            sex === s ? "bg-white text-[var(--verde)] shadow-md border border-[var(--verde)]/10" : "text-[var(--gray)] hover:text-[var(--black)]"
                          )}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-4">
                    <label className="fgb-label text-[var(--gray)]" style={{ fontSize: 9, letterSpacing: '0.15em' }}>CATEGORIAS SELECIONADAS</label>
                    <div className="h-14 flex items-center px-6 bg-[var(--bg-admin)] rounded-[20px] border border-[var(--border)] border-dashed border-2">
                      <p className="text-xs font-black text-[var(--black)] uppercase tracking-tight">{selectedCategories.length} Níveis Ativos</p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2.5 pt-4">
                  {ALL_CATEGORIES.map(cat => (
                    <button
                      key={cat}
                      onClick={() => toggleCategory(cat)}
                      className={cn(
                        "px-6 py-3 rounded-full border-2 text-[10px] font-black transition-all shadow-sm",
                        selectedCategories.includes(cat) 
                          ? "bg-[var(--verde)] border-[var(--verde)] text-white shadow-[0_4px_12px_rgba(27,115,64,0.2)]" 
                          : "bg-white border-[var(--border)] text-[var(--gray)] hover:border-[var(--gray-d)] hover:text-[var(--black)]"
                      )}
                    >
                      {cat.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
            </section>

            {/* Panel 2: Teams */}
            <section className="bg-white rounded-[40px] border border-[var(--border)] shadow-sm overflow-hidden group hover:shadow-md transition-shadow">
              <div className="p-8 border-b border-[var(--border)] bg-[var(--bg-admin)]/50 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center border border-orange-500/20">
                    <Filter className="w-5 h-5 text-orange-600" />
                  </div>
                  <h2 className="fgb-display text-xl text-[var(--black)]">Seleção de Clubes</h2>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-[var(--verde)]/10 rounded-full border border-[var(--verde)]/20">
                   <div className="w-2 h-2 bg-[var(--verde)] rounded-full animate-pulse" />
                   <span className="fgb-label font-black text-[var(--verde)]" style={{ fontSize: 9 }}>{selectedTeamIds.length} CLUBES</span>
                </div>
              </div>

              <div className="p-10 space-y-8">
                <div className="relative group/search">
                  <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--gray)] transition-colors group-focus-within/search:text-[var(--verde)]" />
                  <Input 
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    placeholder="Filtrar por nome ou cidade..."
                    className="h-16 pl-16 pr-6 bg-[var(--bg-admin)] border-2 border-transparent focus:border-[var(--verde)] rounded-[20px] text-base transition-all shadow-inner"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[500px] overflow-y-auto pr-4 custom-scrollbar">
                  {fetchingTeams ? (
                    Array(8).fill(0).map((_, i) => <div key={i} className="h-20 bg-[var(--bg-admin)] rounded-3xl animate-pulse" />)
                  ) : (
                    filteredTeams.map(team => (
                      <button
                        key={team.id}
                        onClick={() => toggleTeam(team.id)}
                        className={cn(
                          "group/card flex items-center gap-5 p-5 rounded-3xl border-2 text-left transition-all duration-300",
                          selectedTeamIds.includes(team.id) 
                            ? "bg-[var(--bg-admin)] border-[var(--verde)] shadow-md" 
                            : "bg-white border-transparent hover:bg-[var(--bg-admin)]"
                        )}
                      >
                        <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center shrink-0 border border-[var(--border)] shadow-sm group-hover/card:scale-110 transition-transform">
                          {team.logoUrl ? <img src={team.logoUrl} className="w-8 h-8 object-contain" /> : <Shield className="w-6 h-6 text-slate-200" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={cn("text-sm font-black truncate tracking-tight uppercase", selectedTeamIds.includes(team.id) ? "text-[var(--black)]" : "text-[var(--gray)]")}>{team.name}</p>
                          <p className="text-[11px] text-[var(--gray)] font-medium truncate opacity-60">{team.city}</p>
                        </div>
                        <Checkbox checked={selectedTeamIds.includes(team.id)} className="w-6 h-6 rounded-lg border-2 border-[var(--border)] data-[state=checked]:bg-[var(--verde)] data-[state=checked]:border-[var(--verde)] transition-all" />
                      </button>
                    ))
                  )}
                </div>
              </div>
            </section>
          </div>

          {/* Right Sidebar: Prediction & Execution */}
          <div className="lg:col-span-4 space-y-10">
            <div className="sticky top-10 space-y-10">
              {/* Executive Summary Card */}
              <div 
                className="rounded-[40px] p-10 text-white relative overflow-hidden shadow-premium" 
                style={{ background: 'linear-gradient(145deg, var(--verde) 0%, var(--verde-dark) 100%)' }}
              >
                 <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 blur-[50px] rounded-full -mr-24 -mt-24 pointer-events-none" />
                 
                 <div className="relative z-10 space-y-10">
                   <div className="flex items-center gap-3">
                     <span className="w-1.5 h-6 bg-[var(--yellow)] rounded-full" />
                     <h3 className="fgb-label text-white/60" style={{ fontSize: 10, letterSpacing: '0.2em' }}>EXECUTIVE PREVIEW</h3>
                   </div>

                   <div className="space-y-8">
                     <div className="p-6 bg-black/20 rounded-[28px] border border-white/10 backdrop-blur-sm">
                        <p className="fgb-label text-white/40 mb-2" style={{ fontSize: 9 }}>PROJEÇÃO DE CARGA</p>
                        <p className="fgb-display text-4xl mb-1">{Math.floor(selectedTeamIds.length * (selectedTeamIds.length - 1) / 2 * (selectedCategories.length || 0))}</p>
                        <p className="fgb-label text-[var(--yellow)]" style={{ fontSize: 9, textTransform: 'none' }}>Partidas a serem instanciadas</p>
                     </div>

                     <div className="grid grid-cols-2 gap-4">
                        <div className="p-5 bg-white/5 rounded-[24px] border border-white/5">
                           <p className="fgb-label text-white/40 mb-1" style={{ fontSize: 8 }}> CLUBES</p>
                           <p className="fgb-display text-3xl">{selectedTeamIds.length}</p>
                        </div>
                        <div className="p-5 bg-white/5 rounded-[24px] border border-white/5">
                           <p className="fgb-label text-white/40 mb-1" style={{ fontSize: 8 }}> NÍVEIS</p>
                           <p className="fgb-display text-3xl">{selectedCategories.length}</p>
                        </div>
                     </div>
                   </div>

                   <Button 
                    onClick={runSimulation}
                    disabled={selectedTeamIds.length < 2 || selectedCategories.length === 0}
                    className="w-full h-20 bg-white text-[var(--verde)] hover:bg-gray-100 font-black uppercase tracking-[0.2em] rounded-[28px] shadow-2xl transition-all hover:scale-[1.03] active:scale-95 disabled:opacity-50 text-[11px]"
                  >
                    Instanciar Mundo
                  </Button>
                 </div>
              </div>

              {/* Simulation Meta Panel */}
              <div className="bg-white rounded-[40px] p-8 border border-[var(--border)] shadow-sm space-y-6">
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-[var(--gray)]" />
                  <h4 className="fgb-label text-[var(--gray)]" style={{ fontSize: 10, letterSpacing: '0.1em' }}>CRONOGRAMA DO CENÁRIO</h4>
                </div>
                <div className="space-y-4">
                  {[
                    { label: 'Janela Temporal', value: 'Maio – Outubro 2026' },
                    { label: 'Estrutura fase 1', value: 'Round-Robin (Standard)' },
                    { label: 'Geolocalização', value: 'Múltiplos Clusters' },
                  ].map((item, i) => (
                    <div key={i} className="flex justify-between items-center bg-[var(--bg-admin)] p-4 rounded-[20px] transition-colors hover:bg-white hover:border hover:border-[var(--border)]">
                      <span className="text-[10px] font-black text-[var(--gray)] uppercase tracking-tight">{item.label}</span>
                      <span className="text-[11px] font-bold text-[var(--black)]">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Steps */}
          <div className="lg:col-span-3 space-y-3">
            <p className="fgb-label text-[var(--gray)] mb-4" style={{ fontSize: 10, letterSpacing: 2 }}>Execução em Tempo Real</p>

            {steps.map((step) => {
              const isActive = step.status === 'loading'
              const isDone = step.status === 'done'
              const isError = step.status === 'error'

              return (
                <div
                  key={step.step}
                  className={cn(
                    'flex items-start gap-4 p-5 rounded-2xl border transition-all duration-500 shadow-sm',
                    isDone ? 'bg-green-50 border-green-200' :
                    isActive ? 'bg-[var(--verde)]/10 border-[var(--verde)]/40 shadow-[0_0_30px_rgba(27,115,64,0.1)]' :
                    isError ? 'bg-red-50 border-red-200' :
                    'bg-white border-[var(--border)]'
                  )}
                >
                  <div className={cn(
                    'w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all duration-300',
                    isDone ? 'bg-green-100' :
                    isActive ? 'bg-[var(--verde)]/20' :
                    isError ? 'bg-red-100' :
                    'bg-[var(--gray-l)] border border-[var(--border)]'
                  )}>
                    {isDone ? <CheckCircle2 className="w-5 h-5 text-green-600" /> :
                     isActive ? <Loader2 className="w-5 h-5 text-[var(--verde)] animate-spin" /> :
                     isError ? <XCircle className="w-5 h-5 text-[var(--red)]" /> :
                     <Clock className="w-5 h-5 text-[var(--gray)]" />}
                  </div>

                  <div className="flex-1 min-w-0 font-sans">
                    <div className="flex items-center gap-3">
                      <span className={cn(
                        'text-[9px] font-black uppercase tracking-widest',
                        isDone ? 'text-green-600' : isActive ? 'text-[var(--verde)]' : isError ? 'text-[var(--red)]' : 'text-[var(--gray)]'
                      )}>
                        Etapa 0{step.step}
                      </span>
                      {isDone && <span className="text-[9px] font-black text-green-600 uppercase italic">OK</span>}
                    </div>
                    <p className={cn(
                      'font-bold text-sm mt-0.5',
                      isDone ? 'text-[var(--black)]' : isActive ? 'text-[var(--black)]' : 'text-[var(--gray)]'
                    )}>
                      {step.label}
                    </p>
                    {step.detail && (
                      <p className="text-[11px] text-[var(--gray)] mt-1 font-medium leading-relaxed">
                        {step.detail}
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          <div className="lg:col-span-2 space-y-6">
            {done && summary && (
              <div className="fgb-card admin-card-verde border border-[var(--verde)]/40 p-8 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 shadow-2xl">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center border border-[var(--verde)]/20">
                    <CheckCircle2 className="w-6 h-6 text-[var(--verde)]" />
                  </div>
                  <div>
                    <h3 className="fgb-display text-xl text-white italic leading-none shadow-sm">Simulação Concluída</h3>
                    <p className="fgb-label text-white/80 mt-1" style={{ fontSize: 10 }}>Status: Persistente & Ativo</p>
                  </div>
                </div>

                <div className="space-y-4 pt-4">
                  <div className="p-5 rounded-2xl bg-black/20 border border-white/10 space-y-4 font-sans">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-white/60 font-bold uppercase tracking-tight">Campeonato</span>
                      <span className="text-white font-black truncate max-w-[150px]">{summary.championshipName}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs border-t border-white/10 pt-4">
                      <span className="text-white/60 font-bold uppercase tracking-tight">Jogos Criados</span>
                      <span className="text-white font-black">{summary.totalGames}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs border-t border-white/10 pt-4">
                      <span className="text-white/60 font-bold uppercase tracking-tight">Tipo de Dados</span>
                      <span className="text-[var(--yellow)] font-black uppercase tracking-widest">Persistente</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 pt-2">
                  <Link href="/admin/standings">
                    <Button className="w-full bg-white text-[var(--verde)] font-bold font-sans h-12 rounded-xl text-xs uppercase tracking-widest shadow-lg transition-all hover:scale-[1.02]">
                      Explorar Classificação <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </Link>
                  <Link href="/admin/results">
                    <Button variant="outline" className="w-full border-white/30 text-white hover:bg-white/10 font-bold h-12 rounded-xl text-xs uppercase tracking-widest font-sans">
                      Validar Súmulas
                    </Button>
                  </Link>
                </div>
              </div>
            )}

            {!done && running && (
              <div className="fgb-card bg-[var(--gray-l)] p-8 space-y-6 text-center">
                <div className="w-16 h-16 rounded-full bg-[var(--verde)]/10 flex items-center justify-center mx-auto mb-4 border border-[var(--verde)]/20">
                  <Loader2 className="w-8 h-8 text-[var(--verde)] animate-spin" />
                </div>
                <h3 className="fgb-display text-lg text-[var(--black)] leading-none">Processando Dados</h3>
                <p className="text-xs text-[var(--gray)] leading-relaxed font-medium font-sans">
                  A IA está gerando confrontos, definindo sedes e simulando resultados realistas. Isso pode levar alguns segundos dependendo do volume de equipes.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
