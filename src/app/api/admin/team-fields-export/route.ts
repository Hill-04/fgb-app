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

export async function GET(req: Request) {
  if (!(await isAuthorized(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }
  try {
    const teams = await prisma.team.findMany({
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        logoUrl: true,
        city: true,
        state: true,
        phone: true,
        sex: true,
        responsible: true,
        totalFeesOwed: true,
        createdAt: true,
        updatedAt: true,
        // Diretoria
        presidentName: true,
        presidentPhone: true,
        presidentMobile: true,
        presidentEmail: true,
        secretaryName: true,
        secretaryPhone: true,
        secretaryMobile: true,
        secretaryEmail: true,
        financialName: true,
        financialPhone: true,
        financialMobile: true,
        financialEmail: true,
        // Institucional
        cnpj: true,
        website: true,
        instagram: true,
        whatsapp: true,
        observations: true,
        isActive: true,
      },
    })
    return NextResponse.json({ ok: true, count: teams.length, teams })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}
