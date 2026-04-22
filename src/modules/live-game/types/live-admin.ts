import type { LiveTablePlayer, LiveTableTab } from '../components/live-game-table-adapter'

export type AdminViewMode = 'pregame' | 'live' | 'review' | 'report' | 'audit'

export type LiveEnvelope = {
  snapshot: any
  lastSequenceNumber: number
  serverUpdatedAt: string
  lastEventId: string | null
}

export type PendingMutation = {
  id: string
  signature: string
  requestBody: Record<string, unknown>
  optimisticSequenceNumber: number
  createdAt: number
}

export type PlayerQuickAction = '2pts' | '3pts' | 'ft' | 'foul' | 'reb' | 'ast' | 'sub'

export type LiveAdminSelectionState = {
  selectedTeamId: string
  selectedAthleteId: string
  selectedPeriod: number
  clockTime: string
  visualShotClock: number
  activeTab: LiveTableTab
}

export type LiveAdminSelectionActions = {
  setSelectedTeamId: (value: string) => void
  setSelectedAthleteId: (value: string) => void
  setSelectedPeriod: (value: number) => void
  setClockTime: (value: string) => void
  setVisualShotClock: (value: number) => void
  setActiveTab: (value: LiveTableTab) => void
}

export type LiveAdminHandlers = {
  load: () => void
  retry: () => void
  doPregameAction: (action: string, extra?: Record<string, unknown>) => Promise<void>
  doLiveActionDirect: (action: string, extra?: Record<string, unknown>) => Promise<void>
  enqueueLiveEvent: (extra: Record<string, unknown>) => void
  doReviewAction: () => Promise<void>
  updateRosterPlayer: (rosterPlayerId: string, patch: Record<string, unknown>) => Promise<void>
  addOfficial: () => Promise<void>
  exportReportPdf: () => Promise<void>
  handlePlayerQuickAction: (teamId: string, player: LiveTablePlayer, action: PlayerQuickAction) => void
  handleControlEvent: (eventType: string) => void
  handleTimeoutFromSide: (side: 'home' | 'away') => void
}

export const MODE_LABELS: Record<AdminViewMode, string> = {
  pregame: 'Pre-jogo',
  live: 'Live',
  review: 'Encerramento',
  report: 'Sumula',
  audit: 'Auditoria',
}

export const QUICK_EVENTS = [
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
