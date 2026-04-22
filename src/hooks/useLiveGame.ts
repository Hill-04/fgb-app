'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'

export type LiveAction =
  | 'SCORE_2'
  | 'SCORE_3'
  | 'FREE_THROW'
  | 'FREE_THROW_MISS'
  | 'MISS_2'
  | 'MISS_3'
  | 'PERSONAL_FOUL'
  | 'TECHNICAL_FOUL'
  | 'UNSPORTSMANLIKE_FOUL'
  | 'DISQUALIFYING_FOUL'
  | 'REBOUND_OFF'
  | 'REBOUND_DEF'
  | 'ASSIST'
  | 'STEAL'
  | 'BLOCK'
  | 'TURNOVER'
  | 'SUBSTITUTION'
  | 'TIMEOUT'
  | 'START_PERIOD'
  | 'END_PERIOD'
  | 'VIOLATION_24S'
  | 'VIOLATION_8S'
  | 'VIOLATION_3S'
  | 'BALL_OUT'
  | 'CANCEL_LAST_EVENT'

export type PossessionSide = 'HOME' | 'AWAY' | null

export type LiveTeam = {
  id: string
  name: string
  logoUrl?: string | null
}

export type LiveRosterPlayer = {
  id: string
  athleteId: string
  jerseyNumber: number | null
  isStarter: boolean
  isOnCourt: boolean
  isDisqualified?: boolean
  athlete: {
    id: string
    name: string
    jerseyNumber: number | null
    position?: string | null
  }
}

export type LiveRoster = {
  id: string
  teamId: string
  players: LiveRosterPlayer[]
}

export type LiveEvent = {
  id: string
  type?: string
  eventType?: string
  period: number
  clockMs?: number | null
  clockTime?: string | null
  teamId?: string | null
  athleteId?: string | null
  secondaryAthleteId?: string | null
  description?: string | null
  sequence?: number
  sequenceNumber?: number
  createdAt: string
  homeScoreAfter?: number | null
  awayScoreAfter?: number | null
  isCancelled?: boolean
}

export type LivePlayerStatLine = {
  id: string
  gameId: string
  teamId: string
  athleteId: string
  points: number
  fouls: number
  technicalFouls: number
  assists: number
  steals: number
  blocks: number
  turnovers: number
  reboundsOffensive: number
  reboundsDefensive: number
  reboundsTotal: number
  twoPtMade: number
  twoPtAttempted: number
  threePtMade: number
  threePtAttempted: number
  freeThrowsMade: number
  freeThrowsAttempted: number
  fgPct?: number
  threePct?: number
  freeThrowPct?: number
  athlete: {
    id: string
    name: string
    jerseyNumber: number | null
    position?: string | null
  }
}

export type LiveTeamStatLine = {
  id: string
  gameId: string
  teamId: string
  points: number
  fouls: number
  timeoutsUsed: number
  reboundsTotal: number
  assists: number
  steals: number
  blocks: number
  turnovers: number
  twoPtMade: number
  twoPtAttempted: number
  threePtMade: number
  threePtAttempted: number
  freeThrowsMade: number
  freeThrowsAttempted: number
}

export type LiveGameSnapshot = {
  id: string
  homeTeamId: string
  awayTeamId: string
  homeTeam: LiveTeam
  awayTeam: LiveTeam
  championship?: { id: string; name: string } | null
  category?: { id: string; name: string } | null
  homeScore: number
  awayScore: number
  currentPeriod: number
  liveStatus: string
  clockDisplay?: string | null
  homeTimeoutsUsed: number
  awayTimeoutsUsed: number
  homeTeamFoulsCurrentPeriod: number
  awayTeamFoulsCurrentPeriod: number
  gameRosters: LiveRoster[]
  gameEvents: LiveEvent[]
  livePlayerStatLines: LivePlayerStatLine[]
  liveTeamStatLines: LiveTeamStatLine[]
}

function toNumber(value: unknown, fallback = 0) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function periodDefaultMs(period: number) {
  return period > 4 ? 5 * 60 * 1000 : 10 * 60 * 1000
}

function parseClockDisplay(clockDisplay?: string | null, period = 1) {
  const safe = String(clockDisplay || '').trim()
  if (!safe) return periodDefaultMs(period)
  const [rawMinutes, rawSeconds] = safe.split(':')
  const minutes = toNumber(rawMinutes, 10)
  const seconds = toNumber(rawSeconds, 0)
  return Math.max(0, Math.trunc(minutes * 60_000 + seconds * 1_000))
}

function cloneSnapshot(snapshot: LiveGameSnapshot) {
  return JSON.parse(JSON.stringify(snapshot)) as LiveGameSnapshot
}

function applyScoreOptimistic(
  snapshot: LiveGameSnapshot,
  action: LiveAction,
  payload: Record<string, unknown>
) {
  if (!['SCORE_2', 'SCORE_3', 'FREE_THROW'].includes(action)) {
    return snapshot
  }

  const teamId = String(payload.teamId || '')
  const points = action === 'SCORE_3' ? 3 : action === 'FREE_THROW' ? 1 : 2
  const next = cloneSnapshot(snapshot)
  if (teamId === next.homeTeamId) next.homeScore += points
  if (teamId === next.awayTeamId) next.awayScore += points
  return next
}

export function useLiveGame(gameId: string) {
  const [game, setGame] = useState<LiveGameSnapshot | null>(null)
  const [clockMs, setClockMs] = useState(10 * 60 * 1000)
  const [shotClockMs, setShotClockMs] = useState(24_000)
  const [isClockRunning, setIsClockRunning] = useState(false)
  const [possession, setPossession] = useState<PossessionSide>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const initializedClockRef = useRef(false)
  const gameRef = useRef<LiveGameSnapshot | null>(null)

  const applyServerSnapshot = useCallback((snapshot: LiveGameSnapshot) => {
    gameRef.current = snapshot
    setGame(snapshot)

    if (!initializedClockRef.current) {
      const parsed = parseClockDisplay(snapshot.clockDisplay, snapshot.currentPeriod || 1)
      setClockMs(parsed)
      setShotClockMs(24_000)
      initializedClockRef.current = true
    }
  }, [])

  const fetchSnapshot = useCallback(async () => {
    if (!gameId) return
    const response = await fetch(`/api/admin/jogos/${gameId}/live`, { cache: 'no-store' })
    const payload = (await response.json().catch(() => ({}))) as Partial<LiveGameSnapshot> & { error?: string }
    if (!response.ok) {
      throw new Error(payload.error || 'Falha ao carregar live')
    }
    applyServerSnapshot(payload as LiveGameSnapshot)
  }, [applyServerSnapshot, gameId])

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      if (!gameId) {
        setIsLoading(false)
        return
      }
      setIsLoading(true)
      try {
        await fetchSnapshot()
        if (!cancelled) setError(null)
      } catch (currentError: unknown) {
        if (!cancelled) {
          const message = currentError instanceof Error ? currentError.message : 'Erro ao carregar live'
          setError(message)
        }
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [fetchSnapshot, gameId])

  useEffect(() => {
    if (!isClockRunning) return
    const interval = window.setInterval(() => {
      setClockMs((current) => {
        const next = Math.max(0, current - 100)
        if (next <= 0) {
          setIsClockRunning(false)
        }
        return next
      })
      setShotClockMs((current) => Math.max(0, current - 100))
    }, 100)
    return () => window.clearInterval(interval)
  }, [isClockRunning])

  useEffect(() => {
    if (!gameId) return
    const interval = window.setInterval(() => {
      void fetchSnapshot().catch(() => {
        /* polling resiliente */
      })
    }, 2500)
    return () => window.clearInterval(interval)
  }, [fetchSnapshot, gameId])

  const executeAction = useCallback(
    async (action: LiveAction, payload: Record<string, unknown> = {}) => {
      if (!gameId) return

      const previous = gameRef.current
      if (previous) {
        const optimistic = applyScoreOptimistic(previous, action, payload)
        if (optimistic !== previous) {
          gameRef.current = optimistic
          setGame(optimistic)
        }
      }

      try {
        const response = await fetch(`/api/admin/jogos/${gameId}/live`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action, payload }),
        })
        const data = (await response.json().catch(() => ({}))) as Partial<LiveGameSnapshot> & { error?: string }
        if (!response.ok) {
          throw new Error(data.error || `Falha ao executar ${action}`)
        }
        applyServerSnapshot(data as LiveGameSnapshot)
        setError(null)
      } catch (currentError: unknown) {
        const message = currentError instanceof Error ? currentError.message : 'Falha na acao live'
        setError(message)
        toast.error(message)
        if (previous) {
          gameRef.current = previous
          setGame(previous)
        }
        await fetchSnapshot().catch(() => {
          /* noop */
        })
        throw currentError
      }
    },
    [applyServerSnapshot, fetchSnapshot, gameId]
  )

  const startClock = useCallback(() => {
    setIsClockRunning(true)
  }, [])

  const stopClock = useCallback(() => {
    setIsClockRunning(false)
  }, [])

  const resetShotClock = useCallback((full = true) => {
    setShotClockMs(full ? 24_000 : 14_000)
  }, [])

  const homeLineup = useMemo(() => {
    if (!game) return [] as LiveRosterPlayer[]
    const roster = game.gameRosters.find((entry) => entry.teamId === game.homeTeamId)
    if (!roster) return [] as LiveRosterPlayer[]
    return roster.players.filter((entry) => entry.isOnCourt)
  }, [game])

  const awayLineup = useMemo(() => {
    if (!game) return [] as LiveRosterPlayer[]
    const roster = game.gameRosters.find((entry) => entry.teamId === game.awayTeamId)
    if (!roster) return [] as LiveRosterPlayer[]
    return roster.players.filter((entry) => entry.isOnCourt)
  }, [game])

  const events = useMemo(() => game?.gameEvents ?? [], [game])

  const stats = useMemo(
    () => ({
      players: game?.livePlayerStatLines ?? [],
      teams: game?.liveTeamStatLines ?? [],
    }),
    [game]
  )

  return {
    game,
    homeLineup,
    awayLineup,
    events,
    stats,
    clockMs,
    shotClockMs,
    isClockRunning,
    possession,
    isLoading,
    error,
    executeAction,
    startClock,
    stopClock,
    resetShotClock,
    setPossession,
  }
}
