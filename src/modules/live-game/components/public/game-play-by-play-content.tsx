'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useGameData } from './game-data-provider'

type PlayByPlayEvent = {
  id: string
  sequenceNumber: number
  clockTime: string | null
  eventType: string
  description: string
  teamId: string | null
  teamName: string | null
  athleteId: string | null
  athleteName: string | null
  homeScoreAfter: number | null
  awayScoreAfter: number | null
  pointsDelta: number
}

type PeriodGroup = {
  period: number
  label: string
  events: PlayByPlayEvent[]
}

const SCORING_TYPES = new Set([
  'SHOT_MADE_2',
  'SHOT_MADE_3',
  'FREE_THROW_MADE',
])

function eventTone(eventType: string) {
  if (SCORING_TYPES.has(eventType)) return 'scoring'
  if (eventType.startsWith('FOUL_')) return 'foul'
  if (eventType === 'TURNOVER') return 'turnover'
  if (eventType === 'GAME_START' || eventType === 'PERIOD_START' || eventType === 'HALFTIME_START') return 'control'
  if (eventType === 'GAME_END' || eventType === 'PERIOD_END' || eventType === 'HALFTIME_END') return 'control'
  return 'neutral'
}

function EventRow({ event, homeTeamName }: { event: PlayByPlayEvent; homeTeamName: string }) {
  const tone = eventTone(event.eventType)
  const isHome = event.teamName === homeTeamName
  const hasScore = event.homeScoreAfter !== null && event.awayScoreAfter !== null

  return (
    <div
      className={`flex items-start gap-3 px-4 py-2.5 ${
        tone === 'scoring'
          ? 'bg-[var(--verde)]/5'
          : tone === 'control'
          ? 'bg-[var(--gray-l)]'
          : 'bg-white'
      } border-t border-[var(--border)] first:border-t-0`}
    >
      {/* Clock */}
      <span className="shrink-0 w-12 text-right text-[11px] font-semibold text-[var(--gray)] tabular-nums mt-0.5">
        {event.clockTime || '—'}
      </span>

      {/* Description */}
      <div className="flex-1 min-w-0">
        <p
          className={`text-sm leading-snug ${
            tone === 'scoring'
              ? 'font-semibold text-[var(--black)]'
              : tone === 'control'
              ? 'font-black text-[10px] uppercase tracking-widest text-[var(--gray)]'
              : 'text-[var(--black)]'
          }`}
        >
          {tone === 'scoring' && (
            <span className="mr-1.5 inline-flex h-4 w-4 items-center justify-center rounded bg-[var(--verde)] text-[9px] font-black text-white">
              +{event.pointsDelta}
            </span>
          )}
          {event.description}
        </p>
        {event.teamName && tone !== 'control' && (
          <p className="text-[10px] text-[var(--gray)]">{event.teamName}</p>
        )}
      </div>

      {/* Running score */}
      {hasScore && (
        <span className="shrink-0 text-xs font-semibold tabular-nums text-[var(--gray)]">
          <span className={isHome ? 'font-black text-[var(--black)]' : ''}>
            {event.homeScoreAfter}
          </span>
          {' – '}
          <span className={!isHome ? 'font-black text-[var(--black)]' : ''}>
            {event.awayScoreAfter}
          </span>
        </span>
      )}
    </div>
  )
}

function PeriodSection({
  group,
  homeTeamName,
}: {
  group: PeriodGroup
  homeTeamName: string
}) {
  return (
    <div className="fgb-card overflow-hidden p-0">
      <div className="border-b border-[var(--border)] bg-[var(--gray-l)] px-4 py-3">
        <span className="text-[10px] font-black uppercase tracking-widest text-[var(--black)]">
          {group.label}
        </span>
        <span className="ml-2 text-[10px] text-[var(--gray)]">
          {group.events.length} evento{group.events.length !== 1 ? 's' : ''}
        </span>
      </div>
      <div>
        {group.events.length === 0 ? (
          <div className="px-4 py-6 text-center text-sm text-[var(--gray)]">
            Sem eventos neste período.
          </div>
        ) : (
          group.events.map((event) => (
            <EventRow key={event.id} event={event} homeTeamName={homeTeamName} />
          ))
        )}
      </div>
    </div>
  )
}

function getPollDelay(isLive: boolean, isFinished: boolean) {
  if (isLive) return 10000
  if (isFinished) return 0
  return 30000
}

export function GamePlayByPlayContent() {
  const { gameId, data: gameData } = useGameData()

  const [periods, setPeriods] = useState<PeriodGroup[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const mountedRef = useRef(true)
  const inFlightRef = useRef(false)
  const hasLoadedRef = useRef(false)

  const fetchPlayByPlay = useCallback(
    async (silent = true) => {
      if (inFlightRef.current || !mountedRef.current) return
      inFlightRef.current = true
      if (!silent && !hasLoadedRef.current) setIsLoading(true)

      try {
        const res = await fetch(`/api/public/games/${gameId}/play-by-play`, { cache: 'no-store' })
        const payload = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(payload.error || 'Erro ao carregar play-by-play')

        if (mountedRef.current) {
          setPeriods(payload.periods ?? [])
          setError(null)
          hasLoadedRef.current = true
        }
      } catch (err: any) {
        if (mountedRef.current) setError(err.message || 'Erro ao carregar play-by-play')
      } finally {
        inFlightRef.current = false
        if (mountedRef.current) setIsLoading(false)
      }
    },
    [gameId]
  )

  useEffect(() => {
    mountedRef.current = true
    let cancelled = false

    const scheduleNext = (delay: number) => {
      if (cancelled || !mountedRef.current || delay === 0) return
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(tick, delay)
    }

    const tick = async () => {
      if (cancelled || !mountedRef.current) return
      if (document.visibilityState === 'hidden') return
      await fetchPlayByPlay(true)
      const isLive = gameData?.game?.isLive ?? false
      const isFinished = gameData?.game?.isFinished ?? false
      scheduleNext(getPollDelay(isLive, isFinished))
    }

    fetchPlayByPlay(false).then(() => {
      if (cancelled) return
      const isLive = gameData?.game?.isLive ?? false
      const isFinished = gameData?.game?.isFinished ?? false
      scheduleNext(getPollDelay(isLive, isFinished))
    })

    return () => {
      cancelled = true
      mountedRef.current = false
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [fetchPlayByPlay, gameData?.game?.isLive, gameData?.game?.isFinished])

  const homeTeamName = gameData?.homeTeam?.name ?? ''

  if (isLoading && periods.length === 0) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-32 rounded-[28px] bg-[var(--gray-l)]" />
        <div className="h-32 rounded-[28px] bg-[var(--gray-l)]" />
      </div>
    )
  }

  if (error && periods.length === 0) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        {error}
      </div>
    )
  }

  const gamePeriods = periods.filter((p) => p.period > 0)
  const preGame = periods.find((p) => p.period === 0)

  if (gamePeriods.length === 0 && (!preGame || preGame.events.length === 0)) {
    return (
      <div className="rounded-[28px] border border-dashed border-[var(--border)] p-10 text-center text-sm text-[var(--gray)]">
        O play-by-play será exibido assim que o jogo começar.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Game periods in reverse order (most recent first) */}
      {[...gamePeriods].reverse().map((group) => (
        <PeriodSection key={group.period} group={group} homeTeamName={homeTeamName} />
      ))}
    </div>
  )
}
