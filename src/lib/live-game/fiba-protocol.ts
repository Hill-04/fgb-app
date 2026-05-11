/**
 * Protocolo FIBA — constantes oficiais.
 * Baseado em FIBA LiveStats v8 (TV Feed) — adaptado para nossa estrutura.
 */

export const FIBA_ACTION_TYPES = {
  POINT_2: '2pt',
  POINT_3: '3pt',
  FREE_THROW: 'ft',
  REBOUND: 'rebound',
  ASSIST: 'assist',
  STEAL: 'steal',
  BLOCK: 'block',
  TURNOVER: 'turnover',
  FOUL: 'foul',
  SUBSTITUTION: 'substitution',
  TIMEOUT: 'timeout',
  JUMP_BALL: 'jumpball',
  PERIOD: 'period',
} as const

export type FibaActionType = typeof FIBA_ACTION_TYPES[keyof typeof FIBA_ACTION_TYPES]

export const FIBA_SHOT_SUBTYPES = ['jumpshot', 'layup', 'dunk', 'tipin', 'hookshot', 'fadeaway'] as const
export const FIBA_REBOUND_SUBTYPES = ['offensive', 'defensive', 'team'] as const
export const FIBA_FOUL_SUBTYPES = ['personal', 'technical', 'unsportsmanlike', 'disqualifying', 'double', 'offensive'] as const
export const FIBA_TURNOVER_SUBTYPES = ['badpass', 'lostball', 'travel', 'doublednb', 'offoul', '3sec', '5sec', '8sec', '24sec', 'backcourt', 'kicked', 'palming', 'lanevio', 'jumpballvio', 'other'] as const

export const FIBA_QUALIFIERS = [
  'pointsinthepaint',
  'fastbreak',
  'secondchance',
  'fromturnover',
  'andone',
  'blocked',
  'contested',
  'open',
  'clutch',
  'gametying',
  'gamewinning',
] as const

export type FibaQualifier = typeof FIBA_QUALIFIERS[number]

export type FibaEventPayload = {
  fiba: {
    actionType: FibaActionType
    subType?: string
    qualifiers?: FibaQualifier[]
    courtX?: number
    courtY?: number
    courtArea?: string
    courtSide?: 'left' | 'right' | 'center'
    shotClockTime?: number
    previousEventId?: string
    officialId?: string
  }
  custom?: Record<string, unknown>
}

export function mapEventTypeToFiba(eventType: string): { actionType: FibaActionType; subType?: string } {
  switch (eventType) {
    case 'SHOT_MADE_2':
    case 'SHOT_MISSED_2':
      return { actionType: '2pt', subType: 'jumpshot' }
    case 'SHOT_MADE_3':
    case 'SHOT_MISSED_3':
      return { actionType: '3pt', subType: 'jumpshot' }
    case 'FREE_THROW_MADE':
    case 'FREE_THROW_MISSED':
      return { actionType: 'ft' }
    case 'REBOUND_OFFENSIVE':
      return { actionType: 'rebound', subType: 'offensive' }
    case 'REBOUND_DEFENSIVE':
      return { actionType: 'rebound', subType: 'defensive' }
    case 'ASSIST':
      return { actionType: 'assist' }
    case 'STEAL':
      return { actionType: 'steal' }
    case 'BLOCK':
      return { actionType: 'block' }
    case 'TURNOVER':
      return { actionType: 'turnover', subType: 'other' }
    case 'FOUL_PERSONAL':
      return { actionType: 'foul', subType: 'personal' }
    case 'FOUL_TECHNICAL':
      return { actionType: 'foul', subType: 'technical' }
    case 'FOUL_UNSPORTSMANLIKE':
      return { actionType: 'foul', subType: 'unsportsmanlike' }
    case 'SUBSTITUTION_IN':
    case 'SUBSTITUTION_OUT':
      return { actionType: 'substitution' }
    case 'TIMEOUT_CONFIRMED':
      return { actionType: 'timeout' }
    default:
      return { actionType: '2pt' }
  }
}

export function deriveCourtArea(courtX: number, courtY: number): string {
  if (courtX >= 35 && courtX <= 65 && courtY <= 19) return 'paint'
  if (courtY > 23.75) return courtX < 20 || courtX > 80 ? 'corner_3' : 'arc_3'
  if (courtY > 50) return 'backcourt'
  return 'midrange'
}

export function validateFibaAction(payload: Partial<FibaEventPayload>): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  if (!payload.fiba) {
    errors.push('Payload sem campo "fiba"')
    return { valid: false, errors }
  }
  if (!payload.fiba.actionType) {
    errors.push('actionType ausente')
  }
  if (payload.fiba.courtX !== undefined && (payload.fiba.courtX < 0 || payload.fiba.courtX > 100)) {
    errors.push('courtX fora do range 0-100')
  }
  if (payload.fiba.courtY !== undefined && (payload.fiba.courtY < 0 || payload.fiba.courtY > 100)) {
    errors.push('courtY fora do range 0-100')
  }
  return { valid: errors.length === 0, errors }
}
