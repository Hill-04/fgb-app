'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { LiveFibaBoxscore } from './live-fiba-boxscore'
import { LiveFibaControls } from './live-fiba-controls'
import { LiveFibaEventLog } from './live-fiba-event-log'
import { LiveFibaScoreboard } from './live-fiba-scoreboard'
import { LiveFibaTeamPanel } from './live-fiba-team-panel'
import type { LiveGameTableModel, LiveTableSide } from '../live-game-table-adapter'
import type { LiveAdminHandlers, LiveAdminSelectionActions, LiveAdminSelectionState } from '../../types/live-admin'

export type RecentLiveInteraction = {
  id: string
  teamId: string | null
  athleteId: string | null
  eventType: string
  side: LiveTableSide | null
  at: number
}

type LiveFibaTableProps = {
  tableModel: LiveGameTableModel
  selection: LiveAdminSelectionState
  selectionActions: LiveAdminSelectionActions
  isSyncing?: boolean
  pendingCount?: number
  error?: string
  onRefresh?: () => void
  handlers: Pick<LiveAdminHandlers, 'enqueueLiveEvent' | 'handleControlEvent' | 'handleTimeoutFromSide'>
}

const KEYBOARD_ACTIONS: Record<string, { eventType: string; pointsDelta?: number }> = {
  '1': { eventType: 'FREE_THROW_MADE', pointsDelta: 1 },
  '2': { eventType: 'SHOT_MADE_2', pointsDelta: 2 },
  '3': { eventType: 'SHOT_MADE_3', pointsDelta: 3 },
  f: { eventType: 'FOUL_PERSONAL' },
  r: { eventType: 'REBOUND_DEFENSIVE' },
  a: { eventType: 'ASSIST' },
  s: { eventType: 'STEAL' },
  b: { eventType: 'BLOCK' },
  t: { eventType: 'TURNOVER' },
}

const ACTION_LOCK_WINDOW_MS = 280

function resolveTeamSide(teamId: string | null, tableModel: LiveGameTableModel): LiveTableSide | null {
  if (!teamId) return null
  if (teamId === tableModel.home.id) return 'home'
  if (teamId === tableModel.away.id) return 'away'
  return null
}

function findSelectedPlayer(tableModel: LiveGameTableModel, selection: LiveAdminSelectionState) {
  if (!selection.selectedAthleteId) return null
  const players = [...tableModel.home.players, ...tableModel.away.players]
  return players.find((player) => player.athleteId === selection.selectedAthleteId) || null
}

export function LiveFibaTable({
  tableModel,
  selection,
  selectionActions,
  isSyncing = false,
  pendingCount = 0,
  error = '',
  onRefresh,
  handlers,
}: LiveFibaTableProps) {
  const [recentInteraction, setRecentInteraction] = useState<RecentLiveInteraction | null>(null)
  const actionLockRef = useRef<Map<string, number>>(new Map())
  const selectedPlayer = useMemo(() => findSelectedPlayer(tableModel, selection), [selection, tableModel])

  useEffect(() => {
    if (!recentInteraction) return undefined
    const timeoutId = window.setTimeout(() => {
      setRecentInteraction((current) => (current?.id === recentInteraction.id ? null : current))
    }, 950)
    return () => window.clearTimeout(timeoutId)
  }, [recentInteraction])

  const handleSelectAthlete = useCallback(
    (teamId: string, athleteId: string) => {
      selectionActions.setSelectedTeamId(teamId)
      selectionActions.setSelectedAthleteId(athleteId)
    },
    [selectionActions]
  )

  const dispatchAction = useCallback(
    (teamId: string, athleteId: string | null, action: { eventType: string; pointsDelta?: number }) => {
      const lockKey = [teamId || 'neutral', athleteId || 'team', action.eventType, selection.selectedPeriod, selection.clockTime].join(':')
      const now = Date.now()
      const lastAt = actionLockRef.current.get(lockKey)

      if (lastAt && now - lastAt < ACTION_LOCK_WINDOW_MS) {
        return
      }

      actionLockRef.current.set(lockKey, now)
      setRecentInteraction({
        id: `${lockKey}:${now}`,
        teamId,
        athleteId,
        eventType: action.eventType,
        side: resolveTeamSide(teamId, tableModel),
        at: now,
      })

      handlers.enqueueLiveEvent({
        eventType: action.eventType,
        pointsDelta: action.pointsDelta,
        teamId,
        athleteId,
        period: selection.selectedPeriod,
        clockTime: selection.clockTime,
      })
    },
    [handlers, selection.clockTime, selection.selectedPeriod, tableModel]
  )

  const handlePlayerEvent = useCallback(
    (teamId: string, athleteId: string, action: { eventType: string; pointsDelta?: number }) => {
      handleSelectAthlete(teamId, athleteId)
      dispatchAction(teamId, athleteId, action)
    },
    [dispatchAction, handleSelectAthlete]
  )

  const handleControlEvent = useCallback(
    (eventType: string) => {
      setRecentInteraction({
        id: `control:${eventType}:${Date.now()}`,
        teamId: null,
        athleteId: null,
        eventType,
        side: null,
        at: Date.now(),
      })
      handlers.handleControlEvent(eventType)
    },
    [handlers]
  )

  const handleTimeout = useCallback(
    (side: LiveTableSide) => {
      const teamId = side === 'home' ? tableModel.home.id : tableModel.away.id
      setRecentInteraction({
        id: `timeout:${teamId}:${Date.now()}`,
        teamId,
        athleteId: null,
        eventType: 'TIMEOUT_CONFIRMED',
        side,
        at: Date.now(),
      })
      handlers.handleTimeoutFromSide(side)
    },
    [handlers, tableModel.away.id, tableModel.home.id]
  )

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      const isTypingTarget =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target?.isContentEditable

      if (isTypingTarget || event.metaKey || event.ctrlKey || event.altKey) {
        return
      }

      const action = KEYBOARD_ACTIONS[event.key.toLowerCase()]
      if (!action || !selectedPlayer || !selection.selectedTeamId) return
      if (!selectedPlayer.isAvailable || !selectedPlayer.isOnCourt || selectedPlayer.disqualified || selectedPlayer.fouls >= 5) return

      event.preventDefault()
      dispatchAction(selection.selectedTeamId, selectedPlayer.athleteId, action)
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [dispatchAction, selectedPlayer, selection.selectedTeamId])

  const selectedPlayerSummary = selectedPlayer
    ? `${selectedPlayer.jerseyNumber ?? '--'} ${selectedPlayer.name}`
    : null

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden rounded-[34px] border border-white/10 bg-[#05070b] p-3 text-white shadow-[0_40px_110px_rgba(0,0,0,0.5)] md:p-4">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_0%_0%,rgba(20,85,48,0.28),transparent_28%),radial-gradient(circle_at_100%_0%,rgba(204,16,22,0.25),transparent_30%),linear-gradient(180deg,rgba(255,255,255,0.03),transparent_28%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.05] [background-image:linear-gradient(90deg,#fff_1px,transparent_1px),linear-gradient(#fff_1px,transparent_1px)] [background-size:32px_32px]" />

      <div className="relative flex min-h-0 flex-1 flex-col gap-3">
        <div className="sticky top-0 z-30">
          <LiveFibaScoreboard
            tableModel={tableModel}
            visualShotClock={selection.visualShotClock}
            operatorFocusTeamId={selection.selectedTeamId}
            recentInteraction={recentInteraction}
            isSyncing={isSyncing}
            pendingCount={pendingCount}
          />
        </div>

        <main className="grid min-h-0 flex-1 gap-3 xl:grid-cols-[minmax(0,1fr)_minmax(320px,360px)_minmax(0,1fr)]">
          <LiveFibaTeamPanel
            team={tableModel.home}
            selectedAthleteId={selection.selectedAthleteId}
            recentInteraction={recentInteraction}
            onSelectAthlete={(athleteId) => handleSelectAthlete(tableModel.home.id, athleteId)}
            onPlayerAction={(player, action) => handlePlayerEvent(tableModel.home.id, player.athleteId, action)}
          />

          <div className="grid min-h-0 gap-3 xl:grid-rows-[minmax(0,1fr)_auto]">
            <LiveFibaEventLog events={tableModel.events} recentInteractionId={recentInteraction?.id ?? ''} />
            <LiveFibaBoxscore tableModel={tableModel} />
          </div>

          <LiveFibaTeamPanel
            team={tableModel.away}
            selectedAthleteId={selection.selectedAthleteId}
            recentInteraction={recentInteraction}
            onSelectAthlete={(athleteId) => handleSelectAthlete(tableModel.away.id, athleteId)}
            onPlayerAction={(player, action) => handlePlayerEvent(tableModel.away.id, player.athleteId, action)}
          />
        </main>

        <div className="sticky bottom-0 z-30">
          <LiveFibaControls
            tableModel={tableModel}
            shotClock={selection.visualShotClock}
            selectedPlayerLabel={selectedPlayerSummary}
            recentInteraction={recentInteraction}
            isSyncing={isSyncing}
            pendingCount={pendingCount}
            error={error}
            onRefresh={onRefresh}
            onShotClockReset={selectionActions.setVisualShotClock}
            onTimeout={handleTimeout}
            onControlEvent={handleControlEvent}
          />
        </div>
      </div>
    </div>
  )
}
