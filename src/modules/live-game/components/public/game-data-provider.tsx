'use client'

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'

export type PeriodScore = {
  period: number
  label: string
  homePoints: number
  awayPoints: number
}

export type PublicLeader = {
  athleteName: string
  teamName: string
  value: number
} | null

export type PublicPlayerLine = {
  athleteId: string
  name: string
  jerseyNumber: number | null
  teamId: string
  teamName: string
  minutesPlayed: number
  efficiency: number
  points: number
  rebounds: number
  assists: number
  fouls: number
  steals: number
  blocks: number
  turnovers: number
  fgMade: number
  fgAttempted: number
  twoMade: number
  twoAttempted: number
  threeMade: number
  threeAttempted: number
  ftMade: number
  ftAttempted: number
  reboundsOffensive: number
  reboundsDefensive: number
  isStarter: boolean
  disqualified: boolean
  fouledOut: boolean
}

export type PublicTeamSummary = {
  teamId: string
  teamName: string
  points: number
  rebounds: number
  assists: number
  fouls: number
  turnovers: number
  steals: number
  blocks: number
}

export type PublicKeyMomentValue = {
  team: 'home' | 'away' | 'tie'
  value: number
  label: string
}

export type PublicLeadTrackerSegment = {
  team: 'home' | 'away' | 'tie'
  widthPct: number
}

export type PublicKeyMomentsData = {
  largestLead: PublicKeyMomentValue
  largestRun: PublicKeyMomentValue
  leadChanges: number
  ties: number
}

export type PublicGameAnalytics = {
  keyMoments: PublicKeyMomentsData
  leadTracker: PublicLeadTrackerSegment[]
  playerEfficiencies: Array<{ athleteId: string; efficiency: number }>
}

export type PublicGameData = {
  game: {
    id: string
    status: 'SCHEDULED' | 'LIVE' | 'FINISHED'
    isLive: boolean
    isFinished: boolean
    scheduledAt: string | null
    venue: string | null
    clockDisplay: string | null
    championship: string | null
    category: string | null
  }
  homeTeam: {
    id: string
    name: string
    shortName: string
    logoUrl: string | null
    score: number
  }
  awayTeam: {
    id: string
    name: string
    shortName: string
    logoUrl: string | null
    score: number
  }
  leaders: {
    points: PublicLeader
    assists: PublicLeader
    rebounds: PublicLeader
    steals: PublicLeader
    blocks: PublicLeader
  }
  recentEvents: Array<{
    period: number | null
    clockTime: string | null
    description: string
    teamName: string | null
    athleteName: string | null
    pointsDelta: number
    occurredAt: string | null
  }>
  keyMoments: PublicKeyMomentsData
  leadTracker: PublicLeadTrackerSegment[]
  analytics: PublicGameAnalytics
  teamSummary: {
    home: PublicTeamSummary
    away: PublicTeamSummary
  }
  boxScore: {
    homePlayers: PublicPlayerLine[]
    awayPlayers: PublicPlayerLine[]
  }
  periodScores: PeriodScore[]
  summary: {
    totalEvents: number
    lastEventAt: string | null
    currentPeriod: number | null
  }
}

type GameDataContextValue = {
  data: PublicGameData | null
  isLoading: boolean
  error: string | null
  updatedAt: string | null
  gameId: string
}

const GameDataContext = createContext<GameDataContextValue | null>(null)

function getPollDelay(data: PublicGameData | null) {
  if (data?.game?.isLive) return 5000
  if (data?.game?.isFinished) return 60000
  return 15000
}

export function GameDataProvider({
  gameId,
  children,
}: {
  gameId: string
  children: React.ReactNode
}) {
  const [data, setData] = useState<PublicGameData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [updatedAt, setUpdatedAt] = useState<string | null>(null)

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const inFlightRef = useRef(false)
  const mountedRef = useRef(true)
  const hasLoadedRef = useRef(false)
  const lastDataRef = useRef<PublicGameData | null>(null)

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const fetchData = useCallback(
    async (silent = true) => {
      if (inFlightRef.current || !mountedRef.current) return null
      inFlightRef.current = true
      if (!silent && !hasLoadedRef.current) setIsLoading(true)

      try {
        const res = await fetch(`/api/public/games/${gameId}/live`, { cache: 'no-store' })
        const payload = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(payload.error || 'Erro ao carregar dados do jogo')

        if (mountedRef.current) {
          setData(payload as PublicGameData)
          setError(null)
          setUpdatedAt(new Date().toISOString())
          hasLoadedRef.current = true
          lastDataRef.current = payload as PublicGameData
        }
        return payload as PublicGameData
      } catch (err: any) {
        if (mountedRef.current) setError(err.message || 'Erro ao carregar dados')
        return null
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
      if (cancelled || !mountedRef.current) return
      clearTimer()
      timerRef.current = setTimeout(tick, delay)
    }

    const tick = async () => {
      if (cancelled || !mountedRef.current) return
      if (document.visibilityState === 'hidden') return
      const result = await fetchData(true)
      scheduleNext(getPollDelay(result || lastDataRef.current))
    }

    const onVisibility = () => {
      if (cancelled || !mountedRef.current) return
      if (document.visibilityState === 'hidden') {
        clearTimer()
        return
      }
      tick()
    }

    document.addEventListener('visibilitychange', onVisibility)
    fetchData(false).then((result) => {
      if (cancelled) return
      scheduleNext(getPollDelay(result || lastDataRef.current))
    })

    return () => {
      cancelled = true
      mountedRef.current = false
      clearTimer()
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [clearTimer, fetchData])

  return (
    <GameDataContext.Provider value={{ data, isLoading, error, updatedAt, gameId }}>
      {children}
    </GameDataContext.Provider>
  )
}

export function useGameData() {
  const ctx = useContext(GameDataContext)
  if (!ctx) throw new Error('useGameData deve ser usado dentro de GameDataProvider')
  return ctx
}
