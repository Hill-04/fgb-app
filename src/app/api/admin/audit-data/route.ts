import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

async function isAuthorized(req: Request): Promise<boolean> {
  const expectedToken = process.env.MIGRATE_TOKEN
  const headerToken = req.headers.get('x-migrate-token')
  if (expectedToken && headerToken && headerToken === expectedToken) return true

  const session = await getServerSession(authOptions)
  const userId = (session?.user as any)?.id
  if (!userId) return false

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { isFederationSuperAdmin: true },
  })
  return Boolean(user?.isFederationSuperAdmin)
}

async function safeCount<T>(fn: () => Promise<T>, label: string): Promise<T | { _error: string }> {
  try {
    return await fn()
  } catch (e) {
    const errMsg = e instanceof Error ? e.message.slice(0, 200) : String(e).slice(0, 200)
    console.error(`[audit-data] ${label} failed:`, errMsg)
    return { _error: errMsg }
  }
}

function normalizeName(s: string): string {
  return s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().replace(/[^a-z0-9]/g, '')
}

export async function GET(req: Request) {
  if (!(await isAuthorized(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const startedAt = Date.now()
  const url = new URL(req.url)
  const mode = url.searchParams.get('mode')

  if (mode === 'deep') {
    return getDeepAudit(startedAt)
  }

  if (mode === 'athletes-review') {
    return getAthletesReview(startedAt)
  }

  return getDefaultAudit(startedAt)
}

async function getDefaultAudit(startedAt: number) {
  const counts = {
    users: await safeCount(() => prisma.user.count(), 'users'),
    teams: await safeCount(() => prisma.team.count(), 'teams'),
    athletes: await safeCount(() => prisma.athlete.count(), 'athletes'),
    coachStaff: await safeCount(() => prisma.coachStaff.count(), 'coachStaff'),
    championships: await safeCount(() => prisma.championship.count(), 'championships'),
    championshipCategories: await safeCount(() => prisma.championshipCategory.count(), 'championshipCategories'),
    registrations: await safeCount(() => prisma.registration.count(), 'registrations'),
    games: await safeCount(() => prisma.game.count(), 'games'),
    gyms: await safeCount(() => prisma.gym.count(), 'gyms'),
    referees: await safeCount(() => prisma.referee.count(), 'referees'),
    categories: await safeCount(() => prisma.category.count(), 'categories'),
    sponsors: await safeCount(() => prisma.sponsor.count(), 'sponsors'),
    articles: await safeCount(() => prisma.article.count(), 'articles'),
    financialInvoices: await safeCount(() => prisma.financialInvoice.count(), 'financialInvoices'),
  }

  const samples = {
    users: await safeCount(
      () =>
        prisma.user.findMany({
          take: 20,
          select: { id: true, name: true, email: true, isAdmin: true, isFederationSuperAdmin: true, createdAt: true },
          orderBy: { createdAt: 'desc' },
        }),
      'samples.users'
    ),
    teams: await safeCount(
      () =>
        prisma.team.findMany({
          take: 25,
          select: { id: true, name: true, city: true, createdAt: true },
          orderBy: { createdAt: 'desc' },
        }),
      'samples.teams'
    ),
    athletes: await safeCount(
      () =>
        prisma.athlete.findMany({
          take: 15,
          select: { id: true, name: true, teamId: true, situation: true, registrationNumber: true, createdAt: true },
          orderBy: { createdAt: 'desc' },
        }),
      'samples.athletes'
    ),
    championships: await safeCount(
      () =>
        prisma.championship.findMany({
          take: 10,
          select: { id: true, name: true, year: true, status: true, createdAt: true },
          orderBy: { createdAt: 'desc' },
        }),
      'samples.championships'
    ),
    games: await safeCount(
      () =>
        prisma.game.findMany({
          take: 5,
          select: { id: true, championshipId: true, dateTime: true, status: true, createdAt: true },
          orderBy: { createdAt: 'desc' },
        }),
      'samples.games'
    ),
  }

  return NextResponse.json({
    ok: true,
    counts,
    samples,
    elapsedMs: Date.now() - startedAt,
    timestamp: new Date().toISOString(),
  })
}

async function getDeepAudit(startedAt: number) {
  const articles = await safeCount(
    () =>
      prisma.article.findMany({
        select: {
          id: true,
          slug: true,
          title: true,
          subtitle: true,
          author: true,
          isPublished: true,
          publishedAt: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
    'articles'
  )

  const athletesTotal = await safeCount(() => prisma.athlete.count(), 'athletes.totalCount')

  const athletesByBatch = await safeCount(async () => {
    const rows = await prisma.$queryRaw<Array<{ batch: string; n: bigint }>>`
      SELECT strftime('%Y-%m-%d %H:%M', "createdAt") as batch, COUNT(*) as n
      FROM "Athlete"
      GROUP BY batch
      ORDER BY batch DESC
      LIMIT 20
    `
    return rows.map((r) => ({ batch: r.batch, count: Number(r.n) }))
  }, 'athletes.byBatch')

  const athletesIsolatedRecent = await safeCount(
    () =>
      prisma.athlete.findMany({
        take: 10,
        select: {
          id: true,
          name: true,
          situation: true,
          teamId: true,
          registrationNumber: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
    'athletes.isolatedRecent'
  )

  const athletesWithRegistrationNumber = await safeCount(
    () => prisma.athlete.count({ where: { registrationNumber: { not: null } } }),
    'athletes.withRegistrationNumber'
  )

  const athletesWithoutRegistrationNumber = await safeCount(
    () => prisma.athlete.count({ where: { registrationNumber: null } }),
    'athletes.withoutRegistrationNumber'
  )

  const teamsRaw = await safeCount(
    () =>
      prisma.team.findMany({
        select: {
          id: true,
          name: true,
          city: true,
          createdAt: true,
          _count: { select: { athletes: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
    'teams'
  )

  type TeamItem = { id: string; name: string; city: string | null; createdAt: Date; athleteCount: number }
  let teams: TeamItem[] | { _error: string } = teamsRaw as any
  let teamsDuplicateCandidates: Array<{ groupKey: string; teams: TeamItem[] }> = []

  if (Array.isArray(teamsRaw)) {
    teams = teamsRaw.map((t) => ({
      id: t.id,
      name: t.name,
      city: t.city,
      createdAt: t.createdAt,
      athleteCount: (t as any)._count?.athletes ?? 0,
    }))
    const grouped = new Map<string, TeamItem[]>()
    for (const t of teams) {
      const key = normalizeName(t.name)
      if (!grouped.has(key)) grouped.set(key, [])
      grouped.get(key)!.push(t)
    }
    for (const [groupKey, groupTeams] of grouped.entries()) {
      if (groupTeams.length > 1) {
        teamsDuplicateCandidates.push({ groupKey, teams: groupTeams })
      }
    }
  }

  const users = await safeCount(
    () =>
      prisma.user.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          isAdmin: true,
          isFederationSuperAdmin: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
    'users'
  )

  const coachStaff = await safeCount(
    () =>
      prisma.coachStaff.findMany({
        select: { id: true, name: true, role: true, teamId: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
    'coachStaff'
  )

  const championships = await safeCount(
    () =>
      prisma.championship.findMany({
        select: { id: true, name: true, year: true, status: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
      }),
    'championships'
  )

  const financialInvoices = await safeCount(
    () =>
      prisma.financialInvoice.findMany({
        select: {
          id: true,
          number: true,
          teamId: true,
          status: true,
          totalCents: true,
          paidCents: true,
          balanceCents: true,
          issueDate: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
    'financialInvoices'
  )

  return NextResponse.json({
    ok: true,
    mode: 'deep',
    articles,
    athletes: {
      totalCount: athletesTotal,
      byBatch: athletesByBatch,
      isolatedRecent: athletesIsolatedRecent,
      withRegistrationNumber: athletesWithRegistrationNumber,
      withoutRegistrationNumber: athletesWithoutRegistrationNumber,
    },
    teams,
    teamsDuplicateCandidates,
    users,
    coachStaff,
    championships,
    financialInvoices,
    elapsedMs: Date.now() - startedAt,
    timestamp: new Date().toISOString(),
  })
}

async function getAthletesReview(startedAt: number) {
  // Discover test teams dynamically: created on 2026-03-27 (UTC) with athletes attached
  const testTeamsRaw = await safeCount(
    () =>
      prisma.team.findMany({
        where: {
          createdAt: {
            gte: new Date('2026-03-27T00:00:00.000Z'),
            lt: new Date('2026-03-28T00:00:00.000Z'),
          },
        },
        select: {
          id: true,
          name: true,
          city: true,
          createdAt: true,
          _count: { select: { athletes: true } },
        },
      }),
    'testTeams'
  )

  type TestTeamMeta = { id: string; name: string; city: string | null; createdAt: Date; athleteCount: number }
  let testTeamsIdentified: TestTeamMeta[] = []
  let testTeamIds: string[] = []
  if (Array.isArray(testTeamsRaw)) {
    testTeamsIdentified = testTeamsRaw
      .filter((t) => ((t as any)._count?.athletes ?? 0) > 0)
      .map((t) => ({
        id: t.id,
        name: t.name,
        city: t.city,
        createdAt: t.createdAt,
        athleteCount: (t as any)._count?.athletes ?? 0,
      }))
    testTeamIds = testTeamsIdentified.map((t) => t.id)
  }

  // Athletes stuck in test teams, grouped by teamId
  const stuckRaw = await safeCount(
    async () => {
      if (testTeamIds.length === 0) return []
      return prisma.athlete.findMany({
        where: { teamId: { in: testTeamIds } },
        select: {
          id: true,
          name: true,
          registrationNumber: true,
          situation: true,
          createdAt: true,
          teamId: true,
          team: { select: { name: true } },
        },
        orderBy: [{ teamId: 'asc' }, { name: 'asc' }],
      })
    },
    'athletesStuckInTestTeams'
  )

  type StuckGroup = {
    teamId: string
    teamName: string | null
    athleteCount: number
    athletes: Array<{
      id: string
      name: string
      registrationNumber: number | null
      situation: string
      createdAt: Date
    }>
  }
  let athletesStuckInTestTeams: StuckGroup[] | { _error: string } = stuckRaw as any
  if (Array.isArray(stuckRaw)) {
    const grouped = new Map<string, StuckGroup>()
    for (const a of stuckRaw) {
      const tid = (a as any).teamId ?? 'null'
      if (!grouped.has(tid)) {
        grouped.set(tid, {
          teamId: tid,
          teamName: (a as any).team?.name ?? null,
          athleteCount: 0,
          athletes: [],
        })
      }
      const g = grouped.get(tid)!
      g.athleteCount += 1
      g.athletes.push({
        id: a.id,
        name: a.name,
        registrationNumber: (a as any).registrationNumber,
        situation: (a as any).situation,
        createdAt: a.createdAt,
      })
    }
    athletesStuckInTestTeams = Array.from(grouped.values())
  }

  // Athletes with no registrationNumber and not in test teams (manual entries)
  const manualRaw = await safeCount(
    () =>
      prisma.athlete.findMany({
        where: {
          registrationNumber: null,
          ...(testTeamIds.length > 0 ? { NOT: { teamId: { in: testTeamIds } } } : {}),
        },
        select: {
          id: true,
          name: true,
          situation: true,
          createdAt: true,
          teamId: true,
          team: { select: { name: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
    'athletesManualEntries'
  )

  const MANUAL_TRUNCATE = 200
  type ManualEntry = {
    id: string
    name: string
    situation: string
    createdAt: Date
    teamId: string | null
    teamName: string | null
  }
  let manualEntriesPayload:
    | {
        totalCount: number
        truncated: boolean
        truncatedAt: number | null
        athletes: ManualEntry[]
      }
    | { _error: string } = manualRaw as any
  if (Array.isArray(manualRaw)) {
    const total = manualRaw.length
    const truncated = total > MANUAL_TRUNCATE
    const slice = truncated ? manualRaw.slice(0, MANUAL_TRUNCATE) : manualRaw
    manualEntriesPayload = {
      totalCount: total,
      truncated,
      truncatedAt: truncated ? MANUAL_TRUNCATE : null,
      athletes: slice.map((a) => ({
        id: a.id,
        name: a.name,
        situation: (a as any).situation,
        createdAt: a.createdAt,
        teamId: (a as any).teamId,
        teamName: (a as any).team?.name ?? null,
      })),
    }
  }

  return NextResponse.json({
    ok: true,
    mode: 'athletes-review',
    testTeamsIdentified,
    athletesStuckInTestTeams,
    athletesManualEntries: manualEntriesPayload,
    elapsedMs: Date.now() - startedAt,
    timestamp: new Date().toISOString(),
  })
}
