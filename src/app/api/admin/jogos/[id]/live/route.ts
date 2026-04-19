import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import type { Prisma } from '@prisma/client'

import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { ensureDatabaseSchema } from '@/lib/db-patch'

type Tx = Prisma.TransactionClient
type JsonRecord = Record<string, unknown>

const PERIOD_DURATION_MS = 10 * 60 * 1000
const MAX_TIMEOUTS = 5

const ALLOWED_ACTIONS = new Set([
  'SCORE',
  'FOUL',
  'REBOUND',
  'ASSIST',
  'STEAL',
  'BLOCK',
  'SUBSTITUTION',
  'TIMEOUT',
  'START_PERIOD',
  'END_PERIOD',
  'VIOLATION',
  'CANCEL_LAST_EVENT',
])

async function requireAdmin() {
  const session = await getServerSession(authOptions)
  if (!session || !(session.user as any).isAdmin) {
    return null
  }
  return session
}

function toNumber(value: unknown, fallback = 0) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function toStringValue(value: unknown, fallback = '') {
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  return fallback
}

function toClockMs(value: unknown, fallbackDisplay?: string | null) {
  const numeric = toNumber(value, Number.NaN)
  if (Number.isFinite(numeric) && numeric >= 0) return numeric
  return parseClockDisplay(fallbackDisplay)
}

function parseClockDisplay(display?: string | null) {
  const safe = toStringValue(display, '').trim()
  if (!safe) return PERIOD_DURATION_MS
  const [rawMinutes, rawSeconds] = safe.split(':')
  const minutes = toNumber(rawMinutes, 0)
  const seconds = toNumber(rawSeconds, 0)
  return Math.max(0, Math.trunc(minutes * 60_000 + seconds * 1_000))
}

function formatClock(clockMs: number) {
  const safeMs = Math.max(0, Math.trunc(clockMs))
  const totalSeconds = Math.floor(safeMs / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

function parseJsonObject(raw: string | null | undefined) {
  if (!raw) return {} as JsonRecord
  try {
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? (parsed as JsonRecord) : {}
  } catch {
    return {}
  }
}

function safeStatPercent(made: number, attempted: number) {
  if (attempted <= 0) return 0
  return Number(((made / attempted) * 100).toFixed(1))
}

async function findTeamIdByAthlete(tx: Tx, gameId: string, athleteId?: string | null) {
  if (!athleteId) return null
  const rosterEntry = await tx.gameRosterPlayer.findFirst({
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

  return rosterEntry?.gameRoster.teamId ?? null
}

async function getOrCreateLiveSession(tx: Tx, gameId: string, userId?: string | null) {
  const existing = await tx.gameLiveSession.findFirst({
    where: {
      gameId,
      status: {
        in: ['PRE_GAME_READY', 'LIVE', 'HALFTIME', 'PERIOD_BREAK', 'FINAL_PENDING_CONFIRMATION'],
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  })

  if (existing) return existing

  return tx.gameLiveSession.create({
    data: {
      gameId,
      openedByUserId: userId ?? null,
      status: 'PRE_GAME_READY',
      publicVisibilityStatus: 'PRE_GAME',
      currentPeriod: 0,
      clockStatus: 'STOPPED',
    },
  })
}

async function getNextSequenceNumber(tx: Tx, gameId: string) {
  const last = await tx.gameEvent.findFirst({
    where: {
      gameId,
    },
    orderBy: {
      sequenceNumber: 'desc',
    },
    select: {
      sequenceNumber: true,
    },
  })

  return (last?.sequenceNumber ?? 0) + 1
}

async function ensurePlayerStatLine(tx: Tx, gameId: string, athleteId: string, teamId: string) {
  await tx.gamePlayerStatLine.upsert({
    where: {
      gameId_athleteId: {
        gameId,
        athleteId,
      },
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
      gameId_teamId: {
        gameId,
        teamId,
      },
    },
    create: {
      gameId,
      teamId,
    },
    update: {},
  })
}

async function decrementPlayerField(
  tx: Tx,
  gameId: string,
  athleteId: string,
  field:
    | 'points'
    | 'fouls'
    | 'assists'
    | 'steals'
    | 'blocks'
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
    where: {
      gameId_athleteId: {
        gameId,
        athleteId,
      },
    },
  })
  if (!line) return

  const current = Number((line as any)[field] ?? 0)
  await tx.gamePlayerStatLine.update({
    where: {
      gameId_athleteId: {
        gameId,
        athleteId,
      },
    },
    data: {
      [field]: Math.max(0, current - amount),
      fouledOut: field === 'fouls' ? Math.max(0, current - amount) >= 5 : line.fouledOut,
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
    | 'reboundsTotal'
    | 'assists'
    | 'steals'
    | 'blocks'
    | 'twoPtMade'
    | 'twoPtAttempted'
    | 'threePtMade'
    | 'threePtAttempted'
    | 'freeThrowsMade'
    | 'freeThrowsAttempted',
  amount = 1
) {
  const line = await tx.gameTeamStatLine.findUnique({
    where: {
      gameId_teamId: {
        gameId,
        teamId,
      },
    },
  })
  if (!line) return

  const current = Number((line as any)[field] ?? 0)
  await tx.gameTeamStatLine.update({
    where: {
      gameId_teamId: {
        gameId,
        teamId,
      },
    },
    data: {
      [field]: Math.max(0, current - amount),
    } as Prisma.GameTeamStatLineUpdateInput,
  })
}

async function cancelLastEvent(tx: Tx, gameId: string) {
  const [lastEvent, previousEvent] = await Promise.all([
    tx.gameEvent.findFirst({
      where: {
        gameId,
        isReverted: false,
      },
      orderBy: [{ sequenceNumber: 'desc' }, { createdAt: 'desc' }],
    }),
    tx.gameEvent.findFirst({
      where: {
        gameId,
        isReverted: false,
      },
      orderBy: [{ sequenceNumber: 'desc' }, { createdAt: 'desc' }],
      skip: 1,
    }),
  ])

  if (!lastEvent) return

  await tx.gameEvent.update({
    where: {
      id: lastEvent.id,
    },
    data: {
      isReverted: true,
      revertedAt: new Date(),
      correctionReason: 'Cancelado pela mesa',
    },
  })

  const payload = parseJsonObject(lastEvent.payloadJson)
  const teamId = lastEvent.teamId ?? toStringValue(payload.teamId, '')
  const athleteId = lastEvent.athleteId ?? toStringValue(payload.athleteId, '')
  const athleteOutId = toStringValue(payload.athleteOutId, '')
  const athleteInId = toStringValue(payload.athleteInId, '')
  const points = toNumber(payload.points, lastEvent.pointsDelta ?? 0)

  if (lastEvent.eventType === 'SCORE_2PTS' || lastEvent.eventType === 'SCORE_3PTS' || lastEvent.eventType === 'FREE_THROW') {
    if (athleteId) {
      await decrementPlayerField(tx, gameId, athleteId, 'points', points)
    }
    if (teamId) {
      await decrementTeamField(tx, gameId, teamId, 'points', points)
    }
    if (athleteId) {
      if (lastEvent.eventType === 'SCORE_2PTS') {
        await decrementPlayerField(tx, gameId, athleteId, 'twoPtMade', 1)
        await decrementPlayerField(tx, gameId, athleteId, 'twoPtAttempted', 1)
      } else if (lastEvent.eventType === 'SCORE_3PTS') {
        await decrementPlayerField(tx, gameId, athleteId, 'threePtMade', 1)
        await decrementPlayerField(tx, gameId, athleteId, 'threePtAttempted', 1)
      } else if (lastEvent.eventType === 'FREE_THROW') {
        await decrementPlayerField(tx, gameId, athleteId, 'freeThrowsMade', 1)
        await decrementPlayerField(tx, gameId, athleteId, 'freeThrowsAttempted', 1)
      }
    }
    if (teamId) {
      if (lastEvent.eventType === 'SCORE_2PTS') {
        await decrementTeamField(tx, gameId, teamId, 'twoPtMade', 1)
        await decrementTeamField(tx, gameId, teamId, 'twoPtAttempted', 1)
      } else if (lastEvent.eventType === 'SCORE_3PTS') {
        await decrementTeamField(tx, gameId, teamId, 'threePtMade', 1)
        await decrementTeamField(tx, gameId, teamId, 'threePtAttempted', 1)
      } else if (lastEvent.eventType === 'FREE_THROW') {
        await decrementTeamField(tx, gameId, teamId, 'freeThrowsMade', 1)
        await decrementTeamField(tx, gameId, teamId, 'freeThrowsAttempted', 1)
      }
    }
  } else if (lastEvent.eventType === 'PERSONAL_FOUL' || lastEvent.eventType === 'TECHNICAL_FOUL') {
    if (athleteId) {
      await decrementPlayerField(tx, gameId, athleteId, 'fouls', 1)
    }
    if (teamId) {
      await decrementTeamField(tx, gameId, teamId, 'fouls', 1)
    }
  } else if (lastEvent.eventType === 'REBOUND_OFF') {
    if (athleteId) {
      await decrementPlayerField(tx, gameId, athleteId, 'reboundsOffensive', 1)
      await decrementPlayerField(tx, gameId, athleteId, 'reboundsTotal', 1)
    }
    if (teamId) {
      await decrementTeamField(tx, gameId, teamId, 'reboundsTotal', 1)
    }
  } else if (lastEvent.eventType === 'REBOUND_DEF') {
    if (athleteId) {
      await decrementPlayerField(tx, gameId, athleteId, 'reboundsDefensive', 1)
      await decrementPlayerField(tx, gameId, athleteId, 'reboundsTotal', 1)
    }
    if (teamId) {
      await decrementTeamField(tx, gameId, teamId, 'reboundsTotal', 1)
    }
  } else if (lastEvent.eventType === 'ASSIST') {
    if (athleteId) {
      await decrementPlayerField(tx, gameId, athleteId, 'assists', 1)
    }
    if (teamId) {
      await decrementTeamField(tx, gameId, teamId, 'assists', 1)
    }
  } else if (lastEvent.eventType === 'STEAL') {
    if (athleteId) {
      await decrementPlayerField(tx, gameId, athleteId, 'steals', 1)
    }
    if (teamId) {
      await decrementTeamField(tx, gameId, teamId, 'steals', 1)
    }
  } else if (lastEvent.eventType === 'BLOCK') {
    if (athleteId) {
      await decrementPlayerField(tx, gameId, athleteId, 'blocks', 1)
    }
    if (teamId) {
      await decrementTeamField(tx, gameId, teamId, 'blocks', 1)
    }
  } else if (lastEvent.eventType === 'TIMEOUT' && teamId) {
    await decrementTeamField(tx, gameId, teamId, 'timeoutsUsed', 1)
  } else if (lastEvent.eventType === 'SUBSTITUTION' && teamId) {
    if (athleteOutId) {
      await tx.gameRosterPlayer.updateMany({
        where: {
          athleteId: athleteOutId,
          gameRoster: {
            gameId,
            teamId,
          },
        },
        data: {
          isOnCourt: true,
        },
      })
    }
    if (athleteInId) {
      await tx.gameRosterPlayer.updateMany({
        where: {
          athleteId: athleteInId,
          gameRoster: {
            gameId,
            teamId,
          },
        },
        data: {
          isOnCourt: false,
        },
      })
    }
  }

  const homeScoreAfter = toNumber((previousEvent as any)?.homeScoreAfter, 0)
  const awayScoreAfter = toNumber((previousEvent as any)?.awayScoreAfter, 0)
  const liveStatus =
    previousEvent?.eventType === 'END_PERIOD'
      ? toStringValue(parseJsonObject(previousEvent.payloadJson).liveStatus, 'HALFTIME')
      : previousEvent?.eventType === 'START_PERIOD'
        ? 'LIVE'
        : 'LIVE'
  const currentPeriod = previousEvent?.period ?? 0
  const clockDisplay = previousEvent?.clockTime ?? '10:00'

  const teamFoulsByTeam = await tx.gameEvent.groupBy({
    by: ['teamId'],
    where: {
      gameId,
      isReverted: false,
      period: currentPeriod || undefined,
      eventType: {
        in: ['PERSONAL_FOUL', 'TECHNICAL_FOUL'],
      },
    },
    _count: {
      id: true,
    },
  })

  const game = await tx.game.findUnique({
    where: {
      id: gameId,
    },
    select: {
      homeTeamId: true,
      awayTeamId: true,
    },
  })

  const homeFouls = teamFoulsByTeam.find((entry) => entry.teamId === game?.homeTeamId)?._count.id ?? 0
  const awayFouls = teamFoulsByTeam.find((entry) => entry.teamId === game?.awayTeamId)?._count.id ?? 0

  await tx.game.update({
    where: {
      id: gameId,
    },
    data: {
      homeScore: Math.max(0, homeScoreAfter),
      awayScore: Math.max(0, awayScoreAfter),
      currentPeriod,
      clockDisplay,
      liveStatus: currentPeriod > 0 ? liveStatus : 'SCHEDULED',
      homeTeamFoulsCurrentPeriod: homeFouls,
      awayTeamFoulsCurrentPeriod: awayFouls,
      homeTimeoutsUsed: Math.max(
        0,
        await tx.gameEvent.count({
          where: {
            gameId,
            isReverted: false,
            eventType: 'TIMEOUT',
            teamId: game?.homeTeamId ?? '',
          },
        })
      ),
      awayTimeoutsUsed: Math.max(
        0,
        await tx.gameEvent.count({
          where: {
            gameId,
            isReverted: false,
            eventType: 'TIMEOUT',
            teamId: game?.awayTeamId ?? '',
          },
        })
      ),
      isLivePublished: currentPeriod > 0,
    },
  })
}

async function getLiveSnapshot(gameId: string) {
  const game = await prisma.game.findUnique({
    where: {
      id: gameId,
    },
    include: {
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
      officials: {
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
        where: {
          isReverted: false,
        },
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
        orderBy: {
          sequenceNumber: 'desc',
        },
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
    const resolvedClockMs = Number((event as any).clockMs ?? parseClockDisplay(event.clockTime))
    const eventType = event.eventType
    const description =
      eventType === 'SCORE_2PTS'
        ? `${event.athlete?.name || 'Atleta'} converteu 2 pontos`
        : eventType === 'SCORE_3PTS'
          ? `${event.athlete?.name || 'Atleta'} converteu 3 pontos`
          : eventType === 'FREE_THROW'
            ? `${event.athlete?.name || 'Atleta'} converteu lance livre`
            : eventType === 'PERSONAL_FOUL'
              ? `${event.athlete?.name || 'Atleta'} cometeu falta pessoal`
              : eventType === 'TECHNICAL_FOUL'
                ? `${event.athlete?.name || 'Atleta'} cometeu falta tecnica`
                : eventType === 'REBOUND_DEF'
                  ? `${event.athlete?.name || 'Atleta'} pegou rebote defensivo`
                  : eventType === 'REBOUND_OFF'
                    ? `${event.athlete?.name || 'Atleta'} pegou rebote ofensivo`
                    : eventType === 'ASSIST'
                      ? `${event.athlete?.name || 'Atleta'} deu assistencia`
                      : eventType === 'STEAL'
                        ? `${event.athlete?.name || 'Atleta'} roubou a bola`
                        : eventType === 'BLOCK'
                          ? `${event.athlete?.name || 'Atleta'} aplicou um toco`
                          : eventType === 'SUBSTITUTION'
                            ? `Substituicao: ${event.athlete?.name || 'Sai'} -> ${event.secondaryAthlete?.name || 'Entra'}`
                            : eventType === 'TIMEOUT'
                              ? `Timeout ${event.team?.name || 'Equipe'}`
                              : eventType === 'START_PERIOD'
                                ? `Inicio do periodo ${event.period}`
                                : eventType === 'END_PERIOD'
                                  ? `Fim do periodo ${event.period}`
                                  : eventType.startsWith('VIOLATION_')
                                    ? `${event.team?.name || 'Equipe'} cometeu ${eventType}`
                                    : eventType

    return {
      ...event,
      type: eventType,
      sequence: Number((event as any).sequence ?? event.sequenceNumber),
      clockMs: resolvedClockMs,
      homeScoreAfter: Number((event as any).homeScoreAfter ?? game.homeScore ?? 0),
      awayScoreAfter: Number((event as any).awayScoreAfter ?? game.awayScore ?? 0),
      description,
      fgPct: 0,
      threePct: 0,
    }
  })

  const playerStatLines = game.playerStatLines.map((line) => {
    const fgMade = line.twoPtMade + line.threePtMade
    const fgAttempted = line.twoPtAttempted + line.threePtAttempted
    return {
      ...line,
      fgPct: safeStatPercent(fgMade, fgAttempted),
      threePct: safeStatPercent(line.threePtMade, line.threePtAttempted),
    }
  })

  return {
    ...game,
    homeScore: Number(game.homeScore ?? 0),
    awayScore: Number(game.awayScore ?? 0),
    gameOfficials: game.officials,
    gameRosters: game.rosters,
    gameEvents: events,
    livePlayerStatLines: playerStatLines,
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
  } catch (error: any) {
    console.error('[LIVE][Admin Jogos GET]', error)
    return NextResponse.json({ error: error.message || 'Erro ao carregar jogo ao vivo' }, { status: 500 })
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

    const actorUserId = (session.user as any).id ? String((session.user as any).id) : null
    const body = (await request.json().catch(() => ({}))) as {
      action?: string
      payload?: JsonRecord
    }

    const action = toStringValue(body.action, '').toUpperCase()
    const payload = body.payload && typeof body.payload === 'object' ? body.payload : {}

    if (!ALLOWED_ACTIONS.has(action)) {
      return NextResponse.json({ error: 'Acao de live invalida' }, { status: 400 })
    }

    const { id: gameId } = await params

    await prisma.$transaction(async (tx) => {
      const game = await tx.game.findUnique({
        where: {
          id: gameId,
        },
        select: {
          id: true,
          homeTeamId: true,
          awayTeamId: true,
          homeScore: true,
          awayScore: true,
          homeTeamFoulsCurrentPeriod: true,
          awayTeamFoulsCurrentPeriod: true,
          homeTimeoutsUsed: true,
          awayTimeoutsUsed: true,
          currentPeriod: true,
          clockDisplay: true,
          liveStatus: true,
        },
      })

      if (!game) {
        throw new Error('Jogo nao encontrado')
      }

      if (action === 'CANCEL_LAST_EVENT') {
        await cancelLastEvent(tx, gameId)
        return
      }

      let teamId = toStringValue(payload.teamId, '') || null
      let athleteId = toStringValue(payload.athleteId, '') || null

      if (!teamId && athleteId) {
        teamId = await findTeamIdByAthlete(tx, gameId, athleteId)
      }

      const period = Math.max(1, Math.trunc(toNumber(payload.period, game.currentPeriod || 1)))
      const clockMs = toClockMs(payload.clockMs, game.clockDisplay)
      const clockDisplay = formatClock(clockMs)
      const nowHomeScore = Number(game.homeScore ?? 0)
      const nowAwayScore = Number(game.awayScore ?? 0)
      let homeScoreAfter = nowHomeScore
      let awayScoreAfter = nowAwayScore

      let eventType = action
      let pointsDelta: number | null = null
      let secondaryAthleteId: string | null = null

      const gamePatch: Prisma.GameUpdateInput = {
        currentPeriod: period,
        clockDisplay,
      }

      if (action === 'SCORE') {
        if (!teamId) {
          throw new Error('teamId obrigatorio para SCORE')
        }
        if (!athleteId) {
          throw new Error('athleteId obrigatorio para SCORE')
        }

        const points = Math.max(1, Math.min(3, Math.trunc(toNumber(payload.points, 2))))
        const shotTypeRaw = toStringValue(payload.type, '').toUpperCase()
        const isThree = shotTypeRaw.includes('3') || points === 3
        const isFreeThrow = shotTypeRaw.includes('FREE') || shotTypeRaw.includes('LL') || points === 1

        eventType = isFreeThrow ? 'FREE_THROW' : isThree ? 'SCORE_3PTS' : 'SCORE_2PTS'
        pointsDelta = isFreeThrow ? 1 : isThree ? 3 : 2

        if (teamId === game.homeTeamId) {
          homeScoreAfter += pointsDelta
          gamePatch.homeScore = homeScoreAfter
        } else if (teamId === game.awayTeamId) {
          awayScoreAfter += pointsDelta
          gamePatch.awayScore = awayScoreAfter
        }

        await ensurePlayerStatLine(tx, gameId, athleteId, teamId)
        await ensureTeamStatLine(tx, gameId, teamId)

        const playerScoreUpdate: Prisma.GamePlayerStatLineUpdateInput = {
          points: { increment: pointsDelta },
        }
        const teamScoreUpdate: Prisma.GameTeamStatLineUpdateInput = {
          points: { increment: pointsDelta },
        }

        if (eventType === 'SCORE_2PTS') {
          playerScoreUpdate.twoPtMade = { increment: 1 }
          playerScoreUpdate.twoPtAttempted = { increment: 1 }
          teamScoreUpdate.twoPtMade = { increment: 1 }
          teamScoreUpdate.twoPtAttempted = { increment: 1 }
        } else if (eventType === 'SCORE_3PTS') {
          playerScoreUpdate.threePtMade = { increment: 1 }
          playerScoreUpdate.threePtAttempted = { increment: 1 }
          teamScoreUpdate.threePtMade = { increment: 1 }
          teamScoreUpdate.threePtAttempted = { increment: 1 }
        } else {
          playerScoreUpdate.freeThrowsMade = { increment: 1 }
          playerScoreUpdate.freeThrowsAttempted = { increment: 1 }
          teamScoreUpdate.freeThrowsMade = { increment: 1 }
          teamScoreUpdate.freeThrowsAttempted = { increment: 1 }
        }

        await tx.gamePlayerStatLine.update({
          where: {
            gameId_athleteId: {
              gameId,
              athleteId,
            },
          },
          data: playerScoreUpdate,
        })

        await tx.gameTeamStatLine.update({
          where: {
            gameId_teamId: {
              gameId,
              teamId,
            },
          },
          data: teamScoreUpdate,
        })
      } else if (action === 'FOUL') {
        if (!teamId) {
          throw new Error('teamId obrigatorio para FOUL')
        }
        if (!athleteId) {
          throw new Error('athleteId obrigatorio para FOUL')
        }

        const foulType = toStringValue(payload.foulType, 'PERSONAL').toUpperCase()
        eventType = foulType === 'TECHNICAL' ? 'TECHNICAL_FOUL' : 'PERSONAL_FOUL'

        if (teamId === game.homeTeamId) {
          gamePatch.homeTeamFoulsCurrentPeriod = {
            increment: 1,
          }
        } else if (teamId === game.awayTeamId) {
          gamePatch.awayTeamFoulsCurrentPeriod = {
            increment: 1,
          }
        }

        await ensurePlayerStatLine(tx, gameId, athleteId, teamId)
        await ensureTeamStatLine(tx, gameId, teamId)

        await tx.gamePlayerStatLine.update({
          where: {
            gameId_athleteId: {
              gameId,
              athleteId,
            },
          },
          data: {
            fouls: { increment: 1 },
            fouledOut: false,
          },
        })

        await tx.gameTeamStatLine.update({
          where: {
            gameId_teamId: {
              gameId,
              teamId,
            },
          },
          data: {
            fouls: { increment: 1 },
          },
        })
      } else if (action === 'REBOUND') {
        if (!teamId) {
          throw new Error('teamId obrigatorio para REBOUND')
        }
        if (!athleteId) {
          throw new Error('athleteId obrigatorio para REBOUND')
        }

        const reboundType = toStringValue(payload.type, 'DEFENSIVE').toUpperCase()
        const isOffensive = reboundType.startsWith('OFF')
        eventType = isOffensive ? 'REBOUND_OFF' : 'REBOUND_DEF'

        await ensurePlayerStatLine(tx, gameId, athleteId, teamId)
        await ensureTeamStatLine(tx, gameId, teamId)

        await tx.gamePlayerStatLine.update({
          where: {
            gameId_athleteId: {
              gameId,
              athleteId,
            },
          },
          data: {
            reboundsOffensive: isOffensive ? { increment: 1 } : undefined,
            reboundsDefensive: !isOffensive ? { increment: 1 } : undefined,
            reboundsTotal: { increment: 1 },
          },
        })

        await tx.gameTeamStatLine.update({
          where: {
            gameId_teamId: {
              gameId,
              teamId,
            },
          },
          data: {
            reboundsTotal: { increment: 1 },
          },
        })
      } else if (action === 'ASSIST' || action === 'STEAL' || action === 'BLOCK') {
        if (!teamId) {
          throw new Error(`teamId obrigatorio para ${action}`)
        }
        if (!athleteId) {
          throw new Error(`athleteId obrigatorio para ${action}`)
        }

        eventType = action
        await ensurePlayerStatLine(tx, gameId, athleteId, teamId)
        await ensureTeamStatLine(tx, gameId, teamId)

        const playerUpdate: Prisma.GamePlayerStatLineUpdateInput =
          action === 'ASSIST'
            ? { assists: { increment: 1 } }
            : action === 'STEAL'
              ? { steals: { increment: 1 } }
              : { blocks: { increment: 1 } }

        const teamUpdate: Prisma.GameTeamStatLineUpdateInput =
          action === 'ASSIST'
            ? { assists: { increment: 1 } }
            : action === 'STEAL'
              ? { steals: { increment: 1 } }
              : { blocks: { increment: 1 } }

        await tx.gamePlayerStatLine.update({
          where: {
            gameId_athleteId: {
              gameId,
              athleteId,
            },
          },
          data: playerUpdate,
        })

        await tx.gameTeamStatLine.update({
          where: {
            gameId_teamId: {
              gameId,
              teamId,
            },
          },
          data: teamUpdate,
        })
      } else if (action === 'SUBSTITUTION') {
        if (!teamId) {
          throw new Error('teamId obrigatorio para SUBSTITUTION')
        }

        const athleteOutId = toStringValue(payload.athleteOutId, '')
        const athleteInId = toStringValue(payload.athleteInId, '')
        athleteId = athleteOutId || athleteId
        secondaryAthleteId = athleteInId || null
        eventType = 'SUBSTITUTION'

        if (athleteOutId) {
          await tx.gameRosterPlayer.updateMany({
            where: {
              athleteId: athleteOutId,
              gameRoster: {
                gameId,
                teamId,
              },
            },
            data: {
              isOnCourt: false,
            },
          })
        }

        if (athleteInId) {
          await tx.gameRosterPlayer.updateMany({
            where: {
              athleteId: athleteInId,
              gameRoster: {
                gameId,
                teamId,
              },
            },
            data: {
              isOnCourt: true,
            },
          })
        }
      } else if (action === 'TIMEOUT') {
        if (!teamId) {
          throw new Error('teamId obrigatorio para TIMEOUT')
        }

        eventType = 'TIMEOUT'

        if (teamId === game.homeTeamId) {
          gamePatch.homeTimeoutsUsed = {
            increment: 1,
          }
        } else if (teamId === game.awayTeamId) {
          gamePatch.awayTimeoutsUsed = {
            increment: 1,
          }
        }

        await ensureTeamStatLine(tx, gameId, teamId)
        await tx.gameTeamStatLine.update({
          where: {
            gameId_teamId: {
              gameId,
              teamId,
            },
          },
          data: {
            timeoutsUsed: { increment: 1 },
          },
        })
      } else if (action === 'START_PERIOD') {
        eventType = 'START_PERIOD'
        gamePatch.liveStatus = 'LIVE'
        gamePatch.currentPeriod = period
        gamePatch.isLivePublished = true
        gamePatch.homeTeamFoulsCurrentPeriod = 0
        gamePatch.awayTeamFoulsCurrentPeriod = 0
      } else if (action === 'END_PERIOD') {
        eventType = 'END_PERIOD'
        const forcedStatus = toStringValue(payload.liveStatus, '').toUpperCase()
        const computedStatus = forcedStatus === 'FINISHED' || period >= 4 ? 'FINISHED' : 'HALFTIME'
        gamePatch.liveStatus = computedStatus
        gamePatch.clockDisplay = clockDisplay
      } else if (action === 'VIOLATION') {
        const violationType = toStringValue(payload.type, '24S').toUpperCase()
        eventType =
          violationType === '8S' ? 'VIOLATION_8S' : violationType === '3S' ? 'VIOLATION_3S' : 'VIOLATION_24S'
      }

      await tx.game.update({
        where: {
          id: gameId,
        },
        data: gamePatch,
      })

      const currentGame = await tx.game.findUnique({
        where: {
          id: gameId,
        },
        select: {
          homeScore: true,
          awayScore: true,
          homeTimeoutsUsed: true,
          awayTimeoutsUsed: true,
          homeTeamId: true,
          awayTeamId: true,
        },
      })

      homeScoreAfter = Number(currentGame?.homeScore ?? homeScoreAfter)
      awayScoreAfter = Number(currentGame?.awayScore ?? awayScoreAfter)

      const liveSession = await getOrCreateLiveSession(tx, gameId, actorUserId)
      const sequenceNumber = await getNextSequenceNumber(tx, gameId)

      if (
        teamId &&
        ((teamId === currentGame?.homeTeamId && Number(currentGame?.homeTimeoutsUsed ?? 0) > MAX_TIMEOUTS) ||
          (teamId === currentGame?.awayTeamId && Number(currentGame?.awayTimeoutsUsed ?? 0) > MAX_TIMEOUTS))
      ) {
        throw new Error('Limite de timeout atingido para a equipe')
      }

      const eventPayload: JsonRecord = {
        ...payload,
        action,
        period,
        clockMs,
        clockDisplay,
      }

      const eventData: any = {
        gameId,
        liveSessionId: liveSession.id,
        sequenceNumber,
        period,
        clockTime: clockDisplay,
        eventType,
        teamId: teamId ?? null,
        athleteId: athleteId ?? null,
        secondaryAthleteId: secondaryAthleteId ?? null,
        pointsDelta,
        payloadJson: JSON.stringify(eventPayload),
        createdByUserId: actorUserId ?? null,
      }

      eventData.sequence = sequenceNumber
      eventData.clockMs = clockMs
      eventData.homeScoreAfter = homeScoreAfter
      eventData.awayScoreAfter = awayScoreAfter

      await tx.gameEvent.create({
        data: eventData,
      })
    })

    const snapshot = await getLiveSnapshot(gameId)
    if (!snapshot) {
      return NextResponse.json({ error: 'Jogo nao encontrado' }, { status: 404 })
    }

    return NextResponse.json(snapshot)
  } catch (error: any) {
    console.error('[LIVE][Admin Jogos POST]', error)
    return NextResponse.json({ error: error.message || 'Erro ao registrar acao live' }, { status: 500 })
  }
}
