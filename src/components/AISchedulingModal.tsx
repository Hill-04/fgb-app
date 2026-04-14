'use client'

import { useEffect, useMemo, useState } from 'react'
import { pluralizeDias, pluralizeJogos } from '@/utils/pluralize'
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Loader2,
  Sparkles,
  Users,
  Zap,
  ShieldCheck,
  Calendar,
  TriangleAlert,
  X,
} from 'lucide-react'
import { ChampionshipAIPipeline } from '@/app/admin/championships/[id]/ChampionshipAIPipeline'

type AISchedulingModalProps = {
  championshipId: string
  championshipName: string
  onClose: () => void
  onApplied: () => void
  variant?: 'modal' | 'page'
}

type CategoryResult = {
  id: string
  name: string
  teams: number
  gamesCount: number
}

type ValidationIssue = {
  type: 'error' | 'warning' | 'info'
  field: string
  message: string
  suggestion?: string
}

type ValidationWarning = {
  type: 'warning' | 'info'
  field: string
  message: string
  suggestion?: string
  athletes?: { name: string; categories: string[] }[]
}

type ValidationResult = {
  viable: boolean
  issues: ValidationIssue[]
  warnings: ValidationWarning[]
  fieldControlType: 'centralizado' | 'alternado'
  fieldControlImpact: string
  summary: {
    totalTeams: number
    totalCategories: number
    readyCategories: number
    totalGames: number
    estimatedDays: number
    totalBlockedDates: number
    multiCatAthletes: number
    turns: number
    phases: number
    format: string
    hasPlayoffs: boolean
    capacity: {
      blockFormat: string
      dayStartTime: string
      regularDayEndTime: string
      extendedDayEndTime: string
      slotDurationMinutes: number
      minRestSlotsPerTeam: number
      maxGamesPerTeamPerDay: number
      scheduleOptimizationMode: string
      numberOfCourts: number
      slotsRegularDay: number
      slotsExtendedDay: number
      maxGamesRegularDay: number
      maxGamesExtendedDay: number
      competitionDaysPerPhase: number
      maxGamesPerPhase: number
      requiredGamesPerPhase: number
      totalWeekendWindows: number
      totalPotentialGames: number | null
    }
  }
  aiMessage: string
}

type Step =
  | 'idle'
  | 'validating'
  | 'diagnosis'
  | 'simulating'
  | 'review'
  | 'applying'
  | 'done'
  | 'error'

type PreviewSlot = {
  time: string
  categoryId: string
  categoryName?: string
  homeTeamId: string
  homeTeamName: string
  awayTeamId: string
  awayTeamName: string
  round: number
  phase?: number
  isReturn?: boolean
  court?: string
  period?: string
  wasRescheduled?: boolean
  rescheduleReason?: string
}

type PreviewDay = {
  date: string
  dayOfWeek: string
  gamesCount: number
  timeSlots: PreviewSlot[]
}

type SimulationGame = {
  categoryId: string
  homeTeamId: string
  awayTeamId: string
  round: number
  phase: number
  dateTime: string
  wasRescheduled?: boolean
  rescheduleReason?: string
}

type SimulationResult = {
  success: boolean
  totalGames: number
  summary: string
  totalBlockedDates?: number
  totalDays: number
  maxGamesPerDay: number
  schedulePreview?: PreviewDay[]
  categories: CategoryResult[]
  games: SimulationGame[]
  conflictsResolved?: {
    categoryName: string
    phase: number
    originalDate: string
    newDate: string
    reason: string
  }[]
  unresolvableConflicts?: {
    groupCategories: string[]
    phase: number
    message: string
    suggestion: string
  }[]
  phases?: number
  aiOptimization?: {
    available: boolean
    provider: string
    suggestion: string | null
    error?: string
  }
}

type ReviewTab = 'date' | 'category' | 'round'

const stepTrail: Step[] = ['diagnosis', 'review', 'done']

const issueStyles = {
  error: {
    bg: 'bg-[var(--red-light)]',
    border: 'border-red-200',
    text: 'text-[var(--red)]',
    label: 'Erro',
  },
  warning: {
    bg: 'bg-[var(--yellow-light)]',
    border: 'border-yellow-200',
    text: 'text-[var(--yellow-dark)]',
    label: 'Atencao',
  },
  info: {
    bg: 'bg-[var(--verde-light)]',
    border: 'border-green-200',
    text: 'text-[var(--verde)]',
    label: 'Info',
  },
} as const

const surfaceCard = 'rounded-[28px] border border-[var(--border)] bg-white/95 shadow-[var(--shadow-md)]'
const nestedCard = 'rounded-2xl border border-[var(--border)] bg-[var(--gray-l)]/75 shadow-sm'
const statCard = 'rounded-2xl border border-[var(--border)] bg-white/90 p-3 text-center shadow-sm'
const secondaryButton =
  'flex-1 h-11 rounded-xl border border-[var(--border)] bg-white text-[10px] font-black uppercase tracking-widest text-[var(--gray)] transition-all hover:border-[var(--verde)] hover:text-[var(--black)]'
const primaryButton =
  'flex-1 h-11 rounded-xl bg-[var(--yellow)] text-[var(--black)] text-[10px] font-black uppercase tracking-widest transition-all hover:bg-[var(--yellow-dark)] inline-flex items-center justify-center gap-2 shadow-sm'

const simSteps = [
  { label: 'Validando inscricoes', icon: ShieldCheck },
  { label: 'Calculando categorias', icon: Users },
  { label: 'Montando confrontos', icon: Calendar },
  { label: 'Otimizando logistica', icon: Zap },
]

function formatLongDate(value: string) {
  return new Date(`${value}T12:00:00`).toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
  })
}

function formatShortDate(value: string) {
  return new Date(value).toLocaleDateString('pt-BR', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    timeZone: 'America/Sao_Paulo',
  })
}

export function AISchedulingModal({
  championshipId,
  championshipName,
  onClose,
  onApplied,
  variant = 'modal',
}: AISchedulingModalProps) {
  const [step, setStep] = useState<Step>('idle')
  const [validation, setValidation] = useState<ValidationResult | null>(null)
  const [simulation, setSimulation] = useState<SimulationResult | null>(null)
  const [errorMsg, setErrorMsg] = useState('')
  const [previewTab, setPreviewTab] = useState<ReviewTab>('date')
  const [chatInput, setChatInput] = useState('')
  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'ai'; content: string }[]>([])
  const [chatLoading, setChatLoading] = useState(false)
  const [simStepIndex, setSimStepIndex] = useState(0)

  const pipelineStep = useMemo(() => {
    switch (step) {
      case 'idle':
      case 'validating':
        return 1
      case 'diagnosis':
        return 2
      case 'simulating':
        return 4
      case 'review':
        return 5
      case 'applying':
      case 'done':
        return 6
      default:
        return 1
    }
  }, [step])

  useEffect(() => {
    if (step !== 'simulating') {
      setSimStepIndex(0)
      return
    }

    const timer = setInterval(() => {
      setSimStepIndex((current) => (current + 1) % simSteps.length)
    }, 1100)

    return () => clearInterval(timer)
  }, [step])

  const flatPreviewSlots = useMemo(() => {
    if (!simulation?.schedulePreview) return []

    return simulation.schedulePreview.flatMap((day) =>
      day.timeSlots.map((slot) => ({
        ...slot,
        date: day.date,
      }))
    )
  }, [simulation])

  const categoryGroups = useMemo(() => {
    if (!simulation) return []

    return simulation.categories.map((category) => ({
      ...category,
      slots: flatPreviewSlots
        .filter((slot) => slot.categoryId === category.id)
        .sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`)),
    }))
  }, [flatPreviewSlots, simulation])

  const roundGroups = useMemo(() => {
    const groups = new Map<number, Array<PreviewSlot & { date: string }>>()

    flatPreviewSlots.forEach((slot) => {
      const key = slot.round ?? 1
      if (!groups.has(key)) groups.set(key, [])
      groups.get(key)!.push(slot)
    })

    return Array.from(groups.entries())
      .sort(([a], [b]) => a - b)
      .map(([round, slots]) => ({
        round,
        slots: slots.sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`)),
      }))
  }, [flatPreviewSlots])

  const runSimulation = async () => {
    setStep('simulating')
    setErrorMsg('')

    try {
      const res = await fetch('/api/scheduling/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ championshipId }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Erro ao simular agendamento')
      }

      const data = await res.json()
      setSimulation(data)
      setStep('review')
    } catch (err: any) {
      setErrorMsg(err.message)
      setStep('error')
    }
  }

  const handleStart = async () => {
    setStep('validating')
    setErrorMsg('')

    try {
      const res = await fetch('/api/scheduling/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ championshipId }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro ao validar configuracoes')

      setValidation(data)
      if (data.viable) {
        await runSimulation()
      } else {
        setStep('diagnosis')
      }
    } catch (err: any) {
      setErrorMsg(err.message)
      setStep('error')
    }
  }

  const handleSimulate = async () => {
    await runSimulation()
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
          games: simulation.games ?? [],
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Erro ao aplicar o calendario')
      }

      setStep('done')
    } catch (err: any) {
      setErrorMsg(err.message)
      setStep('error')
    }
  }

  const handleChat = async () => {
    if (!chatInput.trim() || chatLoading) return

    const userMsg = chatInput.trim()
    setChatInput('')
    setChatMessages((prev) => [...prev, { role: 'user', content: userMsg }])
    setChatLoading(true)

    try {
      const context = `Calendario atual: ${simulation?.totalGames} jogos em ${simulation?.totalDays} dias.
Categorias: ${simulation?.categories?.map((c) => `${c.name} (${c.gamesCount} jogos)`).join(', ')}.
${simulation?.summary}

Pergunta do administrador: ${userMsg}

Responda de forma pratica e direta sobre como otimizar este calendario de basquete.
Se sugerir uma mudanca, explique exatamente o que deve ser ajustado nas configuracoes ou no calendario.`

      const res = await fetch('/api/scheduling/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMsg,
          context,
          championshipId,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        setChatMessages((prev) => [...prev, { role: 'ai', content: data.response }])
      } else {
        setChatMessages((prev) => [
          ...prev,
          { role: 'ai', content: 'Nao consegui processar sua solicitacao. Tente reformular.' },
        ])
      }
    } catch {
      setChatMessages((prev) => [
        ...prev,
        { role: 'ai', content: 'Erro ao conectar com a IA. Verifique sua conexao.' },
      ])
    } finally {
      setChatLoading(false)
    }
  }

  const renderStat = (label: string, value: string | number) => (
    <div className={statCard}>
      <p className="fgb-label text-[var(--gray)] mb-1" style={{ fontSize: 8 }}>
        {label}
      </p>
      <p className="text-xl font-black text-[var(--black)]">{value}</p>
    </div>
  )

  const renderRescheduledBadge = (reason?: string) => (
    <span
      title={reason || 'Jogo reagendado por restricao'}
      className="inline-flex items-center rounded-full border border-yellow-200 bg-[var(--yellow-light)] px-2 py-0.5 text-[8px] font-black uppercase tracking-[0.14em] text-[var(--yellow-dark)]"
    >
      Reagendado
    </span>
  )

  const isModal = variant === 'modal'
  const successPrimaryLabel = isModal ? 'Ver jogos' : 'Ir para jogos'
  const successSecondaryLabel = isModal ? 'Fechar' : 'Nova analise'

  return (
    <div
      className={
        isModal
          ? 'fixed inset-0 z-[100] flex items-center justify-center bg-[rgba(8,14,10,0.48)] p-4 backdrop-blur-sm animate-in fade-in duration-300'
          : 'w-full'
      }
    >
      <div
        className={
          isModal
            ? 'flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-[40px] border border-white/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(248,249,250,0.97)_100%)] shadow-[var(--shadow-premium)]'
            : 'flex w-full flex-col overflow-hidden rounded-[32px] border border-[var(--border)] bg-white shadow-[var(--shadow-md)]'
        }
      >
        <div className={`flex items-center justify-between border-b border-[var(--border)] bg-[var(--gray-l)]/70 ${isModal ? 'p-8' : 'p-6'}`}>
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-yellow-200 bg-[var(--yellow-light)] shadow-sm">
              <Sparkles className="h-6 w-6 text-[var(--yellow-dark)]" />
            </div>
            <div>
              <h3 className="fgb-display text-2xl text-[var(--black)] leading-none">Organizar com IA</h3>
              <p className="fgb-label mt-2 text-[var(--gray)]" style={{ fontSize: 10 }}>
                {championshipName}
              </p>
            </div>
          </div>

          <div className="mr-4 flex items-center gap-2">
            {stepTrail.map((trailStep, index) => (
              <div
                key={trailStep}
                className={`h-1.5 rounded-full transition-all ${
                  step === trailStep
                    ? 'w-4 bg-[var(--yellow)]'
                    : stepTrail.indexOf(step) > index
                      ? 'w-2 bg-[var(--yellow)]/45'
                      : 'w-2 bg-[var(--border)]'
                }`}
              />
            ))}
          </div>

          {isModal && (
            <button
              onClick={onClose}
              className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[var(--border)] bg-white text-[var(--gray)] transition-all hover:border-red-200 hover:bg-[var(--red-light)] hover:text-[var(--red)]"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        <div className={`flex-1 overflow-y-auto ${isModal ? 'p-8' : 'p-6 md:p-8'}`}>
          <div className={`${surfaceCard} mb-6 p-4`}>
            <p className="fgb-label text-[var(--gray)] mb-3" style={{ fontSize: 9 }}>
              Pipeline da IA
            </p>
            <ChampionshipAIPipeline currentStep={pipelineStep} />
          </div>
          {step === 'idle' && (
            <div className="space-y-6 text-center animate-in zoom-in-95 duration-500">
              <div className={`mx-auto max-w-xl p-8 ${surfaceCard}`}>
                <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-[28px] border border-yellow-200 bg-[radial-gradient(circle_at_top,rgba(245,194,0,0.32),rgba(255,255,255,0.95))] shadow-sm">
                  <Sparkles className="h-10 w-10 text-[var(--yellow-dark)]" />
                </div>
                <p className="fgb-display text-3xl text-[var(--black)]">Pronto para organizar</p>
                <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-[var(--gray)]">
                  A IA vai analisar as configuracoes, validar a viabilidade e montar um calendario de fim de semana com as restricoes do campeonato.
                </p>

                <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
                  {[
                    { title: 'Diagnostico', text: 'Le a configuracao e mede riscos antes de gerar.' },
                    { title: 'Conflitos', text: 'Detecta bloqueios, atletas multi-cat e janelas criticas.' },
                    { title: 'Calendario', text: 'Distribui jogos por fase com revisao antes de aplicar.' },
                  ].map((item) => (
                    <div key={item.title} className={nestedCard}>
                      <p className="fgb-label text-[var(--verde)]" style={{ fontSize: 9 }}>
                        {item.title}
                      </p>
                      <p className="mt-2 text-xs leading-relaxed text-[var(--gray)]">{item.text}</p>
                    </div>
                  ))}
                </div>
              </div>

              <button onClick={handleStart} className={`${primaryButton} mx-auto max-w-xs`}>
                Organizar agora
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          {step === 'validating' && (
            <div className="py-16 text-center">
              <Loader2 className="mx-auto h-10 w-10 animate-spin text-[var(--yellow-dark)]" />
              <p className="fgb-display mt-4 text-xl text-[var(--black)]">Analisando configuracoes</p>
              <p className="fgb-label mt-2 text-[var(--gray)]" style={{ fontSize: 9 }}>
                Verificando viabilidade do campeonato
              </p>
            </div>
          )}

          {step === 'diagnosis' && validation && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div
                className={`${surfaceCard} p-5 ${
                  validation.viable
                    ? 'border-green-200 bg-[var(--verde-light)]/60'
                    : 'border-red-200 bg-[var(--red-light)]/70'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-2xl ${
                      validation.viable ? 'bg-white text-[var(--verde)]' : 'bg-white text-[var(--red)]'
                    }`}
                  >
                    {validation.viable ? <CheckCircle2 className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
                  </div>
                  <div>
                    <p className={`fgb-label mb-1 ${validation.viable ? 'text-[var(--verde)]' : 'text-[var(--red)]'}`}>
                      {validation.viable ? 'Campeonato viavel' : 'Problemas encontrados'}
                    </p>
                    <p className="text-sm leading-relaxed text-[var(--black)]">{validation.aiMessage}</p>
                  </div>
                </div>
              </div>

              <div
                className={`${surfaceCard} p-4 ${
                  validation.fieldControlType === 'centralizado'
                    ? 'bg-[var(--yellow-light)]/80'
                    : 'bg-[var(--verde-light)]/80'
                }`}
              >
                <div className="flex flex-wrap items-center gap-3">
                  <span className="fgb-admin-pill">
                    {validation.fieldControlType === 'centralizado'
                      ? 'Campeonato centralizado'
                      : 'Campeonato alternado'}
                  </span>
                  <p className="text-sm leading-relaxed text-[var(--gray-d)]">{validation.fieldControlImpact}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
                {renderStat('Jogos', validation.summary.totalGames)}
                {renderStat('Dias estimados', validation.summary.estimatedDays || '—')}
                {renderStat('Categorias', validation.summary.totalCategories)}
                {renderStat('Categorias prontas', validation.summary.readyCategories)}
              </div>

              <div className={`${surfaceCard} p-5`}>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="fgb-display text-xl text-[var(--black)]">Capacidade da janela</p>
                    <p className="mt-1 text-sm text-[var(--gray)]">
                      A IA calculou a capacidade real por dia e por fase com base nas configuracoes do campeonato.
                    </p>
                  </div>
                  <Calendar className="h-5 w-5 text-[var(--verde)]" />
                </div>

                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                  {renderStat('Sabado', validation.summary.capacity.maxGamesExtendedDay)}
                  {renderStat('Dia regular', validation.summary.capacity.maxGamesRegularDay)}
                  {renderStat('Por fase', validation.summary.capacity.maxGamesPerPhase)}
                </div>

                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {renderStat('Quadras', validation.summary.capacity.numberOfCourts)}
                  {renderStat('Slots regulares', validation.summary.capacity.slotsRegularDay)}
                  {renderStat('Slots sabado', validation.summary.capacity.slotsExtendedDay)}
                  {renderStat('Descanso minimo', `${validation.summary.capacity.minRestSlotsPerTeam} slot`)}
                </div>

                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {renderStat('Max. por equipe/categoria', validation.summary.capacity.maxGamesPerTeamPerDay)}
                  {renderStat(
                    'Modo IA',
                    validation.summary.capacity.scheduleOptimizationMode === 'balanced'
                      ? 'Equilibrado'
                      : validation.summary.capacity.scheduleOptimizationMode === 'compact'
                        ? 'Compacto'
                        : 'Menos viagens'
                  )}
                </div>

                <div className="mt-4 rounded-2xl border border-[var(--border)] bg-[var(--gray-l)]/80 p-4">
                  <p className="fgb-label text-[var(--gray)]" style={{ fontSize: 9 }}>
                    Janela configurada
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--black)]">
                    {validation.summary.capacity.dayStartTime} às {validation.summary.capacity.regularDayEndTime} em dias regulares,
                    sábado até {validation.summary.capacity.extendedDayEndTime}, slots de {validation.summary.capacity.slotDurationMinutes} min,
                    bloco {validation.summary.capacity.blockFormat} e até {validation.summary.capacity.totalWeekendWindows} fim(ns) de semana úteis no período.
                  </p>
                  <p className="mt-2 text-xs leading-relaxed text-[var(--gray)]">
                    Demanda atual: {validation.summary.capacity.requiredGamesPerPhase} jogo(s) por fase.
                    Capacidade da fase: {validation.summary.capacity.maxGamesPerPhase} jogo(s).
                    {validation.summary.capacity.totalPotentialGames !== null &&
                      ` Capacidade teórica total do período: ${validation.summary.capacity.totalPotentialGames} jogo(s).`}
                  </p>
                </div>
              </div>

              <div className={`${surfaceCard} p-5`}>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="fgb-display text-xl text-[var(--black)]">Restricoes de datas</p>
                    <p className="mt-1 text-sm text-[var(--gray)]">
                      Total de bloqueios, atletas multi-categoria e impacto por fase.
                    </p>
                  </div>
                  <TriangleAlert className="h-5 w-5 text-[var(--yellow-dark)]" />
                </div>

                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                  {renderStat('Bloqueios', validation.summary.totalBlockedDates)}
                  {renderStat('Atletas multi-cat', validation.summary.multiCatAthletes)}
                  {renderStat('Fases', validation.summary.phases)}
                </div>

                {validation.warnings.length > 0 && (
                  <div className="mt-4 space-y-3">
                    {validation.warnings.map((warning, index) => (
                      <div key={`${warning.field}-${index}`} className={`${nestedCard} p-4`}>
                        <p className="fgb-label text-[var(--yellow-dark)]" style={{ fontSize: 9 }}>
                          {warning.type === 'info' ? 'Informacao' : 'Ponto de atencao'}
                        </p>
                        <p className="mt-2 text-sm leading-relaxed text-[var(--black)]">{warning.message}</p>
                        {warning.suggestion && (
                          <p className="mt-2 text-xs italic text-[var(--gray)]">{warning.suggestion}</p>
                        )}
                        {warning.athletes && warning.athletes.length > 0 && (
                          <p className="mt-2 text-xs leading-relaxed text-[var(--gray-d)]">
                            {warning.athletes
                              .map((athlete) => `${athlete.name} (${athlete.categories.join(', ')})`)
                              .join(' · ')}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {validation.issues.length > 0 && (
                <div className="space-y-2">
                  {validation.issues.map((issue, index) => {
                    const style = issueStyles[issue.type]

                    return (
                      <div key={`${issue.field}-${index}`} className={`rounded-2xl border p-4 ${style.bg} ${style.border}`}>
                        <p className={`fgb-label ${style.text}`} style={{ fontSize: 9 }}>
                          {style.label}
                        </p>
                        <p className="mt-2 text-sm leading-relaxed text-[var(--black)]">{issue.message}</p>
                        {issue.suggestion && (
                          <p className="mt-2 text-xs italic text-[var(--gray)]">Sugestao: {issue.suggestion}</p>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}

              <div className="flex gap-3 pt-1">
                <button onClick={() => setStep('idle')} className={secondaryButton}>
                  Ajustar configuracoes
                </button>
                <button onClick={() => handleSimulate()} className={primaryButton}>
                  <Sparkles className="h-3.5 w-3.5" />
                  Simular mesmo assim
                </button>
              </div>
            </div>
          )}

          {step === 'simulating' && (
            <div className="space-y-8 py-10">
              <div className="text-center">
                <div className="relative mx-auto h-16 w-16">
                  <Loader2 className="h-16 w-16 animate-spin text-[var(--yellow-dark)]" />
                  <Sparkles className="absolute left-1/2 top-1/2 h-6 w-6 -translate-x-1/2 -translate-y-1/2 text-[var(--yellow-dark)]" />
                </div>
                <p className="fgb-display mt-5 text-2xl text-[var(--black)]">Gerando calendario</p>
                <p className="fgb-label mt-2 text-[var(--gray)]" style={{ fontSize: 9 }}>
                  A IA esta organizando horarios, quadras e fases
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {simSteps.map((simStep, index) => {
                  const isActive = simStepIndex === index
                  const isDone = simStepIndex > index
                  const Icon = simStep.icon
                  return (
                    <div
                      key={simStep.label}
                      className={`flex items-center gap-3 rounded-2xl border px-4 py-3 transition-all ${
                        isActive
                          ? 'border-[var(--amarelo)] bg-[var(--yellow-light)]/70 shadow-sm'
                          : isDone
                            ? 'border-green-200 bg-[var(--verde-light)]/60'
                            : 'border-[var(--border)] bg-white'
                      }`}
                    >
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                          isActive
                            ? 'bg-[var(--amarelo)] text-[var(--black)]'
                            : isDone
                              ? 'bg-green-100 text-green-700'
                              : 'bg-[var(--gray-l)] text-[var(--gray)]'
                        }`}
                      >
                        {isDone ? <CheckCircle2 className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-[var(--gray)]">
                          Etapa {index + 1}
                        </p>
                        <p className={`text-sm font-semibold ${isActive ? 'text-[var(--black)]' : 'text-[var(--gray)]'}`}>
                          {simStep.label}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {step === 'review' && simulation && (
            <div className="space-y-4 animate-in fade-in duration-300">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="fgb-display text-2xl text-[var(--black)]">Calendario completo</p>
                  <p className="mt-2 text-sm text-[var(--gray)]">
                    {pluralizeJogos(simulation.totalGames)} · {pluralizeDias(simulation.totalDays)}
                    {(simulation.totalBlockedDates || 0) > 0 && ` · ${simulation.totalBlockedDates} restricoes`}
                  </p>
                </div>
                <button onClick={() => setStep('diagnosis')} className="fgb-btn-soft h-10 px-4 text-[9px]">
                  Ver diagnostico
                </button>
              </div>

              {simulation.unresolvableConflicts && simulation.unresolvableConflicts.length > 0 && (
                <div className={`${surfaceCard} border-red-200 bg-[var(--red-light)]/70 p-5`}>
                  <p className="fgb-display text-xl text-[var(--red)]">Conflitos nao resolviveis</p>
                  <div className="mt-4 space-y-3">
                    {simulation.unresolvableConflicts.map((conflict, index) => (
                      <div key={`${conflict.phase}-${index}`} className="rounded-2xl border border-red-200 bg-white/80 p-4">
                        <p className="fgb-label text-[var(--red)]">
                          {conflict.groupCategories.join(' + ')} · Fase {conflict.phase}
                        </p>
                        <p className="mt-2 text-sm leading-relaxed text-[var(--black)]">{conflict.message}</p>
                        <p className="mt-2 text-xs leading-relaxed text-[var(--gray)]">{conflict.suggestion}</p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button className="fgb-btn-soft h-10 px-4 text-[9px]">Estender periodo</button>
                    <button className="fgb-btn-soft h-10 px-4 text-[9px]">Verificar equipes</button>
                    <button className="fgb-btn-soft h-10 px-4 text-[9px]">Continuar mesmo assim</button>
                  </div>
                </div>
              )}

              <div className={`${surfaceCard} p-5`}>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="fgb-display text-xl text-[var(--black)]">Cenarios de geracao</p>
                    <p className="mt-2 text-sm text-[var(--gray)]">
                      Refaça o preview com a estrategia que melhor atende a operacao da federacao.
                    </p>
                  </div>
                  <span className="fgb-admin-pill">Modo unico da IA</span>
                </div>

                <div className="mt-4 rounded-2xl border border-[var(--border)] bg-[var(--gray-l)]/70 p-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-[var(--gray)]">
                    Estrategia ativa
                  </p>
                  <p className="mt-3 text-sm leading-relaxed text-[var(--black)]">
                    A IA agora trabalha em um modo unico, priorizando menos viagens e concentrando o maximo de jogos viaveis por etapa dentro da janela do campeonato.
                  </p>
                </div>
              </div>

              <div className={`${surfaceCard} p-2`}>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { key: 'date', label: 'Por data' },
                    { key: 'category', label: 'Por categoria' },
                    { key: 'round', label: 'Por rodada' },
                  ].map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => setPreviewTab(tab.key as ReviewTab)}
                      className={`h-11 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                        previewTab === tab.key
                          ? 'bg-[var(--yellow)] text-[var(--black)]'
                          : 'bg-white text-[var(--gray)] hover:text-[var(--black)]'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="max-h-72 space-y-3 overflow-y-auto pr-1">
                {previewTab === 'date' &&
                  simulation.schedulePreview?.map((day, index) => (
                    <div key={`${day.date}-${index}`} className={`${surfaceCard} overflow-hidden`}>
                      <div className="flex items-center justify-between border-b border-[var(--border)] bg-[var(--gray-l)]/80 px-4 py-3">
                        <div>
                          <p className="fgb-label text-[var(--gray)]" style={{ fontSize: 9 }}>
                            {day.dayOfWeek}
                          </p>
                          <p className="mt-1 text-sm font-black uppercase tracking-wide text-[var(--black)]">
                            {formatLongDate(day.date)}
                          </p>
                        </div>
                        <span className="fgb-admin-pill">{pluralizeJogos(day.gamesCount)}</span>
                      </div>

                      <div className="divide-y divide-[var(--border)]/70">
                        {day.timeSlots.map((slot, slotIndex) => (
                          <div key={`${slot.time}-${slotIndex}`} className="flex items-start gap-3 px-4 py-3">
                            <div className="min-w-14 rounded-xl bg-[var(--yellow-light)] px-2 py-1 text-center text-[10px] font-black text-[var(--yellow-dark)]">
                              {slot.time}
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-semibold text-[var(--black)]">
                                {slot.homeTeamName} × {slot.awayTeamName}
                              </p>
                              <div className="mt-2 flex flex-wrap items-center gap-2">
                                <span className="inline-flex rounded-full border border-[var(--border)] bg-[var(--gray-l)] px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.14em] text-[var(--gray-d)]">
                                  {slot.categoryName} · Rod. {slot.round}
                                </span>
                                {slot.period && (
                                  <span className="inline-flex rounded-full border border-green-200 bg-[var(--verde-light)] px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.14em] text-[var(--verde)]">
                                    {slot.period}
                                  </span>
                                )}
                                {slot.wasRescheduled && renderRescheduledBadge(slot.rescheduleReason)}
                                {slot.court && <span className="text-xs italic text-[var(--gray)]">{slot.court}</span>}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}

                {previewTab === 'category' &&
                  categoryGroups.map((category) => (
                    <div key={category.id} className={`${surfaceCard} overflow-hidden`}>
                      <div className="flex items-center justify-between border-b border-[var(--border)] bg-[var(--gray-l)]/80 px-4 py-3">
                        <p className="fgb-display text-xl text-[var(--black)]">{category.name}</p>
                        <span className="fgb-admin-pill">
                          {pluralizeJogos(category.gamesCount)} · {category.teams} equipes
                        </span>
                      </div>

                      <div className="divide-y divide-[var(--border)]/70">
                        {category.slots.length === 0 ? (
                          <div className="px-4 py-5 text-sm text-[var(--gray)]">
                            Nenhum jogo listado para esta categoria no preview.
                          </div>
                        ) : (
                          category.slots.map((slot, index) => (
                            <div key={`${slot.date}-${slot.time}-${index}`} className="flex items-start gap-3 px-4 py-3">
                              <div className="min-w-14 rounded-xl bg-[var(--yellow-light)] px-2 py-1 text-center text-[10px] font-black text-[var(--yellow-dark)]">
                                {slot.time}
                              </div>
                              <div className="flex-1">
                                <p className="text-sm font-semibold text-[var(--black)]">
                                  {slot.homeTeamName} × {slot.awayTeamName}
                                </p>
                                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-[var(--gray)]">
                                  <span>{formatLongDate(slot.date)}</span>
                                  <span>Rod. {slot.round}</span>
                                  {slot.wasRescheduled && renderRescheduledBadge(slot.rescheduleReason)}
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  ))}

                {previewTab === 'round' &&
                  roundGroups.map((group) => (
                    <div key={group.round} className={`${surfaceCard} overflow-hidden`}>
                      <div className="flex items-center justify-between border-b border-[var(--border)] bg-[var(--gray-l)]/80 px-4 py-3">
                        <p className="fgb-display text-xl text-[var(--black)]">Rodada {group.round}</p>
                        <span className="fgb-admin-pill">{pluralizeJogos(group.slots.length)}</span>
                      </div>

                      {group.slots[0] && (
                        <div className="border-b border-[var(--border)] bg-[var(--yellow-light)]/70 px-4 py-2">
                          <p className="fgb-label text-[var(--yellow-dark)]" style={{ fontSize: 9 }}>
                            {formatLongDate(group.slots[0].date)}
                          </p>
                        </div>
                      )}

                      <div className="divide-y divide-[var(--border)]/70">
                        {group.slots.map((slot, index) => (
                          <div key={`${slot.date}-${slot.time}-${index}`} className="flex items-start gap-3 px-4 py-3">
                            <div className="min-w-14 rounded-xl bg-[var(--yellow-light)] px-2 py-1 text-center text-[10px] font-black text-[var(--yellow-dark)]">
                              {slot.time}
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-semibold text-[var(--black)]">
                                {slot.homeTeamName} × {slot.awayTeamName}
                              </p>
                              <div className="mt-2 flex flex-wrap items-center gap-2">
                                <span className="inline-flex rounded-full border border-[var(--border)] bg-[var(--gray-l)] px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.14em] text-[var(--gray-d)]">
                                  {slot.categoryName}
                                </span>
                                <span className="text-xs text-[var(--gray)]">{formatShortDate(slot.date)}</span>
                                {slot.wasRescheduled && renderRescheduledBadge(slot.rescheduleReason)}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
              </div>

              <div className={`${surfaceCard} p-5`}>
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-[var(--yellow-dark)]" />
                  <p className="fgb-label text-[var(--yellow-dark)]">Otimizar com IA</p>
                </div>

                {chatMessages.length > 0 && (
                  <div className="mt-4 max-h-36 space-y-2 overflow-y-auto">
                    {chatMessages.map((message, index) => (
                      <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div
                          className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                            message.role === 'user'
                              ? 'bg-[var(--yellow-light)] text-[var(--black)]'
                              : 'bg-[var(--verde-light)] text-[var(--black)]'
                          }`}
                        >
                          {message.content}
                        </div>
                      </div>
                    ))}

                    {chatLoading && (
                      <div className="flex justify-start">
                        <div className="rounded-2xl bg-[var(--gray-l)] px-4 py-3 text-sm text-[var(--gray)]">
                          <Loader2 className="h-4 w-4 animate-spin" />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="mt-4 flex gap-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(event) => setChatInput(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' && !chatLoading) handleChat()
                    }}
                    placeholder="Ex: combine categorias proximas no mesmo fim de semana"
                    className="flex-1 rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm text-[var(--black)] outline-none transition-all placeholder:text-slate-400 focus:border-[var(--yellow)]"
                  />
                  <button
                    onClick={handleChat}
                    disabled={chatLoading || !chatInput.trim()}
                    className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--yellow)] text-[var(--black)] transition-all hover:bg-[var(--yellow-dark)] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>

                <p className="mt-3 text-xs text-[var(--gray)]">
                  Sugestoes: "combine categorias proximas" · "separe masculino e feminino"
                </p>
              </div>

              <div className="flex gap-3 pt-1">
                <button onClick={() => setStep('idle')} className={secondaryButton}>
                  Regerar
                </button>
                <button onClick={handleApply} className={primaryButton}>
                  Aprovar e aplicar
                </button>
              </div>
            </div>
          )}

          {step === 'applying' && (
            <div className="py-16 text-center">
              <Loader2 className="mx-auto h-14 w-14 animate-spin text-[var(--yellow-dark)]" />
              <p className="fgb-display mt-5 text-2xl text-[var(--black)]">Efetivando</p>
              <p className="fgb-label mt-2 text-[var(--gray)]" style={{ fontSize: 9 }}>
                Gravando jogos no banco de dados
              </p>
            </div>
          )}

          {step === 'done' && (
            <div className="space-y-6 py-10 text-center animate-in zoom-in-95 duration-500">
              <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-[32px] border border-green-200 bg-[var(--verde-light)] shadow-sm">
                <CheckCircle2 className="h-12 w-12 text-[var(--verde)]" />
              </div>
              <div>
                <p className="fgb-display text-3xl text-[var(--black)]">Calendario aplicado</p>
                <p className="mt-3 text-sm text-[var(--gray)]">
                  Os jogos foram criados com sucesso no banco de dados.
                </p>
              </div>

              <div className="flex gap-3">
                <button onClick={onClose} className={secondaryButton}>
                  {successSecondaryLabel}
                </button>
                <button
                  onClick={() => {
                    onApplied()
                    onClose()
                  }}
                  className={primaryButton}
                >
                  {successPrimaryLabel}
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}

          {step === 'error' && (
            <div className="space-y-6 py-10 animate-in fade-in duration-300">
              <div className={`${surfaceCard} border-red-200 bg-[var(--red-light)]/70 p-10 text-center`}>
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-[var(--red)] shadow-sm">
                  <AlertCircle className="h-8 w-8" />
                </div>
                <div className="mt-5">
                  <h4 className="fgb-display text-2xl text-[var(--red)]">Falha na operacao</h4>
                  <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-[var(--gray-d)]">{errorMsg}</p>
                </div>
              </div>

              <button onClick={() => setStep('idle')} className={`${secondaryButton} w-full`}>
                Tentar novamente
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
