'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { ChevronLeft, Check, Plus, X, ArrowUp, ArrowDown, MapPin, Users, ChevronDown, ChevronUp } from 'lucide-react'
import { WizardPreviewPanel } from '@/components/admin/WizardPreviewPanel'

// ─── Phase types ──────────────────────────────────────────────────────────────
type PhaseMode = 'TRADITIONAL' | 'ENCOUNTER'

type CustomPhase = {
  name: string
  mode: PhaseMode
  formatType: 'ROUND_ROBIN' | 'ELIMINATORIO' | 'GROUPS_ELIMINATORIO'
  // ENCOUNTER-only
  encounterVenue?: string // Free text: "Ginásio Tarso Dutra — Porto Alegre"
  encounterDate?: string  // ISO date
  encounterEndDate?: string // optional, multi-day
  // TRADITIONAL-only
  homePattern?: 'ALTERNATED' | 'FIXED_HOST' | 'NEUTRAL'
  // Common
  qualifiesNextCount?: string // string for input ease, parsed to number
  notes?: string
}

const newPhase = (order: number): CustomPhase => ({
  name: order === 1 ? 'Fase Classificatória' : `Fase ${order}`,
  mode: 'TRADITIONAL',
  formatType: 'ROUND_ROBIN',
  homePattern: 'ALTERNATED',
  qualifiesNextCount: '',
  notes: '',
})

// ─── Constants ────────────────────────────────────────────────────────────────
const CATEGORY_AGES = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20]
const SEXES = ['masculino', 'feminino', 'misto']

const ALL_CATEGORIES = CATEGORY_AGES.flatMap(age => [
  { code: `SUB${age}M`, label: `Sub ${age}`, sex: 'masculino' },
  { code: `SUB${age}F`, label: `Sub ${age}`, sex: 'feminino' },
])

const defaultForm = () => ({
  name: '', year: new Date().getFullYear().toString(), sex: 'masculino',
  minTeamsPerCat: '3', categories: [] as string[],
  format: 'todos_contra_todos', turns: '1', phases: '1', fieldControl: 'alternado',
  // Múltiplas fases (Sprint 1.B)
  hasMultiplePhases: false,
  customPhases: [] as CustomPhase[],
  maxGamesPerTeamPerDay: '2', scheduleOptimizationMode: 'less_travel',
  tiebreakerChain: ['h2h_record', 'h2h_diff', 'h2h_for', 'all_diff', 'all_for', 'draw'] as string[],
  hasRelegation: false, relegationDown: '0', promotionUp: '0',
  hasPlayoffs: false, playoffTeams: '4', playoffFormat: 'melhor_de_1', hasThirdPlace: true,
  hasBlocks: false,
  // Datas
  registrationOpenedAt: '', // inicio das inscricoes
  regDeadline: '',          // fim das inscricoes
  startDate: '',            // inicio do campeonato
  endDate: '',              // fim do campeonato
  // Sancionamento
  sanctioning: 'FGB_OFFICIAL',
  countsForRanking: true,
  countsForBidEligibility: true,
  sanctionNumber: '',
  modality: '5x5',
  // Calendário flexível
  allowedWeekdays: [6, 0] as number[],
  timeSlots: [{ start: '08:00', end: '18:00', label: 'Padrão' }] as { start: string; end: string; label?: string }[],
  blackoutDates: [] as { date: string; endDate?: string; reason?: string }[],
  minRestHoursBetweenGames: '20',
  maxGamesPerTeamPerWeek: '3',
  homePattern: 'ALTERNATED',
})

type FormState = ReturnType<typeof defaultForm>

const STEPS = [
  { title: 'Identificação', desc: 'Nome, ano e sexo' },
  { title: 'Tipo', desc: 'Sancionamento e ranking' },
  { title: 'Categorias', desc: 'Sub 8 → Sub 20' },
  { title: 'Formato', desc: 'Estrutura, turnos e fases' },
  { title: 'Calendário', desc: 'Dias, horários e feriados' },
  { title: 'Regras de jogo', desc: 'Descanso e mando' },
  { title: 'Playoffs', desc: 'Fase eliminatória' },
  { title: 'Datas', desc: 'Prazos finais' },
]

// ─── UI helpers ───────────────────────────────────────────────────────────────
const inputCls =
  'w-full px-3 py-2.5 border border-[var(--fgb-ink-200)] rounded-md bg-white text-[var(--fgb-ink-900)] text-sm focus:outline-none focus:border-[var(--fgb-green-700)] focus:ring-1 focus:ring-[var(--fgb-green-700)] transition-colors'

const inputClsCompact =
  'w-full px-3 py-2 border border-[var(--fgb-ink-200)] rounded-md bg-white text-[var(--fgb-ink-900)] text-sm focus:outline-none focus:border-[var(--fgb-green-700)] focus:ring-1 focus:ring-[var(--fgb-green-700)] transition-colors'

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="fgb-label mb-2"
      style={{ fontSize: 10, color: 'var(--fgb-ink-500)', letterSpacing: '0.16em' }}
    >
      {children}
    </p>
  )
}

function OptionPill({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="fgb-label px-4 py-2.5 transition-colors"
      style={{
        fontSize: 11,
        background: active ? 'var(--fgb-green-700)' : '#fff',
        color: active ? '#fff' : 'var(--fgb-ink-700)',
        border: `1px solid ${active ? 'var(--fgb-green-700)' : 'var(--fgb-ink-200)'}`,
        borderRadius: 6,
      }}
    >
      {children}
    </button>
  )
}

function OptionCard({
  active,
  onClick,
  label,
  desc,
}: {
  active: boolean
  onClick: () => void
  label: string
  desc: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-left transition-colors p-4 rounded-lg"
      style={{
        background: active ? 'var(--fgb-green-50)' : '#fff',
        border: `1.5px solid ${active ? 'var(--fgb-green-700)' : 'var(--fgb-ink-200)'}`,
      }}
    >
      <div className="flex items-center justify-between mb-1.5">
        <span
          className="fgb-label"
          style={{
            fontSize: 12,
            color: active ? 'var(--fgb-green-800)' : 'var(--fgb-ink-900)',
            letterSpacing: '0.08em',
          }}
        >
          {label}
        </span>
        {active && <Check className="w-4 h-4" style={{ color: 'var(--fgb-green-700)' }} />}
      </div>
      <p className="text-xs leading-snug" style={{ color: 'var(--fgb-ink-500)' }}>
        {desc}
      </p>
    </button>
  )
}

function Toggle({
  checked,
  onCheckedChange,
  label,
  description,
}: {
  checked: boolean
  onCheckedChange: (v: boolean) => void
  label: string
  description?: string
}) {
  return (
    <label className="flex items-start gap-3 cursor-pointer select-none">
      <button
        type="button"
        onClick={() => onCheckedChange(!checked)}
        className="relative w-10 h-5 rounded-full transition-colors mt-0.5 shrink-0"
        style={{
          background: checked ? 'var(--fgb-green-700)' : 'var(--fgb-ink-200)',
        }}
      >
        <span
          className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform shadow"
          style={{ transform: checked ? 'translateX(20px)' : 'translateX(0)' }}
        />
      </button>
      <div className="flex-1">
        <span className="text-sm font-medium" style={{ color: 'var(--fgb-ink-900)' }}>
          {label}
        </span>
        {description && (
          <p className="text-xs mt-0.5" style={{ color: 'var(--fgb-ink-500)' }}>
            {description}
          </p>
        )}
      </div>
    </label>
  )
}

function InfoCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div
      className="rounded-lg p-4"
      style={{ background: 'var(--fgb-ink-50)', border: '1px solid var(--fgb-ink-200)' }}
    >
      <p
        className="fgb-label mb-1.5"
        style={{ fontSize: 10, color: 'var(--fgb-green-700)', letterSpacing: '0.18em' }}
      >
        {title}
      </p>
      <p className="text-sm leading-relaxed" style={{ color: 'var(--fgb-ink-700)' }}>
        {children}
      </p>
    </div>
  )
}

function PhaseEditor({
  phase,
  index,
  total,
  onChange,
  onRemove,
  onMove,
}: {
  phase: CustomPhase
  index: number
  total: number
  onChange: (patch: Partial<CustomPhase>) => void
  onRemove: () => void
  onMove: (dir: -1 | 1) => void
}) {
  return (
    <div
      className="rounded-md p-4 space-y-3"
      style={{
        background: '#fff',
        border: '1px solid var(--fgb-ink-200)',
      }}
    >
      {/* Phase header: order + name + actions */}
      <div className="flex items-start gap-2">
        <span
          className="fgb-label shrink-0 inline-flex items-center justify-center w-7 h-7 rounded"
          style={{
            fontSize: 11,
            background: 'var(--fgb-green-700)',
            color: '#fff',
            letterSpacing: 0,
          }}
        >
          {index + 1}
        </span>
        <Input
          value={phase.name}
          onChange={e => onChange({ name: e.target.value })}
          placeholder="Nome da fase"
          className={inputClsCompact + ' flex-1'}
        />
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => onMove(-1)}
            disabled={index === 0}
            className="p-1.5 rounded disabled:opacity-30 transition-colors hover:bg-[var(--fgb-ink-100)]"
            style={{ color: 'var(--fgb-ink-500)' }}
            aria-label="Mover acima"
          >
            <ArrowUp className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onMove(1)}
            disabled={index === total - 1}
            className="p-1.5 rounded disabled:opacity-30 transition-colors hover:bg-[var(--fgb-ink-100)]"
            style={{ color: 'var(--fgb-ink-500)' }}
            aria-label="Mover abaixo"
          >
            <ArrowDown className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={onRemove}
            disabled={total === 1}
            className="p-1.5 rounded disabled:opacity-30 transition-colors hover:bg-[var(--fgb-red-50)]"
            style={{ color: 'var(--fgb-red-500)' }}
            aria-label="Remover fase"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Mode selector */}
      <div>
        <SectionLabel>Modo de Disputa</SectionLabel>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => onChange({ mode: 'TRADITIONAL' })}
            className="text-left p-3 rounded-md transition-colors"
            style={{
              background: phase.mode === 'TRADITIONAL' ? 'var(--fgb-green-50)' : '#fff',
              border: `1.5px solid ${phase.mode === 'TRADITIONAL' ? 'var(--fgb-green-700)' : 'var(--fgb-ink-200)'}`,
            }}
          >
            <div className="flex items-center gap-2 mb-1">
              <Users
                className="w-3.5 h-3.5"
                style={{ color: phase.mode === 'TRADITIONAL' ? 'var(--fgb-green-700)' : 'var(--fgb-ink-500)' }}
              />
              <span
                className="fgb-label"
                style={{
                  fontSize: 11,
                  color: phase.mode === 'TRADITIONAL' ? 'var(--fgb-green-800)' : 'var(--fgb-ink-900)',
                }}
              >
                Tradicional
              </span>
              {phase.mode === 'TRADITIONAL' && (
                <Check className="w-3.5 h-3.5 ml-auto" style={{ color: 'var(--fgb-green-700)' }} />
              )}
            </div>
            <p className="text-xs leading-snug" style={{ color: 'var(--fgb-ink-500)' }}>
              Mando alternado, equipes viajam para os jogos.
            </p>
          </button>
          <button
            type="button"
            onClick={() => onChange({ mode: 'ENCOUNTER' })}
            className="text-left p-3 rounded-md transition-colors"
            style={{
              background: phase.mode === 'ENCOUNTER' ? 'var(--fgb-green-50)' : '#fff',
              border: `1.5px solid ${phase.mode === 'ENCOUNTER' ? 'var(--fgb-green-700)' : 'var(--fgb-ink-200)'}`,
            }}
          >
            <div className="flex items-center gap-2 mb-1">
              <MapPin
                className="w-3.5 h-3.5"
                style={{ color: phase.mode === 'ENCOUNTER' ? 'var(--fgb-green-700)' : 'var(--fgb-ink-500)' }}
              />
              <span
                className="fgb-label"
                style={{
                  fontSize: 11,
                  color: phase.mode === 'ENCOUNTER' ? 'var(--fgb-green-800)' : 'var(--fgb-ink-900)',
                }}
              >
                Encontro
              </span>
              {phase.mode === 'ENCOUNTER' && (
                <Check className="w-3.5 h-3.5 ml-auto" style={{ color: 'var(--fgb-green-700)' }} />
              )}
            </div>
            <p className="text-xs leading-snug" style={{ color: 'var(--fgb-ink-500)' }}>
              Todas as equipes em uma sede única, em data definida.
            </p>
          </button>
        </div>
      </div>

      {/* Format type */}
      <div>
        <SectionLabel>Tipo de fase</SectionLabel>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          {[
            { v: 'ROUND_ROBIN' as const, l: 'Pontos corridos' },
            { v: 'GROUPS_ELIMINATORIO' as const, l: 'Grupos + Mata-mata' },
            { v: 'ELIMINATORIO' as const, l: 'Mata-mata' },
          ].map(o => {
            const active = phase.formatType === o.v
            return (
              <button
                key={o.v}
                type="button"
                onClick={() => onChange({ formatType: o.v })}
                className="fgb-label py-2 px-3 transition-colors"
                style={{
                  fontSize: 10,
                  background: active ? 'var(--fgb-green-700)' : '#fff',
                  color: active ? '#fff' : 'var(--fgb-ink-700)',
                  border: `1px solid ${active ? 'var(--fgb-green-700)' : 'var(--fgb-ink-200)'}`,
                  borderRadius: 6,
                }}
              >
                {o.l}
              </button>
            )
          })}
        </div>
      </div>

      {/* Conditional fields per mode */}
      {phase.mode === 'ENCOUNTER' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="md:col-span-2">
            <SectionLabel>Sede do encontro</SectionLabel>
            <Input
              value={phase.encounterVenue ?? ''}
              onChange={e => onChange({ encounterVenue: e.target.value })}
              placeholder="Ex.: Ginásio Tarso Dutra — Porto Alegre"
              className={inputClsCompact}
            />
          </div>
          <div>
            <SectionLabel>Data do encontro</SectionLabel>
            <Input
              type="date"
              value={phase.encounterDate ?? ''}
              onChange={e => onChange({ encounterDate: e.target.value })}
              className={inputClsCompact}
            />
          </div>
          <div>
            <SectionLabel>Data fim (opcional)</SectionLabel>
            <Input
              type="date"
              value={phase.encounterEndDate ?? ''}
              onChange={e => onChange({ encounterEndDate: e.target.value })}
              className={inputClsCompact}
            />
          </div>
        </div>
      ) : (
        <div>
          <SectionLabel>Padrão de mando da fase</SectionLabel>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            {[
              { v: 'ALTERNATED' as const, l: 'Alternado', d: 'Cada equipe manda uma vez' },
              { v: 'FIXED_HOST' as const, l: 'Sede fixa', d: 'Melhor classificada manda' },
              { v: 'NEUTRAL' as const, l: 'Neutro', d: 'Quadra neutra' },
            ].map(o => {
              const active = (phase.homePattern ?? 'ALTERNATED') === o.v
              return (
                <button
                  key={o.v}
                  type="button"
                  onClick={() => onChange({ homePattern: o.v })}
                  className="text-left p-2.5 rounded-md transition-colors"
                  style={{
                    background: active ? 'var(--fgb-green-50)' : '#fff',
                    border: `1px solid ${active ? 'var(--fgb-green-700)' : 'var(--fgb-ink-200)'}`,
                  }}
                >
                  <span
                    className="fgb-label block"
                    style={{
                      fontSize: 10,
                      color: active ? 'var(--fgb-green-800)' : 'var(--fgb-ink-900)',
                    }}
                  >
                    {o.l}
                  </span>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--fgb-ink-500)' }}>
                    {o.d}
                  </p>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Qualifies next + notes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <SectionLabel>Equipes que avançam</SectionLabel>
          <Input
            type="number"
            min="0"
            value={phase.qualifiesNextCount ?? ''}
            onChange={e => onChange({ qualifiesNextCount: e.target.value })}
            placeholder="ex.: 4"
            className={inputClsCompact}
          />
          <p className="text-xs mt-1" style={{ color: 'var(--fgb-ink-500)' }}>
            Deixe vazio se não houver fase seguinte.
          </p>
        </div>
        <div>
          <SectionLabel>Observações</SectionLabel>
          <Input
            value={phase.notes ?? ''}
            onChange={e => onChange({ notes: e.target.value })}
            placeholder="opcional"
            className={inputClsCompact}
          />
        </div>
      </div>
    </div>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function NewChampionshipPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [submitLoading, setSubmitLoading] = useState(false)
  const [formError, setFormError] = useState('')
  const [form, setForm] = useState<FormState>(defaultForm())
  const [previewExpanded, setPreviewExpanded] = useState(true)

  const setField = (key: keyof FormState, value: any) => setForm(f => ({ ...f, [key]: value }))

  const toggleCategory = (code: string) =>
    setField('categories', form.categories.includes(code) ? form.categories.filter(c => c !== code) : [...form.categories, code])

  const toggleWeekday = (day: number) => {
    const list = form.allowedWeekdays
    setField('allowedWeekdays', list.includes(day) ? list.filter(d => d !== day) : [...list, day].sort())
  }

  const moveTiebreaker = (idx: number, dir: -1 | 1) => {
    const list = [...form.tiebreakerChain]
    const newIdx = idx + dir
    if (newIdx < 0 || newIdx >= list.length) return
    ;[list[idx], list[newIdx]] = [list[newIdx], list[idx]]
    setField('tiebreakerChain', list)
  }

  const validateStep = () => {
    if (step === 0 && !form.name.trim()) { setFormError('O nome do campeonato é obrigatório.'); return false }
    if (step === 2 && form.categories.length === 0) { setFormError('Selecione ao menos uma categoria.'); return false }
    if (step === 3 && form.hasMultiplePhases) {
      if (form.customPhases.length === 0) {
        setFormError('Adicione ao menos uma fase ou desative o toggle de múltiplas fases.')
        return false
      }
      const invalid = form.customPhases.find(p => !p.name.trim())
      if (invalid) {
        setFormError('Toda fase precisa de um nome.')
        return false
      }
      const missingEncounter = form.customPhases.find(
        p => p.mode === 'ENCOUNTER' && (!p.encounterDate || !p.encounterVenue?.trim()),
      )
      if (missingEncounter) {
        setFormError(`Fase "${missingEncounter.name}": preencha sede e data do encontro.`)
        return false
      }
    }
    if (step === 4 && form.allowedWeekdays.length === 0) { setFormError('Selecione ao menos um dia da semana.'); return false }
    if (step === 7) {
      const regOpen = form.registrationOpenedAt ? new Date(form.registrationOpenedAt) : null
      const regEnd = form.regDeadline ? new Date(form.regDeadline) : null
      const start = form.startDate ? new Date(form.startDate) : null
      const end = form.endDate ? new Date(form.endDate) : null
      if (regOpen && regEnd && regOpen > regEnd) {
        setFormError('Abertura das inscrições deve ser antes do encerramento.'); return false
      }
      if (start && end && start > end) {
        setFormError('Início do campeonato deve ser antes do fim.'); return false
      }
      if (regEnd && start && regEnd > start) {
        setFormError('Encerramento das inscrições deve ser antes do início do campeonato.'); return false
      }
    }
    setFormError(''); return true
  }

  const nextStep = () => { if (!validateStep()) return; setStep(s => Math.min(s + 1, STEPS.length - 1)) }
  const prevStep = () => { setFormError(''); setStep(s => Math.max(s - 1, 0)) }

  const handleSubmit = async () => {
    if (!validateStep()) return
    setSubmitLoading(true)
    try {
      const res = await fetch('/api/championships', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          name: form.name.trim(),
          year: Number(form.year),
          minTeamsPerCat: Number(form.minTeamsPerCat),
          turns: Number(form.turns),
          phases: form.hasMultiplePhases ? form.customPhases.length : Number(form.phases),
          maxGamesPerTeamPerDay: Number(form.maxGamesPerTeamPerDay),
          relegationDown: Number(form.relegationDown),
          promotionUp: Number(form.promotionUp),
          playoffTeams: Number(form.playoffTeams),
          tiebreakerChain: form.tiebreakerChain,
          tiebreakers: form.tiebreakerChain.join(','),
          regDeadline: form.regDeadline || new Date().toISOString(),
          registrationOpenedAt: form.registrationOpenedAt || null,
          startDate: form.startDate || null,
          endDate: form.endDate || null,
          sanctioning: form.sanctioning,
          countsForRanking: form.countsForRanking,
          countsForBidEligibility: form.countsForBidEligibility,
          sanctionNumber: form.sanctionNumber || null,
          modality: form.modality,
          allowedWeekdays: form.allowedWeekdays,
          timeSlots: form.timeSlots,
          blackoutDates: form.blackoutDates,
          minRestHoursBetweenGames: Number(form.minRestHoursBetweenGames),
          maxGamesPerTeamPerWeek: Number(form.maxGamesPerTeamPerWeek),
          homePattern: form.homePattern,
          // Fase B: múltiplas fases customizadas
          hasMultiplePhases: form.hasMultiplePhases,
          customPhases: form.hasMultiplePhases
            ? form.customPhases.map((p, i) => ({
                name: p.name.trim(),
                order: i,
                mode: p.mode,
                formatType: p.formatType,
                encounterVenue: p.encounterVenue?.trim() || null,
                encounterDate: p.encounterDate || null,
                encounterEndDate: p.encounterEndDate || null,
                homePattern: p.homePattern || null,
                qualifiesNextCount: p.qualifiesNextCount && p.qualifiesNextCount.trim() !== ''
                  ? Number(p.qualifiesNextCount)
                  : null,
                notes: p.notes?.trim() || null,
              }))
            : [],
        })
      })
      if (res.ok) router.push('/admin/championships')
      else { const d = await res.json(); setFormError(d.error || 'Erro ao salvar') }
    } catch { setFormError('Erro de conexão') } finally { setSubmitLoading(false) }
  }

  // ─── Step renderers ───────────────────────────────────────────────────────────
  const renderStep0 = () => (
    <div className="space-y-6">
      <div>
        <SectionLabel>Nome da Competição</SectionLabel>
        <Input
          value={form.name}
          onChange={e => setField('name', e.target.value)}
          placeholder="Ex: Estadual 2026 Masculino"
          className={inputCls}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <SectionLabel>Ano da Temporada</SectionLabel>
          <Input
            type="number"
            value={form.year}
            onChange={e => setField('year', e.target.value)}
            className={inputClsCompact}
          />
        </div>
        <div>
          <SectionLabel>Mín. Equipes/Categoria</SectionLabel>
          <Input
            type="number"
            min="1"
            value={form.minTeamsPerCat}
            onChange={e => setField('minTeamsPerCat', e.target.value)}
            className={inputClsCompact}
          />
        </div>
      </div>
      <div>
        <SectionLabel>Sexo da Competição</SectionLabel>
        <div className="flex gap-2">
          {SEXES.map(s => (
            <OptionPill key={s} active={form.sex === s} onClick={() => setField('sex', s)}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </OptionPill>
          ))}
        </div>
      </div>
    </div>
  )

  const renderStepType = () => (
    <div className="space-y-6">
      <div>
        <SectionLabel>Sancionamento</SectionLabel>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[
            { value: 'FGB_OFFICIAL', label: 'Oficial FGB', desc: 'Conta para ranking estadual e BID' },
            { value: 'FGB_INVITATIONAL', label: 'Convidativo FGB', desc: 'Organizado pela FGB sem ranqueamento' },
            { value: 'REGIONAL', label: 'Regional', desc: 'Organizado por região afiliada' },
            { value: 'OPEN', label: 'Aberto', desc: 'Torneio amistoso sem sanção oficial' },
          ].map(o => (
            <OptionCard
              key={o.value}
              active={form.sanctioning === o.value}
              onClick={() => setField('sanctioning', o.value)}
              label={o.label}
              desc={o.desc}
            />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <SectionLabel>Modalidade</SectionLabel>
          <div className="flex gap-2">
            {['5x5', '3x3'].map(m => (
              <OptionPill key={m} active={form.modality === m} onClick={() => setField('modality', m)}>
                {m}
              </OptionPill>
            ))}
          </div>
        </div>
        <div>
          <SectionLabel>Nº de Sanção (opcional)</SectionLabel>
          <Input
            value={form.sanctionNumber}
            onChange={e => setField('sanctionNumber', e.target.value)}
            placeholder="Ex: FGB-2026-001"
            className={inputClsCompact}
          />
        </div>
      </div>

      <div className="space-y-3 pt-2 border-t border-[var(--fgb-ink-200)]">
        <Toggle
          checked={form.countsForRanking}
          onCheckedChange={v => setField('countsForRanking', v)}
          label="Conta para o ranking estadual"
        />
        <Toggle
          checked={form.countsForBidEligibility}
          onCheckedChange={v => setField('countsForBidEligibility', v)}
          label="Exige BID publicado para escalação"
        />
      </div>
    </div>
  )

  const renderStep1 = () => {
    const masc = ALL_CATEGORIES.filter(c => c.sex === 'masculino')
    const fem = ALL_CATEGORIES.filter(c => c.sex === 'feminino')
    const showBoth = form.sex === 'misto'
    const showMasc = form.sex === 'masculino' || showBoth
    const showFem = form.sex === 'feminino' || showBoth

    const CatGrid = ({ cats, label }: { cats: typeof masc; label: string }) => (
      <div>
        <SectionLabel>{label}</SectionLabel>
        <div className="grid grid-cols-4 md:grid-cols-7 gap-2">
          {cats.map(cat => {
            const active = form.categories.includes(cat.code)
            return (
              <button
                type="button"
                key={cat.code}
                onClick={() => toggleCategory(cat.code)}
                className="flex flex-col items-center justify-center gap-1 py-3 rounded-md transition-colors"
                style={{
                  background: active ? 'var(--fgb-green-700)' : '#fff',
                  border: `1.5px solid ${active ? 'var(--fgb-green-700)' : 'var(--fgb-ink-200)'}`,
                  color: active ? '#fff' : 'var(--fgb-ink-700)',
                }}
              >
                {active && <Check className="w-3 h-3" />}
                <span
                  className="fgb-label"
                  style={{ fontSize: 10, letterSpacing: '0.04em' }}
                >
                  {cat.label}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    )

    return (
      <div className="space-y-6">
        {showMasc && <CatGrid cats={masc} label="Masculino" />}
        {showFem && <CatGrid cats={fem} label="Feminino" />}
      </div>
    )
  }

  const renderStep2 = () => {
    const updatePhase = (idx: number, patch: Partial<CustomPhase>) => {
      const list = [...form.customPhases]
      list[idx] = { ...list[idx], ...patch }
      setField('customPhases', list)
    }
    const addPhase = () =>
      setField('customPhases', [...form.customPhases, newPhase(form.customPhases.length + 1)])
    const removePhase = (idx: number) =>
      setField('customPhases', form.customPhases.filter((_, i) => i !== idx))
    const movePhase = (idx: number, dir: -1 | 1) => {
      const list = [...form.customPhases]
      const j = idx + dir
      if (j < 0 || j >= list.length) return
      ;[list[idx], list[j]] = [list[j], list[idx]]
      setField('customPhases', list)
    }

    return (
      <div className="space-y-6">
        <div>
          <SectionLabel>Formato da Competição</SectionLabel>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              { value: 'todos_contra_todos', label: 'Pontos Corridos', desc: 'As equipes jogam entre si e a classificação é definida pela tabela geral.' },
              { value: 'eliminatorio', label: 'Mata-Mata', desc: 'Séries eliminatórias desde o início. Quem perde está fora.' },
              { value: 'grupos_eliminatorio', label: 'Grupos + Mata-Mata', desc: 'Fase inicial em grupos seguida por eliminatórias.' },
              { value: 'misto', label: 'Pontos + Playoffs', desc: 'Fase regular de pontos seguida de mata-mata final.' },
            ].map(o => (
              <OptionCard
                key={o.value}
                active={form.format === o.value}
                onClick={() => setField('format', o.value)}
                label={o.label}
                desc={o.desc}
              />
            ))}
          </div>
        </div>

        <div>
          <SectionLabel>Turnos</SectionLabel>
          <Input
            type="number"
            min="1"
            value={form.turns}
            onChange={e => setField('turns', e.target.value)}
            className={inputClsCompact}
            style={{ maxWidth: 200 }}
          />
          <p className="text-xs mt-1.5" style={{ color: 'var(--fgb-ink-500)' }}>
            Quantas vezes cada equipe enfrenta as demais (turno e returno = 2).
          </p>
        </div>

        {/* Múltiplas fases — opt-in */}
        <div
          className="rounded-lg p-4 space-y-4"
          style={{
            background: form.hasMultiplePhases ? 'var(--fgb-green-50)' : 'var(--fgb-ink-50)',
            border: `1px solid ${form.hasMultiplePhases ? 'var(--fgb-green-200)' : 'var(--fgb-ink-200)'}`,
          }}
        >
          <Toggle
            checked={form.hasMultiplePhases}
            onCheckedChange={v => {
              setField('hasMultiplePhases', v)
              if (v && form.customPhases.length === 0) {
                setField('customPhases', [newPhase(1)])
              }
            }}
            label="Esta competição tem múltiplas fases?"
            description="Permite configurar fases independentes (ex.: classificatória → semifinal → final), cada uma com modo de disputa próprio."
          />

          {form.hasMultiplePhases && (
            <div className="space-y-3 pt-2 border-t border-[var(--fgb-ink-200)]">
              {form.customPhases.map((p, idx) => (
                <PhaseEditor
                  key={idx}
                  phase={p}
                  index={idx}
                  total={form.customPhases.length}
                  onChange={patch => updatePhase(idx, patch)}
                  onRemove={() => removePhase(idx)}
                  onMove={dir => movePhase(idx, dir)}
                />
              ))}
              <button
                type="button"
                onClick={addPhase}
                className="fgb-label inline-flex items-center gap-1.5 mt-1 transition-colors"
                style={{ fontSize: 11, color: 'var(--fgb-green-700)' }}
              >
                <Plus className="w-3 h-3" /> Adicionar fase
              </button>
            </div>
          )}

          {!form.hasMultiplePhases && (
            <p className="text-xs leading-relaxed" style={{ color: 'var(--fgb-ink-500)' }}>
              Modo simples: uma única fase usando o formato selecionado acima.
              Para configurações como "classificatória + playoffs" ou
              "encontros regionais", ative o toggle.
            </p>
          )}
        </div>

        <div>
          <SectionLabel>Máx. jogos por equipe/categoria no dia</SectionLabel>
          <Input
            type="number"
            min="1"
            max="6"
            value={form.maxGamesPerTeamPerDay}
            onChange={e => setField('maxGamesPerTeamPerDay', e.target.value)}
            className={inputClsCompact}
            style={{ maxWidth: 200 }}
          />
          <p className="text-xs mt-1.5" style={{ color: 'var(--fgb-ink-500)' }}>
            Em dias de encontro, considere aumentar para 2 ou 3.
          </p>
        </div>
      </div>
    )
  }

  const renderStepCalendar = () => {
    const WEEKDAYS = [
      { d: 1, label: 'Seg' }, { d: 2, label: 'Ter' }, { d: 3, label: 'Qua' },
      { d: 4, label: 'Qui' }, { d: 5, label: 'Sex' }, { d: 6, label: 'Sáb' }, { d: 0, label: 'Dom' },
    ]
    return (
      <div className="space-y-6">
        <div>
          <SectionLabel>Dias da semana permitidos</SectionLabel>
          <p className="text-xs mb-2.5" style={{ color: 'var(--fgb-ink-500)' }}>
            Selecione os dias em que a competição pode ter jogos.
          </p>
          <div className="flex flex-wrap gap-2">
            {WEEKDAYS.map(w => (
              <OptionPill
                key={w.d}
                active={form.allowedWeekdays.includes(w.d)}
                onClick={() => toggleWeekday(w.d)}
              >
                {w.label}
              </OptionPill>
            ))}
          </div>
        </div>

        <div>
          <SectionLabel>Janelas de horário</SectionLabel>
          <p className="text-xs mb-2.5" style={{ color: 'var(--fgb-ink-500)' }}>
            Múltiplas janelas (ex.: matutino 08–12 + noturno 19–22).
          </p>
          <div className="space-y-2">
            {form.timeSlots.map((s, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <Input
                  type="time"
                  value={s.start}
                  onChange={e => {
                    const list = [...form.timeSlots]; list[idx] = { ...list[idx], start: e.target.value }; setField('timeSlots', list)
                  }}
                  className={inputClsCompact + ' flex-1'}
                />
                <span className="text-xs" style={{ color: 'var(--fgb-ink-500)' }}>até</span>
                <Input
                  type="time"
                  value={s.end}
                  onChange={e => {
                    const list = [...form.timeSlots]; list[idx] = { ...list[idx], end: e.target.value }; setField('timeSlots', list)
                  }}
                  className={inputClsCompact + ' flex-1'}
                />
                <Input
                  value={s.label || ''}
                  onChange={e => {
                    const list = [...form.timeSlots]; list[idx] = { ...list[idx], label: e.target.value }; setField('timeSlots', list)
                  }}
                  placeholder="Rótulo"
                  className={inputClsCompact + ' flex-1'}
                />
                <button
                  type="button"
                  onClick={() => setField('timeSlots', form.timeSlots.filter((_, i) => i !== idx))}
                  className="p-2 rounded transition-colors hover:bg-[var(--fgb-red-50)]"
                  style={{ color: 'var(--fgb-red-500)' }}
                  aria-label="Remover janela"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => setField('timeSlots', [...form.timeSlots, { start: '09:00', end: '12:00', label: '' }])}
              className="fgb-label inline-flex items-center gap-1.5 mt-1"
              style={{ fontSize: 11, color: 'var(--fgb-green-700)' }}
            >
              <Plus className="w-3 h-3" /> Adicionar janela
            </button>
          </div>
        </div>

        <div>
          <SectionLabel>Datas bloqueadas (feriados, recessos, ENEM)</SectionLabel>
          <div className="space-y-2">
            {form.blackoutDates.map((b, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <Input
                  type="date"
                  value={b.date}
                  onChange={e => {
                    const list = [...form.blackoutDates]; list[idx] = { ...list[idx], date: e.target.value }; setField('blackoutDates', list)
                  }}
                  className={inputClsCompact + ' flex-1'}
                />
                <Input
                  type="date"
                  value={b.endDate || ''}
                  onChange={e => {
                    const list = [...form.blackoutDates]; list[idx] = { ...list[idx], endDate: e.target.value }; setField('blackoutDates', list)
                  }}
                  placeholder="Fim (opcional)"
                  className={inputClsCompact + ' flex-1'}
                />
                <Input
                  value={b.reason || ''}
                  onChange={e => {
                    const list = [...form.blackoutDates]; list[idx] = { ...list[idx], reason: e.target.value }; setField('blackoutDates', list)
                  }}
                  placeholder="Motivo"
                  className={inputClsCompact + ' flex-1'}
                />
                <button
                  type="button"
                  onClick={() => setField('blackoutDates', form.blackoutDates.filter((_, i) => i !== idx))}
                  className="p-2 rounded transition-colors hover:bg-[var(--fgb-red-50)]"
                  style={{ color: 'var(--fgb-red-500)' }}
                  aria-label="Remover data"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => setField('blackoutDates', [...form.blackoutDates, { date: '', reason: '' }])}
              className="fgb-label inline-flex items-center gap-1.5 mt-1"
              style={{ fontSize: 11, color: 'var(--fgb-green-700)' }}
            >
              <Plus className="w-3 h-3" /> Adicionar data
            </button>
          </div>
        </div>
      </div>
    )
  }

  const renderStepRules = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <SectionLabel>Descanso mínimo entre jogos (horas)</SectionLabel>
          <Input
            type="number"
            min="0"
            max="72"
            value={form.minRestHoursBetweenGames}
            onChange={e => setField('minRestHoursBetweenGames', e.target.value)}
            className={inputClsCompact}
          />
          <p className="text-xs mt-1.5" style={{ color: 'var(--fgb-ink-500)' }}>
            Padrão FIBA: 20h adulto · 90min em festivais.
          </p>
        </div>
        <div>
          <SectionLabel>Máx jogos por equipe/semana</SectionLabel>
          <Input
            type="number"
            min="1"
            max="10"
            value={form.maxGamesPerTeamPerWeek}
            onChange={e => setField('maxGamesPerTeamPerWeek', e.target.value)}
            className={inputClsCompact}
          />
        </div>
      </div>

      <div>
        <SectionLabel>Padrão de mando</SectionLabel>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[
            { v: 'ALTERNATED', l: 'Alternado', d: 'Cada equipe manda uma vez na série' },
            { v: 'FIXED_HOST', l: 'Sede fixa', d: 'A equipe melhor classificada manda todos os jogos' },
            { v: 'NEUTRAL', l: 'Neutro', d: 'Todos os jogos em quadra neutra' },
            { v: 'SERIES_2_2_1', l: '2-2-1 (best-of-5)', d: 'Padrão NBA: 2-2-1 com mando da maior cabeça' },
          ].map(o => (
            <OptionCard
              key={o.v}
              active={form.homePattern === o.v}
              onClick={() => setField('homePattern', o.v)}
              label={o.l}
              desc={o.d}
            />
          ))}
        </div>
      </div>

      <div>
        <SectionLabel>Critérios de desempate (FIBA — ordem importa)</SectionLabel>
        <p className="text-xs mb-2.5" style={{ color: 'var(--fgb-ink-500)' }}>
          Use as setas para reordenar. Aplica de cima para baixo.
        </p>
        <div className="space-y-1.5">
          {form.tiebreakerChain.map((t, idx) => {
            const labels: Record<string, string> = {
              h2h_record: 'Confronto direto (vitórias)',
              h2h_diff: 'Saldo no confronto direto',
              h2h_for: 'Pontos pró no confronto direto',
              all_diff: 'Saldo de pontos (todos os jogos)',
              all_for: 'Pontos pró (todos os jogos)',
              all_against: 'Pontos contra',
              wins: 'Número de vitórias',
              draw: 'Sorteio',
            }
            return (
              <div
                key={t}
                className="flex items-center gap-2 p-2.5 rounded-md"
                style={{ background: '#fff', border: '1px solid var(--fgb-ink-200)' }}
              >
                <span
                  className="fgb-label w-6 text-center"
                  style={{ fontSize: 11, color: 'var(--fgb-green-700)' }}
                >
                  {idx + 1}
                </span>
                <span className="text-sm flex-1" style={{ color: 'var(--fgb-ink-800)' }}>
                  {labels[t] ?? t}
                </span>
                <button
                  type="button"
                  onClick={() => moveTiebreaker(idx, -1)}
                  disabled={idx === 0}
                  className="px-2 disabled:opacity-30"
                  style={{ color: 'var(--fgb-ink-500)' }}
                >
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() => moveTiebreaker(idx, 1)}
                  disabled={idx === form.tiebreakerChain.length - 1}
                  className="px-2 disabled:opacity-30"
                  style={{ color: 'var(--fgb-ink-500)' }}
                >
                  ↓
                </button>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )

  const renderStep3 = () => (
    <div className="space-y-6">
      <Toggle
        checked={form.hasPlayoffs}
        onCheckedChange={v => setField('hasPlayoffs', v)}
        label="Este campeonato tem fase de playoffs"
        description="Mata-mata final após a fase regular."
      />
      {form.hasPlayoffs && (
        <div className="grid grid-cols-2 gap-4 mt-2">
          <div>
            <SectionLabel>Equipes Top</SectionLabel>
            <Input
              type="number"
              value={form.playoffTeams}
              onChange={e => setField('playoffTeams', e.target.value)}
              className={inputClsCompact}
            />
          </div>
          <div>
            <SectionLabel>Formato</SectionLabel>
            <select
              value={form.playoffFormat}
              onChange={e => setField('playoffFormat', e.target.value)}
              className={inputClsCompact}
            >
              <option value="melhor_de_1">Melhor de 1</option>
              <option value="melhor_de_3">Melhor de 3</option>
              <option value="melhor_de_5">Melhor de 5</option>
            </select>
          </div>
        </div>
      )}
    </div>
  )

  const renderStep4 = () => (
    <div className="space-y-6">
      {/* Janela de inscrições */}
      <div
        className="rounded-lg p-4 space-y-4"
        style={{ background: 'var(--fgb-ink-50)', border: '1px solid var(--fgb-ink-200)' }}
      >
        <div>
          <p
            className="fgb-label"
            style={{ fontSize: 11, color: 'var(--fgb-green-700)', letterSpacing: '0.18em' }}
          >
            Janela de Inscrições
          </p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--fgb-ink-500)' }}>
            Período em que as equipes podem se inscrever na competição.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <SectionLabel>Abertura das inscrições</SectionLabel>
            <Input
              type="date"
              value={form.registrationOpenedAt}
              onChange={e => setField('registrationOpenedAt', e.target.value)}
              className={inputClsCompact}
            />
          </div>
          <div>
            <SectionLabel>Encerramento das inscrições</SectionLabel>
            <Input
              type="date"
              value={form.regDeadline}
              onChange={e => setField('regDeadline', e.target.value)}
              className={inputClsCompact}
            />
          </div>
        </div>
      </div>

      {/* Realização do campeonato */}
      <div
        className="rounded-lg p-4 space-y-4"
        style={{ background: 'var(--fgb-green-50)', border: '1px solid var(--fgb-green-200)' }}
      >
        <div>
          <p
            className="fgb-label"
            style={{ fontSize: 11, color: 'var(--fgb-green-700)', letterSpacing: '0.18em' }}
          >
            Realização do Campeonato
          </p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--fgb-ink-500)' }}>
            Período em que os jogos acontecem.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <SectionLabel>Início do campeonato</SectionLabel>
            <Input
              type="date"
              value={form.startDate}
              onChange={e => setField('startDate', e.target.value)}
              className={inputClsCompact}
            />
          </div>
          <div>
            <SectionLabel>Fim do campeonato</SectionLabel>
            <Input
              type="date"
              value={form.endDate}
              onChange={e => setField('endDate', e.target.value)}
              className={inputClsCompact}
            />
          </div>
        </div>
      </div>
    </div>
  )

  // Steps: 0=Identif | 1=Tipo | 2=Categorias | 3=Formato | 4=Calendário | 5=Regras | 6=Playoffs | 7=Datas
  const stepContent = [renderStep0, renderStepType, renderStep1, renderStep2, renderStepCalendar, renderStepRules, renderStep3, renderStep4]

  return (
    <div className="max-w-[1280px] mx-auto pb-12 pt-6 px-4">
      {/* Header full-width */}
      <header className="flex items-center gap-4 mb-6">
        <button
          type="button"
          onClick={() => router.back()}
          className="p-2 rounded-md transition-colors"
          style={{
            background: '#fff',
            border: '1px solid var(--fgb-ink-200)',
            color: 'var(--fgb-ink-600)',
          }}
          aria-label="Voltar"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="fgb-display" style={{ fontSize: 28, color: 'var(--fgb-ink-900)' }}>
            Novo Campeonato
          </h1>
          <p
            className="fgb-label mt-1"
            style={{ fontSize: 10, color: 'var(--fgb-ink-500)', letterSpacing: '0.18em' }}
          >
            Configuração da nova competição
          </p>
        </div>
      </header>

      {/* 2-col grid: form left, preview right (sticky on lg+) */}
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px] gap-6 items-start">

        {/* LEFT — Form card */}
        <div
          className="rounded-lg overflow-hidden order-2 lg:order-1"
          style={{
            background: '#fff',
            border: '1px solid var(--fgb-ink-200)',
            boxShadow: 'var(--shadow-md)',
          }}
        >
          {/* Stepper */}
          <div
            className="flex border-b overflow-x-auto"
            style={{ borderColor: 'var(--fgb-ink-200)' }}
          >
            {STEPS.map((s, i) => {
              const isActive = i === step
              const isDone = i < step
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => i < step && setStep(i)}
                  disabled={i > step}
                  className="flex-1 min-w-[110px] py-3 px-2 transition-colors text-center"
                  style={{
                    borderBottom: `3px solid ${
                      isActive ? 'var(--fgb-green-700)' : isDone ? 'var(--fgb-yellow-500)' : 'transparent'
                    }`,
                    background: isActive ? 'var(--fgb-green-50)' : 'transparent',
                    cursor: i > step ? 'not-allowed' : 'pointer',
                  }}
                >
                  <p
                    className="fgb-label"
                    style={{
                      fontSize: 9,
                      color: isActive
                        ? 'var(--fgb-green-700)'
                        : isDone
                        ? 'var(--fgb-ink-700)'
                        : 'var(--fgb-ink-400)',
                      letterSpacing: '0.16em',
                    }}
                  >
                    {s.title}
                  </p>
                </button>
              )
            })}
          </div>

          {/* Tricolor stripe */}
          <div className="fgb-tricolor" style={{ height: 3 }} />

          {/* Content header */}
          <div className="px-6 sm:px-10 pt-8 pb-4">
            <h2 className="fgb-heading" style={{ fontSize: 22, color: 'var(--fgb-ink-900)' }}>
              {STEPS[step].title}
            </h2>
            <p
              className="fgb-label mt-1"
              style={{ fontSize: 10, color: 'var(--fgb-ink-500)', letterSpacing: '0.16em' }}
            >
              {STEPS[step].desc}
            </p>
          </div>

          {/* Step body */}
          <div className="px-6 sm:px-10 pb-8">
            {stepContent[step]()}
            {formError && (
              <div
                className="mt-6 p-4 rounded-md"
                style={{
                  background: 'var(--fgb-red-50)',
                  border: '1px solid var(--fgb-red-200)',
                  color: 'var(--fgb-red-700)',
                }}
              >
                <p className="fgb-label" style={{ fontSize: 11, letterSpacing: '0.1em' }}>
                  {formError}
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <footer
            className="px-6 sm:px-10 py-5 flex items-center justify-between gap-4"
            style={{ background: 'var(--fgb-ink-50)', borderTop: '1px solid var(--fgb-ink-200)' }}
          >
            <button
              type="button"
              disabled={step === 0}
              onClick={prevStep}
              className="fgb-label disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              style={{
                fontSize: 11,
                color: 'var(--fgb-ink-600)',
                padding: '10px 16px',
              }}
            >
              ← Voltar
            </button>
            <button
              type="button"
              onClick={step < STEPS.length - 1 ? nextStep : handleSubmit}
              disabled={submitLoading}
              className="fgb-btn-primary"
              style={{ minWidth: 200 }}
            >
              {submitLoading
                ? 'Salvando…'
                : step < STEPS.length - 1
                ? 'Próximo →'
                : 'Criar Campeonato'}
            </button>
          </footer>
        </div>

        {/* RIGHT — Preview side panel */}
        <aside className="order-1 lg:order-2 lg:sticky lg:top-6">
          {/* Mobile-only toggle */}
          <button
            type="button"
            onClick={() => setPreviewExpanded(o => !o)}
            className="lg:hidden w-full flex items-center justify-between px-4 py-3 rounded-lg mb-2 transition-colors"
            style={{
              background: 'var(--fgb-green-50)',
              border: '1px solid var(--fgb-green-200)',
            }}
            aria-expanded={previewExpanded}
          >
            <span
              className="fgb-label"
              style={{ fontSize: 11, color: 'var(--fgb-green-800)', letterSpacing: '0.18em' }}
            >
              Preview do Campeonato
            </span>
            {previewExpanded
              ? <ChevronUp size={16} style={{ color: 'var(--fgb-green-700)' }} />
              : <ChevronDown size={16} style={{ color: 'var(--fgb-green-700)' }} />
            }
          </button>
          {/* Panel — hidden on mobile when collapsed, always shown on lg+ */}
          <div className={previewExpanded ? 'block' : 'hidden lg:block'}>
            <WizardPreviewPanel form={form} />
          </div>
        </aside>

      </div>
    </div>
  )
}
