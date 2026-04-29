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

const SCORING_TYPES = new Set(['SHOT_MADE_2', 'SHOT_MADE_3', 'FREE_THROW_MADE'])

function eventTone(eventType: string) {
  if (SCORING_TYPES.has(eventType)) return 'scoring'
  if (eventType.startsWith('FOUL_')) return 'foul'
  if (eventType === 'TURNOVER') return 'turnover'
  if (
    eventType === 'GAME_START' ||
    eventType === 'PERIOD_START' ||
    eventType === 'HALFTIME_START' ||
    eventType === 'GAME_END' ||
    eventType === 'PERIOD_END' ||
    eventType === 'HALFTIME_END'
  ) {
    return 'control'
  }
  return 'neutral'
}

function rowToneClasses(tone: ReturnType<typeof eventTone>) {
  switch (tone) {
    case 'scoring':
      return 'border-[#F5C200]/30 bg-[#F5C200]/10'
    case 'foul':
      return 'border-[#CC1016]/20 bg-[#CC1016]/6'
    case 'turnover':
      return 'border-slate-200 bg-slate-50'
    case 'control':
      return 'border-[var(--border)] bg-[var(--gray-l)]'
    default:
      return 'border-[var(--border)] bg-white'
  }
}

function EventRow({ event }: { event: PlayByPlayEvent }) {
  const tone = eventTone(event.eventType)
  const hasScore = event.homeScoreAfter !== null && event.awayScoreAfter !== null

  return (
    <div
      className={`grid grid-cols-[3.75rem_minmax(0,1fr)_4.5rem] gap-3 rounded-2xl border px-3 py-3 sm:grid-cols-[4.5rem_minmax(0,1fr)_6.25rem] sm:px-4 ${rowToneClasses(tone)}`}
    >
      <div className="text-right text-[11px] font-semibold tabular-nums text-[var(--gray)]">
        {event.clockTime || '--'}
      </div>

      <div className="min-w-0">
        <div className="flex items-start gap-2">
          {tone === 'scoring' ? (
            <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-[#F5C200]" />
          ) : tone === 'foul' ? (
            <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-[#CC1016]" />
          ) : tone === 'turnover' ? (
            <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-slate-400" />
          ) : (
            <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-[var(--gray)]/30" />
          )}
          <div className="min-w-0">
            <p
              className={`text-sm leading-snug ${
                tone === 'control'
                  ? 'text-[11px] font-black uppercase tracking-widest text-[var(--gray)]'
                  : 'font-semibold text-[var(--black)]'
              }`}
            >
              {event.description}
            </p>
            {event.teamName && tone !== 'control' ? (
              <p className="mt-1 truncate text-[10px] text-[var(--gray)]">{event.teamName}</p>
            ) : null}
          </div>
        </div>
      </div>

      <div className="text-right text-sm font-black tabular-nums text-[var(--black)] sm:text-base">
        {hasScore ? `${event.homeScoreAfter} - ${event.awayScoreAfter}` : '--'}
      </div>
    </div>
  )
}

function PeriodSection({ group }: { group: PeriodGroup }) {
  return (
    <div className="fgb-card p-0">
      <div className="border-b border-[var(--border)] bg-[var(--gray-l)] px-4 py-3">
        <span className="text-[10px] font-black uppercase tracking-widest text-[var(--black)]">
          {group.label}
        </span>
        <span className="ml-2 text-[10px] text-[var(--gray)]">
          {group.events.length} evento{group.events.length !== 1 ? 's' : ''}
        </span>
      </div>
      <div className="space-y-2 p-3 sm:p-4">
        {group.events.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[var(--border)] px-4 py-6 text-center text-sm text-[var(--gray)]">
            Sem eventos neste periodo.
          </div>
        ) : (
          group.events.map((event) => <EventRow key={event.id} event={event} />)
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
        O play-by-play sera exibido assim que o jogo comecar.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="fgb-card px-4 py-3">
        <div className="grid grid-cols-[3.75rem_minmax(0,1fr)_4.5rem] gap-3 text-[10px] font-black uppercase tracking-widest text-[var(--gray)] sm:grid-cols-[4.5rem_minmax(0,1fr)_6.25rem]">
          <span className="text-right">Tempo</span>
          <span>Evento</span>
          <span className="text-right">Placar</span>
        </div>
      </div>

      {[...gamePeriods].reverse().map((group) => (
        <PeriodSection key={group.period} group={group} />
      ))}
    </div>
  )
}
