import { randomUUID } from 'crypto'

import { prisma } from '@/lib/db'
import { StandingService } from '@/services/standing-service'

type PregameAction =
  | 'sync-rosters'
  | 'lock-rosters'
  | 'unlock-rosters'
  | 'open-session'
  | 'assign-officials'
  | 'update-roster-player'

type LiveAction =
  | 'event'
  | 'revert-event'
  | 'publish'

type ReviewAction =
  | 'finalize-official'

type EventInput = {
  period: number
  clockTime: string
  eventType: string
  teamId?: string | null
  athleteId?: string | null
  secondaryAthleteId?: string | null
  pointsDelta?: number | null
  payload?: Record<string, unknown> | null
}

const LIVE_VISIBLE_STATUSES = new Set([
  'PRE_GAME_READY',
  'LIVE',
  'HALFTIME',
  'PERIOD_BREAK',
  'FINAL_PENDING_CONFIRMATION',
  'FINAL_OFFICIAL',
])

const SCORING_EVENTS: Record<string, { points: number; bucket: 'two' | 'three' | 'ft' }> = {
  SHOT_MADE_2: { points: 2, bucket: 'two' },
  SHOT_MADE_3: { points: 3, bucket: 'three' },
  FREE_THROW_MADE: { points: 1, bucket: 'ft' },
}

const MISSED_EVENTS: Record<string, 'two' | 'three' | 'ft'> = {
  SHOT_MISSED_2: 'two',
  SHOT_MISSED_3: 'three',
  FREE_THROW_MISSED: 'ft',
}

const FOUL_EVENTS = new Set([
  'FOUL_PERSONAL',
  'FOUL_TECHNICAL',
  'FOUL_UNSPORTSMANLIKE',
  'FOUL_DISQUALIFYING',
])

function safeParseJson<T>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback
  try {
    return JSON.parse(value) as T
  } catch {
    return fallback
  }
}

function serializeJson(value: unknown) {
  return value ? JSON.stringify(value) : null
}

function buildEventDescription(event: {
  eventType: string
  pointsDelta?: number | null
  athleteName?: string | null
  teamName?: string | null
}) {
  const actor = event.athleteName || event.teamName || 'Equipe'

  switch (event.eventType) {
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
    case 'TURNOVER':
      return `${actor} cometeu turnover`
    case 'STEAL':
      return `${actor} roubou a bola`
    case 'BLOCK':
      return `${actor} aplicou um toco`
    case 'ASSIST':
      return `${actor} deu assistência`
    case 'TIMEOUT_CONFIRMED':
      return `${event.teamName || 'Equipe'} pediu tempo`
    case 'GAME_START':
      return 'Jogo iniciado'
    case 'PERIOD_START':
      return `Período ${event.pointsDelta ?? ''} iniciado`.trim()
    case 'PERIOD_END':
      return `Período ${event.pointsDelta ?? ''} encerrado`.trim()
    case 'HALFTIME_START':
      return 'Intervalo iniciado'
    case 'HALFTIME_END':
      return 'Intervalo encerrado'
    case 'GAME_END':
      return 'Jogo encerrado'
    default:
      return `${actor} registrou ${event.eventType}`
  }
}

function createPlayerAccumulator(teamId: string) {
  return {
    teamId,
    minutesPlayed: 0,
    points: 0,
    fouls: 0,
    assists: 0,
    reboundsOffensive: 0,
    reboundsDefensive: 0,
    reboundsTotal: 0,
    steals: 0,
    blocks: 0,
    turnovers: 0,
    twoPtMade: 0,
    twoPtAttempted: 0,
    threePtMade: 0,
    threePtAttempted: 0,
    freeThrowsMade: 0,
    freeThrowsAttempted: 0,
    plusMinus: 0,
    isStarter: false,
    fouledOut: false,
    disqualified: false,
  }
}

function createTeamAccumulator() {
  return {
    points: 0,
    fouls: 0,
    timeoutsUsed: 0,
    reboundsTotal: 0,
    assists: 0,
    steals: 0,
    turnovers: 0,
    blocks: 0,
    twoPtMade: 0,
    twoPtAttempted: 0,
    threePtMade: 0,
    threePtAttempted: 0,
    freeThrowsMade: 0,
    freeThrowsAttempted: 0,
  }
}

function ensurePeriodScore(
  map: Map<number, { homePoints: number; awayPoints: number }>,
  period: number
) {
  if (!map.has(period)) {
    map.set(period, { homePoints: 0, awayPoints: 0 })
  }
  return map.get(period)!
}

function ensureLivePlayer(
  map: Map<string, ReturnType<typeof createPlayerAccumulator>>,
  athleteId: string,
  teamId: string
) {
  if (!map.has(athleteId)) {
    map.set(athleteId, createPlayerAccumulator(teamId))
  }

  const entry = map.get(athleteId)!
  if (!entry.teamId) entry.teamId = teamId
  return entry
}

function ensureLiveTeam(
  map: Map<string, ReturnType<typeof createTeamAccumulator>>,
  teamId: string
) {
  if (!map.has(teamId)) {
    map.set(teamId, createTeamAccumulator())
  }
  return map.get(teamId)!
}

async function getGameBase(gameId: string) {
  return prisma.game.findUnique({
    where: { id: gameId },
    include: {
      championship: { select: { id: true, name: true, year: true } },
      category: { select: { id: true, name: true } },
      homeTeam: { select: { id: true, name: true, logoUrl: true } },
      awayTeam: { select: { id: true, name: true, logoUrl: true } },
      rosters: {
        include: {
          team: { select: { id: true, name: true } },
          players: {
            include: {
              athlete: {
                select: {
                  id: true,
                  name: true,
                  jerseyNumber: true,
                  position: true,
                  status: true,
                },
              },
            },
            orderBy: [{ isStarter: 'desc' }, { jerseyNumber: 'asc' }],
          },
        },
      },
      officials: {
        orderBy: { createdAt: 'asc' },
      },
      liveSessions: {
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
      playerStatLines: {
        include: {
          athlete: { select: { id: true, name: true, jerseyNumber: true } },
          team: { select: { id: true, name: true } },
        },
        orderBy: [{ points: 'desc' }, { athlete: { name: 'asc' } }],
      },
      teamStatLines: {
        include: {
          team: { select: { id: true, name: true } },
        },
      },
      periodScores: {
        orderBy: { period: 'asc' },
      },
      events: {
        include: {
          team: { select: { id: true, name: true } },
          athlete: { select: { id: true, name: true } },
          secondaryAthlete: { select: { id: true, name: true } },
        },
        orderBy: [{ sequenceNumber: 'asc' }, { createdAt: 'asc' }],
      },
      officialReport: true,
      refereeAssignments: {
        include: { referee: true },
      },
    },
  })
}

async function getNextSequenceNumber(gameId: string) {
  const last = await prisma.gameEvent.findFirst({
    where: { gameId },
    orderBy: { sequenceNumber: 'desc' },
    select: { sequenceNumber: true },
  })

  return (last?.sequenceNumber ?? 0) + 1
}

async function logAudit(args: {
  gameId: string
  actionType: string
  actorUserId?: string | null
  targetEntity: string
  targetEntityId?: string | null
  description: string
  meta?: Record<string, unknown> | null
}) {
  await prisma.gameAuditLog.create({
    data: {
      gameId: args.gameId,
      actionType: args.actionType,
      actorUserId: args.actorUserId ?? null,
      targetEntity: args.targetEntity,
      targetEntityId: args.targetEntityId ?? null,
      description: args.description,
      metaJson: serializeJson(args.meta),
    },
  })
}

async function getOrCreateLiveSession(gameId: string, openedByUserId?: string | null) {
  const current = await prisma.gameLiveSession.findFirst({
    where: {
      gameId,
      status: {
        in: ['PRE_GAME_READY', 'LIVE', 'HALFTIME', 'PERIOD_BREAK', 'REVIEW_REQUIRED', 'FINAL_PENDING_CONFIRMATION'],
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  if (current) return current

  return prisma.gameLiveSession.create({
    data: {
      gameId,
      openedByUserId: openedByUserId ?? null,
      status: 'PRE_GAME_READY',
      publicVisibilityStatus: 'PRE_GAME',
      currentPeriod: 0,
      clockStatus: 'STOPPED',
    },
  })
}

async function syncRosterForTeam(gameId: string, teamId: string) {
  const [athletes, coach] = await Promise.all([
    prisma.athlete.findMany({
      where: { teamId, status: 'ACTIVE' },
      orderBy: [{ jerseyNumber: 'asc' }, { name: 'asc' }],
    }),
    prisma.teamMembership.findFirst({
      where: {
        teamId,
        status: 'ACTIVE',
        role: { in: ['HEAD_COACH', 'COACH', 'GESTOR', 'RESPONSAVEL'] },
      },
      include: { user: { select: { name: true } } },
      orderBy: { approvedAt: 'asc' },
    }),
  ])

  const roster = await prisma.gameRoster.upsert({
    where: { gameId_teamId: { gameId, teamId } },
    create: {
      gameId,
      teamId,
      coachName: coach?.user.name ?? null,
      players: athletes.length > 0 ? {
        create: athletes.map((athlete, index) => ({
          athleteId: athlete.id,
          jerseyNumber: athlete.jerseyNumber ?? null,
          isStarter: index < 5,
          isCaptain: index === 0,
        })),
      } : undefined,
    },
    update: {
      coachName: coach?.user.name ?? null,
    },
    include: { players: true },
  })

  const existingIds = new Set(roster.players.map((player) => player.athleteId))
  const incomingIds = new Set(athletes.map((athlete) => athlete.id))

  for (const athlete of athletes) {
    if (existingIds.has(athlete.id)) {
      await prisma.gameRosterPlayer.updateMany({
        where: { gameRosterId: roster.id, athleteId: athlete.id },
        data: { jerseyNumber: athlete.jerseyNumber ?? null },
      })
      continue
    }

    await prisma.gameRosterPlayer.create({
      data: {
        gameRosterId: roster.id,
        athleteId: athlete.id,
        jerseyNumber: athlete.jerseyNumber ?? null,
        isStarter: roster.players.length < 5,
        isCaptain: roster.players.length === 0,
      },
    })
  }

  await prisma.gameRosterPlayer.deleteMany({
    where: {
      gameRosterId: roster.id,
      athleteId: { notIn: Array.from(incomingIds) },
    },
  })

  return prisma.gameRoster.findUnique({
    where: { id: roster.id },
    include: {
      team: { select: { id: true, name: true } },
      players: {
        include: {
          athlete: {
            select: {
              id: true,
              name: true,
              jerseyNumber: true,
              position: true,
              status: true,
            },
          },
        },
        orderBy: [{ isStarter: 'desc' }, { jerseyNumber: 'asc' }],
      },
    },
  })
}

async function findRosterPlayer(gameId: string, teamId: string, athleteId: string) {
  return prisma.gameRosterPlayer.findFirst({
    where: {
      athleteId,
      gameRoster: {
        gameId,
        teamId,
      },
    },
    include: {
      athlete: { select: { id: true, name: true } },
      gameRoster: { select: { id: true, teamId: true } },
    },
  })
}

async function getTrackedOnCourtCount(gameId: string, teamId: string) {
  const roster = await prisma.gameRoster.findUnique({
    where: { gameId_teamId: { gameId, teamId } },
    include: { players: true },
  })

  return {
    rosterId: roster?.id ?? null,
    count: roster?.players.filter((player) => player.isOnCourt).length ?? 0,
    starters: roster?.players.filter((player) => player.isStarter).slice(0, 5) ?? [],
  }
}

async function recomputeLiveState(gameId: string) {
  const game = await prisma.game.findUnique({
    where: { id: gameId },
    include: {
      events: {
        where: { isReverted: false },
        orderBy: [{ sequenceNumber: 'asc' }, { createdAt: 'asc' }],
      },
      rosters: {
        include: { players: true },
      },
    },
  })

  if (!game) {
    throw new Error('Jogo não encontrado')
  }

  const playerMap = new Map<string, ReturnType<typeof createPlayerAccumulator>>()
  const teamMap = new Map<string, ReturnType<typeof createTeamAccumulator>>()
  const periodMap = new Map<number, { homePoints: number; awayPoints: number }>()

  for (const roster of game.rosters) {
    for (const player of roster.players) {
      const line = ensureLivePlayer(playerMap, player.athleteId, roster.teamId)
      line.isStarter = player.isStarter
    }
  }

  let liveStatus = game.liveStatus || 'SCHEDULED'
  let currentPeriod = game.currentPeriod || 0
  let clockDisplay = game.clockDisplay || '10:00'
  let homeTimeoutsUsed = 0
  let awayTimeoutsUsed = 0
  let homeTeamFoulsCurrentPeriod = 0
  let awayTeamFoulsCurrentPeriod = 0

  for (const event of game.events) {
    const teamId = event.teamId ?? undefined
    const actorId = event.athleteId ?? undefined

    if (event.period) {
      currentPeriod = Math.max(currentPeriod, event.period)
    }
    if (event.clockTime) {
      clockDisplay = event.clockTime
    }

    if (teamId) {
      ensureLiveTeam(teamMap, teamId)
    }

    if (event.eventType in SCORING_EVENTS && teamId) {
      const meta = SCORING_EVENTS[event.eventType]
      const teamStats = ensureLiveTeam(teamMap, teamId)
      const points = event.pointsDelta ?? meta.points
      teamStats.points += points

      if (meta.bucket === 'two') {
        teamStats.twoPtMade += 1
        teamStats.twoPtAttempted += 1
      } else if (meta.bucket === 'three') {
        teamStats.threePtMade += 1
        teamStats.threePtAttempted += 1
      } else {
        teamStats.freeThrowsMade += 1
        teamStats.freeThrowsAttempted += 1
      }

      if (actorId) {
        const playerStats = ensureLivePlayer(playerMap, actorId, teamId)
        playerStats.points += points
        if (meta.bucket === 'two') {
          playerStats.twoPtMade += 1
          playerStats.twoPtAttempted += 1
        } else if (meta.bucket === 'three') {
          playerStats.threePtMade += 1
          playerStats.threePtAttempted += 1
        } else {
          playerStats.freeThrowsMade += 1
          playerStats.freeThrowsAttempted += 1
        }
      }

      const periodScore = ensurePeriodScore(periodMap, event.period || 1)
      if (teamId === game.homeTeamId) {
        periodScore.homePoints += points
      } else if (teamId === game.awayTeamId) {
        periodScore.awayPoints += points
      }
    } else if (event.eventType in MISSED_EVENTS && actorId && teamId) {
      const playerStats = ensureLivePlayer(playerMap, actorId, teamId)
      const teamStats = ensureLiveTeam(teamMap, teamId)
      const bucket = MISSED_EVENTS[event.eventType]

      if (bucket === 'two') {
        playerStats.twoPtAttempted += 1
        teamStats.twoPtAttempted += 1
      } else if (bucket === 'three') {
        playerStats.threePtAttempted += 1
        teamStats.threePtAttempted += 1
      } else {
        playerStats.freeThrowsAttempted += 1
        teamStats.freeThrowsAttempted += 1
      }
    }

    if (actorId && teamId) {
      const playerStats = ensureLivePlayer(playerMap, actorId, teamId)
      const teamStats = ensureLiveTeam(teamMap, teamId)

      switch (event.eventType) {
        case 'REBOUND_OFFENSIVE':
          playerStats.reboundsOffensive += 1
          playerStats.reboundsTotal += 1
          teamStats.reboundsTotal += 1
          break
        case 'REBOUND_DEFENSIVE':
          playerStats.reboundsDefensive += 1
          playerStats.reboundsTotal += 1
          teamStats.reboundsTotal += 1
          break
        case 'ASSIST':
          playerStats.assists += 1
          teamStats.assists += 1
          break
        case 'STEAL':
          playerStats.steals += 1
          teamStats.steals += 1
          break
        case 'BLOCK':
          playerStats.blocks += 1
          teamStats.blocks += 1
          break
        case 'TURNOVER':
          playerStats.turnovers += 1
          teamStats.turnovers += 1
          break
      }

      if (FOUL_EVENTS.has(event.eventType)) {
        playerStats.fouls += 1
        teamStats.fouls += 1
        playerStats.fouledOut = playerStats.fouls >= 5
        playerStats.disqualified = event.eventType === 'FOUL_DISQUALIFYING'

        if (teamId === game.homeTeamId) {
          homeTeamFoulsCurrentPeriod += 1
        } else if (teamId === game.awayTeamId) {
          awayTeamFoulsCurrentPeriod += 1
        }
      }
    }

    if (event.eventType === 'TIMEOUT_CONFIRMED' && teamId) {
      const teamStats = ensureLiveTeam(teamMap, teamId)
      teamStats.timeoutsUsed += 1
      if (teamId === game.homeTeamId) homeTimeoutsUsed += 1
      if (teamId === game.awayTeamId) awayTimeoutsUsed += 1
    }

    switch (event.eventType) {
      case 'GAME_START':
        liveStatus = 'LIVE'
        break
      case 'PERIOD_START':
      case 'OVERTIME_START':
        liveStatus = 'LIVE'
        homeTeamFoulsCurrentPeriod = 0
        awayTeamFoulsCurrentPeriod = 0
        break
      case 'PERIOD_END':
      case 'OVERTIME_END':
        liveStatus = 'PERIOD_BREAK'
        break
      case 'HALFTIME_START':
        liveStatus = 'HALFTIME'
        break
      case 'HALFTIME_END':
        liveStatus = 'LIVE'
        homeTeamFoulsCurrentPeriod = 0
        awayTeamFoulsCurrentPeriod = 0
        break
      case 'GAME_END':
        liveStatus = 'FINAL_PENDING_CONFIRMATION'
        break
    }
  }

  const homeStats = ensureLiveTeam(teamMap, game.homeTeamId)
  const awayStats = ensureLiveTeam(teamMap, game.awayTeamId)

  await prisma.$transaction([
    prisma.gamePlayerStatLine.deleteMany({ where: { gameId } }),
    prisma.gameTeamStatLine.deleteMany({ where: { gameId } }),
    prisma.gamePeriodScore.deleteMany({ where: { gameId } }),
    ...Array.from(playerMap.entries()).map(([athleteId, stats]) =>
      prisma.gamePlayerStatLine.create({
        data: {
          gameId,
          athleteId,
          teamId: stats.teamId,
          minutesPlayed: stats.minutesPlayed,
          points: stats.points,
          fouls: stats.fouls,
          assists: stats.assists,
          reboundsOffensive: stats.reboundsOffensive,
          reboundsDefensive: stats.reboundsDefensive,
          reboundsTotal: stats.reboundsTotal,
          steals: stats.steals,
          blocks: stats.blocks,
          turnovers: stats.turnovers,
          twoPtMade: stats.twoPtMade,
          twoPtAttempted: stats.twoPtAttempted,
          threePtMade: stats.threePtMade,
          threePtAttempted: stats.threePtAttempted,
          freeThrowsMade: stats.freeThrowsMade,
          freeThrowsAttempted: stats.freeThrowsAttempted,
          plusMinus: stats.plusMinus,
          isStarter: stats.isStarter,
          fouledOut: stats.fouledOut,
          disqualified: stats.disqualified,
        },
      })
    ),
    prisma.gameTeamStatLine.create({
      data: { gameId, teamId: game.homeTeamId, ...homeStats },
    }),
    prisma.gameTeamStatLine.create({
      data: { gameId, teamId: game.awayTeamId, ...awayStats },
    }),
    ...Array.from(periodMap.entries()).map(([period, score]) =>
      prisma.gamePeriodScore.create({
        data: {
          gameId,
          period,
          homePoints: score.homePoints,
          awayPoints: score.awayPoints,
        },
      })
    ),
    prisma.game.update({
      where: { id: gameId },
      data: {
        homeScore: homeStats.points,
        awayScore: awayStats.points,
        status:
          liveStatus === 'FINAL_PENDING_CONFIRMATION' || liveStatus === 'FINAL_OFFICIAL'
            ? 'FINISHED'
            : liveStatus === 'LIVE' || liveStatus === 'HALFTIME' || liveStatus === 'PERIOD_BREAK'
              ? 'LIVE'
              : game.status,
        liveStatus,
        currentPeriod,
        clockDisplay,
        homeTimeoutsUsed,
        awayTimeoutsUsed,
        homeTeamFoulsCurrentPeriod,
        awayTeamFoulsCurrentPeriod,
      },
    }),
  ])

  return {
    homeScore: homeStats.points,
    awayScore: awayStats.points,
    liveStatus,
    currentPeriod,
  }
}

export class LiveGameService {
  static async getSnapshot(gameId: string, publicView = false) {
    const game = await getGameBase(gameId)

    if (!game) {
      throw new Error('Jogo não encontrado')
    }

    if (publicView && !game.isLivePublished && !LIVE_VISIBLE_STATUSES.has(game.liveStatus)) {
      throw new Error('Jogo ainda não publicado')
    }

    const latestSession = game.liveSessions[0] ?? null

    return {
      game: {
        id: game.id,
        championshipId: game.championshipId,
        name: `${game.homeTeam.name} x ${game.awayTeam.name}`,
        dateTime: game.dateTime,
        location: game.location,
        city: game.city,
        court: game.court,
        venue: game.venue,
        status: game.status,
        liveStatus: game.liveStatus,
        currentPeriod: game.currentPeriod,
        clockDisplay: game.clockDisplay,
        homeScore: game.homeScore ?? 0,
        awayScore: game.awayScore ?? 0,
        isLivePublished: game.isLivePublished,
        homeTimeoutsUsed: game.homeTimeoutsUsed,
        awayTimeoutsUsed: game.awayTimeoutsUsed,
        homeTeamFoulsCurrentPeriod: game.homeTeamFoulsCurrentPeriod,
        awayTeamFoulsCurrentPeriod: game.awayTeamFoulsCurrentPeriod,
        championship: game.championship,
        category: game.category,
        homeTeam: game.homeTeam,
        awayTeam: game.awayTeam,
      },
      session: latestSession,
      rosters: game.rosters.map((roster) => ({
        id: roster.id,
        teamId: roster.teamId,
        teamName: roster.team.name,
        coachName: roster.coachName,
        assistantCoachName: roster.assistantCoachName,
        isLocked: roster.isLocked,
        players: roster.players.map((player) => ({
          id: player.id,
          athleteId: player.athleteId,
          athleteName: player.athlete.name,
          jerseyNumber: player.jerseyNumber ?? player.athlete.jerseyNumber ?? null,
          isStarter: player.isStarter,
          isCaptain: player.isCaptain,
          isAvailable: player.isAvailable,
          isOnCourt: player.isOnCourt,
          status: player.status,
          position: player.athlete.position,
        })),
      })),
      officials: game.officials,
      referees: game.refereeAssignments.map((assignment) => ({
        id: assignment.id,
        role: assignment.role,
        status: assignment.status,
        referee: assignment.referee,
      })),
      events: game.events.map((event) => ({
        id: event.id,
        sequenceNumber: event.sequenceNumber,
        period: event.period,
        clockTime: event.clockTime,
        eventType: event.eventType,
        teamId: event.teamId,
        teamName: event.team?.name ?? null,
        athleteId: event.athleteId,
        athleteName: event.athlete?.name ?? null,
        secondaryAthleteId: event.secondaryAthleteId,
        secondaryAthleteName: event.secondaryAthlete?.name ?? null,
        pointsDelta: event.pointsDelta,
        payload: safeParseJson<Record<string, unknown>>(event.payloadJson, {}),
        createdAt: event.createdAt,
        isReverted: event.isReverted,
        correctionReason: event.correctionReason,
        description: buildEventDescription({
          eventType: event.eventType,
          pointsDelta: event.pointsDelta,
          athleteName: event.athlete?.name,
          teamName: event.team?.name,
        }),
      })),
      boxScore: {
        players: game.playerStatLines.map((line) => ({
          id: line.id,
          athleteId: line.athleteId,
          athleteName: line.athlete.name,
          jerseyNumber: line.athlete.jerseyNumber,
          teamId: line.teamId,
          teamName: line.team.name,
          minutesPlayed: line.minutesPlayed,
          points: line.points,
          fouls: line.fouls,
          assists: line.assists,
          reboundsOffensive: line.reboundsOffensive,
          reboundsDefensive: line.reboundsDefensive,
          reboundsTotal: line.reboundsTotal,
          steals: line.steals,
          blocks: line.blocks,
          turnovers: line.turnovers,
          twoPtMade: line.twoPtMade,
          twoPtAttempted: line.twoPtAttempted,
          threePtMade: line.threePtMade,
          threePtAttempted: line.threePtAttempted,
          freeThrowsMade: line.freeThrowsMade,
          freeThrowsAttempted: line.freeThrowsAttempted,
          isStarter: line.isStarter,
          fouledOut: line.fouledOut,
          disqualified: line.disqualified,
        })),
        teams: game.teamStatLines.map((line) => ({
          id: line.id,
          teamId: line.teamId,
          teamName: line.team.name,
          points: line.points,
          fouls: line.fouls,
          timeoutsUsed: line.timeoutsUsed,
          reboundsTotal: line.reboundsTotal,
          assists: line.assists,
          steals: line.steals,
          turnovers: line.turnovers,
          blocks: line.blocks,
          twoPtMade: line.twoPtMade,
          twoPtAttempted: line.twoPtAttempted,
          threePtMade: line.threePtMade,
          threePtAttempted: line.threePtAttempted,
          freeThrowsMade: line.freeThrowsMade,
          freeThrowsAttempted: line.freeThrowsAttempted,
        })),
        periods: game.periodScores,
      },
      officialReport: game.officialReport
        ? {
            ...game.officialReport,
            boxScore: safeParseJson(game.officialReport.boxScoreJson, null),
            playByPlay: safeParseJson(game.officialReport.playByPlayJson, null),
          }
        : null,
    }
  }

  static async handlePregameAction(
    gameId: string,
    action: PregameAction,
    actorUserId?: string | null,
    payload?: Record<string, unknown>
  ) {
    const game = await prisma.game.findUnique({
      where: { id: gameId },
      select: { id: true, homeTeamId: true, awayTeamId: true },
    })

    if (!game) {
      throw new Error('Jogo não encontrado')
    }

    switch (action) {
      case 'sync-rosters':
        await Promise.all([
          syncRosterForTeam(gameId, game.homeTeamId),
          syncRosterForTeam(gameId, game.awayTeamId),
        ])
        await logAudit({
          gameId,
          actionType: 'ROSTER_SYNC',
          actorUserId,
          targetEntity: 'GameRoster',
          description: 'Rosters oficiais sincronizados com os atletas da equipe.',
        })
        break
      case 'lock-rosters':
      case 'unlock-rosters':
        await prisma.gameRoster.updateMany({
          where: { gameId },
          data: { isLocked: action === 'lock-rosters' },
        })
        await logAudit({
          gameId,
          actionType: action === 'lock-rosters' ? 'ROSTER_LOCK' : 'ROSTER_UNLOCK',
          actorUserId,
          targetEntity: 'GameRoster',
          description:
            action === 'lock-rosters'
              ? 'Rosters travados para operação ao vivo.'
              : 'Rosters liberados para ajustes.',
        })
        break
      case 'assign-officials': {
        const officials = Array.isArray(payload?.officials)
          ? (payload.officials as Array<Record<string, unknown>>)
          : []
        await prisma.gameOfficial.deleteMany({ where: { gameId } })
        if (officials.length > 0) {
          await prisma.gameOfficial.createMany({
            data: officials
              .filter((official) => official.name && official.officialType && official.role)
              .map((official) => ({
                id: randomUUID(),
                gameId,
                name: String(official.name),
                officialType: String(official.officialType),
                role: String(official.role),
                refereeId: official.refereeId ? String(official.refereeId) : null,
              })),
          })
        }
        await logAudit({
          gameId,
          actionType: 'OFFICIALS_UPDATED',
          actorUserId,
          targetEntity: 'GameOfficial',
          description: 'Oficiais do jogo atualizados.',
          meta: { count: officials.length },
        })
        break
      }
      case 'update-roster-player': {
        const rosterPlayerId = payload?.rosterPlayerId ? String(payload.rosterPlayerId) : ''
        if (!rosterPlayerId) {
          throw new Error('Jogador do roster não informado.')
        }

        const patch = (payload?.patch as Record<string, unknown> | undefined) ?? {}
        const data: Record<string, unknown> = {}

        if (patch.jerseyNumber !== undefined) data.jerseyNumber = patch.jerseyNumber === '' ? null : Number(patch.jerseyNumber)
        if (patch.isStarter !== undefined) data.isStarter = Boolean(patch.isStarter)
        if (patch.isCaptain !== undefined) data.isCaptain = Boolean(patch.isCaptain)
        if (patch.isAvailable !== undefined) data.isAvailable = Boolean(patch.isAvailable)
        if (patch.isOnCourt !== undefined) data.isOnCourt = Boolean(patch.isOnCourt)
        if (patch.status !== undefined) data.status = String(patch.status)

        await prisma.gameRosterPlayer.update({
          where: { id: rosterPlayerId },
          data,
        })

        await logAudit({
          gameId,
          actionType: 'ROSTER_PLAYER_UPDATED',
          actorUserId,
          targetEntity: 'GameRosterPlayer',
          targetEntityId: rosterPlayerId,
          description: 'Jogador do roster atualizado manualmente no pré-jogo.',
          meta: data,
        })
        break
      }
      case 'open-session': {
        const rosters = await prisma.gameRoster.findMany({
          where: { gameId },
          include: { players: true },
        })
        if (rosters.length < 2 || rosters.some((roster) => roster.players.length === 0)) {
          throw new Error(
            'Defina os rosters oficiais das duas equipes antes de abrir a sessão ao vivo.'
          )
        }

        const session = await getOrCreateLiveSession(gameId, actorUserId)
        await prisma.game.update({
          where: { id: gameId },
          data: {
            liveStatus: 'PRE_GAME_READY',
            isLivePublished: true,
          },
        })
        await logAudit({
          gameId,
          actionType: 'LIVE_SESSION_OPENED',
          actorUserId,
          targetEntity: 'GameLiveSession',
          targetEntityId: session.id,
          description: 'Sessão ao vivo aberta.',
        })
        break
      }
    }

    return this.getSnapshot(gameId)
  }

  static async handleLiveAction(
    gameId: string,
    action: LiveAction,
    actorUserId?: string | null,
    payload?: Record<string, unknown>
  ) {
    const game = await prisma.game.findUnique({
      where: { id: gameId },
      select: { id: true, homeTeamId: true, awayTeamId: true },
    })

    if (!game) {
      throw new Error('Jogo não encontrado')
    }

    const session = await getOrCreateLiveSession(gameId, actorUserId)

    if (action === 'publish') {
      await prisma.game.update({
        where: { id: gameId },
        data: { isLivePublished: true },
      })
      await prisma.gameLiveSession.update({
        where: { id: session.id },
        data: { publicVisibilityStatus: 'LIVE' },
      })
      await logAudit({
        gameId,
        actionType: 'LIVE_PUBLISHED',
        actorUserId,
        targetEntity: 'GameLiveSession',
        targetEntityId: session.id,
        description: 'Publicação pública do jogo ativada.',
      })
      return this.getSnapshot(gameId)
    }

    if (action === 'revert-event') {
      const eventId = payload?.eventId ? String(payload.eventId) : ''
      const reason = payload?.reason ? String(payload.reason) : 'Reversão manual'
      if (!eventId) {
        throw new Error('Evento não informado para reversão.')
      }

      await prisma.gameEvent.update({
        where: { id: eventId },
        data: {
          isReverted: true,
          revertedAt: new Date(),
          revertedByUserId: actorUserId ?? null,
          correctionReason: reason,
        },
      })

      await logAudit({
        gameId,
        actionType: 'EVENT_REVERTED',
        actorUserId,
        targetEntity: 'GameEvent',
        targetEntityId: eventId,
        description: 'Evento revertido pelo operador.',
        meta: { reason },
      })

      await recomputeLiveState(gameId)
      return this.getSnapshot(gameId)
    }

    const input = payload as EventInput | undefined
    if (!input?.eventType || !input.clockTime) {
      throw new Error('Evento inválido para a mesa digital.')
    }

    if (input.teamId && input.athleteId) {
      const rosterPlayer = await findRosterPlayer(gameId, input.teamId, input.athleteId)
      if (!rosterPlayer) {
        throw new Error('Atleta não pertence ao roster oficial da equipe nesta partida.')
      }

      const tracked = await getTrackedOnCourtCount(gameId, input.teamId)
      const requireOnCourt = ![
        'TIMEOUT_CONFIRMED',
        'GAME_START',
        'PERIOD_START',
        'PERIOD_END',
        'HALFTIME_START',
        'HALFTIME_END',
        'GAME_END',
        'SUBSTITUTION_IN',
      ].includes(input.eventType)

      if (!rosterPlayer.isAvailable && input.eventType !== 'SUBSTITUTION_OUT') {
        throw new Error('Atleta indisponível não pode receber evento de jogo.')
      }

      if (input.eventType === 'SUBSTITUTION_OUT' && tracked.count > 0 && !rosterPlayer.isOnCourt) {
        throw new Error('O atleta precisa estar em quadra para sair.')
      }

      if (requireOnCourt && tracked.count > 0 && !rosterPlayer.isOnCourt) {
        throw new Error('O atleta precisa estar em quadra para receber este evento.')
      }

      if (input.eventType === 'SUBSTITUTION_IN' && rosterPlayer.isOnCourt) {
        throw new Error('O atleta já está em quadra.')
      }
    }

    if (input.eventType === 'GAME_START') {
      for (const teamId of [game.homeTeamId, game.awayTeamId]) {
        const tracked = await getTrackedOnCourtCount(gameId, teamId)
        if (tracked.count === 0 && tracked.starters.length > 0) {
          await prisma.gameRosterPlayer.updateMany({
            where: { id: { in: tracked.starters.map((player) => player.id) } },
            data: { isOnCourt: true },
          })
        }
      }
    }

    const sequenceNumber = await getNextSequenceNumber(gameId)
    await prisma.gameEvent.create({
      data: {
        gameId,
        liveSessionId: session.id,
        sequenceNumber,
        period: Number(input.period) || 1,
        clockTime: input.clockTime,
        eventType: input.eventType,
        teamId: input.teamId ?? null,
        athleteId: input.athleteId ?? null,
        secondaryAthleteId: input.secondaryAthleteId ?? null,
        pointsDelta: input.pointsDelta ?? null,
        payloadJson: serializeJson(input.payload ?? null),
        createdByUserId: actorUserId ?? null,
      },
    })

    await prisma.gameLiveSession.update({
      where: { id: session.id },
      data: {
        status: ['GAME_END'].includes(input.eventType)
          ? 'FINAL_PENDING_CONFIRMATION'
          : ['HALFTIME_START'].includes(input.eventType)
            ? 'HALFTIME'
            : ['PERIOD_END', 'OVERTIME_END'].includes(input.eventType)
              ? 'PERIOD_BREAK'
              : 'LIVE',
        currentPeriod: Number(input.period) || 1,
        clockStatus: ['PERIOD_END', 'HALFTIME_START', 'GAME_END'].includes(input.eventType)
          ? 'STOPPED'
          : 'RUNNING',
        startedAt: input.eventType === 'GAME_START' ? new Date() : session.startedAt ?? null,
      },
    })

    if (input.teamId && input.athleteId && ['SUBSTITUTION_IN', 'SUBSTITUTION_OUT'].includes(input.eventType)) {
      const rosterPlayer = await findRosterPlayer(gameId, input.teamId, input.athleteId)
      if (rosterPlayer) {
        await prisma.gameRosterPlayer.update({
          where: { id: rosterPlayer.id },
          data: { isOnCourt: input.eventType === 'SUBSTITUTION_IN' },
        })
      }
    }

    await logAudit({
      gameId,
      actionType: 'GAME_EVENT_CREATED',
      actorUserId,
      targetEntity: 'GameEvent',
      description: `Evento ${input.eventType} registrado na mesa digital.`,
      meta: {
        teamId: input.teamId ?? null,
        athleteId: input.athleteId ?? null,
        period: input.period,
        clockTime: input.clockTime,
      },
    })

    await recomputeLiveState(gameId)
    return this.getSnapshot(gameId)
  }

  static async reviewGame(gameId: string) {
    const snapshot = await this.getSnapshot(gameId)
    const issues: string[] = []
    const warnings: string[] = []

    if (snapshot.rosters.length < 2 || snapshot.rosters.some((roster) => roster.players.length === 0)) {
      issues.push('Os rosters oficiais ainda não estão completos nas duas equipes.')
    }

    if (snapshot.rosters.some((roster) => !roster.isLocked)) {
      warnings.push('Há roster destravado. O ideal é travar antes do fechamento oficial.')
    }

    const homeTeamStats = snapshot.boxScore.teams.find((team) => team.teamId === snapshot.game.homeTeam.id)
    const awayTeamStats = snapshot.boxScore.teams.find((team) => team.teamId === snapshot.game.awayTeam.id)

    if ((homeTeamStats?.points ?? 0) !== snapshot.game.homeScore) {
      issues.push('O placar da equipe mandante não confere com o box score consolidado.')
    }

    if ((awayTeamStats?.points ?? 0) !== snapshot.game.awayScore) {
      issues.push('O placar da equipe visitante não confere com o box score consolidado.')
    }

    const totalPeriodsHome = snapshot.boxScore.periods.reduce((sum, period) => sum + period.homePoints, 0)
    const totalPeriodsAway = snapshot.boxScore.periods.reduce((sum, period) => sum + period.awayPoints, 0)

    if (totalPeriodsHome !== snapshot.game.homeScore || totalPeriodsAway !== snapshot.game.awayScore) {
      issues.push('A soma das parciais por período não bate com o placar final.')
    }

    if (!['FINAL_PENDING_CONFIRMATION', 'FINAL_OFFICIAL'].includes(snapshot.game.liveStatus)) {
      warnings.push('O jogo ainda não está em fase de fechamento oficial.')
    }

    return {
      ...snapshot,
      review: {
        readyToFinalize: issues.length === 0,
        issues,
        warnings,
      },
    }
  }

  static async handleReviewAction(gameId: string, action: ReviewAction, actorUserId?: string | null) {
    if (action !== 'finalize-official') {
      throw new Error('Ação de revisão inválida.')
    }

    const reviewed = await this.reviewGame(gameId)
    if (!reviewed.review.readyToFinalize) {
      throw new Error('Ainda existem inconsistências que impedem o fechamento oficial.')
    }

    const boxScorePayload = {
      players: reviewed.boxScore.players,
      teams: reviewed.boxScore.teams,
      periods: reviewed.boxScore.periods,
    }

    const playByPlayPayload = reviewed.events.map((event) => ({
      sequenceNumber: event.sequenceNumber,
      period: event.period,
      clockTime: event.clockTime,
      description: event.description,
      pointsDelta: event.pointsDelta,
      eventType: event.eventType,
      teamId: event.teamId,
      athleteId: event.athleteId,
    }))

    const report = await prisma.gameOfficialReport.upsert({
      where: { gameId },
      create: {
        gameId,
        finalHomeScore: reviewed.game.homeScore,
        finalAwayScore: reviewed.game.awayScore,
        overtimeCount: Math.max(0, reviewed.boxScore.periods.filter((period) => period.period > 4).length),
        boxScoreJson: JSON.stringify(boxScorePayload),
        playByPlayJson: JSON.stringify(playByPlayPayload),
        signedOffByUserId: actorUserId ?? null,
        finalizedAt: new Date(),
      },
      update: {
        finalHomeScore: reviewed.game.homeScore,
        finalAwayScore: reviewed.game.awayScore,
        overtimeCount: Math.max(0, reviewed.boxScore.periods.filter((period) => period.period > 4).length),
        boxScoreJson: JSON.stringify(boxScorePayload),
        playByPlayJson: JSON.stringify(playByPlayPayload),
        signedOffByUserId: actorUserId ?? null,
        finalizedAt: new Date(),
      },
    })

    const session = await prisma.gameLiveSession.findFirst({
      where: { gameId },
      orderBy: { createdAt: 'desc' },
    })

    await prisma.game.update({
      where: { id: gameId },
      data: {
        status: 'FINISHED',
        liveStatus: 'FINAL_OFFICIAL',
        isLivePublished: true,
        officialReportId: report.id,
      },
    })

    if (session) {
      await prisma.gameLiveSession.update({
        where: { id: session.id },
        data: {
          status: 'FINAL_OFFICIAL',
          publicVisibilityStatus: 'FINAL',
          endedAt: new Date(),
          closedByUserId: actorUserId ?? null,
        },
      })
    }

    await logAudit({
      gameId,
      actionType: 'GAME_FINAL_OFFICIAL',
      actorUserId,
      targetEntity: 'GameOfficialReport',
      targetEntityId: report.id,
      description: 'Jogo fechado oficialmente e relatório consolidado.',
    })

    const game = await prisma.game.findUnique({
      where: { id: gameId },
      select: { categoryId: true },
    })

    if (game?.categoryId) {
      await StandingService.recalculateForCategory(game.categoryId)
    }

    return this.reviewGame(gameId)
  }

  static async getAuditTrail(gameId: string) {
    const [snapshot, auditLogs] = await Promise.all([
      this.getSnapshot(gameId),
      prisma.gameAuditLog.findMany({
        where: { gameId },
        orderBy: { createdAt: 'desc' },
      }),
    ])

    return {
      ...snapshot,
      auditLogs: auditLogs.map((log) => ({
        ...log,
        meta: safeParseJson(log.metaJson, null),
      })),
    }
  }
}
