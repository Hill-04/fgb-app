'use client'

import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Clock3, Loader2 } from 'lucide-react'
import { buildAdminGamePath as buildCanonicalAdminGamePath } from '@/lib/admin-game-routing'

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

const CONTROL_EVENTS = [
  ['Iniciar jogo', 'GAME_START'],
  ['Iniciar período', 'PERIOD_START'],
  ['Fim período', 'PERIOD_END'],
  ['Intervalo', 'HALFTIME_START'],
  ['Voltar intervalo', 'HALFTIME_END'],
  ['Encerrar jogo', 'GAME_END'],
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
  if (!response.ok) throw new Error(data.error || 'Erro na operação')
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
      return `${actor} deu assistência`
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
      return 'Período iniciado'
    case 'PERIOD_END':
      return 'Período encerrado'
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
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [selectedTeamId, setSelectedTeamId] = useState('')
  const [selectedAthleteId, setSelectedAthleteId] = useState('')
  const [selectedPeriod, setSelectedPeriod] = useState(1)
  const [clockTime, setClockTime] = useState('10:00')
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

  const load = async () => {
    setLoading(true)
    try {
      const response = await fetch(endpoint, { cache: 'no-store' })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(payload.error || 'Falha ao carregar módulo live')

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
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [endpoint])

  useEffect(() => {
    if (mode !== 'live') return

    const interval = setInterval(() => {
      void load()
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

  const selectedPlayers = useMemo(() => {
    if (!selectedTeamId) return []
    return data?.rosters?.find((roster: any) => roster.teamId === selectedTeamId)?.players || []
  }, [data, selectedTeamId])

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
    const now = Date.now()
    const signature = JSON.stringify({
      eventType: extra.eventType,
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
    const role = window.prompt('Função do oficial:', 'Principal') || 'Principal'
    const officials = [...(data.officials || []), { name, officialType, role }]
    await doPregameAction('assign-officials', { officials })
  }

  const exportReportPdf = async () => {
    const { jsPDF } = await import('jspdf')
    const autoTable = (await import('jspdf-autotable')).default
    const doc = new jsPDF()
    doc.setFontSize(16)
    doc.text('FGB · Relatório Oficial da Partida', 14, 16)
    doc.setFontSize(10)
    doc.text(`${data.game.championship.name} · ${data.game.category.name}`, 14, 24)
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

  if (loading) {
    return (
      <div className="flex min-h-[320px] items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--verde)]" />
        <span className="fgb-label text-[var(--gray)]">Carregando módulo live</span>
      </div>
    )
  }

  if (!data) {
    return <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">{error || 'Falha ao carregar jogo.'}</div>
  }

  const { game } = data

  return (
    <div className="space-y-6 px-4 py-6 sm:px-6">
      <div className="rounded-[28px] border border-[var(--border)] bg-white p-6 shadow-sm">
        <p className="fgb-label text-[var(--gray)]">{game.championship.name} · {game.category.name}</p>
        <h1 className="mt-2 fgb-display text-4xl leading-none text-[var(--black)]">
          {game.homeTeam.name} <span className="text-[var(--verde)]">{game.homeScore}</span> × <span className="text-[var(--verde)]">{game.awayScore}</span> {game.awayTeam.name}
        </h1>
        <p className="mt-3 text-sm text-[var(--gray)]">
          Status {game.liveStatus} · Período {game.currentPeriod || 0} · Relógio {game.clockDisplay || '10:00'}
          {mode === 'live' && pendingMutations.length > 0 && (
            <span className="ml-3 inline-flex items-center gap-1 rounded-full bg-yellow-100 px-2 py-1 text-[10px] font-black uppercase tracking-widest text-yellow-700">
              <Clock3 className="h-3 w-3" />
              {pendingMutations.length} sincronizando
            </span>
          )}
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <Link href={buildAdminGameModePath(gameId, 'pregame', championshipId)} className="rounded-xl border border-[var(--border)] bg-white px-4 py-2 text-[10px] font-black uppercase tracking-widest text-[var(--black)]">Pré-jogo</Link>
        <Link href={buildAdminGameModePath(gameId, 'live', championshipId)} className="rounded-xl border border-[var(--border)] bg-white px-4 py-2 text-[10px] font-black uppercase tracking-widest text-[var(--black)]">Mesa</Link>
        <Link href={buildAdminGameModePath(gameId, 'review', championshipId)} className="rounded-xl border border-[var(--border)] bg-white px-4 py-2 text-[10px] font-black uppercase tracking-widest text-[var(--black)]">Revisão</Link>
        <Link href={buildAdminGameModePath(gameId, 'report', championshipId)} className="rounded-xl border border-[var(--border)] bg-white px-4 py-2 text-[10px] font-black uppercase tracking-widest text-[var(--black)]">Relatório</Link>
        <Link href={buildAdminGameModePath(gameId, 'audit', championshipId)} className="rounded-xl border border-[var(--border)] bg-white px-4 py-2 text-[10px] font-black uppercase tracking-widest text-[var(--black)]">Auditoria</Link>
      </div>

      {error && <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      {mode === 'pregame' && (
        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-[28px] border border-[var(--border)] bg-white p-6 shadow-sm">
            <div className="flex flex-wrap gap-3">
              <button onClick={() => doPregameAction('sync-rosters')} disabled={submitting} className="rounded-xl bg-[var(--verde)] px-4 py-3 text-[10px] font-black uppercase tracking-widest text-white">Sincronizar rosters</button>
              <button onClick={() => doPregameAction('lock-rosters')} disabled={submitting} className="rounded-xl border border-[var(--border)] px-4 py-3 text-[10px] font-black uppercase tracking-widest text-[var(--black)]">Travar rosters</button>
              <button onClick={() => doPregameAction('open-session')} disabled={submitting} className="rounded-xl bg-[var(--black)] px-4 py-3 text-[10px] font-black uppercase tracking-widest text-white">Abrir sessão</button>
              <button onClick={addOfficial} disabled={submitting} className="rounded-xl border border-[var(--border)] px-4 py-3 text-[10px] font-black uppercase tracking-widest text-[var(--black)]">Adicionar oficial</button>
            </div>
            <div className="mt-5 space-y-4">
              {(data.rosters || []).map((roster: any) => (
                <div key={roster.id} className="rounded-2xl border border-[var(--border)] bg-[var(--gray-l)] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-black text-[var(--black)]">{roster.teamName}</h2>
                      <p className="text-sm text-[var(--gray)]">Coach: {roster.coachName || 'Não definido'}</p>
                    </div>
                    <span className="rounded-full bg-white px-3 py-1 text-[9px] font-black uppercase tracking-widest text-[var(--gray)]">{roster.isLocked ? 'Travado' : 'Editável'}</span>
                  </div>
                  <div className="mt-4 grid gap-2 md:grid-cols-2">
                    {(roster.players || []).map((player: any) => (
                      <div key={player.id} className="rounded-xl border border-white bg-white px-3 py-3 text-sm text-[var(--black)]">
                        <div className="font-semibold">{player.jerseyNumber ?? '--'} · {player.athleteName}</div>
                        <div className="mt-2 flex flex-wrap gap-2">
                          <button onClick={() => updateRosterPlayer(player.id, { isStarter: !player.isStarter })} className="rounded-full bg-[var(--gray-l)] px-3 py-1 text-[9px] font-black uppercase tracking-widest text-[var(--black)]">{player.isStarter ? 'Titular' : 'Banco'}</button>
                          <button onClick={() => updateRosterPlayer(player.id, { isOnCourt: !player.isOnCourt })} className="rounded-full bg-[var(--gray-l)] px-3 py-1 text-[9px] font-black uppercase tracking-widest text-[var(--black)]">{player.isOnCourt ? 'Em quadra' : 'Fora'}</button>
                          <button onClick={() => updateRosterPlayer(player.id, { isAvailable: !player.isAvailable })} className="rounded-full bg-[var(--gray-l)] px-3 py-1 text-[9px] font-black uppercase tracking-widest text-[var(--black)]">{player.isAvailable ? 'Disponível' : 'Indisponível'}</button>
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
              <div className="rounded-2xl border border-[var(--border)] px-4 py-3">Sessão: {data.session ? 'Aberta' : 'Não iniciada'}</div>
              <div className="rounded-2xl border border-[var(--border)] px-4 py-3">Oficiais: {(data.referees?.length || 0) + (data.officials?.length || 0) > 0 ? 'Definidos' : 'Pendente'}</div>
            </div>
          </div>
        </div>
      )}

      {mode === 'live' && (
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-6">
            <div className="rounded-[28px] border border-[var(--border)] bg-white p-6 shadow-sm">
              <div className="grid gap-4 md:grid-cols-4">
                <select value={selectedTeamId} onChange={(event) => { setSelectedTeamId(event.target.value); setSelectedAthleteId('') }} className="h-11 rounded-xl border border-[var(--border)] px-4 text-sm outline-none">
                  <option value="">Equipe</option>
                  <option value={game.homeTeam.id}>{game.homeTeam.name}</option>
                  <option value={game.awayTeam.id}>{game.awayTeam.name}</option>
                </select>
                <select value={selectedAthleteId} onChange={(event) => setSelectedAthleteId(event.target.value)} className="h-11 rounded-xl border border-[var(--border)] px-4 text-sm outline-none">
                  <option value="">Atleta</option>
                  {selectedPlayers.map((player: any) => (
                    <option key={player.id} value={player.athleteId}>{player.jerseyNumber ?? '--'} · {player.athleteName}</option>
                  ))}
                </select>
                <input value={clockTime} onChange={(event) => setClockTime(event.target.value)} className="h-11 rounded-xl border border-[var(--border)] px-4 text-sm outline-none" />
                <input type="number" min={1} value={selectedPeriod} onChange={(event) => setSelectedPeriod(Number(event.target.value) || 1)} className="h-11 rounded-xl border border-[var(--border)] px-4 text-sm outline-none" />
              </div>
              <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
                {QUICK_EVENTS.map(([label, eventType, pointsDelta]) => (
                  <button
                    key={label}
                    onClick={() => enqueueLiveEvent({ eventType, pointsDelta, teamId: selectedTeamId || null, athleteId: selectedAthleteId || null, period: selectedPeriod, clockTime })}
                    className="rounded-xl border border-[var(--border)] bg-[var(--gray-l)] px-4 py-4 text-[10px] font-black uppercase tracking-widest text-[var(--black)]"
                  >
                    {label}
                  </button>
                ))}
                <button onClick={() => enqueueLiveEvent({ eventType: 'SUBSTITUTION_IN', teamId: selectedTeamId || null, athleteId: selectedAthleteId || null, period: selectedPeriod, clockTime })} className="rounded-xl border border-[var(--border)] bg-[var(--gray-l)] px-4 py-4 text-[10px] font-black uppercase tracking-widest text-[var(--black)]">Entrar</button>
                <button onClick={() => enqueueLiveEvent({ eventType: 'SUBSTITUTION_OUT', teamId: selectedTeamId || null, athleteId: selectedAthleteId || null, period: selectedPeriod, clockTime })} className="rounded-xl border border-[var(--border)] bg-[var(--gray-l)] px-4 py-4 text-[10px] font-black uppercase tracking-widest text-[var(--black)]">Sair</button>
                {CONTROL_EVENTS.map(([label, eventType]) => (
                  <button
                    key={label}
                    onClick={() => enqueueLiveEvent({ eventType, pointsDelta: selectedPeriod, teamId: selectedTeamId || null, athleteId: selectedAthleteId || null, period: selectedPeriod, clockTime })}
                    className="rounded-xl bg-[var(--black)] px-4 py-4 text-[10px] font-black uppercase tracking-widest text-white"
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div className="rounded-[28px] border border-[var(--border)] bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <h2 className="fgb-display text-2xl leading-none text-[var(--black)]">Últimos eventos</h2>
                <button
                  onClick={async () => {
                    const last = [...(data.events || [])].reverse().find((event: any) => !event.isReverted && !event.isOptimistic)
                    if (!last) return
                    await doLiveActionDirect('revert-event', { eventId: last.id, reason: 'Desfazer rápido' })
                  }}
                  className="rounded-xl border border-[var(--border)] px-4 py-2 text-[10px] font-black uppercase tracking-widest text-[var(--black)]"
                >
                  Desfazer último
                </button>
              </div>
              <div className="mt-5 space-y-3">
                {[...(data.events || [])].reverse().slice(0, 15).map((event: any) => (
                  <div key={event.id} className={`rounded-2xl border px-4 py-3 ${event.isOptimistic ? 'border-yellow-200 bg-yellow-50/70 opacity-80' : 'border-[var(--border)] bg-white'}`}>
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-[var(--black)]">{event.description}</p>
                      <span className="fgb-label text-[var(--gray)]">P{event.period} · {event.clockTime}</span>
                    </div>
                    {event.isOptimistic && (
                      <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-yellow-100 px-2 py-1 text-[9px] font-black uppercase tracking-widest text-yellow-700">
                        <Clock3 className="h-3 w-3" />
                        Sincronizando
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-[28px] border border-[var(--border)] bg-white p-6 shadow-sm">
              <h2 className="fgb-display text-2xl leading-none text-[var(--black)]">Líderes</h2>
              <div className="mt-5 space-y-3">
                {(data.boxScore?.players || []).slice(0, 10).map((player: any) => (
                  <div key={player.id} className="grid grid-cols-[1fr_auto] gap-3 rounded-2xl border border-[var(--border)] px-4 py-3">
                    <div>
                      <p className="text-sm font-semibold text-[var(--black)]">{player.athleteName}</p>
                      <p className="text-xs text-[var(--gray)]">{player.teamName}</p>
                    </div>
                    <div className="text-right text-sm text-[var(--black)]">
                      <p><strong>{player.points}</strong> pts</p>
                      <p>{player.reboundsTotal} reb · {player.assists} ast</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-5 flex flex-wrap gap-3">
                <button onClick={() => doLiveActionDirect('publish')} className="rounded-xl bg-[var(--verde)] px-4 py-3 text-[10px] font-black uppercase tracking-widest text-white">Publicar no site</button>
                <Link href={`/games/${gameId}/live`} className="rounded-xl border border-[var(--border)] px-4 py-3 text-[10px] font-black uppercase tracking-widest text-[var(--black)]">Ver público</Link>
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
                  Período {period.period}: {period.homePoints} × {period.awayPoints}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {mode === 'report' && (
        <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-[28px] border border-[var(--border)] bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <h2 className="fgb-display text-2xl leading-none text-[var(--black)]">Relatório oficial</h2>
              <button onClick={exportReportPdf} className="rounded-xl bg-[var(--black)] px-4 py-3 text-[10px] font-black uppercase tracking-widest text-white">Baixar PDF</button>
            </div>
            <div className="mt-5 space-y-3">
              {(data.boxScore?.teams || []).map((team: any) => (
                <div key={team.id} className="rounded-2xl border border-[var(--border)] px-4 py-3 text-sm text-[var(--black)]">
                  <strong>{team.teamName}</strong>: {team.points} pts · {team.assists} ast · {team.reboundsTotal} reb · {team.steals} stl
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-[28px] border border-[var(--border)] bg-white p-6 shadow-sm">
            <h2 className="fgb-display text-2xl leading-none text-[var(--black)]">Box score individual</h2>
            <div className="mt-5 space-y-3">
              {(data.boxScore?.players || []).map((player: any) => (
                <div key={player.id} className="grid grid-cols-[1fr_auto] gap-3 rounded-2xl border border-[var(--border)] px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold text-[var(--black)]">{player.athleteName}</p>
                    <p className="text-xs text-[var(--gray)]">{player.teamName}</p>
                  </div>
                  <div className="text-right text-sm text-[var(--black)]">
                    <p><strong>{player.points}</strong> pts</p>
                    <p>{player.reboundsTotal} reb · {player.assists} ast</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
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
                <p className="mt-1 text-xs text-[var(--gray)]">{log.actionType} · {log.targetEntity}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
