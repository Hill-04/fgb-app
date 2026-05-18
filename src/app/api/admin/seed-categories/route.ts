import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

const CATEGORIES: Array<{ order: number; name: string; maxAge: number | null }> = [
  { order: 1, name: 'Sub 8', maxAge: 8 },
  { order: 2, name: 'Sub 9', maxAge: 9 },
  { order: 3, name: 'Sub 10', maxAge: 10 },
  { order: 4, name: 'Sub 11', maxAge: 11 },
  { order: 5, name: 'Sub 12', maxAge: 12 },
  { order: 6, name: 'Sub 13', maxAge: 13 },
  { order: 7, name: 'Sub 14', maxAge: 14 },
  { order: 8, name: 'Sub 15', maxAge: 15 },
  { order: 9, name: 'Sub 16', maxAge: 16 },
  { order: 10, name: 'Sub 17', maxAge: 17 },
  { order: 11, name: 'Sub 18', maxAge: 18 },
  { order: 12, name: 'Sub 19', maxAge: 19 },
  { order: 13, name: 'Sub 20', maxAge: 20 },
  { order: 14, name: 'Sub 21', maxAge: 21 },
  { order: 15, name: 'Adulto', maxAge: null },
]

async function isAuthorized(req: Request): Promise<boolean> {
  const expectedToken = process.env.MIGRATE_TOKEN
  const headerToken = req.headers.get('x-migrate-token')
  if (expectedToken && headerToken && headerToken === expectedToken) {
    return true
  }

  const session = await getServerSession(authOptions)
  const userId = (session?.user as any)?.id
  if (!userId) return false

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { isFederationSuperAdmin: true },
  })
  return Boolean(user?.isFederationSuperAdmin)
}

export async function GET() {
  return NextResponse.json({ ok: true }, { status: 200 })
}

export async function POST(req: Request) {
  if (!(await isAuthorized(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const startedAt = Date.now()
  try {
    const results: Array<{ name: string; order: number }> = []
    for (const c of CATEGORIES) {
      const upserted = await prisma.category.upsert({
        where: { name: c.name },
        create: {
          name: c.name,
          order: c.order,
          maxAge: c.maxAge,
          minPlayers: 8,
          isActive: true,
        },
        update: {
          order: c.order,
          maxAge: c.maxAge,
        },
      })
      results.push({ name: upserted.name, order: upserted.order })
    }
    return NextResponse.json(
      {
        ok: true,
        count: results.length,
        categories: results,
        elapsedMs: Date.now() - startedAt,
      },
      { status: 200 }
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}
