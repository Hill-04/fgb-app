import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import type { Prisma } from '@prisma/client'

import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { ensureDatabaseSchema } from '@/lib/db-patch'

type Tx = Prisma.TransactionClient
type JsonRecord = Record<string, unknown>

type LiveAction =
  | 'SCORE_2'
  | 'SCORE_3'
  | 'FREE_THROW'
  | 'FREE_THROW_MISS'
  | 'MISS_2'
  | 'MISS_3'
  | 'PERSONAL_FOUL'
  | 'TECHNICAL_FOUL'
  | 'UNSPORTSMANLIKE_FOUL'
  | 'DISQUALIFYING_FOUL'
  | 'REBOUND_OFF'
  | 'REBOUND_DEF'
  | 'ASSIST'
  | 'STEAL'
  | 'BLOCK'
  | 'TURNOVER'
  | 'SUBSTITUTION'
  | 'TIMEOUT'
  | 'START_PERIOD'
  | 'END_PERIOD'
  | 'VIOLATION_24S'
  | 'VIOLATION_8S'
  | 'VIOLATION_3S'
  | 'BALL_OUT'
  | 'CANCEL_LAST_EVENT'

const MAX_TIMEOUTS = 5
const QUARTER_CLOCK_MS = 10 * 60 * 1000

const ACTIONS = new Set<LiveAction>([
  'SCORE_2',
  'SCORE_3',
  'FREE_THROW',
  'FREE_THROW_MISS',
  'MISS_2',
  'MISS_3',
  'PERSONAL_FOUL',
  'TECHNICAL_FOUL',
  'UNSPORTSMANLIKE_FOUL',
  'DISQUALIFYING_FOUL',
  'REBOUND_OFF',
  'REBOUND_DEF',
  'ASSIST',
  'STEAL',
  'BLOCK',
  'TURNOVER',
  'SUBSTITUTION',
  'TIMEOUT',
  'START_PERIOD',
  'END_PERIOD',
  'VIOLATION_24S',
  'VIOLATION_8S',
  'VIOLATION_3S',
  'BALL_OUT',
  'CANCEL_LAST_EVENT',
])

class ApiError extends Error {
  status: number

  constructor(message: string, status = 400) {
    super(message)
    this.status = status
  }
}

function toNumber(value: unknown, fallback = 0) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function toBool(value: unknown, fallback = false) {
  if (typeof value === 'boolean') return value
  if (typeof value === 'string') {
    if (value.toLowerCase() === 'true') return true
    if (value.toLowerCase() === 'false') return false
  }
  return fallback
}

function toText(value: unknown, fallback = '') {
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  return fallback
}

function parseClockDisplay(display?: string | null) {
  const safe = toText(display, '').trim()
  if (!safe) return QUARTER_CLOCK_MS
  const [rawMinutes, rawSeconds] = safe.split(':')
  const minutes = toNumber(rawMinutes, 10)
  const seconds = toNumber(rawSeconds, 0)
  return Math.max(0, Math.trunc(minutes * 60_000 + seconds * 1_000))
}

function toClockMs(value: unknown, fallbackDisplay?: string | null) {
  const numeric = toNumber(value, Number.NaN)
  if (Number.isFinite(numeric) && numeric >= 0) {
    return Math.trunc(numeric)
  }
  return parseClockDisplay(fallbackDisplay)
}

function formatClock(clockMs: number) {
  const totalSeconds = Math.floor(Math.max(0, Math.trunc(clockMs)) / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

function parsePayload(raw: string | null | undefined) {
  if (!raw) return {} as JsonRecord
  try {
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? (parsed as JsonRecord) : {}
  } catch {
    return {}
  }
}

function normalizeAction(rawAction: string, payload: JsonRecord): LiveAction | null {
  const action = rawAction.toUpperCase()
  if (ACTIONS.has(action as LiveAction)) {
    return action as LiveAction
  }

  if (action === 'SCORE') {
    const type = toText(payload.type, '').toUpperCase()
    const points = Math.trunc(toNumber(payload.points, 0))
    if (type.includes('FREE') || type.includes('LL') || points === 1) return 'FREE_THROW'
    if (type.includes('3') || points === 3) return 'SCORE_3'
    return 'SCORE_2'
  }

  if (action === 'FOUL') {
    const foulType = toText(payload.foulType, 'PERSONAL').toUpperCase()
    if (foulType === 'TECHNICAL') return 'TECHNICAL_FOUL'
    if (foulType === 'UNSPORTSMANLIKE') return 'UNSPORTSMANLIKE_FOUL'
    if (foulType === 'DISQUALIFYING') return 'DISQUALIFYING_FOUL'
    return 'PERSONAL_FOUL'
  }

  if (action === 'REBOUND') {
    const reboundType = toText(payload.type, 'DEFENSIVE').toUpperCase()
    return reboundType.startsWith('OFF') ? 'REBOUND_OFF' : 'REBOUND_DEF'
  }

  if (action === 'VIOLATION') {
    const violation = toText(payload.type, '24S').toUpperCase()
    if (violation.includes('8')) return 'VIOLATION_8S'
    if (violation.includes('3')) return 'VIOLATION_3S'
    return 'VIOLATION_24S'
  }

  return null
}

async function requireAdmin() {
  const session = await getServerSession(authOptions)
  if (!session || !(session.user as { isAdmin?: boolean }).isAdmin) {
    return null
  }
  return session
}

async function getNextSequence(tx: Tx, gameId: string) {
  const last = await tx.gameEvent.findFirst({
    where: { gameId },
    orderBy: [{ sequenceNumber: 'desc' }, { createdAt: 'desc' }],
    select: { sequenceNumber: true, sequence: true },
  })

  const baseline = Math.max(Number(last?.sequenceNumber ?? 0), Number(last?.sequence ?? 0))
  return baseline + 1
}

async function getOrCreateSession(tx: Tx, gameId: string, userId: string | null) {
  const existing = await tx.gameLiveSession.findFirst({
    where: {
      gameId,
      status: {
        in: ['PRE_GAME_READY', 'LIVE', 'HALFTIME', 'PERIOD_BREAK', 'FINAL_PENDING_CONFIRMATION'],
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  if (existing) return existing

  return tx.gameLiveSession.create({
    data: {
      gameId,
      openedByUserId: userId,
      status: 'PRE_GAME_READY',
      publicVisibilityStatus: 'PRE_GAME',
      currentPeriod: 0,
      clockStatus: 'STOPPED',
    },
  })
}

async function ensurePlayerStatLine(tx: Tx, gameId: string, athleteId: string, teamId: string) {
  await tx.gamePlayerStatLine.upsert({
    where: {
      gameId_athleteId: { gameId, athleteId },
    },
    create: {
      gameId,
      athleteId,
      teamId,
    },
    update: {
      teamId,
    },
  })
}

async function ensureTeamStatLine(tx: Tx, gameId: string, teamId: string) {
  await tx.gameTeamStatLine.upsert({
    where: {
      gameId_teamId: { gameId, teamId },
    },
    create: {
      gameId,
      teamId,
    },
    update: {},
  })
}

async function findTeamIdByAthlete(tx: Tx, gameId: string, athleteId?: string | null) {
  if (!athleteId) return null

  const rosterPlayer = await tx.gameRosterPlayer.findFirst({
    where: {
      athleteId,
      gameRoster: {
        gameId,
      },
    },
    select: {
      gameRoster: {
        select: {
          teamId: true,
        },
      },
    },
  })

  return rosterPlayer?.gameRoster.teamId ?? null
}

async function findRosterPlayerByAnyId(tx: Tx, gameId: string, idOrAthleteId?: string | null) {
  if (!idOrAthleteId) return null

  const byId = await tx.gameRosterPlayer.findFirst({
    where: {
      id: idOrAthleteId,
      gameRoster: {
        gameId,
      },
    },
    select: {
      id: true,
      athleteId: true,
      isDisqualified: true,
      gameRoster: {
        select: { teamId: true },
      },
    },
  })

  if (byId) {
    return {
      id: byId.id,
      athleteId: byId.athleteId,
      isDisqualified: byId.isDisqualified,
      teamId: byId.gameRoster.teamId,
    }
  }

  const byAthlete = await tx.gameRosterPlayer.findFirst({
    where: {
      athleteId: idOrAthleteId,
      gameRoster: {
        gameId,
      },
    },
    select: {
      id: true,
      athleteId: true,
      isDisqualified: true,
      gameRoster: {
        select: { teamId: true },
      },
    },
  })

  if (!byAthlete) return null
  return {
    id: byAthlete.id,
    athleteId: byAthlete.athleteId,
    isDisqualified: byAthlete.isDisqualified,
    teamId: byAthlete.gameRoster.teamId,
  }
}

async function decrementPlayerField(
  tx: Tx,
  gameId: string,
  athleteId: string,
  field:
    | 'points'
    | 'fouls'
    | 'technicalFouls'
    | 'assists'
    | 'steals'
    | 'blocks'
    | 'turnovers'
    | 'reboundsOffensive'
    | 'reboundsDefensive'
    | 'reboundsTotal'
    | 'twoPtMade'
    | 'twoPtAttempted'
    | 'threePtMade'
    | 'threePtAttempted'
    | 'freeThrowsMade'
    | 'freeThrowsAttempted',
  amount = 1
) {
  const line = await tx.gamePlayerStatLine.findUnique({
    where: { gameId_athleteId: { gameId, athleteId } },
    select: {
      points: true,
      fouls: true,
      technicalFouls: true,
      assists: true,
      steals: true,
      blocks: true,
      turnovers: true,
      reboundsOffensive: true,
      reboundsDefensive: true,
      reboundsTotal: true,
      twoPtMade: true,
      twoPtAttempted: true,
      threePtMade: true,
      threePtAttempted: true,
      freeThrowsMade: true,
      freeThrowsAttempted: true,
    },
  })

  if (!line) return
  const current = Number(line[field] ?? 0)
  await tx.gamePlayerStatLine.update({
    where: { gameId_athleteId: { gameId, athleteId } },
    data: {
      [field]: Math.max(0, current - amount),
      fouledOut: field === 'fouls' ? Math.max(0, current - amount) >= 5 : undefined,
      disqualified: field === 'technicalFouls' ? Math.max(0, current - amount) >= 2 : undefined,
    } as Prisma.GamePlayerStatLineUpdateInput,
  })
}

async function decrementTeamField(
  tx: Tx,
  gameId: string,
  teamId: string,
  field:
    | 'points'
    | 'fouls'
    | 'timeoutsUsed'
    | 'assists'
    | 'steals'
    | 'blocks'
    | 'turnovers'
    | 'reboundsTotal'
    | 'twoPtMade'
    | 'twoPtAttempted'
    | 'threePtMade'
    | 'threePtAttempted'
    | 'freeThrowsMade'
    | 'freeThrowsAttempted',
  amount = 1
) {
  const line = await tx.gameTeamStatLine.findUnique({
    where: { gameId_teamId: { gameId, teamId } },
    select: {
      points: true,
      fouls: true,
      timeoutsUsed: true,
      assists: true,
      steals: true,
      blocks: true,
      turnovers: true,
      reboundsTotal: true,
      twoPtMade: true,
      twoPtAttempted: true,
      threePtMade: true,
      threePtAttempted: true,
      freeThrowsMade: true,
      freeThrowsAttempted: true,
    },
  })

  if (!line) return
  const current = Number(line[field] ?? 0)
  await tx.gameTeamStatLine.update({
    where: { gameId_teamId: { gameId, teamId } },
    data: {
      [field]: Math.max(0, current - amount),
    } as Prisma.GameTeamStatLineUpdateInput,
  })
}

async function setRosterDisqualified(tx: Tx, gameId: string, athleteId: string, value: boolean) {
  await tx.gameRosterPlayer.updateMany({
    where: {
      athleteId,
      gameRoster: { gameId },
    },
    data: {
      isDisqualified: value,
    },
  })

  await tx.gamePlayerStatLine.updateMany({
    where: {
      gameId,
      athleteId,
    },
    data: {
      disqualified: value,
      fouledOut: value,
    },
  })
}

async function createEvent(
  tx: Tx,
  args: {
    gameId: string
    actorUserId: string | null
    eventType: string
    payload: JsonRecord
    period: number
    clockMs: number
    clockDisplay: string
    teamId?: string | null
    athleteId?: string | null
    secondaryAthleteId?: string | null
    pointsDelta?: number | null
    homeScoreAfter: number
    awayScoreAfter: number
  }
) {
  const sequence = await getNextSequence(tx, args.gameId)
  const liveSession = await getOrCreateSession(tx, args.gameId, args.actorUserId)

  await tx.gameEvent.create({
    data: {
      gameId: args.gameId,
      liveSessionId: liveSession.id,
      sequenceNumber: sequence,
      sequence,
      period: args.period,
      clockTime: args.clockDisplay,
      clockMs: args.clockMs,
      eventType: args.eventType,
      teamId: args.teamId ?? null,
      athleteId: args.athleteId ?? null,
      secondaryAthleteId: args.secondaryAthleteId ?? null,
      pointsDelta: args.pointsDelta ?? null,
      homeScoreAfter: args.homeScoreAfter,
      awayScoreAfter: args.awayScoreAfter,
      payloadJson: JSON.stringify(args.payload),
      createdByUserId: args.actorUserId ?? null,
    },
  })
}

async function resolveTeamId(
  tx: Tx,
  game: {
    id: string
    homeTeamId: string
    awayTeamId: string
  },
  payload: JsonRecord,
  athleteId?: string | null
) {
  const fromPayload = toText(payload.teamId, '')
  if (fromPayload) return fromPayload

  const side = toText(payload.teamSide, '').toUpperCase()
  if (side === 'HOME') return game.homeTeamId
  if (side === 'AWAY') return game.awayTeamId

  const byAthlete = await findTeamIdByAthlete(tx, game.id, athleteId)
  if (byAthlete) return byAthlete

  return null
}

async function recomputeTeamCounters(tx: Tx, gameId: string, period: number, homeTeamId: string, awayTeamId: string) {
  const [homeFouls, awayFouls, homeTimeouts, awayTimeouts] = await Promise.all([
    tx.gameEvent.count({
      where: {
        gameId,
        isCancelled: false,
        isReverted: false,
        period,
        teamId: homeTeamId,
        eventType: {
          in: ['PERSONAL_FOUL', 'UNSPORTSMANLIKE_FOUL'],
        },
      },
    }),
    tx.gameEvent.count({
      where: {
        gameId,
        isCancelled: false,
        isReverted: false,
        period,
        teamId: awayTeamId,
        eventType: {
          in: ['PERSONAL_FOUL', 'UNSPORTSMANLIKE_FOUL'],
        },
      },
    }),
    tx.gameEvent.count({
      where: {
        gameId,
        isCancelled: false,
        isReverted: false,
        teamId: homeTeamId,
        eventType: 'TIMEOUT',
      },
    }),
    tx.gameEvent.count({
      where: {
        gameId,
        isCancelled: false,
        isReverted: false,
        teamId: awayTeamId,
        eventType: 'TIMEOUT',
      },
    }),
  ])

  await tx.game.update({
    where: { id: gameId },
    data: {
      homeTeamFoulsCurrentPeriod: homeFouls,
      awayTeamFoulsCurrentPeriod: awayFouls,
      homeTimeoutsUsed: homeTimeouts,
      awayTimeoutsUsed: awayTimeouts,
    },
  })
}

function describeEvent(event: {
  eventType: string
  athlete?: { name: string | null } | null
  secondaryAthlete?: { name: string | null } | null
  team?: { name: string | null } | null
  period: number
  isCancelled?: boolean | null
}) {
  const athleteName = event.athlete?.name || 'Atleta'
  const secondaryName = event.secondaryAthlete?.name || 'Atleta'
  const teamName = event.team?.name || 'Equipe'

  let base = event.eventType
  if (event.eventType === 'SCORE_2PTS') base = `${athleteName} converteu 2 pontos`
  else if (event.eventType === 'SCORE_3PTS') base = `${athleteName} converteu 3 pontos`
  else if (event.eventType === 'FREE_THROW') base = `${athleteName} converteu lance livre`
  else if (event.eventType === 'FREE_THROW_MISS') base = `${athleteName} errou lance livre`
  else if (event.eventType === 'MISS_2') base = `${athleteName} errou arremesso de 2`
  else if (event.eventType === 'MISS_3') base = `${athleteName} errou arremesso de 3`
  else if (event.eventType === 'PERSONAL_FOUL') base = `${athleteName} cometeu falta pessoal`
  else if (event.eventType === 'TECHNICAL_FOUL') base = `${athleteName} cometeu falta tecnica`
  else if (event.eventType === 'UNSPORTSMANLIKE_FOUL') base = `${athleteName} cometeu falta antidesportiva`
  else if (event.eventType === 'DISQUALIFYING_FOUL') base = `${athleteName} foi desqualificado`
  else if (event.eventType === 'REBOUND_OFF') base = `${athleteName} pegou rebote ofensivo`
  else if (event.eventType === 'REBOUND_DEF') base = `${athleteName} pegou rebote defensivo`
  else if (event.eventType === 'ASSIST') base = `${athleteName} deu assistencia`
  else if (event.eventType === 'STEAL') base = `${athleteName} roubou a bola`
  else if (event.eventType === 'BLOCK') base = `${athleteName} aplicou um toco`
  else if (event.eventType === 'TURNOVER') base = `${athleteName} cometeu turnover`
  else if (event.eventType === 'SUBSTITUTION') base = `Substituicao: ${athleteName} -> ${secondaryName}`
  else if (event.eventType === 'TIMEOUT') base = `Timeout ${teamName}`
  else if (event.eventType === 'START_PERIOD') base = `Inicio do periodo ${event.period}`
  else if (event.eventType === 'END_PERIOD') base = `Fim do periodo ${event.period}`
  else if (event.eventType.startsWith('VIOLATION_')) base = `${teamName} cometeu ${event.eventType}`
  else if (event.eventType === 'BALL_OUT') base = `${teamName} bola fora`

  return event.isCancelled ? `${base} (cancelado)` : base
}

async function cancelLastEvent(
  tx: Tx,
  game: {
    id: string
    homeTeamId: string
    awayTeamId: string
    homeScore: number | null
    awayScore: number | null
    currentPeriod: number
    clockDisplay: string | null
  },
  payload: JsonRecord
) {
  const forcedEventId = toText(payload.eventId, '')

  const lastEvent = await tx.gameEvent.findFirst({
    where: {
      gameId: game.id,
      isCancelled: false,
      isReverted: false,
      ...(forcedEventId ? { id: forcedEventId } : {}),
    },
    orderBy: [{ sequenceNumber: 'desc' }, { createdAt: 'desc' }],
  })

  if (!lastEvent) {
    throw new ApiError('Nenhum evento para cancelar', 400)
  }

  await tx.gameEvent.update({
    where: { id: lastEvent.id },
    data: {
      isCancelled: true,
      isReverted: true,
      revertedAt: new Date(),
      correctionReason: 'Cancelado pela mesa',
    },
  })

  const body = parsePayload(lastEvent.payloadJson)
  const teamId = lastEvent.teamId ?? toText(body.teamId, '')
  const athleteId = lastEvent.athleteId ?? toText(body.athleteId, '')
  const athleteOutId = lastEvent.athleteId ?? (toText(body.playerOutId, '') || toText(body.athleteOutId, ''))
  const athleteInId =
    lastEvent.secondaryAthleteId ?? (toText(body.playerInId, '') || toText(body.athleteInId, ''))

  const points = Math.max(0, Math.trunc(toNumber(body.points, lastEvent.pointsDelta ?? 0)))

  if (lastEvent.eventType === 'SCORE_2PTS') {
    if (athleteId) {
      await decrementPlayerField(tx, game.id, athleteId, 'points', points || 2)
      await decrementPlayerField(tx, game.id, athleteId, 'twoPtMade', 1)
      await decrementPlayerField(tx, game.id, athleteId, 'twoPtAttempted', 1)
    }
    if (teamId) {
      await decrementTeamField(tx, game.id, teamId, 'points', points || 2)
      await decrementTeamField(tx, game.id, teamId, 'twoPtMade', 1)
      await decrementTeamField(tx, game.id, teamId, 'twoPtAttempted', 1)
    }
  } else if (lastEvent.eventType === 'SCORE_3PTS') {
    if (athleteId) {
      await decrementPlayerField(tx, game.id, athleteId, 'points', points || 3)
      await decrementPlayerField(tx, game.id, athleteId, 'threePtMade', 1)
      await decrementPlayerField(tx, game.id, athleteId, 'threePtAttempted', 1)
    }
    if (teamId) {
      await decrementTeamField(tx, game.id, teamId, 'points', points || 3)
      await decrementTeamField(tx, game.id, teamId, 'threePtMade', 1)
      await decrementTeamField(tx, game.id, teamId, 'threePtAttempted', 1)
    }
  } else if (lastEvent.eventType === 'FREE_THROW') {
    if (athleteId) {
      await decrementPlayerField(tx, game.id, athleteId, 'points', points || 1)
      await decrementPlayerField(tx, game.id, athleteId, 'freeThrowsMade', 1)
      await decrementPlayerField(tx, game.id, athleteId, 'freeThrowsAttempted', 1)
    }
    if (teamId) {
      await decrementTeamField(tx, game.id, teamId, 'points', points || 1)
      await decrementTeamField(tx, game.id, teamId, 'freeThrowsMade', 1)
      await decrementTeamField(tx, game.id, teamId, 'freeThrowsAttempted', 1)
    }
  } else if (lastEvent.eventType === 'FREE_THROW_MISS') {
    if (athleteId) {
      await decrementPlayerField(tx, game.id, athleteId, 'freeThrowsAttempted', 1)
    }
    if (teamId) {
      await decrementTeamField(tx, game.id, teamId, 'freeThrowsAttempted', 1)
    }
  } else if (lastEvent.eventType === 'MISS_2') {
    if (athleteId) {
      await decrementPlayerField(tx, game.id, athleteId, 'twoPtAttempted', 1)
    }
    if (teamId) {
      await decrementTeamField(tx, game.id, teamId, 'twoPtAttempted', 1)
    }
  } else if (lastEvent.eventType === 'MISS_3') {
    if (athleteId) {
      await decrementPlayerField(tx, game.id, athleteId, 'threePtAttempted', 1)
    }
    if (teamId) {
      await decrementTeamField(tx, game.id, teamId, 'threePtAttempted', 1)
    }
  } else if (lastEvent.eventType === 'PERSONAL_FOUL' || lastEvent.eventType === 'UNSPORTSMANLIKE_FOUL') {
    if (athleteId) {
      await decrementPlayerField(tx, game.id, athleteId, 'fouls', 1)
      const line = await tx.gamePlayerStatLine.findUnique({
        where: { gameId_athleteId: { gameId: game.id, athleteId } },
        select: { fouls: true, technicalFouls: true },
      })
      if (line && line.fouls < 5 && line.technicalFouls < 2) {
        await setRosterDisqualified(tx, game.id, athleteId, false)
      }
    }
    if (teamId) {
      await decrementTeamField(tx, game.id, teamId, 'fouls', 1)
    }
  } else if (lastEvent.eventType === 'TECHNICAL_FOUL') {
    if (athleteId) {
      await decrementPlayerField(tx, game.id, athleteId, 'technicalFouls', 1)
      const line = await tx.gamePlayerStatLine.findUnique({
        where: { gameId_athleteId: { gameId: game.id, athleteId } },
        select: { fouls: true, technicalFouls: true },
      })
      if (line && line.fouls < 5 && line.technicalFouls < 2) {
        await setRosterDisqualified(tx, game.id, athleteId, false)
      }
    }
  } else if (lastEvent.eventType === 'DISQUALIFYING_FOUL') {
    if (athleteId) {
      await setRosterDisqualified(tx, game.id, athleteId, false)
    }
  } else if (lastEvent.eventType === 'REBOUND_OFF') {
    if (athleteId) {
      await decrementPlayerField(tx, game.id, athleteId, 'reboundsOffensive', 1)
      await decrementPlayerField(tx, game.id, athleteId, 'reboundsTotal', 1)
    }
    if (teamId) {
      await decrementTeamField(tx, game.id, teamId, 'reboundsTotal', 1)
    }
  } else if (lastEvent.eventType === 'REBOUND_DEF') {
    if (athleteId) {
      await decrementPlayerField(tx, game.id, athleteId, 'reboundsDefensive', 1)
      await decrementPlayerField(tx, game.id, athleteId, 'reboundsTotal', 1)
    }
    if (teamId) {
      await decrementTeamField(tx, game.id, teamId, 'reboundsTotal', 1)
    }
  } else if (lastEvent.eventType === 'ASSIST') {
    if (athleteId) await decrementPlayerField(tx, game.id, athleteId, 'assists', 1)
    if (teamId) await decrementTeamField(tx, game.id, teamId, 'assists', 1)
  } else if (lastEvent.eventType === 'STEAL') {
    if (athleteId) await decrementPlayerField(tx, game.id, athleteId, 'steals', 1)
    if (teamId) await decrementTeamField(tx, game.id, teamId, 'steals', 1)
  } else if (lastEvent.eventType === 'BLOCK') {
    if (athleteId) await decrementPlayerField(tx, game.id, athleteId, 'blocks', 1)
    if (teamId) await decrementTeamField(tx, game.id, teamId, 'blocks', 1)
  } else if (lastEvent.eventType === 'TURNOVER') {
    if (athleteId) await decrementPlayerField(tx, game.id, athleteId, 'turnovers', 1)
    if (teamId) await decrementTeamField(tx, game.id, teamId, 'turnovers', 1)
  } else if (lastEvent.eventType === 'TIMEOUT') {
    if (teamId) {
      await decrementTeamField(tx, game.id, teamId, 'timeoutsUsed', 1)
    }
  } else if (lastEvent.eventType === 'SUBSTITUTION') {
    if (athleteOutId) {
      await tx.gameRosterPlayer.updateMany({
        where: {
          athleteId: athleteOutId,
          gameRoster: { gameId: game.id },
        },
        data: { isOnCourt: true },
      })
    }
    if (athleteInId) {
      await tx.gameRosterPlayer.updateMany({
        where: {
          athleteId: athleteInId,
          gameRoster: { gameId: game.id },
        },
        data: { isOnCourt: false },
      })
    }
  }

  const previousEvent = await tx.gameEvent.findFirst({
    where: {
      gameId: game.id,
      isCancelled: false,
      isReverted: false,
    },
    orderBy: [{ sequenceNumber: 'desc' }, { createdAt: 'desc' }],
  })

  const restoredPeriod = previousEvent?.period ?? 0
  const restoredClock = previousEvent?.clockTime ?? '10:00'

  const restoredLiveStatus = previousEvent
    ? previousEvent.eventType === 'END_PERIOD'
      ? toText(parsePayload(previousEvent.payloadJson).liveStatus, restoredPeriod >= 4 ? 'FINISHED' : 'HALFTIME')
      : previousEvent.eventType === 'START_PERIOD'
        ? 'LIVE'
        : restoredPeriod > 0
          ? 'LIVE'
          : 'SCHEDULED'
    : 'SCHEDULED'

  await tx.game.update({
    where: { id: game.id },
    data: {
      homeScore: Math.max(0, Math.trunc(toNumber(previousEvent?.homeScoreAfter, game.homeScore ?? 0))),
      awayScore: Math.max(0, Math.trunc(toNumber(previousEvent?.awayScoreAfter, game.awayScore ?? 0))),
      currentPeriod: restoredPeriod,
      clockDisplay: restoredClock,
      liveStatus: restoredLiveStatus,
      isLivePublished: restoredPeriod > 0,
      status: restoredLiveStatus === 'FINISHED' ? 'FINISHED' : undefined,
    },
  })

  await recomputeTeamCounters(tx, game.id, Math.max(1, restoredPeriod), game.homeTeamId, game.awayTeamId)
}

async function handleAction(
  tx: Tx,
  args: {
    gameId: string
    actorUserId: string | null
    action: LiveAction
    payload: JsonRecord
  }
) {
  const game = await tx.game.findUnique({
    where: { id: args.gameId },
    select: {
      id: true,
      homeTeamId: true,
      awayTeamId: true,
      homeScore: true,
      awayScore: true,
      currentPeriod: true,
      clockDisplay: true,
      liveStatus: true,
      homeTimeoutsUsed: true,
      awayTimeoutsUsed: true,
      homeTeamFoulsCurrentPeriod: true,
      awayTeamFoulsCurrentPeriod: true,
      status: true,
    },
  })

  if (!game) throw new ApiError('Jogo nao encontrado', 404)

  if (args.action === 'CANCEL_LAST_EVENT') {
    await cancelLastEvent(tx, game, args.payload)
    return
  }

  let athleteId = toText(args.payload.athleteId, '') || null
  let secondaryAthleteId: string | null = null
  let teamId: string | null = null
  let pointsDelta: number | null = null

  const period = Math.max(1, Math.trunc(toNumber(args.payload.period, game.currentPeriod || 1)))
  const clockMs = toClockMs(args.payload.clockMs, game.clockDisplay)
  const clockDisplay = formatClock(clockMs)

  const gamePatch: Prisma.GameUpdateInput = {
    currentPeriod: period,
    clockDisplay,
  }

  if (args.action === 'SCORE_2' || args.action === 'SCORE_3' || args.action === 'FREE_THROW' || args.action === 'FREE_THROW_MISS' || args.action === 'MISS_2' || args.action === 'MISS_3') {
    if (!athleteId) throw new ApiError('athleteId obrigatorio para acao de arremesso', 400)

    teamId = await resolveTeamId(tx, game, args.payload, athleteId)
    if (!teamId) throw new ApiError('teamId nao identificado para acao de arremesso', 400)

    await ensurePlayerStatLine(tx, game.id, athleteId, teamId)
    await ensureTeamStatLine(tx, game.id, teamId)

    const playerUpdate: Prisma.GamePlayerStatLineUpdateInput = {}
    const teamUpdate: Prisma.GameTeamStatLineUpdateInput = {}

    if (args.action === 'SCORE_2') {
      pointsDelta = 2
      playerUpdate.points = { increment: 2 }
      playerUpdate.twoPtMade = { increment: 1 }
      playerUpdate.twoPtAttempted = { increment: 1 }
      teamUpdate.points = { increment: 2 }
      teamUpdate.twoPtMade = { increment: 1 }
      teamUpdate.twoPtAttempted = { increment: 1 }
    } else if (args.action === 'SCORE_3') {
      pointsDelta = 3
      playerUpdate.points = { increment: 3 }
      playerUpdate.threePtMade = { increment: 1 }
      playerUpdate.threePtAttempted = { increment: 1 }
      teamUpdate.points = { increment: 3 }
      teamUpdate.threePtMade = { increment: 1 }
      teamUpdate.threePtAttempted = { increment: 1 }
    } else if (args.action === 'FREE_THROW') {
      pointsDelta = 1
      playerUpdate.points = { increment: 1 }
      playerUpdate.freeThrowsMade = { increment: 1 }
      playerUpdate.freeThrowsAttempted = { increment: 1 }
      teamUpdate.points = { increment: 1 }
      teamUpdate.freeThrowsMade = { increment: 1 }
      teamUpdate.freeThrowsAttempted = { increment: 1 }
    } else if (args.action === 'FREE_THROW_MISS') {
      playerUpdate.freeThrowsAttempted = { increment: 1 }
      teamUpdate.freeThrowsAttempted = { increment: 1 }
    } else if (args.action === 'MISS_2') {
      playerUpdate.twoPtAttempted = { increment: 1 }
      teamUpdate.twoPtAttempted = { increment: 1 }
    } else if (args.action === 'MISS_3') {
      playerUpdate.threePtAttempted = { increment: 1 }
      teamUpdate.threePtAttempted = { increment: 1 }
    }

    if (pointsDelta) {
      if (teamId === game.homeTeamId) {
        gamePatch.homeScore = { increment: pointsDelta }
      } else if (teamId === game.awayTeamId) {
        gamePatch.awayScore = { increment: pointsDelta }
      }
    }

    await tx.gamePlayerStatLine.update({
      where: {
        gameId_athleteId: {
          gameId: game.id,
          athleteId,
        },
      },
      data: playerUpdate,
    })

    await tx.gameTeamStatLine.update({
      where: {
        gameId_teamId: {
          gameId: game.id,
          teamId,
        },
      },
      data: teamUpdate,
    })
  } else if (
    args.action === 'PERSONAL_FOUL' ||
    args.action === 'TECHNICAL_FOUL' ||
    args.action === 'UNSPORTSMANLIKE_FOUL' ||
    args.action === 'DISQUALIFYING_FOUL'
  ) {
    if (!athleteId) throw new ApiError('athleteId obrigatorio para falta', 400)

    teamId = await resolveTeamId(tx, game, args.payload, athleteId)
    if (!teamId) throw new ApiError('teamId nao identificado para falta', 400)

    await ensurePlayerStatLine(tx, game.id, athleteId, teamId)
    await ensureTeamStatLine(tx, game.id, teamId)

    if (args.action === 'PERSONAL_FOUL' || args.action === 'UNSPORTSMANLIKE_FOUL') {
      await tx.gamePlayerStatLine.update({
        where: {
          gameId_athleteId: {
            gameId: game.id,
            athleteId,
          },
        },
        data: {
          fouls: { increment: 1 },
        },
      })

      await tx.gameTeamStatLine.update({
        where: {
          gameId_teamId: { gameId: game.id, teamId },
        },
        data: {
          fouls: { increment: 1 },
        },
      })

      if (teamId === game.homeTeamId) {
        gamePatch.homeTeamFoulsCurrentPeriod = { increment: 1 }
      } else if (teamId === game.awayTeamId) {
        gamePatch.awayTeamFoulsCurrentPeriod = { increment: 1 }
      }

      const line = await tx.gamePlayerStatLine.findUnique({
        where: { gameId_athleteId: { gameId: game.id, athleteId } },
        select: { fouls: true },
      })
      if ((line?.fouls ?? 0) >= 5) {
        await setRosterDisqualified(tx, game.id, athleteId, true)
      }
    } else if (args.action === 'TECHNICAL_FOUL') {
      await tx.gamePlayerStatLine.update({
        where: {
          gameId_athleteId: {
            gameId: game.id,
            athleteId,
          },
        },
        data: {
          technicalFouls: { increment: 1 },
        },
      })

      const line = await tx.gamePlayerStatLine.findUnique({
        where: { gameId_athleteId: { gameId: game.id, athleteId } },
        select: { technicalFouls: true },
      })
      if ((line?.technicalFouls ?? 0) >= 2) {
        await setRosterDisqualified(tx, game.id, athleteId, true)
      }
    } else {
      await setRosterDisqualified(tx, game.id, athleteId, true)
    }
  } else if (args.action === 'REBOUND_OFF' || args.action === 'REBOUND_DEF') {
    if (!athleteId) throw new ApiError('athleteId obrigatorio para rebote', 400)
    teamId = await resolveTeamId(tx, game, args.payload, athleteId)
    if (!teamId) throw new ApiError('teamId nao identificado para rebote', 400)

    await ensurePlayerStatLine(tx, game.id, athleteId, teamId)
    await ensureTeamStatLine(tx, game.id, teamId)

    await tx.gamePlayerStatLine.update({
      where: {
        gameId_athleteId: {
          gameId: game.id,
          athleteId,
        },
      },
      data:
        args.action === 'REBOUND_OFF'
          ? {
              reboundsOffensive: { increment: 1 },
              reboundsTotal: { increment: 1 },
            }
          : {
              reboundsDefensive: { increment: 1 },
              reboundsTotal: { increment: 1 },
            },
    })

    await tx.gameTeamStatLine.update({
      where: {
        gameId_teamId: {
          gameId: game.id,
          teamId,
        },
      },
      data: {
        reboundsTotal: { increment: 1 },
      },
    })
  } else if (args.action === 'ASSIST' || args.action === 'STEAL' || args.action === 'BLOCK' || args.action === 'TURNOVER') {
    if (!athleteId) throw new ApiError('athleteId obrigatorio para scout individual', 400)
    teamId = await resolveTeamId(tx, game, args.payload, athleteId)
    if (!teamId) throw new ApiError('teamId nao identificado para scout individual', 400)

    await ensurePlayerStatLine(tx, game.id, athleteId, teamId)
    await ensureTeamStatLine(tx, game.id, teamId)

    const playerUpdate: Prisma.GamePlayerStatLineUpdateInput =
      args.action === 'ASSIST'
        ? { assists: { increment: 1 } }
        : args.action === 'STEAL'
          ? { steals: { increment: 1 } }
          : args.action === 'BLOCK'
            ? { blocks: { increment: 1 } }
            : { turnovers: { increment: 1 } }

    const teamUpdate: Prisma.GameTeamStatLineUpdateInput =
      args.action === 'ASSIST'
        ? { assists: { increment: 1 } }
        : args.action === 'STEAL'
          ? { steals: { increment: 1 } }
          : args.action === 'BLOCK'
            ? { blocks: { increment: 1 } }
            : { turnovers: { increment: 1 } }

    await tx.gamePlayerStatLine.update({
      where: {
        gameId_athleteId: {
          gameId: game.id,
          athleteId,
        },
      },
      data: playerUpdate,
    })

    await tx.gameTeamStatLine.update({
      where: {
        gameId_teamId: {
          gameId: game.id,
          teamId,
        },
      },
      data: teamUpdate,
    })
  } else if (args.action === 'SUBSTITUTION') {
    const playerOutRaw = toText(args.payload.playerOutId, '') || toText(args.payload.athleteOutId, '')
    const playerInRaw = toText(args.payload.playerInId, '') || toText(args.payload.athleteInId, '')

    if (!playerOutRaw || !playerInRaw) {
      throw new ApiError('playerOutId e playerInId sao obrigatorios para substituicao', 400)
    }

    const [outPlayer, inPlayer] = await Promise.all([
      findRosterPlayerByAnyId(tx, game.id, playerOutRaw),
      findRosterPlayerByAnyId(tx, game.id, playerInRaw),
    ])

    if (!outPlayer || !inPlayer) {
      throw new ApiError('Jogadores da substituicao nao encontrados no roster do jogo', 400)
    }

    if (outPlayer.teamId !== inPlayer.teamId) {
      throw new ApiError('Substituicao invalida: jogadores de equipes diferentes', 400)
    }

    if (inPlayer.isDisqualified) {
      throw new ApiError('Jogador de entrada esta eliminado', 400)
    }

    teamId = outPlayer.teamId
    athleteId = outPlayer.athleteId
    secondaryAthleteId = inPlayer.athleteId

    await tx.gameRosterPlayer.update({
      where: { id: outPlayer.id },
      data: { isOnCourt: false },
    })

    await tx.gameRosterPlayer.update({
      where: { id: inPlayer.id },
      data: { isOnCourt: true },
    })
  } else if (args.action === 'TIMEOUT') {
    teamId = await resolveTeamId(tx, game, args.payload)
    if (!teamId) throw new ApiError('teamSide ou teamId obrigatorio para timeout', 400)

    const used = teamId === game.homeTeamId ? game.homeTimeoutsUsed : game.awayTimeoutsUsed
    if (used >= MAX_TIMEOUTS) {
      throw new ApiError('Limite de timeout atingido', 400)
    }

    await ensureTeamStatLine(tx, game.id, teamId)
    await tx.gameTeamStatLine.update({
      where: {
        gameId_teamId: {
          gameId: game.id,
          teamId,
        },
      },
      data: {
        timeoutsUsed: { increment: 1 },
      },
    })

    if (teamId === game.homeTeamId) {
      gamePatch.homeTimeoutsUsed = { increment: 1 }
    } else {
      gamePatch.awayTimeoutsUsed = { increment: 1 }
    }
  } else if (args.action === 'START_PERIOD') {
    gamePatch.liveStatus = 'LIVE'
    gamePatch.currentPeriod = period
    gamePatch.isLivePublished = true
    gamePatch.homeTeamFoulsCurrentPeriod = 0
    gamePatch.awayTeamFoulsCurrentPeriod = 0
  } else if (args.action === 'END_PERIOD') {
    const isLastPeriod = toBool(args.payload.isLastPeriod, period >= 4)
    const isTied = toBool(
      args.payload.isTied,
      Number(game.homeScore ?? 0) === Number(game.awayScore ?? 0)
    )

    const incomingHome = Math.trunc(toNumber(args.payload.homeScore, Number(game.homeScore ?? 0)))
    const incomingAway = Math.trunc(toNumber(args.payload.awayScore, Number(game.awayScore ?? 0)))

    const nextLiveStatus = isTied && isLastPeriod ? 'OVERTIME' : isLastPeriod ? 'FINISHED' : 'HALFTIME'

    gamePatch.liveStatus = nextLiveStatus
    gamePatch.currentPeriod = period
    gamePatch.clockDisplay = toText(args.payload.clockDisplay, clockDisplay)
    gamePatch.homeScore = incomingHome
    gamePatch.awayScore = incomingAway

    if (nextLiveStatus === 'FINISHED') {
      gamePatch.status = 'FINISHED'
    }
  } else if (
    args.action === 'VIOLATION_24S' ||
    args.action === 'VIOLATION_8S' ||
    args.action === 'VIOLATION_3S' ||
    args.action === 'BALL_OUT'
  ) {
    teamId = await resolveTeamId(tx, game, args.payload, athleteId)
  }

  await tx.game.update({
    where: { id: game.id },
    data: gamePatch,
  })

  const updatedGame = await tx.game.findUnique({
    where: { id: game.id },
    select: {
      homeScore: true,
      awayScore: true,
      currentPeriod: true,
      clockDisplay: true,
      homeTeamFoulsCurrentPeriod: true,
      awayTeamFoulsCurrentPeriod: true,
      homeTimeoutsUsed: true,
      awayTimeoutsUsed: true,
    },
  })

  const eventType =
    args.action === 'SCORE_2'
      ? 'SCORE_2PTS'
      : args.action === 'SCORE_3'
        ? 'SCORE_3PTS'
        : args.action

  await createEvent(tx, {
    gameId: game.id,
    actorUserId: args.actorUserId,
    eventType,
    payload: {
      ...args.payload,
      action: args.action,
      period,
      clockMs,
      clockDisplay,
      liveStatus: (gamePatch.liveStatus as string | undefined) ?? game.liveStatus,
    },
    period,
    clockMs,
    clockDisplay,
    teamId,
    athleteId,
    secondaryAthleteId,
    pointsDelta,
    homeScoreAfter: Number(updatedGame?.homeScore ?? 0),
    awayScoreAfter: Number(updatedGame?.awayScore ?? 0),
  })
}

function safeStatPercent(made: number, attempted: number) {
  if (attempted <= 0) return 0
  return Number(((made / attempted) * 100).toFixed(1))
}

async function getLiveSnapshot(gameId: string) {
  const game = await prisma.game.findUnique({
    where: { id: gameId },
    include: {
      championship: {
        select: {
          id: true,
          name: true,
        },
      },
      category: {
        select: {
          id: true,
          name: true,
        },
      },
      homeTeam: {
        select: {
          id: true,
          name: true,
          logoUrl: true,
        },
      },
      awayTeam: {
        select: {
          id: true,
          name: true,
          logoUrl: true,
        },
      },
      refereeAssignments: {
        include: {
          referee: true,
        },
        orderBy: {
          createdAt: 'asc',
        },
      },
      rosters: {
        include: {
          team: {
            select: {
              id: true,
              name: true,
            },
          },
          players: {
            include: {
              athlete: {
                select: {
                  id: true,
                  name: true,
                  jerseyNumber: true,
                  position: true,
                  teamId: true,
                },
              },
            },
            orderBy: [{ isOnCourt: 'desc' }, { jerseyNumber: 'asc' }],
          },
        },
      },
      events: {
        include: {
          athlete: {
            select: {
              id: true,
              name: true,
              jerseyNumber: true,
            },
          },
          secondaryAthlete: {
            select: {
              id: true,
              name: true,
              jerseyNumber: true,
            },
          },
          team: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: [{ sequenceNumber: 'desc' }, { createdAt: 'desc' }],
        take: 50,
      },
      playerStatLines: {
        include: {
          athlete: {
            select: {
              id: true,
              name: true,
              jerseyNumber: true,
              position: true,
            },
          },
        },
        orderBy: [{ points: 'desc' }, { athlete: { name: 'asc' } }],
      },
      teamStatLines: {
        include: {
          team: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
  })

  if (!game) return null

  const events = game.events.map((event) => {
    const resolvedClockMs = Number(event.clockMs ?? parseClockDisplay(event.clockTime))

    return {
      ...event,
      type: event.eventType,
      sequence: Number(event.sequence ?? event.sequenceNumber),
      clockMs: resolvedClockMs,
      homeScoreAfter: Number(event.homeScoreAfter ?? game.homeScore ?? 0),
      awayScoreAfter: Number(event.awayScoreAfter ?? game.awayScore ?? 0),
      isCancelled: Boolean(event.isCancelled || event.isReverted),
      description: describeEvent(event),
    }
  })

  const livePlayerStatLines = game.playerStatLines.map((line) => {
    const fgMade = line.twoPtMade + line.threePtMade
    const fgAttempted = line.twoPtAttempted + line.threePtAttempted
    return {
      ...line,
      fgPct: safeStatPercent(fgMade, fgAttempted),
      threePct: safeStatPercent(line.threePtMade, line.threePtAttempted),
      freeThrowPct: safeStatPercent(line.freeThrowsMade, line.freeThrowsAttempted),
    }
  })

  return {
    ...game,
    homeScore: Number(game.homeScore ?? 0),
    awayScore: Number(game.awayScore ?? 0),
    gameOfficials: game.refereeAssignments,
    gameRosters: game.rosters,
    gameEvents: events,
    livePlayerStatLines,
    liveTeamStatLines: game.teamStatLines,
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureDatabaseSchema()
    const session = await requireAdmin()
    if (!session) {
      return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })
    }

    const { id } = await params
    const snapshot = await getLiveSnapshot(id)

    if (!snapshot) {
      return NextResponse.json({ error: 'Jogo nao encontrado' }, { status: 404 })
    }

    return NextResponse.json(snapshot)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro ao carregar jogo ao vivo'
    console.error('[LIVE][Admin Jogos GET]', error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureDatabaseSchema()
    const session = await requireAdmin()
    if (!session) {
      return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })
    }

    const actorUserId = (session.user as { id?: string }).id ?? null
    const body = (await request.json().catch(() => ({}))) as {
      action?: string
      payload?: JsonRecord
    }

    const payload = body.payload && typeof body.payload === 'object' ? body.payload : {}
    const normalized = normalizeAction(toText(body.action, '').trim(), payload)

    if (!normalized) {
      return NextResponse.json({ error: 'Acao de live invalida' }, { status: 400 })
    }

    const { id: gameId } = await params

    await prisma.$transaction(async (tx) => {
      await handleAction(tx, {
        gameId,
        actorUserId,
        action: normalized,
        payload,
      })
    })

    const snapshot = await getLiveSnapshot(gameId)
    if (!snapshot) {
      return NextResponse.json({ error: 'Jogo nao encontrado' }, { status: 404 })
    }

    return NextResponse.json(snapshot)
  } catch (error: unknown) {
    console.error('[LIVE][Admin Jogos POST]', error)

    if (error instanceof ApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }

    const message = error instanceof Error ? error.message : 'Erro ao registrar acao live'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
