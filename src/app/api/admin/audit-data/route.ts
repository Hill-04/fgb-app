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

export async function GET(req: Request) {
  if (!(await isAuthorized(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  try {
    const counts = {
      users: await prisma.user.count(),
      teams: await prisma.team.count(),
      athletes: await prisma.athlete.count(),
      coachStaff: await prisma.coachStaff.count(),
      championships: await prisma.championship.count(),
      championshipCategories: await prisma.championshipCategory.count(),
      registrations: await prisma.registration.count(),
      games: await prisma.game.count(),
      gyms: await prisma.gym.count(),
      referees: await prisma.referee.count(),
      categories: await prisma.category.count(),
      sponsors: await prisma.sponsor.count(),
      articles: await prisma.article.count(),
      financialInvoices: await prisma.financialInvoice.count(),
    }

    const samples = {
      users: await prisma.user.findMany({
        take: 20,
        select: { id: true, name: true, email: true, isAdmin: true, isFederationSuperAdmin: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
      }),
      teams: await prisma.team.findMany({
        take: 25,
        select: { id: true, name: true, city: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
      }),
      athletes: await prisma.athlete.findMany({
        take: 15,
        select: { id: true, name: true, teamId: true, situation: true, registrationNumber: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
      }),
      championships: await prisma.championship.findMany({
        take: 10,
        select: { id: true, name: true, year: true, status: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
      }),
      games: await prisma.game.findMany({
        take: 5,
        select: { id: true, championshipId: true, dateTime: true, status: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
      }),
    }

    return NextResponse.json({ ok: true, counts, samples, timestamp: new Date().toISOString() })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}
