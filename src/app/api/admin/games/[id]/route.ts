import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

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

    const game = await prisma.game.update({
      where: { id },
      data: updateData,
      include: {
        homeTeam: { select: { name: true } },
        awayTeam: { select: { name: true } },
      }
    })

    // Automated Standing Updates
    if (status === 'COMPLETED' && game.homeScore !== null && game.awayScore !== null) {
      const { homeTeamId, awayTeamId, categoryId } = game
      
      const homeWin = game.homeScore > game.awayScore
      const awayWin = game.awayScore > game.homeScore

      // Update Home Team Standing
      await prisma.standing.upsert({
        where: { teamId_categoryId: { teamId: homeTeamId, categoryId } },
        create: {
          teamId: homeTeamId,
          categoryId,
          played: 1,
          wins: homeWin ? 1 : 0,
          losses: homeWin ? 0 : 1,
          points: homeWin ? 2 : 1,
          pointsFor: game.homeScore,
          pointsAg: game.awayScore,
        },
        update: {
          played: { increment: 1 },
          wins: { increment: homeWin ? 1 : 0 },
          losses: { increment: homeWin ? 0 : 1 },
          points: { increment: homeWin ? 2 : 1 },
          pointsFor: { increment: game.homeScore },
          pointsAg: { increment: game.awayScore },
        }
      })

      // Update Away Team Standing
      await prisma.standing.upsert({
        where: { teamId_categoryId: { teamId: awayTeamId, categoryId } },
        create: {
          teamId: awayTeamId,
          categoryId,
          played: 1,
          wins: awayWin ? 1 : 0,
          losses: awayWin ? 0 : 1,
          points: awayWin ? 2 : 1,
          pointsFor: game.awayScore,
          pointsAg: game.homeScore,
        },
        update: {
          played: { increment: 1 },
          wins: { increment: awayWin ? 1 : 0 },
          losses: { increment: awayWin ? 0 : 1 },
          points: { increment: awayWin ? 2 : 1 },
          pointsFor: { increment: game.awayScore },
          pointsAg: { increment: game.homeScore },
        }
      })
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
