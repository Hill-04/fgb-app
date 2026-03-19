import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const championshipId = searchParams.get('championshipId')
  const categoryId = searchParams.get('categoryId')
  const teamId = searchParams.get('teamId')

  try {
    const games = await prisma.game.findMany({
      where: {
        ...(championshipId && { championshipId }),
        ...(categoryId && { categoryId }),
        ...(teamId && {
          OR: [
            { homeTeamId: teamId },
            { awayTeamId: teamId }
          ]
        }),
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

    // Conflict Validation: Check if either team has blocked dates for this game time
    const gameDate = new Date(dateTime)
    
    const conflicts = await prisma.blockedDate.findMany({
      where: {
        registration: {
          championshipId,
          teamId: { in: [homeTeamId, awayTeamId] }
        },
        OR: [
          { startDate: { lte: gameDate }, endDate: { gte: gameDate } },
          { startDate: { lte: gameDate }, endDate: null }
        ]
      },
      include: { registration: { include: { team: true } } }
    })

    if (conflicts.length > 0) {
      const teamNames = conflicts.map(c => c.registration.team.name).join(', ')
      return NextResponse.json({ 
        error: `Conflito de data bloqueada para: ${teamNames}`,
        conflicts: conflicts.map(c => ({ team: c.registration.team.name, reason: c.reason }))
      }, { status: 409 })
    }

    const game = await prisma.game.create({
      data: {
        championshipId,
        categoryId,
        homeTeamId,
        awayTeamId,
        dateTime: gameDate,
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
