'use client'

import { LiveFibaBoxscore } from './live-fiba-boxscore'
import { LiveFibaControls } from './live-fiba-controls'
import { LiveFibaEventLog } from './live-fiba-event-log'
import { LiveFibaScoreboard } from './live-fiba-scoreboard'
import { LiveFibaTeamPanel } from './live-fiba-team-panel'
import type { LiveGameTableModel } from '../live-game-table-adapter'
import type { LiveAdminHandlers, LiveAdminSelectionActions, LiveAdminSelectionState } from '../../types/live-admin'

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
  const activeTab = selection.activeTab

  const handleSelectAthlete = (teamId: string, athleteId: string) => {
    selectionActions.setSelectedTeamId(teamId)
    selectionActions.setSelectedAthleteId(athleteId)
  }

  const handlePlayerEvent = (
    teamId: string,
    athleteId: string,
    action: { eventType: string; pointsDelta?: number }
  ) => {
    handleSelectAthlete(teamId, athleteId)
    handlers.enqueueLiveEvent({
      eventType: action.eventType,
      pointsDelta: action.pointsDelta,
      teamId,
      athleteId,
      period: selection.selectedPeriod,
      clockTime: selection.clockTime,
    })
  }

  return (
    <div className="relative min-h-screen overflow-hidden rounded-[32px] border border-white/10 bg-[#05070c] p-3 text-white shadow-[0_30px_90px_rgba(0,0,0,0.38)] md:p-5">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_14%_8%,rgba(27,115,64,0.34),transparent_28%),radial-gradient(circle_at_86%_12%,rgba(204,16,22,0.28),transparent_26%),linear-gradient(180deg,rgba(255,255,255,0.04),transparent_34%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.045] [background-image:linear-gradient(90deg,#fff_1px,transparent_1px),linear-gradient(#fff_1px,transparent_1px)] [background-size:42px_42px]" />

      <div className="relative space-y-4">
        <LiveFibaScoreboard tableModel={tableModel} isSyncing={isSyncing} pendingCount={pendingCount} />

        <main className="min-h-[620px]">
          {activeTab === 'home' && (
            <LiveFibaTeamPanel
              team={tableModel.home}
              selectedAthleteId={selection.selectedAthleteId}
              onSelectAthlete={(athleteId) => handleSelectAthlete(tableModel.home.id, athleteId)}
              onPlayerAction={(player, action) => handlePlayerEvent(tableModel.home.id, player.athleteId, action)}
            />
          )}

          {activeTab === 'away' && (
            <LiveFibaTeamPanel
              team={tableModel.away}
              selectedAthleteId={selection.selectedAthleteId}
              onSelectAthlete={(athleteId) => handleSelectAthlete(tableModel.away.id, athleteId)}
              onPlayerAction={(player, action) => handlePlayerEvent(tableModel.away.id, player.athleteId, action)}
            />
          )}

          {activeTab === 'log' && <LiveFibaEventLog events={tableModel.events} />}

          {activeTab === 'box' && <LiveFibaBoxscore tableModel={tableModel} />}
        </main>

        <LiveFibaControls
          tableModel={tableModel}
          activeTab={activeTab}
          isSyncing={isSyncing}
          pendingCount={pendingCount}
          error={error}
          onTabChange={selectionActions.setActiveTab}
          onRefresh={onRefresh}
          handlers={handlers}
        />
      </div>
    </div>
  )
}
