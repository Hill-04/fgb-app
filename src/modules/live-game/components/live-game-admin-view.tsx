'use client'

import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Clock3, Loader2 } from 'lucide-react'
import { buildAdminGamePath as buildCanonicalAdminGamePath } from '@/lib/admin-game-routing'
import {
  buildLiveGameTableModel,
  type LiveTablePlayer,
  type LiveTableTab,
} from './live-game-table-adapter'
import { LiveScoreboardFiba } from './live-scoreboard-fiba'
import { LiveTeamPanelFiba } from './live-team-panel-fiba'
import { LiveEventLogFiba } from './live-event-log-fiba'
import { LiveBoxscoreFiba } from './live-boxscore-fiba'
import { SumulaEletronicoView } from './sumula-eletronico-view'

type AdminViewMode = 'pregame' | 'live' | 'review' | 'report' | 'audit'

type LiveEnvelope = {
  snapshot: any
  lastSequenceNumber: number
  serverUpdatedAt: string
  lastEventId: string | null
}

type PendingMutation = {
  id: string
  signature: string
  requestBody: Record<string, unknown>
  optimisticSequenceNumber: number
  createdAt: number
}

const MODE_LABELS: Record<AdminViewMode, string> = {
  pregame: 'PrÃ©-jogo',
  live: 'Live',
  review: 'Encerramento',
  report: 'SÃºmula',
  audit: 'Auditoria',
}

const QUICK_EVENTS = [
  ['+2', 'SHOT_MADE_2', 2],
  ['+3', 'SHOT_MADE_3', 3],
  ['FT', 'FREE_THROW_MADE', 1],
  ['Reb O', 'REBOUND_OFFENSIVE'],
  ['Reb D', 'REBOUND_DEFENSIVE'],
  ['AST', 'ASSIST'],
  ['STL', 'STEAL'],
  ['BLK', 'BLOCK'],
  ['TOV', 'TURNOVER'],
  ['Falta', 'FOUL_PERSONAL'],
  ['Tempo', 'TIMEOUT_CONFIRMED'],
] as const

function buildAdminGameModePath(gameId: string, mode: AdminViewMode, championshipId?: string) {
  const modeMap: Record<AdminViewMode, 'roster' | 'live' | 'encerramento' | 'sumula' | 'auditoria'> = {
    pregame: 'roster',
    live: 'live',
    review: 'encerramento',
    report: 'sumula',
    audit: 'auditoria',
  }

  return buildCanonicalAdminGamePath(gameId, modeMap[mode], championshipId)
}

async function postJson(url: string, body: Record<string, unknown>) {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data.error || 'Erro na operaÃ§Ã£o')
  return data
}

function cloneSnapshot(snapshot: any) {
  return JSON.parse(JSON.stringify(snapshot))
}

function normalizeEnvelope(payload: any): LiveEnvelope {
  if (payload?.snapshot) {
    return payload as LiveEnvelope
  }

  const lastEvent = Array.isArray(payload?.events) && payload.events.length > 0
    ? payload.events[payload.events.length - 1]
    : null

  return {
    snapshot: payload,
    lastSequenceNumber: lastEvent?.sequenceNumber ?? 0,
    serverUpdatedAt: new Date().toISOString(),
    lastEventId: lastEvent?.id ?? null,
  }
}

function ensureTeamLine(snapshot: any, teamId: string) {
  snapshot.boxScore ||= { players: [], teams: [], periods: [] }
  let teamLine = snapshot.boxScore.teams.find((entry: any) => entry.teamId === teamId)
  if (!teamLine) {
    const teamName =
      snapshot.game.homeTeam.id === teamId
        ? snapshot.game.homeTeam.name
        : snapshot.game.awayTeam.id === teamId
          ? snapshot.game.awayTeam.name
          : 'Equipe'
    teamLine = {
      id: `temp-team-${teamId}`,
      teamId,
      teamName,
      points: 0,
      fouls: 0,
      timeoutsUsed: 0,
      reboundsTotal: 0,
      assists: 0,
      steals: 0,
      turnovers: 0,
      blocks: 0,
      twoPtMade: 0,
      twoPtAttempted: 0,
      threePtMade: 0,
      threePtAttempted: 0,
      freeThrowsMade: 0,
      freeThrowsAttempted: 0,
    }
    snapshot.boxScore.teams.push(teamLine)
  }
  return teamLine
}

function ensurePlayerLine(snapshot: any, teamId: string, athleteId?: string | null) {
  if (!athleteId) return null

  snapshot.boxScore ||= { players: [], teams: [], periods: [] }
  let playerLine = snapshot.boxScore.players.find((entry: any) => entry.athleteId === athleteId)

  if (!playerLine) {
    const rosterPlayer = snapshot.rosters
      ?.flatMap((roster: any) => roster.players || [])
      ?.find((player: any) => player.athleteId === athleteId)

    playerLine = {
      id: `temp-player-${athleteId}`,
      athleteId,
      athleteName: rosterPlayer?.athleteName || 'Atleta',
      jerseyNumber: rosterPlayer?.jerseyNumber ?? null,
      teamId,
      teamName:
        snapshot.game.homeTeam.id === teamId
          ? snapshot.game.homeTeam.name
          : snapshot.game.awayTeam.id === teamId
            ? snapshot.game.awayTeam.name
            : 'Equipe',
      minutesPlayed: 0,
      points: 0,
      fouls: 0,
      assists: 0,
      reboundsOffensive: 0,
      reboundsDefensive: 0,
      reboundsTotal: 0,
      steals: 0,
      blocks: 0,
      turnovers: 0,
      twoPtMade: 0,
      twoPtAttempted: 0,
      threePtMade: 0,
      threePtAttempted: 0,
      freeThrowsMade: 0,
      freeThrowsAttempted: 0,
      isStarter: Boolean(rosterPlayer?.isStarter),
      fouledOut: false,
      disqualified: false,
    }
    snapshot.boxScore.players.push(playerLine)
  }

  return playerLine
}

function ensurePeriodLine(snapshot: any, period: number) {
  snapshot.boxScore ||= { players: [], teams: [], periods: [] }
  let periodLine = snapshot.boxScore.periods.find((entry: any) => entry.period === period)
  if (!periodLine) {
    periodLine = {
      id: `temp-period-${period}`,
      period,
      homePoints: 0,
      awayPoints: 0,
    }
    snapshot.boxScore.periods.push(periodLine)
    snapshot.boxScore.periods.sort((left: any, right: any) => left.period - right.period)
  }
  return periodLine
}

function updateRosterPlayerOnCourt(snapshot: any, teamId: string, athleteId: string, isOnCourt: boolean) {
  const roster = snapshot.rosters?.find((entry: any) => entry.teamId === teamId)
  const player = roster?.players?.find((entry: any) => entry.athleteId === athleteId)
  if (player) {
    player.isOnCourt = isOnCourt
  }
}

function sortLeaders(snapshot: any) {
  snapshot.boxScore.players.sort((left: any, right: any) => {
    if (right.points !== left.points) return right.points - left.points
    if (right.reboundsTotal !== left.reboundsTotal) return right.reboundsTotal - left.reboundsTotal
    return left.athleteName.localeCompare(right.athleteName)
  })
}

function buildOptimisticDescription(snapshot: any, eventType: string, teamId?: string | null, athleteId?: string | null) {
  const athleteName = athleteId
    ? snapshot.rosters?.flatMap((roster: any) => roster.players || [])?.find((player: any) => player.athleteId === athleteId)?.athleteName
    : null
  const teamName =
    teamId === snapshot.game.homeTeam.id
      ? snapshot.game.homeTeam.name
      : teamId === snapshot.game.awayTeam.id
        ? snapshot.game.awayTeam.name
        : null

  const actor = athleteName || teamName || 'Equipe'

  switch (eventType) {
    case 'SHOT_MADE_2':
      return `${actor} converteu 2 pontos`
    case 'SHOT_MADE_3':
      return `${actor} converteu 3 pontos`
    case 'FREE_THROW_MADE':
      return `${actor} converteu lance livre`
    case 'REBOUND_OFFENSIVE':
      return `${actor} pegou rebote ofensivo`
    case 'REBOUND_DEFENSIVE':
      return `${actor} pegou rebote defensivo`
    case 'ASSIST':
      return `${actor} deu assistÃªncia`
    case 'STEAL':
      return `${actor} roubou a bola`
    case 'BLOCK':
      return `${actor} aplicou um toco`
    case 'TURNOVER':
      return `${actor} cometeu turnover`
    case 'FOUL_PERSONAL':
      return `${actor} cometeu falta`
    case 'TIMEOUT_CONFIRMED':
      return `${actor} pediu tempo`
    case 'SUBSTITUTION_IN':
      return `${actor} entrou em quadra`
    case 'SUBSTITUTION_OUT':
      return `${actor} saiu de quadra`
    case 'GAME_START':
      return 'Jogo iniciado'
    case 'PERIOD_START':
      return 'PerÃ­odo iniciado'
    case 'PERIOD_END':
      return 'PerÃ­odo encerrado'
    case 'HALFTIME_START':
      return 'Intervalo iniciado'
    case 'HALFTIME_END':
      return 'Intervalo encerrado'
    case 'GAME_END':
      return 'Jogo encerrado'
    default:
      return `${actor} registrou ${eventType}`
  }
}

function applyOptimisticEvent(snapshot: any, mutation: PendingMutation) {
  const next = cloneSnapshot(snapshot)
  const body = mutation.requestBody
  const eventType = String(body.eventType || '')
  const teamId = body.teamId ? String(body.teamId) : null
  const athleteId = body.athleteId ? String(body.athleteId) : null
  const period = Number(body.period || next.game.currentPeriod || 1)
  const clockTime = String(body.clockTime || next.game.clockDisplay || '10:00')
  const pointsDelta = body.pointsDelta !== undefined && body.pointsDelta !== null ? Number(body.pointsDelta) : null

  next.game.currentPeriod = period
  next.game.clockDisplay = clockTime

  const optimisticEvent = {
    id: mutation.id,
    sequenceNumber: mutation.optimisticSequenceNumber,
    period,
    clockTime,
    eventType,
    teamId,
    teamName:
      teamId === next.game.homeTeam.id
        ? next.game.homeTeam.name
        : teamId === next.game.awayTeam.id
          ? next.game.awayTeam.name
          : null,
    athleteId,
    athleteName:
      athleteId
        ? next.rosters?.flatMap((roster: any) => roster.players || [])?.find((player: any) => player.athleteId === athleteId)?.athleteName ?? null
        : null,
    secondaryAthleteId: null,
    secondaryAthleteName: null,
    pointsDelta,
    payload: {},
    createdAt: new Date().toISOString(),
    isReverted: false,
    correctionReason: null,
    isOptimistic: true,
    syncStatus: 'syncing',
    description: buildOptimisticDescription(next, eventType, teamId, athleteId),
  }

  next.events.push(optimisticEvent)

  if (teamId) {
    const teamLine = ensureTeamLine(next, teamId)
    const playerLine = ensurePlayerLine(next, teamId, athleteId)
    const periodLine = ensurePeriodLine(next, period)
    const isHome = teamId === next.game.homeTeam.id

    switch (eventType) {
      case 'SHOT_MADE_2':
        next.game[isHome ? 'homeScore' : 'awayScore'] += 2
        teamLine.points += 2
        teamLine.twoPtMade += 1
        teamLine.twoPtAttempted += 1
        if (playerLine) {
          playerLine.points += 2
          playerLine.twoPtMade += 1
          playerLine.twoPtAttempted += 1
        }
        if (isHome) periodLine.homePoints += 2
        else periodLine.awayPoints += 2
        break
      case 'SHOT_MADE_3':
        next.game[isHome ? 'homeScore' : 'awayScore'] += 3
        teamLine.points += 3
        teamLine.threePtMade += 1
        teamLine.threePtAttempted += 1
        if (playerLine) {
          playerLine.points += 3
          playerLine.threePtMade += 1
          playerLine.threePtAttempted += 1
        }
        if (isHome) periodLine.homePoints += 3
        else periodLine.awayPoints += 3
        break
      case 'FREE_THROW_MADE':
        next.game[isHome ? 'homeScore' : 'awayScore'] += 1
        teamLine.points += 1
        teamLine.freeThrowsMade += 1
        teamLine.freeThrowsAttempted += 1
        if (playerLine) {
          playerLine.points += 1
          playerLine.freeThrowsMade += 1
          playerLine.freeThrowsAttempted += 1
        }
        if (isHome) periodLine.homePoints += 1
        else periodLine.awayPoints += 1
        break
      case 'REBOUND_OFFENSIVE':
        teamLine.reboundsTotal += 1
        if (playerLine) {
          playerLine.reboundsOffensive += 1
          playerLine.reboundsTotal += 1
        }
        break
      case 'REBOUND_DEFENSIVE':
        teamLine.reboundsTotal += 1
        if (playerLine) {
          playerLine.reboundsDefensive += 1
          playerLine.reboundsTotal += 1
        }
        break
      case 'ASSIST':
        teamLine.assists += 1
        if (playerLine) playerLine.assists += 1
        break
      case 'STEAL':
        teamLine.steals += 1
        if (playerLine) playerLine.steals += 1
        break
      case 'BLOCK':
        teamLine.blocks += 1
        if (playerLine) playerLine.blocks += 1
        break
      case 'TURNOVER':
        teamLine.turnovers += 1
        if (playerLine) playerLine.turnovers += 1
        break
      case 'FOUL_PERSONAL':
        teamLine.fouls += 1
        if (playerLine) playerLine.fouls += 1
        next.game[isHome ? 'homeTeamFoulsCurrentPeriod' : 'awayTeamFoulsCurrentPeriod'] += 1
        break
      case 'TIMEOUT_CONFIRMED':
        teamLine.timeoutsUsed += 1
        next.game[isHome ? 'homeTimeoutsUsed' : 'awayTimeoutsUsed'] += 1
        break
      case 'SUBSTITUTION_IN':
        if (athleteId) updateRosterPlayerOnCourt(next, teamId, athleteId, true)
        break
      case 'SUBSTITUTION_OUT':
        if (athleteId) updateRosterPlayerOnCourt(next, teamId, athleteId, false)
        break
    }
  }

  switch (eventType) {
    case 'GAME_START':
      next.game.liveStatus = 'LIVE'
      break
    case 'PERIOD_START':
      next.game.liveStatus = 'LIVE'
      next.game.homeTeamFoulsCurrentPeriod = 0
      next.game.awayTeamFoulsCurrentPeriod = 0
      break
    case 'PERIOD_END':
      next.game.liveStatus = 'PERIOD_BREAK'
      break
    case 'HALFTIME_START':
      next.game.liveStatus = 'HALFTIME'
      break
    case 'HALFTIME_END':
      next.game.liveStatus = 'LIVE'
      break
    case 'GAME_END':
      next.game.liveStatus = 'FINAL_PENDING_CONFIRMATION'
      next.game.status = 'FINISHED'
      break
  }

  sortLeaders(next)
  return next
}

function reapplyPendingMutations(baseSnapshot: any, queue: PendingMutation[]) {
  let snapshot = cloneSnapshot(baseSnapshot)
  for (const mutation of queue) {
    snapshot = applyOptimisticEvent(snapshot, mutation)
  }
  return snapshot
}

function isSameActionSignature(signature: string, last: { signature: string; at: number } | null, now: number) {
  return Boolean(last && last.signature === signature && now - last.at < 450)
}

function resolveShotClockReset(eventType?: string) {
  switch (eventType) {
    case 'REBOUND_OFFENSIVE':
      return 14
    case 'REBOUND_DEFENSIVE':
    case 'SHOT_MADE_2':
    case 'SHOT_MADE_3':
    case 'FREE_THROW_MADE':
    case 'TURNOVER':
    case 'STEAL':
    case 'TIMEOUT_CONFIRMED':
    case 'PERIOD_START':
    case 'HALFTIME_END':
    case 'GAME_START':
      return 24
    default:
      return null
  }
}

export function LiveGameAdminView({
  gameId,
  mode,
  championshipId,
}: {
  gameId: string
  mode: AdminViewMode
  championshipId?: string
}) {
  const [data, setData] = useState<any>(null)
  const [isInitialLoading, setIsInitialLoading] = useState(true)
  const [isRefreshingInBackground, setIsRefreshingInBackground] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [selectedTeamId, setSelectedTeamId] = useState('')
  const [selectedAthleteId, setSelectedAthleteId] = useState('')
  const [selectedPeriod, setSelectedPeriod] = useState(1)
  const [clockTime, setClockTime] = useState('10:00')
  const [visualShotClock, setVisualShotClock] = useState(24)
  const [activeTab, setActiveTab] = useState<LiveTableTab>('home')
  const [pendingMutations, setPendingMutations] = useState<PendingMutation[]>([])

  const endpoint = `/api/admin/games/${gameId}/${mode}`
  const confirmedSnapshotRef = useRef<any>(null)
  const confirmedEnvelopeRef = useRef<LiveEnvelope | null>(null)
  const deferredRemoteRef = useRef<LiveEnvelope | null>(null)
  const pendingMutationsRef = useRef<PendingMutation[]>([])
  const processingRef = useRef(false)
  const lastActionGuardRef = useRef<{ signature: string; at: number } | null>(null)

  useEffect(() => {
    pendingMutationsRef.current = pendingMutations
  }, [pendingMutations])

  const applyRemoteEnvelope = (envelope: LiveEnvelope) => {
    confirmedSnapshotRef.current = envelope.snapshot
    confirmedEnvelopeRef.current = envelope
    setData(envelope.snapshot)
  }

  const load = async ({ background = false }: { background?: boolean } = {}) => {
    const hasVisibleSnapshot = Boolean(confirmedSnapshotRef.current || data)
    const shouldUseBackgroundRefresh = background || hasVisibleSnapshot

    if (shouldUseBackgroundRefresh) {
      setIsRefreshingInBackground(true)
    } else {
      setIsInitialLoading(true)
    }

    try {
      const response = await fetch(endpoint, { cache: 'no-store' })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(payload.error || 'Falha ao carregar mÃ³dulo live')

      if (mode === 'live') {
        const envelope = normalizeEnvelope(payload)
        const highestPendingSequence =
          pendingMutationsRef.current[pendingMutationsRef.current.length - 1]?.optimisticSequenceNumber ??
          confirmedEnvelopeRef.current?.lastSequenceNumber ??
          0

        if (pendingMutationsRef.current.length > 0) {
          if (envelope.lastSequenceNumber >= highestPendingSequence) {
            applyRemoteEnvelope(envelope)
            return
          }

          if (
            !deferredRemoteRef.current ||
            envelope.lastSequenceNumber >= deferredRemoteRef.current.lastSequenceNumber
          ) {
            deferredRemoteRef.current = envelope
          }
          return
        }

        applyRemoteEnvelope(envelope)
      } else {
        setData(payload)
      }

      setError('')
    } catch (currentError: any) {
      setError(currentError.message)
    } finally {
      if (shouldUseBackgroundRefresh) {
        setIsRefreshingInBackground(false)
      } else {
        setIsInitialLoading(false)
      }
    }
  }

  useEffect(() => {
    void load()
  }, [endpoint])

  useEffect(() => {
    if (mode !== 'live') return

    const interval = setInterval(() => {
      void load({ background: true })
    }, 5000)

    return () => clearInterval(interval)
  }, [mode, endpoint])

  useEffect(() => {
    if (data?.game?.homeTeam?.id && !selectedTeamId) {
      setSelectedTeamId(data.game.homeTeam.id)
    }
    if (data?.game?.currentPeriod) {
      setSelectedPeriod(data.game.currentPeriod || 1)
    }
    if (data?.game?.clockDisplay) {
      setClockTime(data.game.clockDisplay || '10:00')
    }
  }, [data, selectedTeamId])

  useEffect(() => {
    if (mode !== 'live') return
    if (!data?.game) return

    if (data.game.liveStatus === 'SCHEDULED' || data.game.liveStatus === 'PRE_GAME_READY') {
      setVisualShotClock(24)
    }

    if (data.game.liveStatus === 'PERIOD_BREAK' || data.game.liveStatus === 'HALFTIME') {
      setVisualShotClock((current) => (current > 24 ? 24 : current))
    }
  }, [mode, data?.game?.liveStatus, data?.game?.currentPeriod])

  useEffect(() => {
    if (mode !== 'live') return
    const isRunning = data?.game?.liveStatus === 'LIVE'
    if (!isRunning) return

    const interval = window.setInterval(() => {
      setVisualShotClock((current) => (current > 0 ? current - 1 : 0))
    }, 1000)

    return () => window.clearInterval(interval)
  }, [mode, data?.game?.liveStatus])

  useEffect(() => {
    if (mode !== 'live') return
    if (processingRef.current) return
    if (pendingMutations.length === 0) {
      if (deferredRemoteRef.current) {
        applyRemoteEnvelope(deferredRemoteRef.current)
        deferredRemoteRef.current = null
      }
      return
    }

    const mutation = pendingMutations[0]
    processingRef.current = true

    ;(async () => {
      try {
        const payload = await postJson(`/api/admin/games/${gameId}/live`, mutation.requestBody)
        const responseEnvelope = normalizeEnvelope(payload)
        const currentConfirmed = confirmedEnvelopeRef.current
        const useEnvelope =
          currentConfirmed && currentConfirmed.lastSequenceNumber > responseEnvelope.lastSequenceNumber
            ? currentConfirmed
            : responseEnvelope

        confirmedSnapshotRef.current = useEnvelope.snapshot
        confirmedEnvelopeRef.current = useEnvelope

        const remaining = pendingMutationsRef.current.filter((entry) => entry.id !== mutation.id)
        pendingMutationsRef.current = remaining
        setPendingMutations(remaining)

        if (remaining.length > 0) {
          setData(reapplyPendingMutations(useEnvelope.snapshot, remaining))
        } else if (
          deferredRemoteRef.current &&
          deferredRemoteRef.current.lastSequenceNumber > useEnvelope.lastSequenceNumber
        ) {
          applyRemoteEnvelope(deferredRemoteRef.current)
          deferredRemoteRef.current = null
        } else {
          setData(useEnvelope.snapshot)
          deferredRemoteRef.current = null
        }
      } catch (currentError: any) {
        const remaining = pendingMutationsRef.current.filter((entry) => entry.id !== mutation.id)
        pendingMutationsRef.current = remaining
        setPendingMutations(remaining)
        setError(currentError.message)

        const baseEnvelope = deferredRemoteRef.current || confirmedEnvelopeRef.current
        if (baseEnvelope) {
          if (deferredRemoteRef.current) {
            confirmedSnapshotRef.current = deferredRemoteRef.current.snapshot
            confirmedEnvelopeRef.current = deferredRemoteRef.current
            deferredRemoteRef.current = null
          }
          setData(
            remaining.length > 0
              ? reapplyPendingMutations(baseEnvelope.snapshot, remaining)
              : baseEnvelope.snapshot
          )
        }
      } finally {
        processingRef.current = false
      }
    })()
  }, [pendingMutations, gameId, mode])

  const tableModel = useMemo(() => buildLiveGameTableModel(data), [data])

  const selectedTeam =
    selectedTeamId === tableModel.home.id
      ? tableModel.home
      : selectedTeamId === tableModel.away.id
        ? tableModel.away
        : null

  const selectedAthlete =
    selectedTeam?.players.find((player) => player.athleteId === selectedAthleteId) || null

  const doPregameAction = async (action: string, extra: Record<string, unknown> = {}) => {
    setSubmitting(true)
    try {
      setData(await postJson(`/api/admin/games/${gameId}/pregame`, { action, ...extra }))
      setError('')
    } catch (currentError: any) {
      setError(currentError.message)
    } finally {
      setSubmitting(false)
    }
  }

  const doLiveActionDirect = async (action: string, extra: Record<string, unknown> = {}) => {
    setSubmitting(true)
    try {
      const envelope = normalizeEnvelope(await postJson(`/api/admin/games/${gameId}/live`, { action, ...extra }))
      applyRemoteEnvelope(envelope)
      setError('')
    } catch (currentError: any) {
      setError(currentError.message)
    } finally {
      setSubmitting(false)
    }
  }

  const enqueueLiveEvent = (extra: Record<string, unknown>) => {
    const eventType = String(extra.eventType || '')
    const now = Date.now()
    const signature = JSON.stringify({
      eventType,
      teamId: extra.teamId,
      athleteId: extra.athleteId,
      period: extra.period,
      clockTime: extra.clockTime,
      pointsDelta: extra.pointsDelta,
    })

    if (isSameActionSignature(signature, lastActionGuardRef.current, now)) {
      return
    }

    const duplicatedInQueue = pendingMutationsRef.current.some(
      (entry) => entry.signature === signature && now - entry.createdAt < 450
    )
    if (duplicatedInQueue) {
      return
    }

    lastActionGuardRef.current = { signature, at: now }

    const visualReset = resolveShotClockReset(eventType)
    if (visualReset !== null) {
      setVisualShotClock(visualReset)
    }

    const baseSequence =
      confirmedEnvelopeRef.current?.lastSequenceNumber ??
      normalizeEnvelope({ events: data?.events || [] }).lastSequenceNumber

    const mutation: PendingMutation = {
      id: `temp-${now}-${Math.random().toString(36).slice(2, 7)}`,
      signature,
      requestBody: { action: 'event', ...extra },
      optimisticSequenceNumber: baseSequence + pendingMutationsRef.current.length + 1,
      createdAt: now,
    }

    const nextQueue = [...pendingMutationsRef.current, mutation]
    pendingMutationsRef.current = nextQueue
    setPendingMutations(nextQueue)
    setData((current: any) => applyOptimisticEvent(current, mutation))
    setError('')
  }

  const doReviewAction = async () => {
    setSubmitting(true)
    try {
      setData(await postJson(`/api/admin/games/${gameId}/review`, { action: 'finalize-official' }))
      setError('')
    } catch (currentError: any) {
      setError(currentError.message)
    } finally {
      setSubmitting(false)
    }
  }

  const updateRosterPlayer = async (rosterPlayerId: string, patch: Record<string, unknown>) => {
    await doPregameAction('update-roster-player', { rosterPlayerId, patch })
  }

  const addOfficial = async () => {
    const name = window.prompt('Nome do oficial:')
    if (!name) return
    const officialType = window.prompt('Tipo do oficial (REFEREE, TABLE, STATS, OTHER):', 'REFEREE') || 'REFEREE'
    const role = window.prompt('FunÃ§Ã£o do oficial:', 'Principal') || 'Principal'
    const officials = [...(data.officials || []), { name, officialType, role }]
    await doPregameAction('assign-officials', { officials })
  }

  const exportReportPdf = async () => {
    const { jsPDF } = await import('jspdf')
    const autoTable = (await import('jspdf-autotable')).default
    const doc = new jsPDF()
    doc.setFontSize(16)
    doc.text('FGB Â· SÃºmula Oficial da Partida', 14, 16)
    doc.setFontSize(10)
    doc.text(`${data.game.championship.name} Â· ${data.game.category.name}`, 14, 24)
    doc.text(`${data.game.homeTeam.name} ${data.game.homeScore} x ${data.game.awayScore} ${data.game.awayTeam.name}`, 14, 30)
    doc.text(`Status: ${data.game.liveStatus}`, 14, 36)

    autoTable(doc, {
      startY: 44,
      head: [['Equipe', 'Pts', 'Ast', 'Reb', 'Stl', 'Blk']],
      body: (data.boxScore?.teams || []).map((team: any) => [
        team.teamName,
        team.points,
        team.assists,
        team.reboundsTotal,
        team.steals,
        team.blocks,
      ]),
    })

    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 8,
      head: [['Atleta', 'Equipe', 'Pts', 'Reb', 'Ast', 'Faltas']],
      body: (data.boxScore?.players || []).map((player: any) => [
        player.athleteName,
        player.teamName,
        player.points,
        player.reboundsTotal,
        player.assists,
        player.fouls,
      ]),
    })

    doc.save(`relatorio-oficial-${data.game.homeTeam.name}-vs-${data.game.awayTeam.name}.pdf`)
  }

  const handlePlayerQuickAction = (
    teamId: string,
    player: LiveTablePlayer,
    action: '2pts' | '3pts' | 'ft' | 'foul' | 'reb' | 'ast' | 'sub'
  ) => {
    setSelectedTeamId(teamId)
    setSelectedAthleteId(player.athleteId)

    if (action === 'sub') {
      enqueueLiveEvent({
        eventType: player.isOnCourt ? 'SUBSTITUTION_OUT' : 'SUBSTITUTION_IN',
        teamId,
        athleteId: player.athleteId,
        period: selectedPeriod,
        clockTime,
      })
      return
    }

    const actionMap = {
      '2pts': { eventType: 'SHOT_MADE_2', pointsDelta: 2 },
      '3pts': { eventType: 'SHOT_MADE_3', pointsDelta: 3 },
      ft: { eventType: 'FREE_THROW_MADE', pointsDelta: 1 },
      foul: { eventType: 'FOUL_PERSONAL' },
      reb: { eventType: 'REBOUND_DEFENSIVE' },
      ast: { eventType: 'ASSIST' },
    } as const

    const payload = actionMap[action]
    enqueueLiveEvent({
      eventType: payload.eventType,
      pointsDelta: 'pointsDelta' in payload ? payload.pointsDelta : undefined,
      teamId,
      athleteId: player.athleteId,
      period: selectedPeriod,
      clockTime,
    })
  }

  const handleControlEvent = (eventType: string) => {
    enqueueLiveEvent({
      eventType,
      teamId: null,
      athleteId: null,
      period: selectedPeriod,
      clockTime,
    })
  }

  const handleTimeoutFromSide = (side: 'home' | 'away') => {
    const teamId = side === 'home' ? tableModel.home.id : tableModel.away.id
    enqueueLiveEvent({
      eventType: 'TIMEOUT_CONFIRMED',
      teamId,
      athleteId: null,
      period: selectedPeriod,
      clockTime,
    })
  }

  if (isInitialLoading && !data) {
    return (
      <div className="flex min-h-[320px] flex-col items-center justify-center gap-4 rounded-[28px] border border-[var(--border)] bg-white p-8 text-center shadow-sm">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--verde)]" />
        <span className="fgb-label text-[var(--gray)]">Carregando mÃ³dulo live</span>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="rounded-[28px] border border-red-200 bg-red-50 p-8 text-center shadow-sm">
        <p className="text-sm font-semibold text-red-700">{error || 'Falha ao carregar jogo.'}</p>
        <button
          onClick={() => {
            setError('')
            void load()
          }}
          className="mt-4 rounded-xl bg-red-600 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-white"
        >
          Tentar novamente
        </button>
      </div>
    )
  }

  const { game } = data
  return (
    <div className="space-y-6 px-4 py-6 sm:px-6">
      <div className="rounded-[28px] border border-[var(--border)] bg-white p-6 shadow-sm">
        <p className="fgb-label text-[var(--gray)]">{game.championship.name} Â· {game.category.name}</p>
        <h1 className="mt-2 fgb-display text-4xl leading-none text-[var(--black)]">
          {game.homeTeam.name} <span className="text-[var(--verde)]">{game.homeScore}</span> Ã— <span className="text-[var(--verde)]">{game.awayScore}</span> {game.awayTeam.name}
        </h1>
        <div className="mt-4 inline-flex rounded-full border border-[var(--border)] bg-[var(--gray-l)] px-3 py-1 text-[9px] font-black uppercase tracking-widest text-[var(--gray)]">
          Etapa atual: {MODE_LABELS[mode]}
        </div>
        <p className="mt-3 text-sm text-[var(--gray)]">
          Status {game.liveStatus} Â· PerÃ­odo {game.currentPeriod || 0} Â· RelÃ³gio {game.clockDisplay || '10:00'}
          {mode === 'live' && pendingMutations.length > 0 && (
            <span className="ml-3 inline-flex items-center gap-1 rounded-full bg-yellow-100 px-2 py-1 text-[10px] font-black uppercase tracking-widest text-yellow-700">
              <Clock3 className="h-3 w-3" />
              {pendingMutations.length} sincronizando
            </span>
          )}
          {mode === 'live' && isRefreshingInBackground && pendingMutations.length === 0 && (
            <span className="ml-3 inline-flex items-center gap-1 rounded-full border border-[var(--border)] bg-white px-2 py-1 text-[10px] font-black uppercase tracking-widest text-[var(--gray)]">
              <Loader2 className="h-3 w-3 animate-spin" />
              Sincronizando
            </span>
          )}
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <Link href={buildAdminGameModePath(gameId, 'pregame', championshipId)} className="rounded-xl border border-[var(--border)] bg-white px-4 py-2 text-[10px] font-black uppercase tracking-widest text-[var(--black)]">PrÃ©-jogo</Link>
        <Link href={buildAdminGameModePath(gameId, 'live', championshipId)} className="rounded-xl border border-[var(--border)] bg-white px-4 py-2 text-[10px] font-black uppercase tracking-widest text-[var(--black)]">Mesa</Link>
        <Link href={buildAdminGameModePath(gameId, 'review', championshipId)} className="rounded-xl border border-[var(--border)] bg-white px-4 py-2 text-[10px] font-black uppercase tracking-widest text-[var(--black)]">Encerramento</Link>
        <Link href={buildAdminGameModePath(gameId, 'report', championshipId)} className="rounded-xl border border-[var(--border)] bg-white px-4 py-2 text-[10px] font-black uppercase tracking-widest text-[var(--black)]">SÃºmula</Link>
        <Link href={buildAdminGameModePath(gameId, 'audit', championshipId)} className="rounded-xl border border-[var(--border)] bg-white px-4 py-2 text-[10px] font-black uppercase tracking-widest text-[var(--black)]">Auditoria</Link>
      </div>

      {error && <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      {mode === 'pregame' && (
        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-[28px] border border-[var(--border)] bg-white p-6 shadow-sm">
            <div className="flex flex-wrap gap-3">
              <button onClick={() => doPregameAction('sync-rosters')} disabled={submitting} className="rounded-xl bg-[var(--verde)] px-4 py-3 text-[10px] font-black uppercase tracking-widest text-white">Sincronizar rosters</button>
              <button onClick={() => doPregameAction('lock-rosters')} disabled={submitting} className="rounded-xl border border-[var(--border)] px-4 py-3 text-[10px] font-black uppercase tracking-widest text-[var(--black)]">Travar rosters</button>
              <button onClick={() => doPregameAction('open-session')} disabled={submitting} className="rounded-xl bg-[var(--black)] px-4 py-3 text-[10px] font-black uppercase tracking-widest text-white">Abrir sessÃ£o</button>
              <button onClick={addOfficial} disabled={submitting} className="rounded-xl border border-[var(--border)] px-4 py-3 text-[10px] font-black uppercase tracking-widest text-[var(--black)]">Adicionar oficial</button>
            </div>
            <div className="mt-5 space-y-4">
              {(data.rosters || []).map((roster: any) => (
                <div key={roster.id} className="rounded-2xl border border-[var(--border)] bg-[var(--gray-l)] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-black text-[var(--black)]">{roster.teamName}</h2>
                      <p className="text-sm text-[var(--gray)]">Coach: {roster.coachName || 'NÃ£o definido'}</p>
                    </div>
                    <span className="rounded-full bg-white px-3 py-1 text-[9px] font-black uppercase tracking-widest text-[var(--gray)]">{roster.isLocked ? 'Travado' : 'EditÃ¡vel'}</span>
                  </div>
                  <div className="mt-4 grid gap-2 md:grid-cols-2">
                    {(roster.players || []).map((player: any) => (
                      <div key={player.id} className="rounded-xl border border-white bg-white px-3 py-3 text-sm text-[var(--black)]">
                        <div className="font-semibold">{player.jerseyNumber ?? '--'} Â· {player.athleteName}</div>
                        <div className="mt-2 flex flex-wrap gap-2">
                          <button onClick={() => updateRosterPlayer(player.id, { isStarter: !player.isStarter })} className="rounded-full bg-[var(--gray-l)] px-3 py-1 text-[9px] font-black uppercase tracking-widest text-[var(--black)]">{player.isStarter ? 'Titular' : 'Banco'}</button>
                          <button onClick={() => updateRosterPlayer(player.id, { isOnCourt: !player.isOnCourt })} className="rounded-full bg-[var(--gray-l)] px-3 py-1 text-[9px] font-black uppercase tracking-widest text-[var(--black)]">{player.isOnCourt ? 'Em quadra' : 'Fora'}</button>
                          <button onClick={() => updateRosterPlayer(player.id, { isAvailable: !player.isAvailable })} className="rounded-full bg-[var(--gray-l)] px-3 py-1 text-[9px] font-black uppercase tracking-widest text-[var(--black)]">{player.isAvailable ? 'DisponÃ­vel' : 'IndisponÃ­vel'}</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-[28px] border border-[var(--border)] bg-white p-6 shadow-sm">
            <h2 className="fgb-display text-2xl leading-none text-[var(--black)]">Checklist</h2>
            <div className="mt-5 space-y-3 text-sm text-[var(--black)]">
              <div className="rounded-2xl border border-[var(--border)] px-4 py-3">Rosters: {(data.rosters || []).length >= 2 ? 'OK' : 'Pendente'}</div>
              <div className="rounded-2xl border border-[var(--border)] px-4 py-3">Atletas: {(data.rosters || []).every((roster: any) => roster.players.length > 0) ? 'OK' : 'Pendente'}</div>
              <div className="rounded-2xl border border-[var(--border)] px-4 py-3">SessÃ£o: {data.session ? 'Aberta' : 'NÃ£o iniciada'}</div>
              <div className="rounded-2xl border border-[var(--border)] px-4 py-3">Oficiais: {(data.referees?.length || 0) + (data.officials?.length || 0) > 0 ? 'Definidos' : 'Pendente'}</div>
            </div>
          </div>
        </div>
      )}

      {mode === 'live' && (
        <div className="space-y-5">
          <LiveScoreboardFiba
            table={tableModel}
            clockDisplay={game.clockDisplay || clockTime}
            visualShotClock={visualShotClock}
            isSyncing={pendingMutations.length > 0 || isRefreshingInBackground}
            onResetShotClock={(value) => setVisualShotClock(value)}
            onTimeout={handleTimeoutFromSide}
            onControlEvent={handleControlEvent}
          />

          <div className="overflow-hidden rounded-[14px] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] shadow-[0_20px_48px_rgba(4,10,22,0.28)]">
            <div className="flex gap-1.5 px-2 pt-2">
              {[
                ['home', `🔵 ${tableModel.home.shortName}`],
                ['away', `🔴 ${tableModel.away.shortName}`],
                ['log', '📋 Log'],
                ['box', '📊 Boxscore'],
              ].map(([tabId, label]) => (
                <button
                  key={tabId}
                  type="button"
                  onClick={() => setActiveTab(tabId as LiveTableTab)}
                  className={`flex-1 rounded-t-[8px] border-b-2 px-2 py-2 text-[12px] font-bold uppercase tracking-[0.04em] transition ${
                    activeTab === tabId
                      ? 'border-b-[#f5c849] bg-white/10 text-[#f5c849]'
                      : 'border-b-transparent bg-white/[0.03] text-white/50'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {activeTab === 'home' && (
              <LiveTeamPanelFiba
                team={tableModel.home}
                selectedAthleteId={selectedAthleteId}
                onSelectAthlete={(athleteId) => {
                  setSelectedTeamId(tableModel.home.id)
                  setSelectedAthleteId(athleteId)
                }}
                onPlayerAction={(player, action) => handlePlayerQuickAction(tableModel.home.id, player, action)}
              />
            )}

            {activeTab === 'away' && (
              <LiveTeamPanelFiba
                team={tableModel.away}
                selectedAthleteId={selectedAthleteId}
                onSelectAthlete={(athleteId) => {
                  setSelectedTeamId(tableModel.away.id)
                  setSelectedAthleteId(athleteId)
                }}
                onPlayerAction={(player, action) => handlePlayerQuickAction(tableModel.away.id, player, action)}
              />
            )}

            {activeTab === 'log' && <LiveEventLogFiba events={tableModel.events} />}
            {activeTab === 'box' && <LiveBoxscoreFiba table={tableModel} />}
          </div>

          <div className="grid gap-3 xl:grid-cols-[1.05fr_0.95fr]">
            <div className="rounded-[14px] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.03))] p-4 text-white shadow-[0_18px_40px_rgba(0,0,0,0.2)]">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-[10px] uppercase tracking-[0.24em] text-white/40">Seleção atual</div>
                  <div className="mt-2 text-[22px] font-black uppercase tracking-[0.05em] text-white">
                    {selectedAthlete?.name || 'Nenhum atleta selecionado'}
                  </div>
                  <div className="mt-1 text-sm text-white/45">
                    {selectedTeam?.name || 'Equipe'} · camisa {selectedAthlete?.jerseyNumber ?? '--'}
                  </div>
                </div>
                <span className="rounded-full bg-white/10 px-3 py-1 text-[9px] font-black uppercase tracking-widest text-white/55">
                  fallback
                </span>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <select
                  value={selectedTeamId}
                  onChange={(event) => {
                    setSelectedTeamId(event.target.value)
                    setSelectedAthleteId('')
                  }}
                  className="h-11 rounded-xl border border-white/10 bg-black/20 px-4 text-sm text-white outline-none"
                >
                  <option value="" className="text-black">Equipe</option>
                  <option value={tableModel.home.id} className="text-black">{tableModel.home.name}</option>
                  <option value={tableModel.away.id} className="text-black">{tableModel.away.name}</option>
                </select>
                <select
                  value={selectedAthleteId}
                  onChange={(event) => setSelectedAthleteId(event.target.value)}
                  className="h-11 rounded-xl border border-white/10 bg-black/20 px-4 text-sm text-white outline-none"
                >
                  <option value="" className="text-black">Atleta</option>
                  {(selectedTeam?.players || []).map((player) => (
                    <option key={player.id} value={player.athleteId} className="text-black">
                      {player.jerseyNumber ?? '--'} · {player.name}
                    </option>
                  ))}
                </select>
                <input
                  value={clockTime}
                  onChange={(event) => setClockTime(event.target.value)}
                  className="h-11 rounded-xl border border-white/10 bg-black/20 px-4 text-sm text-white outline-none"
                />
                <input
                  type="number"
                  min={1}
                  value={selectedPeriod}
                  onChange={(event) => setSelectedPeriod(Number(event.target.value) || 1)}
                  className="h-11 rounded-xl border border-white/10 bg-black/20 px-4 text-sm text-white outline-none"
                />
              </div>

              <div className="mt-4 grid grid-cols-4 gap-2">
                {[
                  ['Pts', selectedAthlete?.points ?? 0],
                  ['Reb', selectedAthlete?.rebounds ?? 0],
                  ['Ast', selectedAthlete?.assists ?? 0],
                  ['Faltas', selectedAthlete?.fouls ?? 0],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-[10px] bg-white/8 px-3 py-3 text-center">
                    <div className="text-[9px] uppercase tracking-[0.18em] text-white/40">{label}</div>
                    <div className="mt-1 text-lg font-black text-white">{value}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[14px] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.03))] p-4 text-white shadow-[0_18px_40px_rgba(0,0,0,0.2)]">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-[10px] uppercase tracking-[0.24em] text-white/40">Console auxiliar</div>
                  <div className="mt-2 text-[22px] font-black uppercase tracking-[0.05em] text-white">
                    Mesa manual e publicação
                  </div>
                </div>
                <button
                  onClick={async () => {
                    const last = [...(data.events || [])].reverse().find((event: any) => !event.isReverted && !event.isOptimistic)
                    if (!last) return
                    await doLiveActionDirect('revert-event', { eventId: last.id, reason: 'Desfazer rapido da mesa' })
                  }}
                  className="rounded-lg border border-white/10 bg-white/8 px-3 py-2 text-[10px] font-black uppercase tracking-[0.12em] text-white"
                >
                  Desfazer último
                </button>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
                {QUICK_EVENTS.filter(([_, eventType]) => !['TIMEOUT_CONFIRMED'].includes(eventType)).map(([label, eventType, pointsDelta]) => (
                  <button
                    key={label}
                    onClick={() =>
                      enqueueLiveEvent({
                        eventType,
                        pointsDelta,
                        teamId: selectedTeamId || null,
                        athleteId: selectedAthleteId || null,
                        period: selectedPeriod,
                        clockTime,
                      })
                    }
                    className="rounded-[10px] border border-white/10 bg-white/8 px-3 py-3 text-[11px] font-black uppercase tracking-[0.12em] text-white transition hover:bg-white/12"
                  >
                    {label}
                  </button>
                ))}
              </div>

              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  onClick={() => doLiveActionDirect('publish')}
                  className="rounded-lg bg-[var(--verde)] px-4 py-3 text-[10px] font-black uppercase tracking-widest text-white"
                >
                  Publicar no site
                </button>
                <Link
                  href={`/games/${gameId}/live`}
                  className="rounded-lg border border-white/10 bg-white/6 px-4 py-3 text-[10px] font-black uppercase tracking-widest text-white"
                >
                  Ver público
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {mode === 'review' && (
        <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-[28px] border border-[var(--border)] bg-white p-6 shadow-sm">
            <h2 className="fgb-display text-2xl leading-none text-[var(--black)]">Checklist final</h2>
            <div className="mt-5 space-y-3">
              {(data.review?.issues || []).map((issue: string) => (
                <div key={issue} className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{issue}</div>
              ))}
              {(data.review?.warnings || []).map((warning: string) => (
                <div key={warning} className="rounded-2xl border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-700">{warning}</div>
              ))}
              {(data.review?.issues || []).length === 0 && (data.review?.warnings || []).length === 0 && (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">Partida pronta para fechamento oficial.</div>
              )}
            </div>
            <button onClick={doReviewAction} disabled={submitting || !data.review?.readyToFinalize} className="mt-5 rounded-xl bg-[var(--black)] px-4 py-3 text-[10px] font-black uppercase tracking-widest text-white disabled:opacity-50">Fechar oficialmente</button>
          </div>
          <div className="rounded-[28px] border border-[var(--border)] bg-white p-6 shadow-sm">
            <h2 className="fgb-display text-2xl leading-none text-[var(--black)]">Parciais</h2>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {(data.boxScore?.periods || []).map((period: any) => (
                <div key={period.id} className="rounded-2xl border border-[var(--border)] px-4 py-3 text-sm text-[var(--black)]">
                  PerÃ­odo {period.period}: {period.homePoints} Ã— {period.awayPoints}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {mode === 'report' && (
        <SumulaEletronicoView data={data} />
      )}

      {mode === 'audit' && (
        <div className="rounded-[28px] border border-[var(--border)] bg-white p-6 shadow-sm">
          <h2 className="fgb-display text-2xl leading-none text-[var(--black)]">Auditoria</h2>
          <div className="mt-5 space-y-3">
            {(data.auditLogs || []).map((log: any) => (
              <div key={log.id} className="rounded-2xl border border-[var(--border)] px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-[var(--black)]">{log.description}</p>
                  <span className="text-xs text-[var(--gray)]">{new Date(log.createdAt).toLocaleString('pt-BR')}</span>
                </div>
                <p className="mt-1 text-xs text-[var(--gray)]">{log.actionType} Â· {log.targetEntity}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}





