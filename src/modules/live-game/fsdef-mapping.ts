/**
 * FSDEF ↔ Live Module — Vocabulary Bridge (Fase 4 A)
 *
 * O modulo live-game tem seu proprio vocabulario de eventTypes (ex: SHOT_MADE_2)
 * que predates a Fase 1. A Fase 1 introduziu FSDEF (P2_MADE etc) como vocabulario
 * canonico baseado na biblioteca da FIBA.
 *
 * Este arquivo:
 * - Documenta a mapeamento bidirecional entre os dois vocabularios
 * - Provê toFsdef(legacy) e toLegacy(fsdef) para uso em pontos de integracao
 * - Lista nomes ja IDENTICOS (ex: ASSIST, STEAL, BLOCK — mesma string nos dois)
 *
 * IMPORTANTE: este arquivo NAO modifica comportamento do live-game-service.ts
 * nem da live-fiba-config.ts. Eles continuam usando o vocabulario legacy.
 * O bridge serve para:
 *   - Pontos onde precisamos converter (ex: ler GameEvent.eventType e usar FSDEF helpers)
 *   - Migracao gradual futura para canonico FSDEF
 */

import {
  FSDEF_EVENT_TYPES,
  type FsdefEventType,
} from '@/lib/constants/game-events'

/** Tipos do live-game module — strings literais conforme live-fiba-config.ts e QUICK_EVENTS. */
export type LiveLegacyEventType =
  | 'SHOT_MADE_2'
  | 'SHOT_MISSED_2'
  | 'SHOT_MADE_3'
  | 'SHOT_MISSED_3'
  | 'FREE_THROW_MADE'
  | 'FREE_THROW_MISSED'
  | 'REBOUND_OFFENSIVE'
  | 'REBOUND_DEFENSIVE'
  | 'ASSIST'
  | 'STEAL'
  | 'BLOCK'
  | 'TURNOVER'
  | 'FOUL_PERSONAL'
  | 'FOUL_TECHNICAL'
  | 'FOUL_UNSPORTSMANLIKE'
  | 'TIMEOUT_CONFIRMED'
  | 'PERIOD_START'
  | 'PERIOD_END'
  | 'HALFTIME_START'
  | 'HALFTIME_END'
  | 'GAME_START'
  | 'GAME_END'

const LEGACY_TO_FSDEF: Record<LiveLegacyEventType, FsdefEventType | null> = {
  // Shots — divergencia de naming (live SHOT_MADE_2 vs FSDEF P2_MADE)
  SHOT_MADE_2: FSDEF_EVENT_TYPES.TWO_PT_MADE,           // 'P2_MADE'
  SHOT_MISSED_2: FSDEF_EVENT_TYPES.TWO_PT_MISS,         // 'P2_MISS'
  SHOT_MADE_3: FSDEF_EVENT_TYPES.THREE_PT_MADE,         // 'P3_MADE'
  SHOT_MISSED_3: FSDEF_EVENT_TYPES.THREE_PT_MISS,       // 'P3_MISS'
  FREE_THROW_MADE: FSDEF_EVENT_TYPES.FREE_THROW_MADE,   // 'FT_MADE'
  FREE_THROW_MISSED: FSDEF_EVENT_TYPES.FREE_THROW_MISS, // 'FT_MISS'

  // Rebounds — nome IDENTICO entre vocabularios (so o valor de string difere)
  REBOUND_OFFENSIVE: FSDEF_EVENT_TYPES.REBOUND_OFFENSIVE, // 'REB_OFF'
  REBOUND_DEFENSIVE: FSDEF_EVENT_TYPES.REBOUND_DEFENSIVE, // 'REB_DEF'

  // Playmaking — nome IDENTICO
  ASSIST: FSDEF_EVENT_TYPES.ASSIST,     // 'AST'
  STEAL: FSDEF_EVENT_TYPES.STEAL,       // 'STL'
  BLOCK: FSDEF_EVENT_TYPES.BLOCK,       // 'BLK'
  TURNOVER: FSDEF_EVENT_TYPES.TURNOVER, // 'TO'

  // Fouls — nome IDENTICO
  FOUL_PERSONAL: FSDEF_EVENT_TYPES.FOUL_PERSONAL,             // 'F_PERS'
  FOUL_TECHNICAL: FSDEF_EVENT_TYPES.FOUL_TECHNICAL,           // 'F_TEC'
  FOUL_UNSPORTSMANLIKE: FSDEF_EVENT_TYPES.FOUL_UNSPORTSMANLIKE, // 'F_UNS'

  // Game flow
  TIMEOUT_CONFIRMED: FSDEF_EVENT_TYPES.TIMEOUT,   // 'TIM'
  PERIOD_START: FSDEF_EVENT_TYPES.PERIOD_START,   // 'PER_START'
  PERIOD_END: FSDEF_EVENT_TYPES.PERIOD_END,       // 'PER_END'
  GAME_START: FSDEF_EVENT_TYPES.GAME_START,       // 'GAME_START' — mesmo valor
  GAME_END: FSDEF_EVENT_TYPES.GAME_END,           // 'GAME_END' — mesmo valor

  // Sem equivalente direto FSDEF — manter como legacy
  HALFTIME_START: null,
  HALFTIME_END: null,
}

const FSDEF_TO_LEGACY: Partial<Record<FsdefEventType, LiveLegacyEventType>> = {}
for (const [legacy, fsdef] of Object.entries(LEGACY_TO_FSDEF)) {
  if (fsdef) FSDEF_TO_LEGACY[fsdef] = legacy as LiveLegacyEventType
}

/**
 * Converte vocabulario legacy do live-game para FSDEF canonico.
 * Retorna null quando nao ha mapping (HALFTIME_START etc).
 */
export function toFsdef(legacyType: string): FsdefEventType | null {
  return LEGACY_TO_FSDEF[legacyType as LiveLegacyEventType] ?? null
}

/**
 * Converte FSDEF para legacy (preserva compatibilidade do live-game module).
 * Retorna null se nao for um FSDEF conhecido pelo legacy.
 */
export function toLegacy(fsdefType: string): LiveLegacyEventType | null {
  return FSDEF_TO_LEGACY[fsdefType as FsdefEventType] ?? null
}

/**
 * True quando o tipo legacy ja e identico ao FSDEF (mesma string).
 * Util para evitar conversao desnecessaria.
 */
export function isIdenticalVocabulary(legacyType: string): boolean {
  return ['ASSIST', 'STEAL', 'BLOCK', 'GAME_START', 'GAME_END'].includes(legacyType)
}

/**
 * Lista de pontos do codebase que ainda usam vocabulario legacy (auditoria).
 * Mantida atualizada para tracking de migracao gradual ao FSDEF.
 *
 * Atualizado em 2026-05-11:
 * - src/modules/live-game/live-fiba-config.ts (LIVE_PLAYER_INLINE_ACTIONS, LIVE_EVENT_PRESENTATIONS)
 * - src/modules/live-game/types/live-admin.ts (QUICK_EVENTS)
 * - src/modules/live-game/services/live-game-service.ts (case 'GAME_END' etc — switch statements)
 * - src/modules/live-game/client/live-optimistic.ts (optimistic update applier)
 * - src/modules/live-game/components/* (display labels — tone, icon)
 *
 * Estrategia de migracao recomendada (proximas fases):
 *   1. Adicionar FsdefEventType nas APIs publicas, aceitando AMBOS vocabularios
 *      durante transicao
 *   2. Converter no service layer antes de gravar GameEvent (DB sempre recebe FSDEF)
 *   3. Atualizar leitura: GameEvent.eventType pode ser FSDEF ou legacy — usar toLegacy()
 *      ao renderizar ate migracao total
 *   4. Migrar live-fiba-config e QUICK_EVENTS para FSDEF (breaking — coordenar com release)
 */
