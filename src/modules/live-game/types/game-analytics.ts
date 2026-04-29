export type TeamSide = 'HOME' | 'AWAY'
export type LeadState = 'HOME' | 'AWAY' | 'TIE'

export type KeyMoments = {
  largestLead: { team: TeamSide; value: number } | null
  largestRun: { team: TeamSide; value: number } | null
  leadChanges: number
  ties: number
}

export type LeadSegment = {
  fromSeq: number
  toSeq: number
  leader: LeadState
  homeScore: number
  awayScore: number
}

export type LeadTracker = {
  homeLeadEvents: number
  awayLeadEvents: number
  tiedEvents: number
  totalScoringEvents: number
  segments: LeadSegment[]
}

export type EfficiencyInput = {
  points: number
  rebounds: number
  assists: number
  steals: number
  blocks: number
  turnovers: number
  fgMade: number
  fgAttempted: number
  ftMade: number
  ftAttempted: number
}

export type GameAnalyticsEvent = {
  sequenceNumber: number
  teamId: string | null | undefined
  pointsDelta: number | null | undefined
  isReverted: boolean
}

export type GameAnalyticsInput = {
  events: GameAnalyticsEvent[]
  homeTeamId: string
  awayTeamId: string
}

export type PlayerEfficiency = {
  athleteId: string
  efficiency: number
}

export type GameAnalytics = {
  keyMoments: KeyMoments
  leadTracker: LeadTracker
  playerEfficiencies: PlayerEfficiency[]
}
