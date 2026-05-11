/**
 * FSDEF — FIBA Statistics Data Exchange Format
 *
 * Vocabulario canonico de acoes de jogo, derivado do bundle FIBA LiveStats
 * (GeniusSports.DataPlatform.Contracts.StandardEvents.Basketball).
 *
 * Use estes valores como `eventType` em `GameEvent`. Eventos legados (anteriores
 * a Fase 1) podem ter outros valores; nao os altere — sao historico.
 *
 * Novos eventos DEVEM usar `FsdefEventType` validado por `assertFsdefEventType`.
 */

export const FSDEF_EVENT_TYPES = {
  // === Field goals (cesta) ===
  TWO_PT_MADE: "P2_MADE",
  TWO_PT_MISS: "P2_MISS",
  THREE_PT_MADE: "P3_MADE",
  THREE_PT_MISS: "P3_MISS",

  // === Free throws (lance livre) ===
  FREE_THROW_MADE: "FT_MADE",
  FREE_THROW_MISS: "FT_MISS",
  FREE_THROW_AWARDED: "FT_AWARDED",

  // === Rebounds ===
  REBOUND_OFFENSIVE: "REB_OFF",
  REBOUND_DEFENSIVE: "REB_DEF",
  REBOUND_TEAM: "REB_TEAM",
  REBOUND_DEAD_BALL: "REB_DEAD",

  // === Playmaking ===
  ASSIST: "AST",
  STEAL: "STL",
  BLOCK: "BLK",
  TURNOVER: "TO",

  // === Fouls ===
  FOUL_PERSONAL: "F_PERS",
  FOUL_OFFENSIVE: "F_OFF",
  FOUL_TECHNICAL: "F_TEC",
  FOUL_UNSPORTSMANLIKE: "F_UNS",
  FOUL_DISQUALIFYING: "F_DSQ",
  FOUL_BENCH: "F_BENCH",
  FOUL_COACH: "F_COACH",

  // === Game flow ===
  SUBSTITUTION_IN: "SUB_IN",
  SUBSTITUTION_OUT: "SUB_OUT",
  TIMEOUT: "TIM",
  PERIOD_START: "PER_START",
  PERIOD_END: "PER_END",
  GAME_START: "GAME_START",
  GAME_END: "GAME_END",
  OVERTIME_START: "OT_START",

  // === Meta (correcoes, anotacoes oficiais) ===
  CORRECTION: "CORR",
  OFFICIAL_NOTE: "NOTE",
} as const

export type FsdefEventType =
  (typeof FSDEF_EVENT_TYPES)[keyof typeof FSDEF_EVENT_TYPES]

const ALL_FSDEF_VALUES = new Set<string>(Object.values(FSDEF_EVENT_TYPES))

export function isFsdefEventType(value: string): value is FsdefEventType {
  return ALL_FSDEF_VALUES.has(value)
}

export function assertFsdefEventType(value: string): asserts value is FsdefEventType {
  if (!isFsdefEventType(value)) {
    throw new Error(
      `Invalid FSDEF event type: "${value}". Valid values: ${Object.values(
        FSDEF_EVENT_TYPES,
      ).join(", ")}`,
    )
  }
}

// === Categorizacao ===

const POINT_EVENTS: Record<FsdefEventType, number> = {
  [FSDEF_EVENT_TYPES.TWO_PT_MADE]: 2,
  [FSDEF_EVENT_TYPES.THREE_PT_MADE]: 3,
  [FSDEF_EVENT_TYPES.FREE_THROW_MADE]: 1,
} as Record<FsdefEventType, number>

/**
 * Retorna pontos gerados pelo evento (0 se nao for evento de ponto).
 */
export function pointsFromEvent(type: FsdefEventType): number {
  return POINT_EVENTS[type] ?? 0
}

const SHOT_ATTEMPT_EVENTS = new Set<FsdefEventType>([
  FSDEF_EVENT_TYPES.TWO_PT_MADE,
  FSDEF_EVENT_TYPES.TWO_PT_MISS,
  FSDEF_EVENT_TYPES.THREE_PT_MADE,
  FSDEF_EVENT_TYPES.THREE_PT_MISS,
])

export function isShotAttempt(type: FsdefEventType): boolean {
  return SHOT_ATTEMPT_EVENTS.has(type)
}

const FOUL_EVENTS = new Set<FsdefEventType>([
  FSDEF_EVENT_TYPES.FOUL_PERSONAL,
  FSDEF_EVENT_TYPES.FOUL_OFFENSIVE,
  FSDEF_EVENT_TYPES.FOUL_TECHNICAL,
  FSDEF_EVENT_TYPES.FOUL_UNSPORTSMANLIKE,
  FSDEF_EVENT_TYPES.FOUL_DISQUALIFYING,
  FSDEF_EVENT_TYPES.FOUL_BENCH,
  FSDEF_EVENT_TYPES.FOUL_COACH,
])

export function isFoul(type: FsdefEventType): boolean {
  return FOUL_EVENTS.has(type)
}

const REBOUND_EVENTS = new Set<FsdefEventType>([
  FSDEF_EVENT_TYPES.REBOUND_OFFENSIVE,
  FSDEF_EVENT_TYPES.REBOUND_DEFENSIVE,
  FSDEF_EVENT_TYPES.REBOUND_TEAM,
  FSDEF_EVENT_TYPES.REBOUND_DEAD_BALL,
])

export function isRebound(type: FsdefEventType): boolean {
  return REBOUND_EVENTS.has(type)
}
