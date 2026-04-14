import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/db'
import { authOptions } from '@/lib/auth'
import { recalculateStandings } from '@/lib/standings'
import { ensureDatabaseSchema } from '@/lib/db-patch'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureDatabaseSchema()

    const session = await getServerSession(authOptions)
    if (!session || !(session.user as any).isAdmin) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { id } = await params
    const { homeScore, awayScore, status, playerStats } = await request.json()
    const parsedHomeScore = Number(homeScore)
    const parsedAwayScore = Number(awayScore)

    if (!Number.isFinite(parsedHomeScore) || !Number.isFinite(parsedAwayScore)) {
      return NextResponse.json({ error: 'Placar inválido' }, { status: 400 })
    }

    const game = await prisma.game.findUnique({ where: { id } })
    if (!game) {
      return NextResponse.json({ error: 'Jogo não encontrado' }, { status: 404 })
    }

    await prisma.game.update({
      where: { id },
      data: {
        homeScore: parsedHomeScore,
        awayScore: parsedAwayScore,
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
            points:      Number(playerStat.points)      || 0,
            fouls:       Number(playerStat.fouls)       || 0,
            assists:     Number(playerStat.assists)     || 0,
            rebounds:    Number(playerStat.rebounds)    || 0,
            blocks:      Number(playerStat.blocks)      || 0,
            steals:      Number(playerStat.steals)      || 0,
            threePoints: Number(playerStat.threePoints) || 0,
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
    return NextResponse.json({ error: error.message || 'Erro ao registrar resultado' }, { status: 500 })
  }
}
