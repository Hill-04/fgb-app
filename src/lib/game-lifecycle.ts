/**
 * Game lifecycle state machine — Fase 1 Foundation.
 *
 * Pure functions: matriz de transicoes valida + guards.
 * Aplicacao do guarda em DB (Prisma) fica em outra camada (ex: service que
 * chama `transitionGame()` e grava `GameAuditLog`).
 *
 * Estados:
 *   DRAFT          — rascunho (criado mas nao agendado oficialmente)
 *   SCHEDULED      — agendado, aceita alteracao livre
 *   LINEUP_LOCKED  — rosters travados, arbitros confirmados
 *   LIVE           — jogo em andamento (GameEvent sendo gravado)
 *   ENDED          — fim natural, aguarda validacao de paridade
 *   CONFIRMED      — paridade OK, sumula gerada (GameOfficialReport.finalizedAt)
 *   PUBLISHED      — publicado, stats propagadas para Standing/Ranking. IMUTAVEL.
 *   UNDER_REVIEW   — revisao oficial requisitada (permite correcao via correctsEventId)
 *   CANCELLED      — cancelado (W.O. etc) — terminal
 *   POSTPONED      — adiado, volta para SCHEDULED
 */

export type GameLifecycleState =
  | "DRAFT"
  | "SCHEDULED"
  | "LINEUP_LOCKED"
  | "LIVE"
  | "ENDED"
  | "CONFIRMED"
  | "PUBLISHED"
  | "UNDER_REVIEW"
  | "CANCELLED"
  | "POSTPONED"

const TRANSITIONS: Record<GameLifecycleState, ReadonlyArray<GameLifecycleState>> = {
  DRAFT: ["SCHEDULED", "CANCELLED"],
  SCHEDULED: ["LINEUP_LOCKED", "POSTPONED", "CANCELLED"],
  LINEUP_LOCKED: ["LIVE", "SCHEDULED", "POSTPONED", "CANCELLED"],
  LIVE: ["ENDED", "CANCELLED"],
  ENDED: ["CONFIRMED", "UNDER_REVIEW"],
  CONFIRMED: ["PUBLISHED", "UNDER_REVIEW"],
  PUBLISHED: ["UNDER_REVIEW"],
  UNDER_REVIEW: ["CONFIRMED", "PUBLISHED"],
  CANCELLED: [],
  POSTPONED: ["SCHEDULED", "CANCELLED"],
}

/**
 * Estados em que dados do jogo sao considerados imutaveis.
 * Mutacoes nesses estados so podem acontecer transitando para UNDER_REVIEW primeiro.
 */
const IMMUTABLE_STATES = new Set<GameLifecycleState>(["CONFIRMED", "PUBLISHED"])

/**
 * Estados terminais (sem proximas transicoes).
 */
const TERMINAL_STATES = new Set<GameLifecycleState>(["CANCELLED"])

export function canTransition(
  from: GameLifecycleState,
  to: GameLifecycleState,
): boolean {
  return TRANSITIONS[from]?.includes(to) ?? false
}

export function validTransitions(
  from: GameLifecycleState,
): ReadonlyArray<GameLifecycleState> {
  return TRANSITIONS[from] ?? []
}

export function isImmutable(state: GameLifecycleState): boolean {
  return IMMUTABLE_STATES.has(state)
}

export function isTerminal(state: GameLifecycleState): boolean {
  return TERMINAL_STATES.has(state)
}

/**
 * Lanca erro descritivo se a transicao for invalida.
 */
export function assertCanTransition(
  from: GameLifecycleState,
  to: GameLifecycleState,
): void {
  if (!canTransition(from, to)) {
    const valid = validTransitions(from)
    throw new Error(
      `Transicao invalida: ${from} -> ${to}. Transicoes validas a partir de ${from}: ${
        valid.length > 0 ? valid.join(", ") : "(estado terminal)"
      }`,
    )
  }
}

/**
 * Lanca erro se o jogo estiver em estado imutavel.
 * Use antes de qualquer UPDATE em dados do jogo.
 */
export function assertMutable(
  state: GameLifecycleState,
  context: string = "operacao",
): void {
  if (isImmutable(state)) {
    throw new Error(
      `${context} bloqueada: jogo em estado ${state} e imutavel. ` +
        `Transicione para UNDER_REVIEW antes de modificar.`,
    )
  }
}

// === Resultado de validacao de paridade ===

export type ParityCheck = {
  ok: boolean
  homeExpected: number
  homeCalculated: number
  awayExpected: number
  awayCalculated: number
  errors: string[]
}

/**
 * Valida paridade: soma de pontos por jogador = placar do time.
 * Use antes de transitar ENDED -> CONFIRMED.
 *
 * Lendo: `expected` vem do placar manual do jogo, `calculated` vem da soma das stats.
 */
export function validateParityNumbers(input: {
  homeExpected: number
  awayExpected: number
  homePlayerPointsSum: number
  awayPlayerPointsSum: number
}): ParityCheck {
  const errors: string[] = []
  const homeCalculated = input.homePlayerPointsSum
  const awayCalculated = input.awayPlayerPointsSum

  if (homeCalculated !== input.homeExpected) {
    errors.push(
      `Time da casa: placar oficial ${input.homeExpected} != soma stats ${homeCalculated} (diff ${
        homeCalculated - input.homeExpected
      })`,
    )
  }
  if (awayCalculated !== input.awayExpected) {
    errors.push(
      `Time visitante: placar oficial ${input.awayExpected} != soma stats ${awayCalculated} (diff ${
        awayCalculated - input.awayExpected
      })`,
    )
  }

  return {
    ok: errors.length === 0,
    homeExpected: input.homeExpected,
    homeCalculated,
    awayExpected: input.awayExpected,
    awayCalculated,
    errors,
  }
}

// === Mapeamento de estados legados (Game.status / Game.liveStatus) ===

/**
 * Deriva o lifecycle state a partir dos campos legados.
 * Usado pelo backfill e como fallback enquanto codigo nao migra.
 */
export function deriveLifecycleFromLegacy(input: {
  status?: string | null
  liveStatus?: string | null
  isLivePublished?: boolean | null
}): GameLifecycleState {
  const s = (input.status ?? "").toUpperCase()
  const live = (input.liveStatus ?? "").toUpperCase()
  const published = input.isLivePublished === true

  if (s === "CANCELLED") return "CANCELLED"
  if (s === "POSTPONED") return "POSTPONED"
  if (s === "FINISHED" && published) return "PUBLISHED"
  if (s === "FINISHED") return "CONFIRMED"
  if (live === "LIVE" || live === "HALFTIME" || live === "PERIOD_BREAK") return "LIVE"
  if (live === "PRE_GAME_READY") return "LINEUP_LOCKED"
  return "SCHEDULED"
}
