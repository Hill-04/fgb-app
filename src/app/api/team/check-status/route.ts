import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

/**
 * Returns the real-time membership status from the DB (not the JWT).
 * Used by the request-status page to poll for approval.
 */
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  const userId = (session.user as any).id

  const membership = await prisma.teamMembership.findFirst({
    where: { userId },
    include: { team: { select: { id: true, name: true } } },
    orderBy: { requestedAt: 'desc' },
  })

  if (!membership) {
    return NextResponse.json({ membershipStatus: 'NO_TEAM' })
  }

  return NextResponse.json({
    membershipStatus: membership.status,
    teamId: membership.teamId,
    teamName: membership.team?.name ?? null,
  })
}
