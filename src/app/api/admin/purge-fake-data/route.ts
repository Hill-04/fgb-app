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
  const userId = (session?.user as { id?: string } | undefined)?.id
  if (!userId) return false
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { isFederationSuperAdmin: true },
  })
  return Boolean(user?.isFederationSuperAdmin)
}

// 6 teams oficiais do lote 05-08 que contêm 20 atletas dummy cada (Bloco 2 do audit)
const BLOCO_2_OFFICIAL_TEAM_NAMES = [
  'AMB Santa Cruz',
  'Associação Esportiva Flyboys',
  'Associação Sojão Basquete Clube',
  'Associação Guaporense de basquete',
  'Associação Esportiva Panatinaikos',
  'APACOBAS',
]

const EXPECTED_DUMMY_ATHLETE_COUNT = 120

async function findTargets() {
  // Test teams criados no lote 03-27 (2 com atletas + 6 sem atletas + variantes)
  const testTeams_03_27 = await prisma.team.findMany({
    where: {
      createdAt: {
        gte: new Date('2026-03-27T00:00:00Z'),
        lt: new Date('2026-03-28T00:00:00Z'),
      },
    },
    select: {
      id: true,
      name: true,
      createdAt: true,
      _count: { select: { athletes: true } },
    },
  })

  // Mesa Demo teams (lote 04-18, 2 teams)
  const mesaDemoTeams = await prisma.team.findMany({
    where: { name: { contains: 'Mesa Demo' } },
    select: {
      id: true,
      name: true,
      createdAt: true,
      _count: { select: { athletes: true } },
    },
  })

  const teamsToDelete = [...testTeams_03_27, ...mesaDemoTeams]
  const teamIdsToDelete = teamsToDelete.map((t) => t.id)

  // Bloco 2: 6 teams oficiais do lote 05-08 com 20 atletas dummy cada
  const bloco2Teams = await prisma.team.findMany({
    where: {
      name: { in: BLOCO_2_OFFICIAL_TEAM_NAMES },
      createdAt: {
        gte: new Date('2026-05-08T00:00:00Z'),
        lt: new Date('2026-05-09T00:00:00Z'),
      },
    },
    select: { id: true, name: true, createdAt: true },
  })

  // Atletas presos nos test teams (cascade manual — Athlete.team não tem onDelete: Cascade)
  const athletesInTestTeams = await prisma.athlete.findMany({
    where: { teamId: { in: teamIdsToDelete } },
    select: { id: true, name: true, teamId: true },
  })

  // Dummies nos 6 teams oficiais do Bloco 2 (restrito por IDs, não notIn)
  const dummyAthletesInOfficialTeams = await prisma.athlete.findMany({
    where: {
      registrationNumber: null,
      teamId: { in: bloco2Teams.map((t) => t.id) },
      situation: 'PENDING',
    },
    select: {
      id: true,
      name: true,
      teamId: true,
      createdAt: true,
      team: { select: { name: true } },
    },
  })

  // Championships simulação
  const championshipsToDelete = await prisma.championship.findMany({
    where: {
      OR: [
        { name: { contains: 'Simulação' } },
        { name: { contains: 'simulação' } },
        { name: { contains: 'Nova criação' } },
      ],
    },
    select: { id: true, name: true },
  })

  // Users a deletar:
  //  - smoke (@fgb.local)
  //  - mesa-demo-admin
  //  - @fgb.com.br do lote 03-27 (NÃO Brayan, NÃO super admin)
  const usersToDelete = await prisma.user.findMany({
    where: {
      OR: [
        { email: { endsWith: '@fgb.local' } },
        { email: 'mesa-demo-admin@fgb.com.br' },
        {
          AND: [
            { email: { endsWith: '@fgb.com.br' } },
            { email: { not: 'brayanalexguarnieri@gmail.com' } },
            { isFederationSuperAdmin: false },
            {
              createdAt: {
                gte: new Date('2026-03-27T00:00:00Z'),
                lt: new Date('2026-03-28T00:00:00Z'),
              },
            },
          ],
        },
      ],
    },
    select: {
      id: true,
      email: true,
      name: true,
      isFederationSuperAdmin: true,
      createdAt: true,
    },
  })

  // Referees — lista TODOS no plan; execute valida que count<=1 antes de deletar
  const refereesToDelete = await prisma.referee.findMany({
    select: { id: true, name: true, email: true, createdAt: true },
  })

  // FinancialInvoices ligadas aos test teams (FinancialInvoice.team não tem onDelete: Cascade)
  const invoicesToDelete = await prisma.financialInvoice.findMany({
    where: { teamId: { in: teamIdsToDelete } },
    select: { id: true, totalCents: true, teamId: true },
  })

  // Warnings
  const dummyCount = dummyAthletesInOfficialTeams.length
  const dummyWarning =
    dummyCount !== EXPECTED_DUMMY_ATHLETE_COUNT
      ? `EXPECTED ${EXPECTED_DUMMY_ATHLETE_COUNT}, GOT ${dummyCount} — REVIEW BEFORE EXECUTE`
      : null

  const refereeWarning =
    refereesToDelete.length > 1
      ? `Found ${refereesToDelete.length} referees; execute will refuse unless count<=1. Review names below and add a filter if needed.`
      : null

  const bloco2MissingTeams = BLOCO_2_OFFICIAL_TEAM_NAMES.filter(
    (n) => !bloco2Teams.some((t) => t.name === n),
  )
  const bloco2Warning =
    bloco2MissingTeams.length > 0
      ? `Expected 6 Bloco 2 teams; missing: ${bloco2MissingTeams.join(', ')}`
      : null

  return {
    testTeams_03_27: testTeams_03_27.map((t) => ({
      id: t.id,
      name: t.name,
      athleteCount: t._count.athletes,
      createdAt: t.createdAt,
    })),
    mesaDemoTeams: mesaDemoTeams.map((t) => ({
      id: t.id,
      name: t.name,
      athleteCount: t._count.athletes,
      createdAt: t.createdAt,
    })),
    bloco2Teams,
    athletesInTestTeams: athletesInTestTeams.length,
    dummyAthletesInOfficialTeams: {
      total: dummyCount,
      byTeam: Object.entries(
        dummyAthletesInOfficialTeams.reduce(
          (acc, a) => {
            const teamName = a.team?.name || 'NULL_TEAM'
            acc[teamName] = (acc[teamName] || 0) + 1
            return acc
          },
          {} as Record<string, number>,
        ),
      ).map(([team, count]) => ({ team, count })),
      ids: dummyAthletesInOfficialTeams.map((a) => a.id),
    },
    championshipsToDelete,
    usersToDelete: usersToDelete.map((u) => ({
      id: u.id,
      email: u.email,
      name: u.name,
      isAdmin: u.isFederationSuperAdmin,
      createdAt: u.createdAt,
    })),
    refereesToDelete,
    invoicesToDelete,
    warnings: {
      dummyCount: dummyWarning,
      refereeCount: refereeWarning,
      bloco2Missing: bloco2Warning,
    },
    summary: {
      teamsCount: teamsToDelete.length,
      athletesCount: athletesInTestTeams.length + dummyCount,
      championshipsCount: championshipsToDelete.length,
      usersCount: usersToDelete.length,
      refereesCount: refereesToDelete.length,
      invoicesCount: invoicesToDelete.length,
    },
  }
}

export async function GET(req: Request) {
  if (!(await isAuthorized(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }
  try {
    const plan = await findTargets()
    return NextResponse.json({ ok: true, mode: 'plan', plan })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}

export async function POST(req: Request) {
  if (!(await isAuthorized(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const confirmHeader = req.headers.get('x-confirm-purge')
  if (confirmHeader !== 'yes-i-understand') {
    return NextResponse.json(
      {
        error: 'Missing confirmation header',
        expected: 'x-confirm-purge: yes-i-understand',
      },
      { status: 400 },
    )
  }

  const startedAt = Date.now()
  try {
    const plan = await findTargets()

    // Refuse to delete referees if more than 1 exists (avoid accidental mass-delete)
    if (plan.refereesToDelete.length > 1) {
      return NextResponse.json(
        {
          ok: false,
          error: `Refusing to delete ${plan.refereesToDelete.length} referees. Add a name filter and re-run.`,
          referees: plan.refereesToDelete,
        },
        { status: 400 },
      )
    }

    const teamIdsToDelete = [
      ...plan.testTeams_03_27.map((t) => t.id),
      ...plan.mesaDemoTeams.map((t) => t.id),
    ]
    const userIdsToDelete = plan.usersToDelete.map((u) => u.id)
    const championshipIdsToDelete = plan.championshipsToDelete.map((c) => c.id)
    const refereeIdsToDelete = plan.refereesToDelete.map((r) => r.id)
    const dummyAthleteIds = plan.dummyAthletesInOfficialTeams.ids
    const invoiceIds = plan.invoicesToDelete.map((i) => i.id)

    // ATOMIC TRANSACTION — all-or-nothing. Order matters because of FKs without onDelete: Cascade.
    const [
      deletedAthletesInTestTeams,
      deletedDummyAthletes,
      deletedInvoices,
      deletedTeamMemberships,
      deletedRegistrationsDefensive,
      deletedChampionships,
      deletedReferees,
      deletedTeams,
      deletedUsers,
    ] = await prisma.$transaction([
      // Step 1a: Athletes in test teams (no Athlete.team cascade)
      prisma.athlete.deleteMany({
        where: { teamId: { in: teamIdsToDelete } },
      }),
      // Step 1b: Dummy athletes inside official Bloco 2 teams
      prisma.athlete.deleteMany({
        where: { id: { in: dummyAthleteIds } },
      }),
      // Step 2: FinancialInvoices (no FinancialInvoice.team cascade)
      prisma.financialInvoice.deleteMany({
        where: { id: { in: invoiceIds } },
      }),
      // Step 3: TeamMemberships (no cascade from Team OR User)
      prisma.teamMembership.deleteMany({
        where: {
          OR: [
            { teamId: { in: teamIdsToDelete } },
            { userId: { in: userIdsToDelete } },
          ],
        },
      }),
      // Step 4: Defensive Registrations of test teams (Registration.team has no cascade)
      prisma.registration.deleteMany({
        where: { teamId: { in: teamIdsToDelete } },
      }),
      // Step 5: Championships (cascade Registration, Game, ChampionshipCategory, etc)
      prisma.championship.deleteMany({
        where: { id: { in: championshipIdsToDelete } },
      }),
      // Step 6: Referees (validated above to be <=1)
      prisma.referee.deleteMany({
        where: { id: { in: refereeIdsToDelete } },
      }),
      // Step 7: Teams (now safe — athletes/invoices/memberships/registrations cleared)
      prisma.team.deleteMany({
        where: { id: { in: teamIdsToDelete } },
      }),
      // Step 8: Users (memberships cleared above)
      prisma.user.deleteMany({
        where: { id: { in: userIdsToDelete } },
      }),
    ])

    return NextResponse.json({
      ok: true,
      mode: 'execute',
      elapsedMs: Date.now() - startedAt,
      deletedCounts: {
        athletesInTestTeams: deletedAthletesInTestTeams.count,
        dummyAthletesInOfficialTeams: deletedDummyAthletes.count,
        financialInvoices: deletedInvoices.count,
        teamMemberships: deletedTeamMemberships.count,
        registrationsDefensive: deletedRegistrationsDefensive.count,
        championships: deletedChampionships.count,
        referees: deletedReferees.count,
        teams: deletedTeams.count,
        users: deletedUsers.count,
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}
