import bcrypt from 'bcryptjs'
import { PrismaClient } from '@prisma/client'
import { PrismaLibSQL } from '@prisma/adapter-libsql'
import { createClient } from '@libsql/client'
import * as dotenv from 'dotenv'
import fs from 'fs'

dotenv.config({ path: '.env.local' })
dotenv.config()

export const ALLOW_FIXTURE_ENV = 'ALLOW_LIVE_FIBA_FIXTURE'
export const FIXTURE_MARKER = 'fixture:live-fiba-validation'
export const FIXTURE_CHAMPIONSHIP_NAME = 'FIXTURE - Mesa FIBA Live 2026'
export const FIXTURE_CHAMPIONSHIP_DESCRIPTION =
  '[fixture:live-fiba-validation] Campeonato descartavel para validar a mesa FIBA ponta a ponta.'
export const FIXTURE_CATEGORY_NAME = 'Sub 18'
export const FIXTURE_HOME_TEAM_NAME = 'FIXTURE - Mesa Azul'
export const FIXTURE_AWAY_TEAM_NAME = 'FIXTURE - Mesa Vermelha'
export const FIXTURE_ADMIN_NAME = 'Fixture Live Admin'
export const FIXTURE_ADMIN_EMAIL = 'fixture-live-admin@fgb.com.br'
export const FIXTURE_ADMIN_PASSWORD = 'fixture123'

export const FIXTURE_HOME_PLAYERS = [
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

export const FIXTURE_AWAY_PLAYERS = [
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

type DatabaseTarget = {
  authToken: string | undefined
  logicalEnvironment: string
  maskedUrl: string
  url: string
}

type FixtureState = {
  championship: { id: string; name: string; description: string | null } | null
  teams: Array<{ id: string; name: string }>
  admin: { id: string; email: string } | null
}

export function requireFixtureGuard() {
  if (process.env[ALLOW_FIXTURE_ENV] !== 'true') {
    throw new Error(
      `Abortado por seguranca. Defina ${ALLOW_FIXTURE_ENV}=true para rodar o seed/cleanup do fixture live FIBA.`
    )
  }
}

function maskDatabaseUrl(rawUrl: string) {
  if (rawUrl.startsWith('file:')) {
    return rawUrl
  }

  if (rawUrl.startsWith('libsql://')) {
    return rawUrl.replace(/(libsql:\/\/)([^/]+)(.*)?/, '$1$2')
  }

  return rawUrl
}

export function resolveDatabaseTarget(): DatabaseTarget {
  const url = process.env.DATABASE_URL

  if (!url) {
    throw new Error('DATABASE_URL nao definida.')
  }

  const logicalEnvironment = url.startsWith('libsql://') ? 'REMOTE_TURSO_LIBSQL' : 'LOCAL_SQLITE'

  return {
    url,
    authToken: url.startsWith('libsql://') ? process.env.DATABASE_AUTH_TOKEN : undefined,
    logicalEnvironment,
    maskedUrl: maskDatabaseUrl(url),
  }
}

export function createPrismaClient() {
  const target = resolveDatabaseTarget()
  const libsql = createClient({ url: target.url, authToken: target.authToken })
  const adapter = new PrismaLibSQL(libsql)

  return {
    prisma: new PrismaClient({ adapter } as never),
    target,
  }
}

export function logFixtureHeader(mode: 'seed' | 'cleanup', target: DatabaseTarget) {
  console.log(`=== LIVE FIBA FIXTURE :: ${mode.toUpperCase()} ===`)
  console.log(`datasource: ${target.maskedUrl}`)
  console.log(`ambiente logico: ${target.logicalEnvironment}`)
  console.log(`fixture marker: ${FIXTURE_MARKER}`)
  console.log(`guard env: ${ALLOW_FIXTURE_ENV}=true`)
}

export function logFixtureFooter(mode: 'seed' | 'cleanup') {
  console.log(`=== LIVE FIBA FIXTURE :: ${mode.toUpperCase()} FINALIZADO ===`)
}

export function getFixtureBaseUrl() {
  return (process.env.NEXTAUTH_URL || 'http://localhost:3000').replace(/\/$/, '')
}

export function buildFixtureLiveUrl(championshipId: string, gameId: string) {
  return `${getFixtureBaseUrl()}/admin/championships/${championshipId}/jogos/${gameId}/live`
}

export async function hashFixturePassword() {
  return bcrypt.hash(FIXTURE_ADMIN_PASSWORD, 10)
}

export async function findFixtureState(prisma: PrismaClient): Promise<FixtureState> {
  const championships = await prisma.championship.findMany({
    where: {
      name: FIXTURE_CHAMPIONSHIP_NAME,
      description: FIXTURE_CHAMPIONSHIP_DESCRIPTION,
    },
    select: {
      id: true,
      name: true,
      description: true,
    },
  })

  if (championships.length > 1) {
    throw new Error(
      `Ambiguidade detectada: ${championships.length} campeonatos com marcador fixture explicito. Cleanup abortado.`
    )
  }

  const teams = await prisma.team.findMany({
    where: {
      name: {
        in: [FIXTURE_HOME_TEAM_NAME, FIXTURE_AWAY_TEAM_NAME],
      },
    },
    select: {
      id: true,
      name: true,
    },
  })

  const admin = await prisma.user.findUnique({
    where: { email: FIXTURE_ADMIN_EMAIL },
    select: { id: true, email: true },
  })

  return {
    championship: championships[0] ?? null,
    teams,
    admin,
  }
}

async function ensureNoNonFixtureTeamReferences(
  prisma: PrismaClient,
  teamIds: string[],
  championshipId: string
) {
  if (teamIds.length === 0) return

  const externalGames = await prisma.game.findFirst({
    where: {
      championshipId: { not: championshipId },
      OR: [{ homeTeamId: { in: teamIds } }, { awayTeamId: { in: teamIds } }],
    },
    select: { id: true },
  })

  const registrations = await prisma.registration.findFirst({
    where: { teamId: { in: teamIds } },
    select: { id: true },
  })

  const standings = await prisma.standing.findFirst({
    where: { teamId: { in: teamIds } },
    select: { id: true },
  })

  const invoices = await prisma.financialInvoice.findFirst({
    where: { teamId: { in: teamIds } },
    select: { id: true },
  })

  if (externalGames || registrations || standings || invoices) {
    throw new Error(
      'Cleanup abortado: uma das equipes fixture possui referencia fora do campeonato fixture. Mantendo dados para evitar remocao indevida.'
    )
  }
}

async function safeDeleteFixtureAdmin(prisma: PrismaClient, adminId: string | null) {
  if (!adminId) return { removedAdminId: null, retainedAdminId: null }

  const remainingEvent = await prisma.gameEvent.findFirst({
    where: { createdByUserId: adminId },
    select: { id: true },
  })

  const remainingSession = await prisma.gameLiveSession.findFirst({
    where: {
      OR: [{ openedByUserId: adminId }, { closedByUserId: adminId }],
    },
    select: { id: true },
  })

  const remainingMembership = await prisma.teamMembership.findFirst({
    where: { userId: adminId },
    select: { id: true },
  })

  if (remainingEvent || remainingSession || remainingMembership) {
    return {
      removedAdminId: null,
      retainedAdminId: adminId,
    }
  }

  await prisma.user.delete({ where: { id: adminId } })

  return {
    removedAdminId: adminId,
    retainedAdminId: null,
  }
}

export async function cleanupFixtureData(prisma: PrismaClient) {
  const state = await findFixtureState(prisma)
  const removedIds: string[] = []
  const retainedIds: string[] = []

  if (!state.championship) {
    const teamIds = state.teams.map((team) => team.id)
    if (teamIds.length > 0) {
      const linkedGame = await prisma.game.findFirst({
        where: {
          OR: [{ homeTeamId: { in: teamIds } }, { awayTeamId: { in: teamIds } }],
        },
        select: { id: true },
      })

      if (linkedGame) {
        throw new Error(
          'Cleanup abortado: equipes fixture encontradas sem campeonato fixture, mas ainda referenciadas em jogos. Mantendo dados para evitar remocao indevida.'
        )
      }

      const registrations = await prisma.registration.findFirst({
        where: { teamId: { in: teamIds } },
        select: { id: true },
      })
      const standings = await prisma.standing.findFirst({
        where: { teamId: { in: teamIds } },
        select: { id: true },
      })
      const invoices = await prisma.financialInvoice.findFirst({
        where: { teamId: { in: teamIds } },
        select: { id: true },
      })

      if (registrations || standings || invoices) {
        throw new Error(
          'Cleanup abortado: equipes fixture parciais possuem referencias externas. Mantendo dados para evitar remocao indevida.'
        )
      }

      await prisma.athlete.deleteMany({ where: { teamId: { in: teamIds } } })
      await prisma.gym.deleteMany({ where: { teamId: { in: teamIds } } })
      await prisma.team.deleteMany({ where: { id: { in: teamIds } } })
      removedIds.push(...teamIds)
    }

    const adminCleanup = await safeDeleteFixtureAdmin(prisma, state.admin?.id ?? null)
    if (adminCleanup.removedAdminId) {
      removedIds.push(adminCleanup.removedAdminId)
    }
    if (adminCleanup.retainedAdminId) {
      retainedIds.push(adminCleanup.retainedAdminId)
    }

    return {
      removedIds,
      retainedIds,
      state,
    }
  }

  const championshipId = state.championship.id
  const teamIds = state.teams.map((team) => team.id)
  const gameIds = (
    await prisma.game.findMany({
      where: { championshipId },
      select: { id: true },
    })
  ).map((game) => game.id)

  const rosterIds = (
    await prisma.gameRoster.findMany({
      where: { gameId: { in: gameIds } },
      select: { id: true },
    })
  ).map((roster) => roster.id)

  if (gameIds.length > 0) {
    await prisma.gameAuditLog.deleteMany({ where: { gameId: { in: gameIds } } })
    await prisma.gameOfficialReport.deleteMany({ where: { gameId: { in: gameIds } } })
    await prisma.refereeAssignment.deleteMany({ where: { gameId: { in: gameIds } } })
    await prisma.gameEvent.deleteMany({ where: { gameId: { in: gameIds } } })
    await prisma.gamePeriodScore.deleteMany({ where: { gameId: { in: gameIds } } })
    await prisma.gamePlayerStatLine.deleteMany({ where: { gameId: { in: gameIds } } })
    await prisma.gameTeamStatLine.deleteMany({ where: { gameId: { in: gameIds } } })
    await prisma.gameOfficial.deleteMany({ where: { gameId: { in: gameIds } } })
    await prisma.playerStat.deleteMany({ where: { gameId: { in: gameIds } } })
    await prisma.gameLiveSession.deleteMany({ where: { gameId: { in: gameIds } } })
  }

  if (rosterIds.length > 0) {
    await prisma.gameRosterPlayer.deleteMany({ where: { gameRosterId: { in: rosterIds } } })
    await prisma.gameRoster.deleteMany({ where: { id: { in: rosterIds } } })
  }

  if (gameIds.length > 0) {
    await prisma.game.deleteMany({ where: { id: { in: gameIds } } })
    removedIds.push(...gameIds)
  }

  await prisma.document.deleteMany({ where: { championshipId } })
  await prisma.athleteBidEntry.deleteMany({ where: { championshipId } })
  await prisma.registration.deleteMany({ where: { championshipId } })
  await prisma.standing.deleteMany({
    where: {
      category: {
        championshipId,
      },
    },
  })
  await prisma.championshipCategory.deleteMany({ where: { championshipId } })
  await prisma.block.deleteMany({ where: { championshipId } })
  await prisma.financialInvoice.deleteMany({ where: { championshipId } })
  await prisma.championship.delete({ where: { id: championshipId } })
  removedIds.push(championshipId)

  await ensureNoNonFixtureTeamReferences(prisma, teamIds, championshipId)

  if (teamIds.length > 0) {
    await prisma.athlete.deleteMany({ where: { teamId: { in: teamIds } } })
    await prisma.gym.deleteMany({ where: { teamId: { in: teamIds } } })
    await prisma.team.deleteMany({ where: { id: { in: teamIds } } })
    removedIds.push(...teamIds)
  }

  const adminCleanup = await safeDeleteFixtureAdmin(prisma, state.admin?.id ?? null)
  if (adminCleanup.removedAdminId) {
    removedIds.push(adminCleanup.removedAdminId)
  }
  if (adminCleanup.retainedAdminId) {
    retainedIds.push(adminCleanup.retainedAdminId)
  }

  return {
    removedIds,
    retainedIds,
    state,
  }
}
