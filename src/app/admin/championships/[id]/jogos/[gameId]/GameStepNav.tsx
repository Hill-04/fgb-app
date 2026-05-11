'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ArrowLeft, ShieldCheck, Lock, Radio, CheckCircle2, RotateCcw, Send, X } from 'lucide-react'
import type { GameLifecycleState } from '@/lib/game-lifecycle'

const STEPS = [
  { segment: 'roster', label: 'Escalação', num: '01' },
  { segment: 'sumula', label: 'Súmula',    num: '02' },
]

const STATE_META: Partial<Record<GameLifecycleState, { label: string; bg: string; fg: string; icon: any }>> = {
  DRAFT:         { label: 'Rascunho',     bg: 'var(--fgb-ink-100)',    fg: 'var(--fgb-ink-700)',    icon: ShieldCheck },
  SCHEDULED:     { label: 'Agendado',     bg: 'var(--fgb-yellow-50)',  fg: 'var(--fgb-yellow-800)', icon: ShieldCheck },
  LINEUP_LOCKED: { label: 'Escalações',   bg: 'var(--fgb-green-100)',  fg: 'var(--fgb-green-800)',  icon: Lock },
  LIVE:          { label: 'Ao vivo',      bg: 'var(--fgb-red-50)',     fg: 'var(--fgb-red-700)',    icon: Radio },
  ENDED:         { label: 'Encerrado',    bg: 'rgba(30,58,95,0.08)',   fg: 'var(--fgb-navy-800)',   icon: ShieldCheck },
  CONFIRMED:     { label: 'Confirmado',   bg: 'var(--fgb-green-50)',   fg: 'var(--fgb-green-800)',  icon: CheckCircle2 },
  PUBLISHED:     { label: 'Publicado',    bg: 'var(--fgb-green-700)',  fg: '#fff',                   icon: Send },
  UNDER_REVIEW:  { label: 'Em revisão',   bg: 'var(--fgb-yellow-500)', fg: 'var(--fgb-ink-900)',    icon: RotateCcw },
  CANCELLED:     { label: 'Cancelado',    bg: 'var(--fgb-ink-200)',    fg: 'var(--fgb-ink-700)',    icon: X },
  POSTPONED:     { label: 'Adiado',       bg: 'var(--fgb-yellow-50)',  fg: 'var(--fgb-yellow-800)', icon: RotateCcw },
}

interface Props {
  championshipId: string
  gameId: string
  homeTeamName: string
  awayTeamName: string
  lifecycleState?: GameLifecycleState
}

export function GameStepNav({ championshipId, gameId, homeTeamName, awayTeamName, lifecycleState }: Props) {
  const pathname = usePathname()
  const hubPath  = `/admin/championships/${championshipId}/jogos/${gameId}`

  if (pathname === hubPath) return null

  const activeSegment = STEPS.find(s => pathname.endsWith(`/${s.segment}`))?.segment
  const meta = lifecycleState ? STATE_META[lifecycleState] : null

  return (
    <div className="mb-5 flex flex-wrap items-center gap-3 rounded-2xl border border-[var(--border)] bg-white px-4 py-3 shadow-sm">
      <Link
        href={hubPath}
        className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-[var(--gray)] hover:text-[var(--black)] transition-colors shrink-0"
      >
        <ArrowLeft className="h-3 w-3" /> Jogo
      </Link>

      <span className="hidden sm:inline text-[10px] text-[var(--gray)] shrink-0">
        {homeTeamName} × {awayTeamName}
      </span>

      {/* Lifecycle badge (Fase 7) */}
      {meta && (() => {
        const Icon = meta.icon
        return (
          <span
            className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[9px] font-black uppercase tracking-widest shrink-0"
            style={{ background: meta.bg, color: meta.fg, border: `1px solid ${meta.fg}22` }}
            title={`Estado FGB: ${meta.label}`}
          >
            <Icon className="h-3 w-3" aria-hidden />
            {meta.label}
          </span>
        )
      })()}

      <div className="flex flex-wrap gap-1.5 ml-auto">
        {STEPS.map(step => {
          const href     = `${hubPath}/${step.segment}`
          const isActive = step.segment === activeSegment
          return (
            <Link
              key={step.segment}
              href={href}
              className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[9px] font-black uppercase tracking-widest transition-colors"
              style={
                isActive
                  ? { background: 'var(--verde)', color: 'white' }
                  : { background: 'var(--gray-l)', color: 'var(--gray)', border: '1px solid var(--border)' }
              }
            >
              <span style={{ opacity: isActive ? 0.8 : 0.5 }}>{step.num}</span>&nbsp;{step.label}
            </Link>
          )
        })}
      </div>
    </div>
  )
}
