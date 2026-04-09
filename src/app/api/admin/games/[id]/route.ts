import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { StandingService } from '@/services/standing-service'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session || !(session.user as any).isAdmin) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  try {
    const { id } = await params
    const body = await request.json()
    const { 
      homeScore, 
      awayScore, 
      status, 
      dateTime, 
      location,
      city
    } = body

    const oldGame = await prisma.game.findUnique({
      where: { id },
      select: { status: true, categoryId: true }
    })

    const updateData: any = {}
    if (homeScore !== undefined) updateData.homeScore = Number(homeScore)
    if (awayScore !== undefined) updateData.awayScore = Number(awayScore)
    if (status) updateData.status = status
    if (dateTime) updateData.dateTime = new Date(dateTime)
    if (location) updateData.location = location
    if (city) updateData.city = city

    // Conflict Validation if date is changing
    if (dateTime) {
      const gameDate = new Date(dateTime)
      const currentChampionship = await prisma.game.findUnique({
        where: { id },
        select: { championshipId: true, homeTeamId: true, awayTeamId: true }
      })

      if (currentChampionship) {
        const conflicts = await prisma.blockedDate.findMany({
          where: {
            registration: {
              championshipId: currentChampionship.championshipId,
              teamId: { in: [currentChampionship.homeTeamId, currentChampionship.awayTeamId] }
            },
            startDate: { lte: gameDate },
            endDate: { gte: gameDate }
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
      }
    }

    const game = await prisma.game.update({
      where: { id },
      data: updateData,
      include: {
        homeTeam: { select: { name: true } },
        awayTeam: { select: { name: true } },
      }
    })

    // Automated Standing Updates
    // Recalculate if it IS finished or WAS finished (case of status change or score fix)
    if (game.status === 'FINISHED' || oldGame?.status === 'FINISHED') {
      await StandingService.recalculateForCategory(game.categoryId)
    }

    return NextResponse.json(game)
  } catch (error) {
    console.error('Error updating game:', error)
    return NextResponse.json({ error: 'Erro ao atualizar jogo' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session || !(session.user as any).isAdmin) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  try {
    const { id } = await params
    const game = await prisma.game.findUnique({ where: { id }, select: { categoryId: true, status: true } })
    await prisma.game.delete({ where: { id } })
    
    if (game?.status === 'FINISHED') {
      await StandingService.recalculateForCategory(game.categoryId)
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao excluir jogo' }, { status: 500 })
  }
}
