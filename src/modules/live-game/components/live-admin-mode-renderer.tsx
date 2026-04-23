'use client'

import type { LiveGameTableModel, LiveTablePlayer, LiveTableTeam } from './live-game-table-adapter'
import { LiveAdminAuditMode } from './live-admin-audit-mode'
import { LiveFibaTable } from './live-fiba/live-fiba-table'
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
  error: string
  pendingCount: number
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
  error,
  pendingCount,
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
      <LiveFibaTable
        tableModel={tableModel}
        handlers={handlers}
        isSyncing={isSyncing}
        selection={selection}
        selectionActions={selectionActions}
        pendingCount={pendingCount}
        error={error}
        onRefresh={handlers.retry}
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
