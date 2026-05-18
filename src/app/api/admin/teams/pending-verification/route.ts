import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { ensureDatabaseSchema } from '@/lib/db-patch'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET() {
  await ensureDatabaseSchema()

  const session = await getServerSession(authOptions)
  const userId = (session?.user as { id?: string } | undefined)?.id

  if (!userId) {
    return NextResponse.json({ ok: false, error: 'Não autorizado' }, { status: 401 })
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { isAdmin: true, isFederationSuperAdmin: true },
  })

  if (!user?.isAdmin && !user?.isFederationSuperAdmin) {
    return NextResponse.json({ ok: false, error: 'Apenas admin' }, { status: 403 })
  }

  const teams = await prisma.team.findMany({
    where: { verificationStatus: 'PENDING_VERIFICATION' } as any,
    select: {
      id: true,
      name: true,
      cnpj: true,
      city: true,
      state: true,
      institutionalEmail: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({ ok: true, count: teams.length, teams })
}
