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

    // Automated Standing Updates using Service
    if (game.status === 'FINISHED' || status === 'FINISHED') {
      await StandingService.updateFromGame(game.id)
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
    await prisma.game.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao excluir jogo' }, { status: 500 })
  }
}
