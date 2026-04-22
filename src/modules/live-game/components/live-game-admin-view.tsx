'use client'

import { useLiveAdminConsole } from '../hooks/use-live-admin-console'
import type { AdminViewMode } from '../types/live-admin'
import { LiveAdminModeRenderer } from './live-admin-mode-renderer'
import { LiveAdminShell } from './live-admin-shell'

export function LiveGameAdminView({
  gameId,
  mode,
  championshipId,
}: {
  gameId: string
  mode: AdminViewMode
  championshipId?: string
}) {
  const liveAdmin = useLiveAdminConsole({ gameId, mode })

  return (
    <LiveAdminShell
      gameId={gameId}
      championshipId={championshipId}
      mode={mode}
      data={liveAdmin.data}
      game={liveAdmin.game}
      error={liveAdmin.error}
      isInitialLoading={liveAdmin.isInitialLoading}
      isRefreshingInBackground={liveAdmin.isRefreshingInBackground}
      pendingCount={liveAdmin.pendingCount}
      onRetry={liveAdmin.handlers.retry}
    >
      <LiveAdminModeRenderer
        mode={mode}
        data={liveAdmin.data}
        gameId={gameId}
        tableModel={liveAdmin.tableModel}
        selectedTeam={liveAdmin.selectedTeam}
        selectedAthlete={liveAdmin.selectedAthlete}
        isSyncing={liveAdmin.isSyncing}
        submitting={liveAdmin.submitting}
        selection={liveAdmin.selection}
        selectionActions={liveAdmin.selectionActions}
        handlers={liveAdmin.handlers}
      />
    </LiveAdminShell>
  )
}
