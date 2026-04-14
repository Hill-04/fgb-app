import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  const teamId = (session.user as any).teamId
  if (!teamId) {
    return NextResponse.json({ error: 'Equipe não encontrada' }, { status: 404 })
  }

  try {
    const members = await prisma.teamMembership.findMany({
      where: { teamId },
      include: {
        user: {
          select: { id: true, name: true, email: true, createdAt: true },
        },
      },
      orderBy: [
        // PENDING first, then ACTIVE, then others
        { status: 'asc' },
        { requestedAt: 'desc' },
      ],
    })

    return NextResponse.json({ members })
  } catch {
    return NextResponse.json({ error: 'Erro ao listar membros' }, { status: 500 })
  }
}
