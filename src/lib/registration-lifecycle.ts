/**
 * Registration lifecycle state machine — Fase 6
 *
 * Pure functions. Sem hooks, sem side-effects, sem DB.
 *
 * Estados:
 *   DRAFT          — equipe esta preenchendo a inscricao, ainda nao submeteu
 *   SUBMITTED      — equipe submeteu, aguardando review do admin
 *   UNDER_REVIEW   — admin esta revisando (docs, taxas, elegibilidade)
 *   CONFIRMED      — admin aprovou, inscricao ativa para o campeonato
 *   REJECTED       — admin recusou (com motivo)
 *   CANCELLED      — equipe ou admin cancelou (W.O., desistencia)
 *
 * Coexiste com Registration.status legacy ('PENDING'/'CONFIRMED'/'REJECTED').
 * `deriveLifecycleFromLegacy` faz a ponte.
 */

export type RegistrationLifecycleState =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'CONFIRMED'
  | 'REJECTED'
  | 'CANCELLED'

const TRANSITIONS: Record<RegistrationLifecycleState, ReadonlyArray<RegistrationLifecycleState>> = {
  DRAFT: ['SUBMITTED', 'CANCELLED'],
  SUBMITTED: ['UNDER_REVIEW', 'CONFIRMED', 'REJECTED', 'CANCELLED'],
  UNDER_REVIEW: ['CONFIRMED', 'REJECTED', 'SUBMITTED'],
  CONFIRMED: ['CANCELLED', 'UNDER_REVIEW'], // re-revisao pos-confirmacao (raro)
  REJECTED: ['SUBMITTED'], // permite re-submeter apos correcao
  CANCELLED: [], // terminal
}

const IMMUTABLE_STATES = new Set<RegistrationLifecycleState>(['CONFIRMED', 'CANCELLED'])
const TERMINAL_STATES = new Set<RegistrationLifecycleState>(['CANCELLED'])

export function canTransition(
  from: RegistrationLifecycleState,
  to: RegistrationLifecycleState,
): boolean {
  return TRANSITIONS[from]?.includes(to) ?? false
}

export function validTransitions(
  from: RegistrationLifecycleState,
): ReadonlyArray<RegistrationLifecycleState> {
  return TRANSITIONS[from] ?? []
}

export function isImmutable(state: RegistrationLifecycleState): boolean {
  return IMMUTABLE_STATES.has(state)
}

export function isTerminal(state: RegistrationLifecycleState): boolean {
  return TERMINAL_STATES.has(state)
}

export function assertCanTransition(
  from: RegistrationLifecycleState,
  to: RegistrationLifecycleState,
): void {
  if (!canTransition(from, to)) {
    const valid = validTransitions(from)
    throw new Error(
      `Transicao invalida em Registration: ${from} -> ${to}. Transicoes validas a partir de ${from}: ${
        valid.length > 0 ? valid.join(', ') : '(estado terminal)'
      }`,
    )
  }
}

/**
 * Mapeia status legacy ('PENDING'/'CONFIRMED'/'REJECTED') para lifecycle state.
 * Usado pelo backfill futuro e como fallback enquanto admin UI nao migrar.
 */
export function deriveLifecycleFromLegacy(input: {
  status?: string | null
}): RegistrationLifecycleState {
  const s = (input.status ?? '').toUpperCase()
  if (s === 'CONFIRMED') return 'CONFIRMED'
  if (s === 'REJECTED') return 'REJECTED'
  if (s === 'CANCELLED') return 'CANCELLED'
  // PENDING legacy = SUBMITTED (mais conservador que UNDER_REVIEW)
  return 'SUBMITTED'
}

// ─────────────── Display helpers ───────────────

const STATE_LABELS: Record<RegistrationLifecycleState, string> = {
  DRAFT: 'Rascunho',
  SUBMITTED: 'Aguardando análise',
  UNDER_REVIEW: 'Em análise',
  CONFIRMED: 'Confirmada',
  REJECTED: 'Recusada',
  CANCELLED: 'Cancelada',
}

const STATE_DESCRIPTIONS: Record<RegistrationLifecycleState, string> = {
  DRAFT: 'Equipe ainda está preenchendo. Não enviado para FGB.',
  SUBMITTED: 'Inscrição enviada — aguardando início da análise pela secretaria.',
  UNDER_REVIEW: 'Secretaria está verificando documentos, taxas e elegibilidade.',
  CONFIRMED: 'Aprovada pela FGB. Equipe participa do campeonato.',
  REJECTED: 'Recusada. Verifique o motivo e corrija para re-submeter.',
  CANCELLED: 'Cancelada definitivamente.',
}

export function getStateLabel(state: RegistrationLifecycleState): string {
  return STATE_LABELS[state] ?? state
}

export function getStateDescription(state: RegistrationLifecycleState): string {
  return STATE_DESCRIPTIONS[state] ?? ''
}
