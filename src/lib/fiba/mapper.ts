import type { FibaAction, FibaPlayerBoxScore } from './client'

export const ACTION_LABELS_PT: Record<string, string> = {
  '2pt': '2 pontos',
  '3pt': '3 pontos',
  'freethrow': 'Lance Livre',
  'rebound': 'Rebote',
  'assist': 'Assistência',
  'block': 'Bloqueio',
  'steal': 'Roubo de bola',
  'turnover': 'Perda de posse',
  'foul': 'Falta',
  'timeout': 'Tempo Técnico',
  'substitution': 'Substituição',
  'jumpball': 'Salto',
  'periodstart': 'Início de período',
  'periodend': 'Fim de período',
  'gameover': 'Fim de jogo',
  'challenge': 'Revisão de árbitro',
}

const SUBTYPE_LABELS_PT: Record<string, string> = {
  'drivinglayupshotmade': 'Bandeja convertida',
  'drivinglayupshotmissed': 'Bandeja errada',
  'drivingdunkshotmade': 'Enterrada convertida',
  'drivingdunkshotmissed': 'Enterrada errada',
  'jumpshot': 'Arremesso',
  'pullupmidrangeshot': 'Arremesso médio',
  'stepbackjumpshot': 'Step-back',
  'floatingjumpshot': 'Floater',
  'hookshot': 'Gancho',
  'turnaroundjumpshot': 'Inversão',
  'personal': 'Falta pessoal',
  'technical': 'Falta técnica',
  'unsportsmanlike': 'Falta antiesportiva',
  'disqualifying': 'Falta desclassificante',
  'offensive': 'Rebote ofensivo',
  'defensive': 'Rebote defensivo',
  'lostball': 'Bola perdida',
  'badpass': 'Passe errado',
  'outofbounds': 'Saiu pela linha',
  'travel': 'Toque',
  'doubledribble': 'Duplo drible',
  'charge': 'Invasão',
  'inbound': 'Falta de ataque',
}

export function buildActionDescription(action: FibaAction): string {
  const base = action.subType
    ? SUBTYPE_LABELS_PT[action.subType.toLowerCase()] ?? ACTION_LABELS_PT[action.actionType.toLowerCase()] ?? action.actionType
    : ACTION_LABELS_PT[action.actionType.toLowerCase()] ?? action.actionType

  if (action.actionType === '2pt' || action.actionType === '3pt' || action.actionType === 'freethrow') {
    return action.success === false ? `${base} (erro)` : base
  }
  return base
}

export function clockToMs(clock: string): number {
  const parts = clock.split(':')
  if (parts.length === 2) {
    const [min, sec] = parts
    return (parseInt(min) * 60 + parseFloat(sec)) * 1000
  }
  return 0
}

export function mapFibaBoxScoreToStatLine(p: FibaPlayerBoxScore) {
  const fgMissed = (p.twoPointersAttempted - p.twoPointersMade) + (p.threePointersAttempted - p.threePointersMade)
  const ftMissed = p.freeThrowsAttempted - p.freeThrowsMade
  const fibaIndex = p.points + p.reboundsTotal + p.assists + p.steals + p.blocks - fgMissed - ftMissed - p.turnovers

  const [minStr] = (p.minutesPlayed ?? '0:00').split(':')
  const secStr = (p.minutesPlayed ?? '0:00').split(':')[1] ?? '0'
  const minutesPlayed = parseInt(minStr) * 60 + parseInt(secStr)

  return {
    points: p.points,
    twoPtMade: p.twoPointersMade,
    twoPtAttempted: p.twoPointersAttempted,
    threePtMade: p.threePointersMade,
    threePtAttempted: p.threePointersAttempted,
    freeThrowsMade: p.freeThrowsMade,
    freeThrowsAttempted: p.freeThrowsAttempted,
    reboundsOffensive: p.reboundsOffensive,
    reboundsDefensive: p.reboundsDefensive,
    reboundsTotal: p.reboundsTotal,
    assists: p.assists,
    steals: p.steals,
    blocks: p.blocks,
    blocksReceived: p.blocksReceived,
    turnovers: p.turnovers,
    fouls: p.foulsPersonal,
    foulsTechnical: p.foulsTechnical,
    plusMinus: p.plusMinus,
    isStarter: p.starter,
    pointsInPaint: p.pointsInPaint,
    fastBreakPoints: p.fastBreakPoints,
    secondChancePoints: p.secondChancePoints,
    pointsFromTurnover: p.pointsFromTurnover,
    dunks: p.dunks,
    fibaIndex: Math.max(fibaIndex, -99),
    minutesPlayed,
  }
}

export function mapFibaActionType(action: FibaAction): string | null {
  const t = action.actionType.toLowerCase()
  const sub = (action.subType ?? '').toLowerCase()
  const success = action.success !== false

  if (t === '2pt') return success ? 'SHOT_MADE_2' : 'SHOT_MISSED_2'
  if (t === '3pt') return success ? 'SHOT_MADE_3' : 'SHOT_MISSED_3'
  if (t === 'freethrow') return success ? 'FREE_THROW_MADE' : 'FREE_THROW_MISSED'
  if (t === 'rebound' && sub === 'offensive') return 'REBOUND_OFFENSIVE'
  if (t === 'rebound') return 'REBOUND_DEFENSIVE'
  if (t === 'assist') return 'ASSIST'
  if (t === 'block') return 'BLOCK'
  if (t === 'steal') return 'STEAL'
  if (t === 'turnover') return 'TURNOVER'
  if (t === 'foul' && sub === 'technical') return 'FOUL_TECHNICAL'
  if (t === 'foul' && sub === 'unsportsmanlike') return 'FOUL_UNSPORTSMANLIKE'
  if (t === 'foul' && sub === 'disqualifying') return 'FOUL_DISQUALIFYING'
  if (t === 'foul') return 'FOUL_PERSONAL'
  if (t === 'timeout') return 'TIMEOUT_CONFIRMED'
  if (t === 'substitution') return 'SUBSTITUTION_IN'
  if (t === 'periodstart') return 'PERIOD_START'
  if (t === 'periodend') return 'PERIOD_END'
  if (t === 'gameover') return 'GAME_END'
  return null
}
