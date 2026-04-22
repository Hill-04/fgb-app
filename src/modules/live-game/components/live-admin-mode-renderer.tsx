'use client'

import type { LiveGameTableModel, LiveTablePlayer, LiveTableTeam } from './live-game-table-adapter'
import { LiveAdminAuditMode } from './live-admin-audit-mode'
import { LiveAdminLiveMode } from './live-admin-live-mode'
import { LiveAdminPregameMode } from './live-admin-pregame-mode'
import { LiveAdminReportMode } from './live-admin-report-mode'
import { LiveAdminReviewMode } from './live-admin-review-mode'
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
  submitting: boolean
  selection: LiveAdminSelectionState
  selectionActions: LiveAdminSelectionActions
  handlers: LiveAdminHandlers
}

export function LiveAdminModeRenderer({
  mode,
  data,
  gameId,
  tableModel,
  selectedTeam,
  selectedAthlete,
  isSyncing,
  submitting,
  selection,
  selectionActions,
  handlers,
}: LiveAdminModeRendererProps) {
  if (mode === 'pregame') {
    return <LiveAdminPregameMode data={data} submitting={submitting} handlers={handlers} />
  }

  if (mode === 'live') {
    return (
      <LiveAdminLiveMode
        data={data}
        gameId={gameId}
        tableModel={tableModel}
        selectedTeam={selectedTeam}
        selectedAthlete={selectedAthlete}
        isSyncing={isSyncing}
        selection={selection}
        selectionActions={selectionActions}
        handlers={handlers}
      />
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
