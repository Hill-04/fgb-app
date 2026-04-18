import { PrismaClient } from '@prisma/client'
import { PrismaLibSQL } from '@prisma/adapter-libsql'
import { createClient } from '@libsql/client'
import * as dotenv from 'dotenv'
import fs from 'fs'

dotenv.config()

const CHAMPIONSHIP_NAME = 'Demo Mesa FIBA 2026'
const HOME_TEAM_NAME = 'Mesa Demo Azul'
const AWAY_TEAM_NAME = 'Mesa Demo Vermelho'

const HOME_PLAYERS = [
  ['Lucas Ferreira', 4, 'PG'],
  ['Matheus Costa', 7, 'SG'],
  ['Pedro Alves', 10, 'SF'],
  ['Rafael Souza', 14, 'PF'],
  ['Bruno Oliveira', 21, 'C'],
  ['Thiago Lima', 8, 'SG'],
  ['Guilherme Neto', 11, 'SF'],
  ['Diego Martins', 23, 'C'],
  ['Caio Dornelles', 31, 'PF'],
  ['Murilo Prates', 18, 'PG'],
] as const

const AWAY_PLAYERS = [
  ['Andre Santos', 5, 'PG'],
  ['Felipe Mendes', 9, 'SG'],
  ['Carlos Rocha', 12, 'SF'],
  ['Victor Pereira', 15, 'PF'],
  ['Eduardo Gomes', 22, 'C'],
  ['Leonardo Cruz', 6, 'PG'],
  ['Rodrigo Freitas', 13, 'SF'],
  ['Henrique Dias', 20, 'C'],
  ['Vinicius Lisboa', 27, 'PF'],
  ['Igor Ramires', 33, 'SG'],
] as const

async function createPrismaClient() {
  let url = process.env.DATABASE_URL

  if (fs.existsSync('.env.local')) {
    const envContent = fs.readFileSync('.env.local', 'utf-8')
    const match = envContent.match(/DATABASE_URL=\"(.+)\"/)
    if (match) {
      url = match[1]
    }
  }

  if (!url) {
    throw new Error('DATABASE_URL nao definida')
  }

  const isRemote = url.startsWith('libsql://')
  const authToken = isRemote ? process.env.DATABASE_AUTH_TOKEN : undefined
  const libsql = createClient({ url, authToken })
  const adapter = new PrismaLibSQL(libsql)
  return new PrismaClient({ adapter } as any)
}

async function main() {
  const prisma = await createPrismaClient()

  try {
    console.log('Preparando seed da mesa demo...')

    await prisma.championship.deleteMany({
      where: { name: CHAMPIONSHIP_NAME },
    })

    const admin = await prisma.user.upsert({
      where: { email: 'mesa-demo-admin@fgb.com.br' },
      update: {
        name: 'Mesa Demo Admin',
        defaultRole: 'ADMIN',
        isAdmin: true,
      },
      create: {
        name: 'Mesa Demo Admin',
        email: 'mesa-demo-admin@fgb.com.br',
        password: 'senha123',
        defaultRole: 'ADMIN',
        isAdmin: true,
      },
    })

    const homeTeam = await prisma.team.upsert({
      where: { name: HOME_TEAM_NAME },
      update: {
        city: 'Porto Alegre',
        state: 'RS',
        sex: 'masculino',
        responsible: 'Mesa Demo',
      },
      create: {
        name: HOME_TEAM_NAME,
        city: 'Porto Alegre',
        state: 'RS',
        sex: 'masculino',
        responsible: 'Mesa Demo',
      },
    })

    const awayTeam = await prisma.team.upsert({
      where: { name: AWAY_TEAM_NAME },
      update: {
        city: 'Canoas',
        state: 'RS',
        sex: 'masculino',
        responsible: 'Mesa Demo',
      },
      create: {
        name: AWAY_TEAM_NAME,
        city: 'Canoas',
        state: 'RS',
        sex: 'masculino',
        responsible: 'Mesa Demo',
      },
    })

    await prisma.athlete.deleteMany({
      where: {
        teamId: { in: [homeTeam.id, awayTeam.id] },
      },
    })

    const createAthletes = async (
      teamId: string,
      sex: string,
      players: readonly (readonly [string, number, string])[]
    ) => {
      const athletes = []
      for (const [name, jerseyNumber, position] of players) {
        athletes.push(
          await prisma.athlete.create({
            data: {
              name,
              sex,
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

    const homeAthletes = await createAthletes(homeTeam.id, 'masculino', HOME_PLAYERS)
    const awayAthletes = await createAthletes(awayTeam.id, 'masculino', AWAY_PLAYERS)

    const championship = await prisma.championship.create({
      data: {
        name: CHAMPIONSHIP_NAME,
        description: 'Cenario de teste para a nova mesa ao vivo fiel ao demo FIBA.',
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
        name: 'Sub 18',
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
        location: 'Ginasio Demo FGB',
        venue: 'Ginasio Demo FGB',
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
          name: 'Mesa Demo FGB',
          role: 'Operador',
        },
      ],
    })

    const createRoster = async (
      teamId: string,
      coachName: string,
      athletes: { id: string; jerseyNumber: number | null; name: string }[]
    ) => {
      const roster = await prisma.gameRoster.create({
        data: {
          gameId: game.id,
          teamId,
          coachName,
          assistantCoachName: 'Auxiliar Demo',
          isLocked: true,
        },
      })

      await prisma.gameRosterPlayer.createMany({
        data: athletes.map((athlete, index) => ({
          gameRosterId: roster.id,
          athleteId: athlete.id,
          jerseyNumber: athlete.jerseyNumber,
          isStarter: index < 5,
          isCaptain: index === 0,
          isAvailable: true,
          isOnCourt: index < 5,
          status: 'ACTIVE',
        })),
      })

      return roster
    }

    await createRoster(homeTeam.id, 'Joao Demo', homeAthletes)
    await createRoster(awayTeam.id, 'Marcos Demo', awayAthletes)

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

    await prisma.gamePlayerStatLine.createMany({
      data: [
        ...homeAthletes.map((athlete, index) => {
          const seed = homeStatSeed[index]
          return {
            gameId: game.id,
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
          }
        }),
        ...awayAthletes.map((athlete, index) => {
          const seed = awayStatSeed[index]
          return {
            gameId: game.id,
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
          }
        }),
      ],
    })

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

    await prisma.gameEvent.createMany({
      data: [
        createEvent(1, 1, '09:48', 'GAME_START', homeTeam.id, null),
        createEvent(2, 1, '09:16', 'SHOT_MADE_2', homeTeam.id, homeAthletes[0].id, 2),
        createEvent(3, 1, '08:54', 'SHOT_MADE_3', awayTeam.id, awayAthletes[0].id, 3),
        createEvent(4, 1, '07:43', 'ASSIST', homeTeam.id, homeAthletes[1].id),
        createEvent(5, 1, '07:42', 'SHOT_MADE_2', homeTeam.id, homeAthletes[2].id, 2),
        createEvent(6, 2, '08:11', 'FOUL_PERSONAL', awayTeam.id, awayAthletes[3].id),
        createEvent(7, 2, '07:26', 'TIMEOUT_CONFIRMED', homeTeam.id, null),
        createEvent(8, 2, '06:42', 'SHOT_MADE_2', awayTeam.id, awayAthletes[4].id, 2),
      ],
    })

    console.log('Seed da mesa demo criada com sucesso.')
    console.log(`Campeonato: ${championship.name}`)
    console.log(`Jogo: ${homeTeam.name} x ${awayTeam.name}`)
    console.log(`Game ID: ${game.id}`)
    console.log(`Rota canonica: /admin/championships/${championship.id}/jogos/${game.id}/live`)
  } finally {
    await prisma.$disconnect()
  }
}

main().catch((error) => {
  console.error('Erro ao criar seed da mesa demo:', error)
  process.exit(1)
})
