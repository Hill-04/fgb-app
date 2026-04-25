'use client'

import { useEffect, useState } from 'react'
import { ArrowBigLeftDash, ArrowBigRightDash, RadioTower } from 'lucide-react'

import type { LiveGameTableModel, LiveTableSide, LiveTableTeam } from '../live-game-table-adapter'
import type { RecentLiveInteraction } from './live-fiba-table'

type LiveFibaScoreboardProps = {
  tableModel: LiveGameTableModel
  visualShotClock: number
  operatorFocusTeamId?: string
  recentInteraction?: RecentLiveInteraction | null
  isSyncing?: boolean
  pendingCount?: number
}

function TeamMetaPill({
  label,
  value,
  highlight = false,
  aggressive = false,
}: {
  label: string
  value: number | string
  highlight?: boolean
  aggressive?: boolean
}) {
  return (
    <div
      className={[
        'rounded-2xl border px-3 py-2 text-center transition',
        highlight ? 'border-[#F5C200]/35 bg-[#F5C200]/12 text-[#F5C200]' : 'border-white/10 bg-white/[0.05] text-white',
        aggressive ? 'ring-2 ring-[#CC1016]/45' : '',
      ].join(' ')}
    >
      <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/45">{label}</p>
      <p className="mt-1 text-xl font-black leading-none">{value}</p>
    </div>
  )
}

function TeamScoreBlock({
  team,
  side,
  possessionSide,
  flash,
  operatorFocused,
  recentInteraction,
}: {
  team: LiveTableTeam
  side: LiveTableSide
  possessionSide: LiveTableSide | null
  flash: boolean
  operatorFocused: boolean
  recentInteraction?: RecentLiveInteraction | null
}) {
  const isHome = side === 'home'
  const interactionForTeam = recentInteraction?.teamId === team.id
  const eventType = recentInteraction?.eventType ?? ''
  const foulBurst = interactionForTeam && eventType.includes('FOUL')
  const timeoutBurst = interactionForTeam && eventType === 'TIMEOUT_CONFIRMED'
  const scoreFlashClass = flash ? (isHome ? 'ring-4 ring-emerald-300/75 ring-offset-0' : 'ring-4 ring-[#FF7A7F]/85 ring-offset-0') : ''

  return (
    <section
      className={[
        'relative overflow-hidden rounded-[28px] border p-4 shadow-[0_26px_70px_rgba(0,0,0,0.38)] transition',
        isHome
          ? 'border-[#145530]/55 bg-[linear-gradient(135deg,rgba(8,28,17,0.98),rgba(20,85,48,0.94))]'
          : 'border-[#CC1016]/55 bg-[linear-gradient(135deg,rgba(37,7,8,0.98),rgba(204,16,22,0.9))]',
        scoreFlashClass,
        foulBurst ? 'ring-4 ring-[#CC1016]/65 ring-offset-0' : '',
        timeoutBurst ? 'ring-4 ring-sky-300/65 ring-offset-0' : '',
        operatorFocused ? 'shadow-[0_0_0_1px_rgba(245,194,0,0.45),0_26px_70px_rgba(0,0,0,0.42)]' : '',
      ].join(' ')}
    >
      <div className="absolute inset-0 opacity-[0.08] [background-image:linear-gradient(90deg,#fff_1px,transparent_1px),linear-gradient(#fff_1px,transparent_1px)] [background-size:26px_26px]" />
      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-white/58">
              {isHome ? 'Mandante' : 'Visitante'}
            </p>
            {possessionSide === side ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-[#F5C200]/45 bg-[#F5C200]/14 px-2 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-[#F5C200]">
                {isHome ? <ArrowBigLeftDash className="h-3.5 w-3.5" /> : <ArrowBigRightDash className="h-3.5 w-3.5" />}
                Posse
              </span>
            ) : null}
            {team.inBonus ? (
              <span className="rounded-full border border-[#F5C200]/35 bg-[#F5C200]/14 px-2 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-[#F5C200]">
                Bonus
              </span>
            ) : null}
            {timeoutBurst ? (
              <span className="rounded-full border border-sky-300/45 bg-sky-400/16 px-2 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-sky-100">
                Timeout
              </span>
            ) : null}
          </div>
          <h2 className="mt-2 truncate text-[clamp(1.4rem,2.2vw,2.3rem)] font-black uppercase leading-none tracking-[0.03em] text-white">
            {team.shortName}
          </h2>
          <p className="mt-1 truncate text-xs font-semibold uppercase tracking-[0.16em] text-white/45">{team.name}</p>
        </div>

        <div className="rounded-[22px] border border-white/12 bg-black/20 px-4 py-3 text-center">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/42">Coach</p>
          <p className="mt-1 max-w-[140px] truncate text-sm font-black uppercase tracking-[0.06em] text-white">
            {team.coachName}
          </p>
        </div>
      </div>

      <div className="relative mt-4 grid items-end gap-4 xl:grid-cols-[1fr_auto]">
        <div className="flex items-end gap-4">
          <div
            className={[
              'text-[clamp(5rem,8vw,8rem)] font-black leading-none tracking-[-0.08em] text-white transition-transform duration-150',
              flash ? 'scale-[1.06]' : '',
            ].join(' ')}
          >
            {team.score}
          </div>
          <div className="pb-2">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/42">Pontos</p>
            <p className="mt-1 text-sm font-bold uppercase tracking-[0.12em] text-white/70">
              {team.side === 'home' ? 'Controle local' : 'Controle visitante'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 xl:min-w-[210px]">
          <TeamMetaPill label="Fouls" value={team.fouls} highlight={team.inBonus} aggressive={foulBurst} />
          <TeamMetaPill label="TM" value={team.remainingTimeouts} aggressive={timeoutBurst} />
          <TeamMetaPill label="REB" value={team.rebounds} />
          <TeamMetaPill label="AST" value={team.assists} />
        </div>
      </div>
    </section>
  )
}

export function LiveFibaScoreboard({
  tableModel,
  visualShotClock,
  operatorFocusTeamId = '',
  recentInteraction = null,
  isSyncing = false,
  pendingCount = 0,
}: LiveFibaScoreboardProps) {
  const [flashSide, setFlashSide] = useState<LiveTableSide | null>(null)
  const [scoreState, setScoreState] = useState({ home: tableModel.home.score, away: tableModel.away.score })

  useEffect(() => {
    if (tableModel.home.score === scoreState.home && tableModel.away.score === scoreState.away) {
      return
    }

    const changedSide: LiveTableSide = tableModel.home.score !== scoreState.home ? 'home' : 'away'
    setFlashSide(changedSide)
    setScoreState({ home: tableModel.home.score, away: tableModel.away.score })

    const timeoutId = window.setTimeout(() => {
      setFlashSide((current) => (current === changedSide ? null : current))
    }, 420)

    return () => window.clearTimeout(timeoutId)
  }, [scoreState.away, scoreState.home, tableModel.away.score, tableModel.home.score])

  const shotClockUrgent = visualShotClock <= 5

  return (
    <div className="rounded-[30px] border border-white/10 bg-[#070a10]/95 p-3 text-white shadow-[0_30px_90px_rgba(0,0,0,0.46)] backdrop-blur-xl">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3 px-2">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#F5C200]">FGB live control</p>
          <h1 className="mt-1 text-[clamp(1.2rem,1.8vw,1.8rem)] font-black uppercase tracking-[0.04em] text-white">
            {tableModel.championshipName}
          </h1>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/42">
            {tableModel.categoryName} / {tableModel.venueLabel}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-white/68">
            {tableModel.liveStatus}
          </span>
          <span
            className={[
              'inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em]',
              isSyncing ? 'bg-[#F5C200] text-black' : 'bg-[#145530]/32 text-emerald-100',
            ].join(' ')}
          >
            <RadioTower className="h-3.5 w-3.5" />
            {isSyncing ? `Sync ${pendingCount}` : 'Stable'}
          </span>
        </div>
      </div>

      <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_300px_minmax(0,1fr)]">
        <TeamScoreBlock
          team={tableModel.home}
          side="home"
          possessionSide={tableModel.possessionSide}
          flash={flashSide === 'home'}
          operatorFocused={operatorFocusTeamId === tableModel.home.id}
          recentInteraction={recentInteraction}
        />

        <section className="grid rounded-[28px] border border-white/10 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),rgba(7,10,16,0.98)_72%)] p-4 text-center shadow-[0_22px_60px_rgba(0,0,0,0.32)]">
          <div className="grid content-between gap-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-white/38">{tableModel.currentPeriodLabel}</p>
              <div className="mt-3 text-[clamp(3rem,5vw,4.5rem)] font-black leading-none tracking-[-0.06em] text-white">
                {tableModel.clockDisplay}
              </div>
              <p className="mt-2 text-[10px] font-black uppercase tracking-[0.22em] text-white/35">
                Periodo {tableModel.currentPeriod}
              </p>
            </div>

            <div className="rounded-[26px] border border-white/10 bg-black/35 px-4 py-4">
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-white/38">Shot clock</p>
              <div
                className={[
                  'mt-2 rounded-[22px] border px-4 py-4 text-[clamp(2.6rem,4vw,3.6rem)] font-black leading-none tracking-[-0.06em] transition-colors',
                  shotClockUrgent
                    ? 'border-[#CC1016]/70 bg-[#CC1016]/14 text-[#FFB4B7]'
                    : 'border-[#F5C200]/35 bg-[#F5C200]/10 text-[#F5C200]',
                ].join(' ')}
              >
                {Math.max(visualShotClock, 0)}
              </div>
              <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.18em] text-white/35">
                {shotClockUrgent ? 'Urgente / reset necessario' : 'Controle de posse visual'}
              </p>
            </div>

            <div className="grid grid-cols-4 gap-2">
              {tableModel.periodScores.length > 0 ? (
                tableModel.periodScores.slice(-4).map((period) => (
                  <div key={period.period} className="rounded-2xl border border-white/10 bg-white/[0.04] px-2 py-2 text-center">
                    <p className="text-[9px] font-black uppercase tracking-[0.18em] text-white/35">{period.label}</p>
                    <p className="mt-1 text-sm font-black text-white">
                      {period.homePoints}-{period.awayPoints}
                    </p>
                  </div>
                ))
              ) : (
                <div className="col-span-4 rounded-2xl border border-dashed border-white/10 bg-white/[0.03] px-4 py-3 text-[10px] font-black uppercase tracking-[0.18em] text-white/35">
                  Sem parciais registradas
                </div>
              )}
            </div>
          </div>
        </section>

        <TeamScoreBlock
          team={tableModel.away}
          side="away"
          possessionSide={tableModel.possessionSide}
          flash={flashSide === 'away'}
          operatorFocused={operatorFocusTeamId === tableModel.away.id}
          recentInteraction={recentInteraction}
        />
      </div>
    </div>
  )
}
