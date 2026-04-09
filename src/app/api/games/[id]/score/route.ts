import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { recalculateStandings } from '@/lib/standings'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { homeScore, awayScore, status, playerStats } = await request.json()

    const game = await prisma.game.findUnique({ where: { id } })
    if (!game) {
      return NextResponse.json({ error: 'Jogo não encontrado' }, { status: 404 })
    }

    await prisma.game.update({
      where: { id },
      data: {
        homeScore,
        awayScore,
        status: status || 'FINISHED',
      },
    })

    if (playerStats && Array.isArray(playerStats)) {
      await prisma.playerStat.deleteMany({
        where: { gameId: id },
      })

      if (playerStats.length > 0) {
        await prisma.playerStat.createMany({
          data: playerStats.map((playerStat: any) => ({
            gameId: id,
            teamId: playerStat.teamId,
            userId: playerStat.userId,
            points: playerStat.points || 0,
            fouls: playerStat.fouls || 0,
          })),
        })
      }
    }

    if (status === 'FINISHED' || !status) {
      await recalculateStandings(game.categoryId)
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('[Score API Error]', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
