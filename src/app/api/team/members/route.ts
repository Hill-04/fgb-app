import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { canManageTeamMembers } from '@/lib/access/team-permissions'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 })
  }

  const teamId = (session.user as any).teamId
  const teamRole = (session.user as any).teamRole

  if (!teamId) {
    return NextResponse.json({ error: 'Equipe nao encontrada' }, { status: 404 })
  }

  try {
    const members = await prisma.teamMembership.findMany({
      where: { teamId },
      include: {
        user: {
          select: { id: true, name: true, email: true, createdAt: true },
        },
      },
      orderBy: [{ status: 'asc' }, { requestedAt: 'desc' }],
    })

    return NextResponse.json({
      members,
      permissions: {
        canManageMembers: canManageTeamMembers(teamRole),
      },
    })
  } catch {
    return NextResponse.json({ error: 'Erro ao listar membros' }, { status: 500 })
  }
}
