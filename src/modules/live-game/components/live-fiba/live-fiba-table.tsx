'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { LiveFibaBoxscore } from './live-fiba-boxscore'
import { LiveFibaControls } from './live-fiba-controls'
import { LiveFibaEventLog } from './live-fiba-event-log'
import { LiveFibaScoreboard } from './live-fiba-scoreboard'
import { LiveFibaTeamPanel } from './live-fiba-team-panel'
import type { LiveGameTableModel, LiveTableSide } from '../live-game-table-adapter'
import { getLiveControlAvailability } from '../../live-fiba-config'
import type { LiveAdminHandlers, LiveAdminSelectionActions, LiveAdminSelectionState } from '../../types/live-admin'
import type { LiveAdminPresentation } from '../live-game-admin-view'

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
  presentation?: LiveAdminPresentation
  fullscreenHref?: string
  exitHref?: string
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
  presentation = 'admin',
  fullscreenHref = '',
  exitHref = '',
}: LiveFibaTableProps) {
  const [recentInteraction, setRecentInteraction] = useState<RecentLiveInteraction | null>(null)
  const actionLockRef = useRef<Map<string, number>>(new Map())
  const selectedPlayer = useMemo(() => findSelectedPlayer(tableModel, selection), [selection, tableModel])
  const controlAvailability = useMemo(
    () =>
      getLiveControlAvailability({
        liveStatus: tableModel.liveStatus,
        currentPeriod: tableModel.currentPeriod,
        isFinal: ['FINAL_PENDING_CONFIRMATION', 'FINAL_OFFICIAL'].includes(tableModel.liveStatus),
      }),
    [tableModel.currentPeriod, tableModel.liveStatus]
  )

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
    ? `#${String(selectedPlayer.jerseyNumber ?? '--').padStart(2, '0')} ${selectedPlayer.name}`
    : null

  const operationalHint = selectedPlayer
    ? 'Jogador travado para clique rapido e atalhos.'
    : 'Selecione um atleta para operar sem trocar de contexto.'
  const fullscreen = presentation === 'fullscreen'

  return (
    <div
      className={[
        'relative flex flex-col overflow-hidden bg-[#05070b] text-white shadow-[0_40px_110px_rgba(0,0,0,0.5)]',
        fullscreen
          ? 'h-[100dvh] w-screen border-0 p-2 md:p-2.5'
          : 'min-h-[calc(100dvh-2rem)] rounded-[34px] border border-white/10 p-3 md:p-4',
      ].join(' ')}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_0%_0%,rgba(20,85,48,0.28),transparent_28%),radial-gradient(circle_at_100%_0%,rgba(204,16,22,0.25),transparent_30%),linear-gradient(180deg,rgba(255,255,255,0.03),transparent_28%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.05] [background-image:linear-gradient(90deg,#fff_1px,transparent_1px),linear-gradient(#fff_1px,transparent_1px)] [background-size:32px_32px]" />

      <div className={['relative grid min-h-0 flex-1 grid-rows-[auto_minmax(0,1fr)_auto]', fullscreen ? 'gap-2' : 'gap-3'].join(' ')}>
        <div className="z-30">
          <LiveFibaScoreboard
            tableModel={tableModel}
            visualShotClock={selection.visualShotClock}
            operatorFocusTeamId={selection.selectedTeamId}
            recentInteraction={recentInteraction}
            isSyncing={isSyncing}
            pendingCount={pendingCount}
            presentation={presentation}
            fullscreenHref={fullscreenHref}
            exitHref={exitHref}
          />
        </div>

        <main className={['grid min-h-0 xl:grid-cols-[minmax(360px,1fr)_minmax(320px,0.86fr)_minmax(360px,1fr)]', fullscreen ? 'gap-2' : 'gap-3'].join(' ')}>
          <LiveFibaTeamPanel
            team={tableModel.home}
            selectedAthleteId={selection.selectedAthleteId}
            recentInteraction={recentInteraction}
            onSelectAthlete={(athleteId) => handleSelectAthlete(tableModel.home.id, athleteId)}
            onPlayerAction={(player, action) => handlePlayerEvent(tableModel.home.id, player.athleteId, action)}
          />

          <div className={['grid min-h-0 xl:grid-rows-[auto_minmax(0,1fr)_auto]', fullscreen ? 'gap-2' : 'gap-3'].join(' ')}>
            <section className="grid gap-3 rounded-[28px] border border-white/10 bg-[#0a0e14] p-4 text-white shadow-[0_24px_72px_rgba(0,0,0,0.34)]">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.26em] text-[#F5C200]">Contexto operacional</p>
                  <h2 className="mt-1 text-lg font-black uppercase tracking-[0.04em] text-white">Mesa unica em modo continuo</h2>
                </div>
                <span className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-white/64">
                  {tableModel.liveStatus}
                </span>
              </div>

              <div className="grid gap-2 text-[11px] font-black uppercase tracking-[0.14em] text-white/78">
                <div className="rounded-2xl border border-[#F5C200]/20 bg-[#F5C200]/10 px-3 py-2 text-[#F5C200]">
                  Proxima acao sugerida: {controlAvailability.startOrResume.label}
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/[0.05] px-3 py-2">
                  Jogador ativo: <span className="text-white">{selectedPlayerSummary || 'Nenhum travado'}</span>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/20 px-3 py-2 text-white/62">
                  {operationalHint}
                </div>
              </div>

              <div className="grid gap-2 rounded-[24px] border border-white/10 bg-black/20 px-3 py-3">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/42">Atalhos de mesa</p>
                <div className="grid grid-cols-3 gap-2 text-[10px] font-black uppercase tracking-[0.14em] text-white/74">
                  <span className="rounded-xl bg-white/[0.06] px-2 py-2">1 +1</span>
                  <span className="rounded-xl bg-white/[0.06] px-2 py-2">2 +2</span>
                  <span className="rounded-xl bg-white/[0.06] px-2 py-2">3 +3</span>
                  <span className="rounded-xl bg-white/[0.06] px-2 py-2">F FOUL</span>
                  <span className="rounded-xl bg-white/[0.06] px-2 py-2">R REB</span>
                  <span className="rounded-xl bg-white/[0.06] px-2 py-2">A AST</span>
                  <span className="rounded-xl bg-white/[0.06] px-2 py-2">S STL</span>
                  <span className="rounded-xl bg-white/[0.06] px-2 py-2">B BLK</span>
                  <span className="rounded-xl bg-white/[0.06] px-2 py-2">T TO</span>
                </div>
              </div>
            </section>

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

        <div className="z-30">
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
            presentation={presentation}
          />
        </div>
      </div>
    </div>
  )
}
