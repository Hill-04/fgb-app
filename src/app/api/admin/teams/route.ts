import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session || !(session.user as any).isAdmin) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  try {
    const teams = await prisma.team.findMany({
      include: {
        gym: true,
        members: {
          where: { role: 'HEAD_COACH' },
          include: { user: { select: { name: true, email: true } } },
          take: 1
        }
      },
      orderBy: { name: 'asc' }
    })
    return NextResponse.json(teams)
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao buscar equipes' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session || !(session.user as any).isAdmin) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { name, logoUrl, city, state, phone, sex } = body

    if (!name) return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 })

    const team = await prisma.team.create({
      data: {
        name,
        logoUrl,
        city,
        state: state || 'RS',
        phone,
        sex
      }
    })

    return NextResponse.json(team)
  } catch (error) {
    console.error('Error creating team:', error)
    return NextResponse.json({ error: 'Erro ao criar equipe' }, { status: 500 })
  }
}
