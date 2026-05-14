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

export async function GET(req: Request) {
  if (!(await isAuthorized(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const startedAt = Date.now()

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
