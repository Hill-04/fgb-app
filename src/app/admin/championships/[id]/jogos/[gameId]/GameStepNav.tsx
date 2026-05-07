'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'

const STEPS = [
  { segment: 'roster',       label: 'Roster',        num: '01' },
  { segment: 'stats',        label: 'Stats',         num: '02' },
  { segment: 'live',         label: 'Live',          num: '03' },
  { segment: 'encerramento', label: 'Encerramento',  num: '04' },
  { segment: 'sumula',       label: 'Súmula',        num: '05' },
  { segment: 'auditoria',    label: 'Auditoria',     num: '06' },
]

interface Props {
  championshipId: string
  gameId: string
  homeTeamName: string
  awayTeamName: string
}

export function GameStepNav({ championshipId, gameId, homeTeamName, awayTeamName }: Props) {
  const pathname = usePathname()
  const hubPath = `/admin/championships/${championshipId}/jogos/${gameId}`

  if (pathname === hubPath) return null

  const activeSegment = STEPS.find(s => pathname.endsWith(`/${s.segment}`))?.segment

  return (
    <div className="mb-5 flex flex-wrap items-center gap-3 rounded-2xl border border-[var(--border)] bg-white px-4 py-3 shadow-sm">
      <Link
        href={hubPath}
        className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-[var(--gray)] hover:text-[var(--black)] transition-colors shrink-0"
      >
        <ArrowLeft className="h-3 w-3" /> Hub
      </Link>

      <span className="hidden sm:inline text-[10px] text-[var(--gray)] shrink-0">
        {homeTeamName} × {awayTeamName}
      </span>

      <div className="flex flex-wrap gap-1.5 ml-auto">
        {STEPS.map(step => {
          const href = `${hubPath}/${step.segment}`
          const isActive = step.segment === activeSegment
          return (
            <Link
              key={step.segment}
              href={href}
              className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[9px] font-black uppercase tracking-widest transition-colors"
              style={isActive
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
