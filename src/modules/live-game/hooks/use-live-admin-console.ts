'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { applyOptimisticEvent, isSameActionSignature, reapplyPendingMutations, resolveShotClockReset } from '../client/live-optimistic'
import { normalizeEnvelope, shouldDeferRemote, shouldUseResponseEnvelope } from '../client/live-reconciliation'
import {
  buildLiveGameTableModel,
  type LiveGameTableModel,
  type LiveTablePlayer,
  type LiveTableTab,
  type LiveTableTeam,
} from '../components/live-game-table-adapter'
import type {
  AdminViewMode,
  LiveAdminHandlers,
  LiveAdminSelectionActions,
  LiveAdminSelectionState,
  LiveEnvelope,
  PendingMutation,
  PlayerQuickAction,
} from '../types/live-admin'

type UseLiveAdminConsoleParams = {
  gameId: string
  mode: AdminViewMode
}

type UseLiveAdminConsoleResult = {
  data: any
  game: any
  tableModel: LiveGameTableModel
  selectedTeam: LiveTableTeam | null
  selectedAthlete: LiveTablePlayer | null
  isInitialLoading: boolean
  isRefreshingInBackground: boolean
  isSyncing: boolean
  submitting: boolean
  error: string
  pendingCount: number
  selection: LiveAdminSelectionState
  selectionActions: LiveAdminSelectionActions
  handlers: LiveAdminHandlers
}

async function postJson(url: string, body: Record<string, unknown>) {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data.error || 'Erro na operacao')
  return data
}

export function useLiveAdminConsole({ gameId, mode }: UseLiveAdminConsoleParams): UseLiveAdminConsoleResult {
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
      if (!response.ok) throw new Error(payload.error || 'Falha ao carregar modulo live')

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

          if (shouldDeferRemote(deferredRemoteRef.current, envelope)) {
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
        const useEnvelope = shouldUseResponseEnvelope(confirmedEnvelopeRef.current, responseEnvelope)

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
    const role = window.prompt('Funcao do oficial:', 'Principal') || 'Principal'
    const officials = [...(data.officials || []), { name, officialType, role }]
    await doPregameAction('assign-officials', { officials })
  }

  const exportReportPdf = async () => {
    const { jsPDF } = await import('jspdf')
    const autoTable = (await import('jspdf-autotable')).default
    const doc = new jsPDF()
    doc.setFontSize(16)
    doc.text('FGB - Sumula Oficial da Partida', 14, 16)
    doc.setFontSize(10)
    doc.text(`${data.game.championship.name} - ${data.game.category.name}`, 14, 24)
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

  const handlePlayerQuickAction = (teamId: string, player: LiveTablePlayer, action: PlayerQuickAction) => {
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

  const retry = () => {
    setError('')
    void load()
  }

  return {
    data,
    game: data?.game ?? null,
    tableModel,
    selectedTeam,
    selectedAthlete,
    isInitialLoading,
    isRefreshingInBackground,
    isSyncing: pendingMutations.length > 0 || isRefreshingInBackground,
    submitting,
    error,
    pendingCount: pendingMutations.length,
    selection: {
      selectedTeamId,
      selectedAthleteId,
      selectedPeriod,
      clockTime,
      visualShotClock,
      activeTab,
    },
    selectionActions: {
      setSelectedTeamId,
      setSelectedAthleteId,
      setSelectedPeriod,
      setClockTime,
      setVisualShotClock,
      setActiveTab,
    },
    handlers: {
      load: () => void load(),
      retry,
      doPregameAction,
      doLiveActionDirect,
      enqueueLiveEvent,
      doReviewAction,
      updateRosterPlayer,
      addOfficial,
      exportReportPdf,
      handlePlayerQuickAction,
      handleControlEvent,
      handleTimeoutFromSide,
    },
  }
}
