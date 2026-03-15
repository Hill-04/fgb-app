import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session || !(session.user as any).isAdmin) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const championshipId = searchParams.get('championshipId')
  const categoryId = searchParams.get('categoryId')

  try {
    const games = await prisma.game.findMany({
      where: {
        ...(championshipId && { championshipId }),
        ...(categoryId && { categoryId }),
      },
      include: {
        homeTeam: { select: { name: true } },
        awayTeam: { select: { name: true } },
        category: { select: { name: true } },
      },
      orderBy: { dateTime: 'asc' }
    })
    return NextResponse.json(games)
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao buscar jogos' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session || !(session.user as any).isAdmin) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { 
      championshipId, 
      categoryId, 
      homeTeamId, 
      awayTeamId, 
      dateTime, 
      location, 
      city, 
      phase 
    } = body

    if (!championshipId || !categoryId || !homeTeamId || !awayTeamId || !dateTime) {
      return NextResponse.json({ error: 'Campos obrigatórios ausentes' }, { status: 400 })
    }

    const game = await prisma.game.create({
      data: {
        championshipId,
        categoryId,
        homeTeamId,
        awayTeamId,
        dateTime: new Date(dateTime),
        location,
        city,
        phase: Number(phase) || 1
      }
    })

    return NextResponse.json(game)
  } catch (error) {
    console.error('Error creating game:', error)
    return NextResponse.json({ error: 'Erro ao criar jogo' }, { status: 500 })
  }
}
