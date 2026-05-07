import { randomUUID } from 'crypto'

import {
  FIXTURE_ADMIN_EMAIL,
  FIXTURE_ADMIN_NAME,
  FIXTURE_ADMIN_PASSWORD,
  FIXTURE_AWAY_PLAYERS,
  FIXTURE_AWAY_TEAM_NAME,
  FIXTURE_CATEGORY_NAME,
  FIXTURE_CHAMPIONSHIP_DESCRIPTION,
  FIXTURE_CHAMPIONSHIP_NAME,
  FIXTURE_HOME_PLAYERS,
  FIXTURE_HOME_TEAM_NAME,
  buildFixtureLiveUrl,
  cleanupFixtureData,
  createPrismaClient,
  hashFixturePassword,
  logFixtureFooter,
  logFixtureHeader,
  requireFixtureGuard,
} from './live-fiba-fixture-utils'

async function main() {
  requireFixtureGuard()

  const { prisma, target } = createPrismaClient()

  try {
    logFixtureHeader('seed', target)
    console.log('acao: removendo fixture anterior com cleanup seguro antes de recriar.')

    const cleanupResult = await cleanupFixtureData(prisma)
    console.log(
      `cleanup previo: removidos=${cleanupResult.removedIds.length} retidos=${cleanupResult.retainedIds.length}`
    )
    if (cleanupResult.retainedIds.length > 0) {
      console.log(`cleanup previo: ids retidos=${cleanupResult.retainedIds.join(', ')}`)
    }

    const passwordHash = await hashFixturePassword()

    const admin = await prisma.user.upsert({
      where: { email: FIXTURE_ADMIN_EMAIL },
      update: {
        name: FIXTURE_ADMIN_NAME,
        password: passwordHash,
        defaultRole: 'ADMIN',
        isAdmin: true,
      },
      create: {
        name: FIXTURE_ADMIN_NAME,
        email: FIXTURE_ADMIN_EMAIL,
        password: passwordHash,
        defaultRole: 'ADMIN',
        isAdmin: true,
      },
    })

    const homeTeam = await prisma.team.create({
      data: {
        name: FIXTURE_HOME_TEAM_NAME,
        city: 'Porto Alegre',
        state: 'RS',
        sex: 'masculino',
        responsible: 'Fixture Mesa FIBA',
      },
    })

    const awayTeam = await prisma.team.create({
      data: {
        name: FIXTURE_AWAY_TEAM_NAME,
        city: 'Canoas',
        state: 'RS',
        sex: 'masculino',
        responsible: 'Fixture Mesa FIBA',
      },
    })

    const createAthletes = async (
      teamId: string,
      players: readonly (readonly [string, number, string])[]
    ) => {
      const athletes = []
      for (const [name, jerseyNumber, position] of players) {
        athletes.push(
          await prisma.athlete.create({
            data: {
              name,
              sex: 'masculino',
              position,
              jerseyNumber,
              status: 'ACTIVE',
              teamId,
            },
          })
        )
      }
      return athletes
    }

    const homeAthletes = await createAthletes(homeTeam.id, FIXTURE_HOME_PLAYERS)
    const awayAthletes = await createAthletes(awayTeam.id, FIXTURE_AWAY_PLAYERS)

    const championship = await prisma.championship.create({
      data: {
        name: FIXTURE_CHAMPIONSHIP_NAME,
        description: FIXTURE_CHAMPIONSHIP_DESCRIPTION,
        sex: 'masculino',
        format: 'todos_contra_todos',
        phases: 1,
        startDate: new Date('2026-05-01T00:00:00.000Z'),
        endDate: new Date('2026-05-31T00:00:00.000Z'),
        regDeadline: new Date('2026-04-20T00:00:00.000Z'),
        status: 'IN_PROGRESS',
      },
    })

    const category = await prisma.championshipCategory.create({
      data: {
        championshipId: championship.id,
        name: FIXTURE_CATEGORY_NAME,
        isViable: true,
      },
    })

    const game = await prisma.game.create({
      data: {
        championshipId: championship.id,
        categoryId: category.id,
        homeTeamId: homeTeam.id,
        awayTeamId: awayTeam.id,
        phase: 1,
        round: 1,
        dateTime: new Date('2026-05-10T17:00:00.000Z'),
        location: 'Ginasio Fixture FGB',
        venue: 'Ginasio Fixture FGB',
        city: 'Porto Alegre',
        status: 'IN_PROGRESS',
        liveStatus: 'LIVE',
        currentPeriod: 2,
        clockDisplay: '06:42',
        homeTimeoutsUsed: 1,
        awayTimeoutsUsed: 2,
        homeTeamFoulsCurrentPeriod: 3,
        awayTeamFoulsCurrentPeriod: 2,
        isLivePublished: true,
        homeScore: 31,
        awayScore: 27,
      },
    })

    const session = await prisma.gameLiveSession.create({
      data: {
        gameId: game.id,
        status: 'LIVE',
        startedAt: new Date('2026-05-10T17:00:00.000Z'),
        openedByUserId: admin.id,
        publicVisibilityStatus: 'LIVE',
        currentPeriod: 2,
        clockStatus: 'RUNNING',
      },
    })

    await prisma.gameOfficial.createMany({
      data: [
        {
          gameId: game.id,
          officialType: 'REFEREE',
          name: 'Carlos Henrique',
          role: 'Principal',
        },
        {
          gameId: game.id,
          officialType: 'TABLE',
          name: 'Mesa Fixture FGB',
          role: 'Operador',
        },
      ],
    })

    const createRoster = async (
      teamId: string,
      coachName: string,
      athletes: Array<{ id: string; jerseyNumber: number | null }>
    ) => {
      const roster = await prisma.gameRoster.create({
        data: {
          gameId: game.id,
          teamId,
          coachName,
          assistantCoachName: 'Auxiliar Fixture',
          isLocked: true,
        },
      })

      const rosterTimestamp = new Date().toISOString()
      for (const [index, athlete] of athletes.entries()) {
        await prisma.$executeRawUnsafe(
          'INSERT INTO "GameRosterPlayer" ("id", "gameRosterId", "athleteId", "jerseyNumber", "isStarter", "isCaptain", "isAvailable", "isOnCourt", "status", "createdAt", "updatedAt") VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          randomUUID(),
          roster.id,
          athlete.id,
          athlete.jerseyNumber,
          index < 5 ? 1 : 0,
          index === 0 ? 1 : 0,
          1,
          index < 5 ? 1 : 0,
          'ACTIVE',
          rosterTimestamp,
          rosterTimestamp
        )
      }

      return roster
    }

    await createRoster(homeTeam.id, 'Joao Fixture', homeAthletes)
    await createRoster(awayTeam.id, 'Marcos Fixture', awayAthletes)

    const homeStatSeed = [
      [homeAthletes[0], 8, 2, 3, 1],
      [homeAthletes[1], 7, 1, 2, 2],
      [homeAthletes[2], 6, 4, 1, 2],
      [homeAthletes[3], 4, 5, 1, 1],
      [homeAthletes[4], 6, 6, 0, 1],
    ] as const

    const awayStatSeed = [
      [awayAthletes[0], 9, 2, 2, 1],
      [awayAthletes[1], 5, 2, 1, 2],
      [awayAthletes[2], 4, 3, 1, 1],
      [awayAthletes[3], 5, 4, 1, 1],
      [awayAthletes[4], 4, 5, 0, 2],
    ] as const

    const createPlayerStatLine = async (input: {
      athleteId: string
      teamId: string
      minutesPlayed: number
      points: number
      assists: number
      reboundsOffensive: number
      reboundsDefensive: number
      reboundsTotal: number
      fouls: number
      steals: number
      blocks: number
      turnovers: number
      twoPtMade: number
      twoPtAttempted: number
      threePtMade: number
      threePtAttempted: number
      freeThrowsMade: number
      freeThrowsAttempted: number
      isStarter: boolean
      fouledOut: boolean
      disqualified: boolean
    }) => {
      const playerStatTimestamp = new Date().toISOString()
      await prisma.$executeRawUnsafe(
        'INSERT INTO "GamePlayerStatLine" ("id", "gameId", "athleteId", "teamId", "minutesPlayed", "points", "fouls", "assists", "reboundsOffensive", "reboundsDefensive", "reboundsTotal", "steals", "blocks", "turnovers", "twoPtMade", "twoPtAttempted", "threePtMade", "threePtAttempted", "freeThrowsMade", "freeThrowsAttempted", "plusMinus", "isStarter", "fouledOut", "disqualified", "updatedAt") VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        randomUUID(),
        game.id,
        input.athleteId,
        input.teamId,
        input.minutesPlayed,
        input.points,
        input.fouls,
        input.assists,
        input.reboundsOffensive,
        input.reboundsDefensive,
        input.reboundsTotal,
        input.steals,
        input.blocks,
        input.turnovers,
        input.twoPtMade,
        input.twoPtAttempted,
        input.threePtMade,
        input.threePtAttempted,
        input.freeThrowsMade,
        input.freeThrowsAttempted,
        null,
        input.isStarter ? 1 : 0,
        input.fouledOut ? 1 : 0,
        input.disqualified ? 1 : 0,
        playerStatTimestamp
      )
    }

    for (const [index, athlete] of homeAthletes.entries()) {
      const seed = homeStatSeed[index]
      await createPlayerStatLine({
        athleteId: athlete.id,
        teamId: homeTeam.id,
        minutesPlayed: index < 5 ? 16 : 4,
        points: seed?.[1] ?? 0,
        assists: seed?.[2] ?? 0,
        reboundsOffensive: 1,
        reboundsDefensive: Math.max((seed?.[3] ?? 0) - 1, 0),
        reboundsTotal: seed?.[3] ?? 0,
        fouls: seed?.[4] ?? 0,
        steals: index === 0 ? 1 : 0,
        blocks: index === 4 ? 1 : 0,
        turnovers: index === 1 ? 1 : 0,
        twoPtMade: index < 5 ? 2 : 0,
        twoPtAttempted: index < 5 ? 4 : 0,
        threePtMade: index === 1 ? 1 : 0,
        threePtAttempted: index === 1 ? 2 : 0,
        freeThrowsMade: index === 0 ? 2 : 0,
        freeThrowsAttempted: index === 0 ? 2 : 0,
        isStarter: index < 5,
        fouledOut: false,
        disqualified: false,
      })
    }

    for (const [index, athlete] of awayAthletes.entries()) {
      const seed = awayStatSeed[index]
      await createPlayerStatLine({
        athleteId: athlete.id,
        teamId: awayTeam.id,
        minutesPlayed: index < 5 ? 16 : 3,
        points: seed?.[1] ?? 0,
        assists: seed?.[2] ?? 0,
        reboundsOffensive: 1,
        reboundsDefensive: Math.max((seed?.[3] ?? 0) - 1, 0),
        reboundsTotal: seed?.[3] ?? 0,
        fouls: seed?.[4] ?? 0,
        steals: index === 0 ? 1 : 0,
        blocks: index === 4 ? 1 : 0,
        turnovers: index === 1 ? 1 : 0,
        twoPtMade: index < 5 ? 2 : 0,
        twoPtAttempted: index < 5 ? 4 : 0,
        threePtMade: index === 0 ? 1 : 0,
        threePtAttempted: index === 0 ? 3 : 0,
        freeThrowsMade: index === 3 ? 1 : 0,
        freeThrowsAttempted: index === 3 ? 2 : 0,
        isStarter: index < 5,
        fouledOut: false,
        disqualified: false,
      })
    }

    await prisma.gameTeamStatLine.createMany({
      data: [
        {
          gameId: game.id,
          teamId: homeTeam.id,
          points: 31,
          fouls: 3,
          timeoutsUsed: 1,
          reboundsTotal: 16,
          assists: 7,
          steals: 3,
          turnovers: 4,
          blocks: 2,
          twoPtMade: 11,
          twoPtAttempted: 20,
          threePtMade: 2,
          threePtAttempted: 7,
          freeThrowsMade: 3,
          freeThrowsAttempted: 4,
        },
        {
          gameId: game.id,
          teamId: awayTeam.id,
          points: 27,
          fouls: 2,
          timeoutsUsed: 2,
          reboundsTotal: 14,
          assists: 6,
          steals: 2,
          turnovers: 5,
          blocks: 1,
          twoPtMade: 10,
          twoPtAttempted: 21,
          threePtMade: 1,
          threePtAttempted: 6,
          freeThrowsMade: 4,
          freeThrowsAttempted: 6,
        },
      ],
    })

    await prisma.gamePeriodScore.createMany({
      data: [
        { gameId: game.id, period: 1, homePoints: 18, awayPoints: 14 },
        { gameId: game.id, period: 2, homePoints: 13, awayPoints: 13 },
      ],
    })

    const createEvent = (
      sequenceNumber: number,
      period: number,
      clockTime: string,
      eventType: string,
      teamId: string,
      athleteId: string | null,
      pointsDelta?: number
    ) => ({
      gameId: game.id,
      liveSessionId: session.id,
      sequenceNumber,
      period,
      clockTime,
      eventType,
      teamId,
      athleteId,
      pointsDelta: pointsDelta ?? null,
      createdByUserId: admin.id,
      payloadJson: null,
        isReverted: false,
      })

    for (const event of [
      createEvent(1, 1, '09:48', 'GAME_START', homeTeam.id, null),
      createEvent(2, 1, '09:16', 'SHOT_MADE_2', homeTeam.id, homeAthletes[0].id, 2),
      createEvent(3, 1, '08:54', 'SHOT_MADE_3', awayTeam.id, awayAthletes[0].id, 3),
      createEvent(4, 1, '07:43', 'ASSIST', homeTeam.id, homeAthletes[1].id),
      createEvent(5, 1, '07:42', 'SHOT_MADE_2', homeTeam.id, homeAthletes[2].id, 2),
      createEvent(6, 2, '08:11', 'FOUL_PERSONAL', awayTeam.id, awayAthletes[3].id),
      createEvent(7, 2, '07:26', 'TIMEOUT_CONFIRMED', homeTeam.id, null),
      createEvent(8, 2, '06:42', 'SHOT_MADE_2', awayTeam.id, awayAthletes[4].id, 2),
    ]) {
      const eventTimestamp = new Date().toISOString()
      await prisma.$executeRawUnsafe(
        'INSERT INTO "GameEvent" ("id", "gameId", "liveSessionId", "sequenceNumber", "period", "clockTime", "eventType", "teamId", "athleteId", "secondaryAthleteId", "pointsDelta", "payloadJson", "createdByUserId", "createdAt", "isReverted", "revertedAt", "revertedByUserId", "correctionReason", "sequence", "clockMs", "homeScoreAfter", "awayScoreAfter") VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        randomUUID(),
        event.gameId,
        event.liveSessionId,
        event.sequenceNumber,
        event.period,
        event.clockTime,
        event.eventType,
        event.teamId,
        event.athleteId,
        null,
        event.pointsDelta,
        event.payloadJson,
        event.createdByUserId,
        eventTimestamp,
        event.isReverted ? 1 : 0,
        null,
        null,
        null,
        null,
        null,
        null,
        null
      )
    }

    const liveUrl = buildFixtureLiveUrl(championship.id, game.id)

    console.log('fixture seed criado com sucesso.')
    console.log(`fixture marker: ${FIXTURE_CHAMPIONSHIP_DESCRIPTION}`)
    console.log(`championshipId: ${championship.id}`)
    console.log(`gameId: ${game.id}`)
    console.log(`url: ${liveUrl}`)
    console.log(`login: ${FIXTURE_ADMIN_EMAIL}`)
    console.log(`senha: ${FIXTURE_ADMIN_PASSWORD}`)
    console.log('cleanup: npm run cleanup:live-table')
    logFixtureFooter('seed')
  } finally {
    await prisma.$disconnect()
  }
}

main().catch((error) => {
  console.error('Erro ao criar fixture live FIBA:', error)
  process.exit(1)
})
