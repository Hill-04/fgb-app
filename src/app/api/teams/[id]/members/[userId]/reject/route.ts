import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { canManageTeamMembers } from '@/lib/access/team-permissions'

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
        { error: 'Apenas o Head Coach pode recusar membros da equipe' },
        { status: 403 }
      )
    }

    const { id: teamId, userId } = await params

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
        status: 'REJECTED',
        updatedAt: new Date(),
      },
    })

    return NextResponse.json({
      success: true,
      membership: updatedMembership,
    })
  } catch (error) {
    console.error('Erro ao recusar membro:', error)
    return NextResponse.json({ error: 'Erro ao recusar membro' }, { status: 500 })
  }
}
