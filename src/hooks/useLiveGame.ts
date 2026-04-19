'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

export type LiveAction =
  | 'SCORE'
  | 'FOUL'
  | 'REBOUND'
  | 'ASSIST'
  | 'STEAL'
  | 'BLOCK'
  | 'SUBSTITUTION'
  | 'TIMEOUT'
  | 'START_PERIOD'
  | 'END_PERIOD'
  | 'VIOLATION'
  | 'CANCEL_LAST_EVENT'

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
  athleteName?: string | null
  description?: string | null
  sequence?: number
  sequenceNumber?: number
  createdAt: string
  homeScoreAfter?: number | null
  awayScoreAfter?: number | null
}

export type LivePlayerStatLine = {
  id: string
  gameId: string
  teamId: string
  athleteId: string
  points: number
  fouls: number
  assists: number
  steals: number
  blocks: number
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

type PossessionSide = 'home' | 'away' | null

function toNumber(value: unknown, fallback = 0) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function parseClockDisplay(clockDisplay?: string | null) {
  const safe = String(clockDisplay || '').trim()
  if (!safe) return 10 * 60 * 1000
  const [rawMinutes, rawSeconds] = safe.split(':')
  const minutes = toNumber(rawMinutes, 10)
  const seconds = toNumber(rawSeconds, 0)
  return Math.max(0, Math.trunc(minutes * 60_000 + seconds * 1_000))
}

function formatClock(clockMs: number) {
  const safeMs = Math.max(0, Math.trunc(clockMs))
  const totalSeconds = Math.floor(safeMs / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

function cloneSnapshot(snapshot: LiveGameSnapshot) {
  return JSON.parse(JSON.stringify(snapshot)) as LiveGameSnapshot
}

function applyOptimisticUpdate(snapshot: LiveGameSnapshot, action: LiveAction, payload: Record<string, unknown>) {
  const next = cloneSnapshot(snapshot)
  const teamId = String(payload.teamId || '')
  const athleteId = String(payload.athleteId || '')
  const points = Math.max(0, Math.trunc(toNumber(payload.points, 0)))
  const period = Math.max(1, Math.trunc(toNumber(payload.period, next.currentPeriod || 1)))
  const clockMs = Math.max(0, Math.trunc(toNumber(payload.clockMs, parseClockDisplay(next.clockDisplay))))
  const clockDisplay = formatClock(clockMs)
  const now = new Date().toISOString()

  next.currentPeriod = period
  next.clockDisplay = clockDisplay

  if (action === 'SCORE') {
    if (teamId === next.homeTeamId) next.homeScore += points
    if (teamId === next.awayTeamId) next.awayScore += points
  }
  if (action === 'FOUL') {
    if (teamId === next.homeTeamId) next.homeTeamFoulsCurrentPeriod += 1
    if (teamId === next.awayTeamId) next.awayTeamFoulsCurrentPeriod += 1
  }
  if (action === 'TIMEOUT') {
    if (teamId === next.homeTeamId) next.homeTimeoutsUsed += 1
    if (teamId === next.awayTeamId) next.awayTimeoutsUsed += 1
  }
  if (action === 'START_PERIOD') {
    next.liveStatus = 'LIVE'
  }
  if (action === 'END_PERIOD') {
    next.liveStatus = period >= 4 ? 'FINISHED' : 'HALFTIME'
  }
  if (action === 'SUBSTITUTION') {
    const athleteOutId = String(payload.athleteOutId || '')
    const athleteInId = String(payload.athleteInId || '')
    const roster = next.gameRosters.find((entry) => entry.teamId === teamId)
    if (roster) {
      if (athleteOutId) {
        const athleteOut = roster.players.find((entry) => entry.athleteId === athleteOutId)
        if (athleteOut) athleteOut.isOnCourt = false
      }
      if (athleteInId) {
        const athleteIn = roster.players.find((entry) => entry.athleteId === athleteInId)
        if (athleteIn) athleteIn.isOnCourt = true
      }
    }
  }

  if (action !== 'CANCEL_LAST_EVENT') {
    next.gameEvents.unshift({
      id: `optimistic-${Date.now()}`,
      type: action,
      period,
      clockMs,
      clockTime: clockDisplay,
      teamId: teamId || null,
      athleteId: athleteId || null,
      createdAt: now,
      homeScoreAfter: next.homeScore,
      awayScoreAfter: next.awayScore,
      description: action,
    })
  }

  return next
}

export function useLiveGame(gameId: string) {
  const [game, setGame] = useState<LiveGameSnapshot | null>(null)
  const [gameClockMs, setGameClockMs] = useState(10 * 60 * 1000)
  const [shotClockMs, setShotClockMs] = useState(24_000)
  const [isClockRunning, setIsClockRunning] = useState(false)
  const [possession, setPossession] = useState<PossessionSide>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const gameRef = useRef<LiveGameSnapshot | null>(null)

  const applyServerSnapshot = useCallback(
    (snapshot: LiveGameSnapshot) => {
      gameRef.current = snapshot
      setGame(snapshot)
      if (!isClockRunning) {
        const parsedClock = parseClockDisplay(snapshot.clockDisplay)
        const periodFallback = Math.max(1, snapshot.currentPeriod || 1) * 10 * 60 * 1000
        setGameClockMs(parsedClock || periodFallback)
      }
    },
    [isClockRunning]
  )

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
        if (!cancelled) setError(currentError instanceof Error ? currentError.message : 'Erro ao carregar live')
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
      setGameClockMs((current) => Math.max(0, current - 100))
      setShotClockMs((current) => Math.max(0, current - 100))
    }, 100)
    return () => window.clearInterval(interval)
  }, [isClockRunning])

  useEffect(() => {
    if (!gameId) return
    const interval = window.setInterval(() => {
      void fetchSnapshot().catch(() => {
        /* noop: polling resiliente */
      })
    }, 2500)
    return () => window.clearInterval(interval)
  }, [fetchSnapshot, gameId])

  const executeAction = useCallback(
    async (action: LiveAction, payload: Record<string, unknown> = {}) => {
      if (!gameId) return

      if (gameRef.current) {
        const optimistic = applyOptimisticUpdate(gameRef.current, action, payload)
        gameRef.current = optimistic
        setGame(optimistic)
      }

      if (action === 'SCORE') {
        const teamId = String(payload.teamId || '')
        if (teamId && gameRef.current) {
          setPossession(teamId === gameRef.current.homeTeamId ? 'away' : 'home')
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
        setError(currentError instanceof Error ? currentError.message : 'Falha na acao live')
        await fetchSnapshot()
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
    const onCourt = roster.players.filter((entry) => entry.isOnCourt)
    if (onCourt.length > 0) return onCourt
    const starters = roster.players.filter((entry) => entry.isStarter).slice(0, 5)
    return starters.length > 0 ? starters : roster.players.slice(0, 5)
  }, [game])

  const awayLineup = useMemo(() => {
    if (!game) return [] as LiveRosterPlayer[]
    const roster = game.gameRosters.find((entry) => entry.teamId === game.awayTeamId)
    if (!roster) return [] as LiveRosterPlayer[]
    const onCourt = roster.players.filter((entry) => entry.isOnCourt)
    if (onCourt.length > 0) return onCourt
    const starters = roster.players.filter((entry) => entry.isStarter).slice(0, 5)
    return starters.length > 0 ? starters : roster.players.slice(0, 5)
  }, [game])

  const events = useMemo(() => {
    return game?.gameEvents ?? []
  }, [game])

  const stats = useMemo(() => {
    return {
      players: game?.livePlayerStatLines ?? [],
      teams: game?.liveTeamStatLines ?? [],
    }
  }, [game])

  return {
    game,
    homeLineup,
    awayLineup,
    events,
    stats,
    clockMs: gameClockMs,
    shotClockMs,
    isClockRunning,
    possession,
    executeAction,
    startClock,
    stopClock,
    resetShotClock,
    isLoading,
    error,
  }
}

