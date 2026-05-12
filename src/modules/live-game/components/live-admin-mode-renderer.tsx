'use client'

import type { LiveGameTableModel, LiveTablePlayer, LiveTableTeam } from './live-game-table-adapter'
import { LiveAdminAuditMode } from './live-admin-audit-mode'
import { LiveFibaTable } from './live-fiba/live-fiba-table'
import { FourFactorsLive } from './live-fiba/four-factors-live'
import { LiveAdminPregameMode } from './live-admin-pregame-mode'
import { LiveAdminReportMode } from './live-admin-report-mode'
import { LiveAdminReviewMode } from './live-admin-review-mode'
import type { LiveAdminPresentation } from './live-game-admin-view'
import type {
  AdminViewMode,
  LiveAdminHandlers,
  LiveAdminSelectionActions,
  LiveAdminSelectionState,
} from '../types/live-admin'

type LiveAdminModeRendererProps = {
  mode: AdminViewMode
  data: any
  gameId: string
  tableModel: LiveGameTableModel
  selectedTeam: LiveTableTeam | null
  selectedAthlete: LiveTablePlayer | null
  isSyncing: boolean
  error: string
  pendingCount: number
  submitting: boolean
  selection: LiveAdminSelectionState
  selectionActions: LiveAdminSelectionActions
  handlers: LiveAdminHandlers
  presentation?: LiveAdminPresentation
  fullscreenHref?: string
  exitHref?: string
}

export function LiveAdminModeRenderer({
  mode,
  data,
  gameId,
  tableModel,
  selectedTeam,
  selectedAthlete,
  isSyncing,
  error,
  pendingCount,
  submitting,
  selection,
  selectionActions,
  handlers,
  presentation = 'admin',
  fullscreenHref = '',
  exitHref = '',
}: LiveAdminModeRendererProps) {
  if (mode === 'pregame') {
    return <LiveAdminPregameMode data={data} submitting={submitting} handlers={handlers} />
  }

  if (mode === 'live') {
    const events = (data?.events ?? []) as { eventType: string; teamId: string; payloadJson?: string | null; isReverted?: boolean }[]
    const liveEvents = events.filter((event) => !event.isReverted)
    const homeTeamId = data?.game?.homeTeamId ?? ''
    const awayTeamId = data?.game?.awayTeamId ?? ''
    const homeTeamName = data?.game?.homeTeam?.name ?? 'Casa'
    const awayTeamName = data?.game?.awayTeam?.name ?? 'Visitante'
    const canShowFourFactors =
      presentation !== 'fullscreen' && homeTeamId && awayTeamId && liveEvents.length > 0

    return (
      <>
        <LiveFibaTable
          tableModel={tableModel}
          handlers={handlers}
          isSyncing={isSyncing}
          selection={selection}
          selectionActions={selectionActions}
          pendingCount={pendingCount}
          error={error}
          onRefresh={handlers.retry}
          presentation={presentation}
          fullscreenHref={fullscreenHref}
          exitHref={exitHref}
        />
        {canShowFourFactors && (
          <div className="mt-6">
            <FourFactorsLive
              events={liveEvents}
              homeTeamId={homeTeamId}
              awayTeamId={awayTeamId}
              homeTeamName={homeTeamName}
              awayTeamName={awayTeamName}
            />
          </div>
        )}
      </>
    )
  }

  if (mode === 'review') {
    return <LiveAdminReviewMode data={data} submitting={submitting} handlers={handlers} />
  }

  if (mode === 'report') {
    return <LiveAdminReportMode data={data} />
  }

  return <LiveAdminAuditMode data={data} />
}
