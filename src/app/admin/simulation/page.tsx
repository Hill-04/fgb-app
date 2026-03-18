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
    <div className="space-y-10 animate-in fade-in duration-500 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
              <FlaskConical className="w-5 h-5 text-purple-400" />
            </div>
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">FGB LABS</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-display font-black tracking-tighter text-white uppercase italic leading-tight">
            Laboratório de Simulação
          </h1>
          <p className="text-slate-500 text-sm mt-2 max-w-xl font-medium">
            Configure e execute cenários completos de campeonatos. As simulações agora são <strong className="text-purple-400">persistentes</strong> e marcadas para visualização administrativa.
          </p>
        </div>

        <div className="flex flex-wrap gap-3 w-full sm:w-auto">
          {!running && !showConfig && (
            <Button
              onClick={() => setShowConfig(true)}
              variant="outline"
              className="flex-1 sm:flex-none border-white/10 text-slate-300 rounded-xl h-12 px-6 font-bold hover:bg-white/5"
            >
              Nova Configuração
            </Button>
          )}
          
          <Button
            onClick={cleanSimulation}
            disabled={cleaning || running}
            variant="ghost"
            className="flex-1 sm:flex-none text-red-500/70 hover:text-red-500 hover:bg-red-500/10 border border-red-500/20 rounded-xl h-12 px-6 font-bold"
          >
            {cleaning ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
            Limpar Dados
          </Button>

          {showConfig && (
            <Button
              onClick={runSimulation}
              disabled={running || cleaning || selectedTeamIds.length < 2 || selectedCategories.length === 0}
              className="flex-[2] sm:flex-none bg-purple-600 hover:bg-purple-500 text-white font-black uppercase tracking-wider h-12 px-8 rounded-xl shadow-lg shadow-purple-600/20 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100"
            >
              {running ? (
                <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Iniciando...</>
              ) : (
                <><Play className="w-5 h-5 mr-2" />Efetuar Simulação</>
              )}
            </Button>
          )}
        </div>
      </div>

      {showConfig ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in slide-in-from-bottom-4 duration-500">
          {/* Main Config */}
          <div className="lg:col-span-2 space-y-8">
            <section className="bg-[#0A0A0A] border border-white/5 rounded-[32px] p-8 space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400">
                  <Shield className="w-4 h-4" />
                </div>
                <h2 className="text-lg font-bold text-white uppercase tracking-tight">Informações Básicas</h2>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Nome do Campeonato</label>
                  <Input 
                    value={name} 
                    onChange={e => setName(e.target.value)}
                    placeholder="Ex: Torneio de Verão 2026"
                    className="bg-white/[0.03] border-white/10 h-14 rounded-2xl focus:border-purple-500 text-white text-base font-bold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Sexo</label>
                    <div className="flex gap-2">
                      {['masculino', 'feminino'].map(s => (
                        <button
                          key={s}
                          onClick={() => setSex(s)}
                          className={cn(
                            "flex-1 h-12 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all",
                            sex === s ? "bg-purple-500/20 border-purple-500 text-purple-400" : "bg-white/5 border-white/5 text-slate-500 hover:border-white/10"
                          )}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Categorias</label>
                    <p className="text-[11px] text-slate-400 font-medium h-12 flex items-center italic">{selectedCategories.length} selecionadas</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 pt-2">
                  {ALL_CATEGORIES.map(cat => (
                    <button
                      key={cat}
                      onClick={() => toggleCategory(cat)}
                      className={cn(
                        "px-4 py-2 rounded-lg border text-[10px] font-bold transition-all",
                        selectedCategories.includes(cat) ? "bg-purple-500/10 border-purple-500/40 text-purple-300" : "bg-white/[0.02] border-white/5 text-slate-500 hover:border-white/10"
                      )}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
            </section>

            <section className="bg-[#0A0A0A] border border-white/5 rounded-[32px] p-8 space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-400">
                    <Filter className="w-4 h-4" />
                  </div>
                  <h2 className="text-lg font-bold text-white uppercase tracking-tight">Seleção de Equipes</h2>
                </div>
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{selectedTeamIds.length} equipes</span>
              </div>

              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <Input 
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  placeholder="Buscar equipe ou cidade..."
                  className="bg-white/[0.03] border-white/10 h-12 pl-12 rounded-xl focus:border-purple-500 text-white"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {fetchingTeams ? (
                  Array(6).fill(0).map((_, i) => <div key={i} className="h-16 bg-white/5 rounded-2xl animate-pulse" />)
                ) : (
                  filteredTeams.map(team => (
                    <button
                      key={team.id}
                      onClick={() => toggleTeam(team.id)}
                      className={cn(
                        "flex items-center gap-4 p-4 rounded-2xl border text-left transition-all",
                        selectedTeamIds.includes(team.id) ? "bg-purple-500/10 border-purple-500/40" : "bg-white/[0.02] border-white/5 hover:border-white/10"
                      )}
                    >
                      <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center shrink-0 border border-white/10">
                        {team.logoUrl ? <img src={team.logoUrl} className="w-6 h-6 object-contain" /> : <Shield className="w-5 h-5 text-slate-600" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={cn("text-xs font-bold truncate", selectedTeamIds.includes(team.id) ? "text-white" : "text-slate-400")}>{team.name}</p>
                        <p className="text-[10px] text-slate-600 font-medium truncate">{team.city}</p>
                      </div>
                      <Checkbox checked={selectedTeamIds.includes(team.id)} className="rounded-full border-slate-700" />
                    </button>
                  ))
                )}
              </div>
            </section>
          </div>

          {/* Preview / Sidebar */}
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-purple-600 to-indigo-700 rounded-[32px] p-8 text-white shadow-2xl shadow-purple-900/20">
              <h3 className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60 mb-6">Resumo da Simulação</h3>
              
              <div className="space-y-6">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest opacity-40 mb-1">Cenário</p>
                  <p className="text-xl font-display font-black leading-tight italic uppercase tracking-tighter">{name}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-widest opacity-40 mb-1">Equipes</p>
                    <p className="text-2xl font-black">{selectedTeamIds.length}</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-widest opacity-40 mb-1">Categorias</p>
                    <p className="text-2xl font-black">{selectedCategories.length}</p>
                  </div>
                </div>

                <div className="pt-6 border-t border-white/10">
                  <p className="text-[9px] font-medium leading-relaxed opacity-80 italic">
                    Esta simulação irá gerar aproximadamente {Math.floor(selectedTeamIds.length * (selectedTeamIds.length - 1) / 2 * (selectedCategories.length || 0))} jogos distribuídos entre as categorias selecionadas.
                  </p>
                </div>

                <Button 
                  onClick={runSimulation}
                  disabled={selectedTeamIds.length < 2 || selectedCategories.length === 0}
                  className="w-full h-14 bg-white text-purple-600 hover:bg-purple-50 font-black uppercase tracking-widest rounded-2xl shadow-xl transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
                >
                  Confirmar e Iniciar
                </Button>
              </div>
            </div>

            <div className="bg-[#0A0A0A] border border-white/5 rounded-[32px] p-6 space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-slate-500" />
                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Cronograma Simulado</h4>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-slate-500 font-bold uppercase tracking-tight">Período</span>
                  <span className="text-white font-black">Maio – Outubro 2026</span>
                </div>
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-slate-500 font-bold uppercase tracking-tight">Fase</span>
                  <span className="text-white font-black">Única (Regular)</span>
                </div>
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-slate-500 font-bold uppercase tracking-tight">Localização</span>
                  <span className="text-white font-black">Sedes Randômicas</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Steps */}
          <div className="lg:col-span-3 space-y-3">
            <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em]">Execução em Tempo Real</p>

            {steps.map((step) => {
              const isActive = step.status === 'loading'
              const isDone = step.status === 'done'
              const isError = step.status === 'error'

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

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <span className={cn(
                        'text-[9px] font-black uppercase tracking-widest',
                        isDone ? 'text-green-500' : isActive ? 'text-purple-400' : isError ? 'text-red-400' : 'text-slate-600'
                      )}>
                        Etapa 0{step.step}
                      </span>
                      {isDone && <span className="text-[9px] font-black text-green-500 uppercase italic">OK</span>}
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

          <div className="lg:col-span-2 space-y-6">
            {done && summary && (
              <div className="bg-purple-500/10 border border-purple-500/20 rounded-[32px] p-8 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-purple-500/20 flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-display font-black text-white italic uppercase tracking-tighter leading-none">Simulação Concluída</h3>
                    <p className="text-[10px] font-black text-purple-400 uppercase tracking-widest mt-1">Status: Persistente & Ativo</p>
                  </div>
                </div>

                <div className="space-y-4 pt-4">
                  <div className="p-5 rounded-2xl bg-white/5 border border-white/5 space-y-4">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-400 font-bold uppercase tracking-tight">Campeonato</span>
                      <span className="text-white font-black truncate max-w-[150px]">{summary.championshipName}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs border-t border-white/5 pt-4">
                      <span className="text-slate-400 font-bold uppercase tracking-tight">Jogos Criados</span>
                      <span className="text-white font-black">{summary.totalGames}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs border-t border-white/5 pt-4">
                      <span className="text-slate-400 font-bold uppercase tracking-tight">Tipo de Dados</span>
                      <span className="text-emerald-400 font-black uppercase tracking-widest">Persistente</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 pt-2">
                  <Link href="/admin/standings">
                    <Button className="w-full bg-white text-purple-900 font-black h-12 rounded-xl text-xs uppercase tracking-widest shadow-lg transition-all hover:scale-[1.02]">
                      Explorar Classificação <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </Link>
                  <Link href="/admin/results">
                    <Button variant="outline" className="w-full border-purple-500/30 text-purple-300 hover:bg-purple-500/10 font-bold h-12 rounded-xl text-xs uppercase tracking-widest">
                      Validar Súmulas
                    </Button>
                  </Link>
                </div>
              </div>
            )}

            {!done && running && (
              <div className="bg-[#0A0A0A] border border-white/5 rounded-[32px] p-8 space-y-6 text-center">
                <div className="w-16 h-16 rounded-full bg-purple-500/10 flex items-center justify-center mx-auto mb-4 border border-purple-500/20">
                  <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
                </div>
                <h3 className="text-lg font-bold text-white uppercase tracking-tight">Processando Dados</h3>
                <p className="text-xs text-slate-500 leading-relaxed font-medium">
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
