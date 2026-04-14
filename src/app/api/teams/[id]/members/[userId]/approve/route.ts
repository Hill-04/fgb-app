import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { canManageTeamMembers } from '@/lib/access/team-permissions'

const ALLOWED_TEAM_ROLES = [
  'HEAD_COACH',
  'ASSISTANT_COACH',
  'PHYSICAL_TRAINER',
  'DOCTOR',
  'STAFF_OTHER',
] as const

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; userId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 })
    }

    const teamRole = (session.user as any).teamRole
    if (!canManageTeamMembers(teamRole)) {
      return NextResponse.json(
        { error: 'Apenas o Head Coach pode aprovar membros da equipe' },
        { status: 403 }
      )
    }

    const { id: teamId, userId } = await params
    const body = await req.json().catch(() => ({}))
    const requestedRole =
      typeof body.role === 'string' && ALLOWED_TEAM_ROLES.includes(body.role)
        ? body.role
        : 'STAFF_OTHER'

    const requesterMembership = await prisma.teamMembership.findFirst({
      where: {
        userId: session.user.id,
        teamId,
        status: 'ACTIVE',
      },
    })

    if (!requesterMembership) {
      return NextResponse.json({ error: 'Equipe nao encontrada' }, { status: 404 })
    }

    const membership = await prisma.teamMembership.findFirst({
      where: {
        userId,
        teamId,
        status: 'PENDING',
      },
    })

    if (!membership) {
      return NextResponse.json({ error: 'Solicitacao nao encontrada' }, { status: 404 })
    }

    const updatedMembership = await prisma.teamMembership.update({
      where: { id: membership.id },
      data: {
        status: 'ACTIVE',
        role: requestedRole,
        approvedAt: new Date(),
        updatedAt: new Date(),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        team: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    return NextResponse.json({
      success: true,
      membership: updatedMembership,
    })
  } catch (error) {
    console.error('Erro ao aprovar membro:', error)
    return NextResponse.json({ error: 'Erro ao aprovar membro' }, { status: 500 })
  }
}
