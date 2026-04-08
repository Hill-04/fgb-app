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
    <div className="space-y-10 animate-in fade-in duration-500 max-w-6xl mx-auto pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-[var(--verde)]/10 border border-[var(--verde)]/20 flex items-center justify-center">
              <FlaskConical className="w-5 h-5 text-[var(--verde)]" />
            </div>
            <span className="fgb-label text-[var(--gray)]" style={{ fontSize: 10, letterSpacing: 2 }}>FGB LABS</span>
          </div>
          <h1 className="fgb-display text-4xl sm:text-5xl text-[var(--black)] italic leading-none">
            Laboratório de Simulação
          </h1>
          <p className="fgb-label text-[var(--gray)] mt-2 max-w-xl" style={{ textTransform: 'none', letterSpacing: 0 }}>
            Configure e execute cenários completos de campeonatos. As simulações agora são <strong className="text-[var(--verde)] font-bold">persistentes</strong> e marcadas para visualização administrativa.
          </p>
        </div>

        <div className="flex flex-wrap gap-3 w-full sm:w-auto">
          {!running && !showConfig && (
            <Button
              onClick={() => setShowConfig(true)}
              variant="outline"
              className="flex-1 sm:flex-none fgb-btn-outline h-12 px-6"
            >
              Nova Configuração
            </Button>
          )}
          
          <Button
            onClick={cleanSimulation}
            disabled={cleaning || running}
            variant="ghost"
            className="flex-1 sm:flex-none text-[var(--red)] hover:text-[var(--red)] hover:bg-[var(--red)]/10 border border-[var(--red)]/20 rounded-xl h-12 px-6 font-bold font-sans"
          >
            {cleaning ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
            Limpar Dados
          </Button>

          {showConfig && (
            <Button
              onClick={runSimulation}
              disabled={running || cleaning || selectedTeamIds.length < 2 || selectedCategories.length === 0}
              className="flex-[2] sm:flex-none fgb-btn-primary h-12 px-8 shadow-lg hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100"
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
            <section className="fgb-card p-8 space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-500">
                  <Shield className="w-4 h-4" />
                </div>
                <h2 className="fgb-display text-lg text-[var(--black)] leading-none">Informações Básicas</h2>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="fgb-label text-[var(--gray)]" style={{ fontSize: 10 }}>Nome do Campeonato</label>
                  <Input 
                    value={name} 
                    onChange={e => setName(e.target.value)}
                    placeholder="Ex: Torneio de Verão 2026"
                    className="bg-white border-[var(--border)] h-14 rounded-2xl focus-visible:ring-1 focus-visible:ring-[var(--verde)] text-[var(--black)] text-base font-bold shadow-sm font-sans"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="fgb-label text-[var(--gray)]" style={{ fontSize: 10 }}>Sexo</label>
                    <div className="flex gap-2">
                      {['masculino', 'feminino'].map(s => (
                        <button
                          key={s}
                          onClick={() => setSex(s)}
                          className={cn(
                            "flex-1 h-12 rounded-xl border fgb-label uppercase transition-all shadow-sm",
                            sex === s ? "bg-[var(--verde)]/10 border-[var(--verde)]/40 text-[var(--verde)]" : "bg-white border-[var(--border)] text-[var(--gray)] hover:bg-[var(--gray-l)] hover:text-[var(--black)]"
                          )}
                          style={{ fontSize: 10 }}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="fgb-label text-[var(--gray)]" style={{ fontSize: 10 }}>Categorias</label>
                    <p className="text-[11px] text-[var(--gray)] font-medium h-12 flex items-center italic font-sans">{selectedCategories.length} selecionadas</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 pt-2">
                  {ALL_CATEGORIES.map(cat => (
                    <button
                      key={cat}
                      onClick={() => toggleCategory(cat)}
                      className={cn(
                        "px-4 py-2 rounded-xl border text-[10px] font-bold transition-all shadow-sm font-sans",
                        selectedCategories.includes(cat) ? "bg-[var(--verde)]/10 border-[var(--verde)]/40 text-[var(--verde)]" : "bg-white border-[var(--border)] text-[var(--gray)] hover:bg-[var(--gray-l)] hover:text-[var(--black)]"
                      )}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
            </section>

            <section className="fgb-card p-8 space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-500">
                    <Filter className="w-4 h-4" />
                  </div>
                  <h2 className="fgb-display text-lg text-[var(--black)] leading-none">Seleção de Equipes</h2>
                </div>
                <span className="fgb-label text-[var(--gray)] uppercase" style={{ fontSize: 10 }}>{selectedTeamIds.length} equipes</span>
              </div>

              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--gray)]" />
                <Input 
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  placeholder="Buscar equipe ou cidade..."
                  className="bg-white border-[var(--border)] shadow-sm h-12 pl-12 rounded-xl focus-visible:ring-1 focus-visible:ring-[var(--verde)] text-[var(--black)] font-sans"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {fetchingTeams ? (
                  Array(6).fill(0).map((_, i) => <div key={i} className="h-16 bg-[var(--gray-l)] rounded-2xl animate-pulse" />)
                ) : (
                  filteredTeams.map(team => (
                    <button
                      key={team.id}
                      onClick={() => toggleTeam(team.id)}
                      className={cn(
                        "flex items-center gap-4 p-4 rounded-2xl border text-left transition-all shadow-sm",
                        selectedTeamIds.includes(team.id) ? "bg-[var(--verde)]/10 border-[var(--verde)]/40" : "bg-white border-[var(--border)] hover:bg-[var(--gray-l)] hover:border-gray-300"
                      )}
                    >
                      <div className="w-10 h-10 rounded-xl bg-[var(--gray-l)] flex items-center justify-center shrink-0 border border-[var(--border)]">
                        {team.logoUrl ? <img src={team.logoUrl} className="w-6 h-6 object-contain" /> : <Shield className="w-5 h-5 text-slate-300" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={cn("text-xs font-bold truncate font-sans tracking-tight", selectedTeamIds.includes(team.id) ? "text-[var(--black)]" : "text-[var(--gray)]")}>{team.name}</p>
                        <p className="text-[10px] text-[var(--gray)] font-medium truncate font-sans">{team.city}</p>
                      </div>
                      <Checkbox checked={selectedTeamIds.includes(team.id)} className="rounded-[4px] border-gray-300 data-[state=checked]:bg-[var(--verde)] data-[state=checked]:border-[var(--verde)] shadow-none" />
                    </button>
                  ))
                )}
              </div>
            </section>
          </div>

          {/* Preview / Sidebar */}
          <div className="space-y-6">
            <div className="fgb-card admin-card-verde p-8 text-white shadow-xl">
              <h3 className="fgb-label text-white/60 mb-6" style={{ fontSize: 10, letterSpacing: 2 }}>Resumo da Simulação</h3>
              
              <div className="space-y-6">
                <div>
                  <p className="fgb-label text-white/50 mb-1" style={{ fontSize: 9 }}>Cenário</p>
                  <p className="fgb-display text-xl leading-tight italic">{name}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="fgb-label text-white/50 mb-1" style={{ fontSize: 9 }}>Equipes</p>
                    <p className="fgb-display text-2xl">{selectedTeamIds.length}</p>
                  </div>
                  <div>
                    <p className="fgb-label text-white/50 mb-1" style={{ fontSize: 9 }}>Categorias</p>
                    <p className="fgb-display text-2xl">{selectedCategories.length}</p>
                  </div>
                </div>

                <div className="pt-6 border-t border-white/20">
                  <p className="text-[10px] font-medium leading-relaxed text-white/80 italic font-sans">
                    Esta simulação irá gerar aproximadamente {Math.floor(selectedTeamIds.length * (selectedTeamIds.length - 1) / 2 * (selectedCategories.length || 0))} jogos distribuídos entre as categorias selecionadas.
                  </p>
                </div>

                <Button 
                  onClick={runSimulation}
                  disabled={selectedTeamIds.length < 2 || selectedCategories.length === 0}
                  className="w-full h-14 bg-white text-[var(--verde)] hover:bg-gray-100 font-bold font-sans uppercase tracking-widest rounded-2xl shadow-xl transition-all hover:scale-105 active:scale-95 disabled:opacity-50 text-xs"
                >
                  Confirmar e Iniciar
                </Button>
              </div>
            </div>

            <div className="fgb-card p-6 space-y-4 shadow-sm bg-[var(--gray-l)]">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-[var(--gray)]" />
                <h4 className="fgb-label text-[var(--gray)]" style={{ fontSize: 10 }}>Cronograma Simulado</h4>
              </div>
              <div className="space-y-3 font-sans">
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-[var(--gray)] font-bold uppercase tracking-tight">Período</span>
                  <span className="text-[var(--black)] font-black">Maio – Outubro 2026</span>
                </div>
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-[var(--gray)] font-bold uppercase tracking-tight">Fase</span>
                  <span className="text-[var(--black)] font-black">Única (Regular)</span>
                </div>
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-[var(--gray)] font-bold uppercase tracking-tight">Localização</span>
                  <span className="text-[var(--black)] font-black">Sedes Randômicas</span>
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
