// ============================================================
// FGB — Types da Súmula Eletrônica Full FIBA
// ============================================================

export type TeamSide = "HOME" | "AWAY"

export type SumulaStatus =
  | "NAO_INICIADA"
  | "EM_ANDAMENTO"
  | "INTERVALO"
  | "FINALIZADA"
  | "ASSINADA"
  | "HOMOLOGADA"

export type FoulType =
  | "PESSOAL"
  | "TECNICA"
  | "ANTIDESPORTIVA"
  | "DISQUALIFICANTE"

export type SignatureRole =
  | "ARBITRO_PRINCIPAL"
  | "ARBITRO_AUXILIAR"
  | "REPRESENTANTE_HOME"
  | "REPRESENTANTE_AWAY"
  | "MESARIO"

export type ScoutEventType =
  | "CESTA_2PTS"
  | "CESTA_3PTS"
  | "LANCE_LIVRE_CONVERTIDO"
  | "LANCE_LIVRE_ERRADO"
  | "TENTATIVA_2PTS_ERRADA"
  | "TENTATIVA_3PTS_ERRADA"
  | "REBOTE_OFENSIVO"
  | "REBOTE_DEFENSIVO"
  | "ASSISTENCIA"
  | "ROUBO_DE_BOLA"
  | "TOCO"
  | "TURNO_OVER"
  | "FALTA_PESSOAL_COMETIDA"
  | "FALTA_TECNICA_COMETIDA"
  | "FALTA_ANTIDESPORTIVA_COMETIDA"
  | "FALTA_DISQUALIFICANTE_COMETIDA"
  | "FALTA_RECEBIDA"
  | "ENTRADA_EM_QUADRA"
  | "SAIDA_DE_QUADRA"
  | "TIMEOUT_SOLICITADO"
  | "VIOLACAO_24S"
  | "VIOLACAO_8S"
  | "VIOLACAO_3S"
  | "BOLA_FORA"

export interface PlayerStats {
  points: number
  fieldGoalsMade: number
  fieldGoalsAttempted: number
  threePointersMade: number
  threePointersAttempted: number
  freeThrowsMade: number
  freeThrowsAttempted: number
  offensiveRebounds: number
  defensiveRebounds: number
  totalRebounds: number
  assists: number
  steals: number
  blocks: number
  turnovers: number
  personalFouls: number
  technicalFouls: number
  unsportsmanlikeFouls: number
  disqualifyingFouls: number
  foulsReceived: number
  secondsPlayed: number
  efficiency: number
}

export interface PlayerOnGame {
  id: string
  sumulaId: string
  athleteId: string
  teamSide: TeamSide
  jerseyNumber: number
  fullName: string
  position?: string
  isStarter: boolean
  isCaptain: boolean
  isCoach: boolean
  isOnCourt: boolean
  isDisqualified: boolean
  isEjected: boolean
  stats: PlayerStats
}

export interface SumulaEvent {
  id: string
  sumulaId: string
  sequence: number
  period: number
  gameClockMs: number
  realTimestamp: string
  type: ScoutEventType
  teamSide: TeamSide
  playerOnGameId?: string
  playerJerseyNumber?: number
  playerName?: string
  assistedByPlayerId?: string
  foulType?: FoulType
  committedBy?: string
  foulOnPlayerId?: string
  homeScoreAfter: number
  awayScoreAfter: number
  substitutedPlayerId?: string
  isCancelled: boolean
}

export interface Sumula {
  id: string
  gameId: string
  status: SumulaStatus
  startedAt?: string
  finishedAt?: string
  signedAt?: string
  currentPeriod: number
  isOvertime: boolean
  overtimeCount: number
  homeScore: number
  awayScore: number
  homePeriodScores: number[]
  awayPeriodScores: number[]
  homeTeamFoulsByPeriod: number[]
  awayTeamFoulsByPeriod: number[]
  homeTimeoutsUsed: number
  awayTimeoutsUsed: number
  homeTimeoutsUsedLastPeriod: number
  awayTimeoutsUsedLastPeriod: number
}

export interface SumulaLocalState {
  sumula: Sumula
  homeLineup: PlayerOnGame[]
  awayLineup: PlayerOnGame[]
  events: SumulaEvent[]
  gameClockMs: number
  shotClockMs: number
  isClockRunning: boolean
  isShotClockRunning: boolean
  possession: TeamSide | null
}

export const FIBA = {
  PERIODS: 4,
  PERIOD_MS: 10 * 60 * 1000,
  OT_MS: 5 * 60 * 1000,
  SHOT_CLOCK_MS: 24 * 1000,
  SHOT_CLOCK_RESET_REBOUND_MS: 14 * 1000,
  MAX_PERSONAL_FOULS: 5,
  TEAM_FOUL_BONUS: 4,
  MAX_TIMEOUTS: 5,
  MAX_TIMEOUTS_LAST_2MIN: 2,
  LAST_2MIN_MS: 2 * 60 * 1000,
} as const
