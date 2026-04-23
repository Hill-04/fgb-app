export type LivePlayerActionTone = 'score' | 'neutral' | 'alert'

export type LivePlayerInlineAction = {
  id: string
  label: string
  eventType: string
  pointsDelta?: number
  tone: LivePlayerActionTone
}

export type LiveEventPresentation = {
  actionLabel: string
  detailLabel: string
  icon: string
}

export type LiveControlAvailability = {
  label: string
  eventType: string
  disabled: boolean
  hint: string
}

export const LIVE_PLAYER_INLINE_ACTIONS: LivePlayerInlineAction[] = [
  { id: 'plus1', label: '+1', eventType: 'FREE_THROW_MADE', pointsDelta: 1, tone: 'score' },
  { id: 'plus2', label: '+2', eventType: 'SHOT_MADE_2', pointsDelta: 2, tone: 'score' },
  { id: 'plus3', label: '+3', eventType: 'SHOT_MADE_3', pointsDelta: 3, tone: 'score' },
  { id: 'reb', label: 'REB', eventType: 'REBOUND_DEFENSIVE', tone: 'neutral' },
  { id: 'ast', label: 'AST', eventType: 'ASSIST', tone: 'neutral' },
  { id: 'stl', label: 'STL', eventType: 'STEAL', tone: 'neutral' },
  { id: 'blk', label: 'BLK', eventType: 'BLOCK', tone: 'neutral' },
  { id: 'foul', label: 'FOUL', eventType: 'FOUL_PERSONAL', tone: 'alert' },
  { id: 'to', label: 'TO', eventType: 'TURNOVER', tone: 'alert' },
]

const LIVE_EVENT_PRESENTATIONS: Record<string, LiveEventPresentation> = {
  SHOT_MADE_2: {
    actionLabel: '+2',
    detailLabel: '2 pontos convertidos',
    icon: '+2',
  },
  SHOT_MADE_3: {
    actionLabel: '+3',
    detailLabel: '3 pontos convertidos',
    icon: '+3',
  },
  FREE_THROW_MADE: {
    actionLabel: '+1',
    detailLabel: 'lance livre convertido',
    icon: '+1',
  },
  SHOT_MISSED_2: {
    actionLabel: 'MISS 2',
    detailLabel: 'arremesso de 2 perdido',
    icon: 'M2',
  },
  SHOT_MISSED_3: {
    actionLabel: 'MISS 3',
    detailLabel: 'arremesso de 3 perdido',
    icon: 'M3',
  },
  FREE_THROW_MISSED: {
    actionLabel: 'MISS 1',
    detailLabel: 'lance livre perdido',
    icon: 'M1',
  },
  REBOUND_OFFENSIVE: {
    actionLabel: 'REB',
    detailLabel: 'rebote ofensivo',
    icon: 'REB',
  },
  REBOUND_DEFENSIVE: {
    actionLabel: 'REB',
    detailLabel: 'rebote defensivo',
    icon: 'REB',
  },
  ASSIST: {
    actionLabel: 'AST',
    detailLabel: 'assistencia',
    icon: 'AST',
  },
  STEAL: {
    actionLabel: 'STL',
    detailLabel: 'roubo',
    icon: 'STL',
  },
  BLOCK: {
    actionLabel: 'BLK',
    detailLabel: 'toco',
    icon: 'BLK',
  },
  FOUL_PERSONAL: {
    actionLabel: 'FOUL',
    detailLabel: 'falta pessoal',
    icon: 'FL',
  },
  FOUL_TECHNICAL: {
    actionLabel: 'FOUL',
    detailLabel: 'falta tecnica',
    icon: 'FT',
  },
  FOUL_UNSPORTSMANLIKE: {
    actionLabel: 'FOUL',
    detailLabel: 'falta antidesportiva',
    icon: 'FU',
  },
  FOUL_DISQUALIFYING: {
    actionLabel: 'FOUL',
    detailLabel: 'falta desqualificante',
    icon: 'FD',
  },
  TURNOVER: {
    actionLabel: 'TO',
    detailLabel: 'turnover',
    icon: 'TO',
  },
  SUBSTITUTION_IN: {
    actionLabel: 'SUB IN',
    detailLabel: 'entrada em quadra',
    icon: 'IN',
  },
  SUBSTITUTION_OUT: {
    actionLabel: 'SUB OUT',
    detailLabel: 'saida de quadra',
    icon: 'OUT',
  },
  TIMEOUT_CONFIRMED: {
    actionLabel: 'TM',
    detailLabel: 'timeout confirmado',
    icon: 'TM',
  },
  GAME_START: {
    actionLabel: 'START',
    detailLabel: 'jogo iniciado',
    icon: 'GO',
  },
  PERIOD_START: {
    actionLabel: 'P START',
    detailLabel: 'periodo iniciado',
    icon: 'PS',
  },
  PERIOD_END: {
    actionLabel: 'P END',
    detailLabel: 'periodo encerrado',
    icon: 'PE',
  },
  HALFTIME_START: {
    actionLabel: 'HALF',
    detailLabel: 'intervalo iniciado',
    icon: 'HT',
  },
  HALFTIME_END: {
    actionLabel: 'RESUME',
    detailLabel: 'intervalo encerrado',
    icon: 'RE',
  },
  GAME_END: {
    actionLabel: 'FINAL',
    detailLabel: 'jogo encerrado',
    icon: 'END',
  },
}

export function getLiveEventPresentation(eventType?: string | null): LiveEventPresentation {
  if (!eventType) {
    return {
      actionLabel: 'EV',
      detailLabel: 'evento',
      icon: 'EV',
    }
  }

  return (
    LIVE_EVENT_PRESENTATIONS[eventType] || {
      actionLabel: eventType,
      detailLabel: eventType.toLowerCase().replaceAll('_', ' '),
      icon: 'EV',
    }
  )
}

export function buildCanonicalLiveEventDescription({
  eventType,
  athleteName,
  teamName,
  period,
}: {
  eventType: string
  athleteName?: string | null
  teamName?: string | null
  period?: number | null
}) {
  const actor = athleteName || teamName || 'Equipe'

  switch (eventType) {
    case 'SHOT_MADE_2':
      return `${actor} converteu 2 pontos`
    case 'SHOT_MADE_3':
      return `${actor} converteu 3 pontos`
    case 'FREE_THROW_MADE':
      return `${actor} converteu lance livre`
    case 'SHOT_MISSED_2':
      return `${actor} errou arremesso de 2`
    case 'SHOT_MISSED_3':
      return `${actor} errou arremesso de 3`
    case 'FREE_THROW_MISSED':
      return `${actor} errou lance livre`
    case 'REBOUND_OFFENSIVE':
      return `${actor} pegou rebote ofensivo`
    case 'REBOUND_DEFENSIVE':
      return `${actor} pegou rebote defensivo`
    case 'ASSIST':
      return `${actor} deu assistencia`
    case 'STEAL':
      return `${actor} roubou a bola`
    case 'BLOCK':
      return `${actor} aplicou um toco`
    case 'TURNOVER':
      return `${actor} cometeu turnover`
    case 'FOUL_PERSONAL':
      return `${actor} cometeu falta pessoal`
    case 'FOUL_TECHNICAL':
      return `${actor} cometeu falta tecnica`
    case 'FOUL_UNSPORTSMANLIKE':
      return `${actor} cometeu falta antidesportiva`
    case 'FOUL_DISQUALIFYING':
      return `${actor} cometeu falta desqualificante`
    case 'TIMEOUT_CONFIRMED':
      return `${teamName || 'Equipe'} pediu timeout`
    case 'GAME_START':
      return 'Jogo iniciado'
    case 'PERIOD_START':
      return `Periodo ${period || ''} iniciado`.trim()
    case 'PERIOD_END':
      return `Periodo ${period || ''} encerrado`.trim()
    case 'HALFTIME_START':
      return 'Intervalo iniciado'
    case 'HALFTIME_END':
      return 'Intervalo encerrado'
    case 'GAME_END':
      return 'Jogo encerrado'
    default:
      return `${actor} registrou ${eventType}`
  }
}

export function getLiveControlAvailability({
  liveStatus,
  currentPeriod,
  isFinal,
}: {
  liveStatus: string
  currentPeriod: number
  isFinal: boolean
}) {
  const status = liveStatus || 'PRE_GAME_READY'

  let startOrResume: LiveControlAvailability
  if (isFinal) {
    startOrResume = {
      label: 'Jogo encerrado',
      eventType: 'GAME_START',
      disabled: true,
      hint: 'Nenhum reinicio e permitido apos o encerramento.',
    }
  } else if (status === 'HALFTIME') {
    startOrResume = {
      label: 'Voltar do intervalo',
      eventType: 'HALFTIME_END',
      disabled: false,
      hint: 'Retoma a partida a partir do intervalo atual.',
    }
  } else if (status === 'PERIOD_BREAK') {
    startOrResume = {
      label: `Iniciar P${Math.max(1, currentPeriod + 1)}`,
      eventType: 'PERIOD_START',
      disabled: false,
      hint: 'Abre o proximo periodo com relogio ao vivo.',
    }
  } else if (status === 'LIVE') {
    startOrResume = {
      label: 'Jogo em andamento',
      eventType: 'GAME_START',
      disabled: true,
      hint: 'A partida ja esta ao vivo.',
    }
  } else {
    startOrResume = {
      label: 'Iniciar jogo',
      eventType: 'GAME_START',
      disabled: false,
      hint: 'Abre a partida e inicia a operacao da mesa.',
    }
  }

  const endPeriod: LiveControlAvailability = {
    label: 'Encerrar periodo',
    eventType: 'PERIOD_END',
    disabled: status !== 'LIVE' || isFinal,
    hint:
      status === 'LIVE'
        ? 'Fecha o periodo atual e leva a mesa para pausa controlada.'
        : isFinal
          ? 'Partida ja finalizada.'
          : 'Disponivel somente com a partida ao vivo.',
  }

  const endGame: LiveControlAvailability = {
    label: 'Encerrar jogo',
    eventType: 'GAME_END',
    disabled: isFinal || ['SCHEDULED', 'PRE_GAME_READY'].includes(status),
    hint:
      isFinal
        ? 'O jogo ja esta encerrado.'
        : ['SCHEDULED', 'PRE_GAME_READY'].includes(status)
          ? 'Inicie a partida antes de encerrar.'
          : 'Fecha a operacao ao vivo e envia o jogo para confirmacao final.',
  }

  return { startOrResume, endPeriod, endGame }
}
