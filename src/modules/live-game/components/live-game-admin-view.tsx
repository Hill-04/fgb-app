'use client'

import { useMemo } from 'react'

import { buildAdminGamePath } from '@/lib/admin-game-routing'
import { useLiveAdminConsole } from '../hooks/use-live-admin-console'
import type { AdminViewMode } from '../types/live-admin'
import { LiveAdminModeRenderer } from './live-admin-mode-renderer'
import { LiveAdminShell } from './live-admin-shell'

export type LiveAdminPresentation = 'admin' | 'fullscreen'

export function LiveGameAdminView({
  gameId,
  mode,
  championshipId,
  presentation = 'admin',
}: {
  gameId: string
  mode: AdminViewMode
  championshipId?: string
  presentation?: LiveAdminPresentation
}) {
  const liveAdmin = useLiveAdminConsole({ gameId, mode })
  const fullscreenHref = useMemo(() => {
    if (mode !== 'live') return ''
    const params = new URLSearchParams()
    if (championshipId) params.set('championshipId', championshipId)
    const query = params.toString()
    return `/live/${gameId}/mesa${query ? `?${query}` : ''}`
  }, [championshipId, gameId, mode])
  const exitHref = useMemo(() => buildAdminGamePath(gameId, 'live', championshipId), [championshipId, gameId])

  return (
    <LiveAdminShell
      gameId={gameId}
      championshipId={championshipId}
      mode={mode}
      presentation={presentation}
      data={liveAdmin.data}
      game={liveAdmin.game}
      error={liveAdmin.error}
      isInitialLoading={liveAdmin.isInitialLoading}
      isRefreshingInBackground={liveAdmin.isRefreshingInBackground}
      pendingCount={liveAdmin.pendingCount}
      onRetry={liveAdmin.handlers.retry}
      fullscreenHref={fullscreenHref}
    >
      <LiveAdminModeRenderer
        mode={mode}
        data={liveAdmin.data}
        gameId={gameId}
        tableModel={liveAdmin.tableModel}
        selectedTeam={liveAdmin.selectedTeam}
        selectedAthlete={liveAdmin.selectedAthlete}
        isSyncing={liveAdmin.isSyncing}
        error={liveAdmin.error}
        pendingCount={liveAdmin.pendingCount}
        submitting={liveAdmin.submitting}
        selection={liveAdmin.selection}
        selectionActions={liveAdmin.selectionActions}
        handlers={liveAdmin.handlers}
        presentation={presentation}
        fullscreenHref={fullscreenHref}
        exitHref={exitHref}
      />
    </LiveAdminShell>
  )
}
