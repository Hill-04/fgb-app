import { prisma } from '@/lib/db'
import { recalculateStandings } from '@/lib/standings'

export class StandingService {
  static async recalculateForCategory(categoryId: string) {
    await recalculateStandings(categoryId)
  }

  static async updateFromGame(gameId: string) {
    const game = await prisma.game.findUnique({
      where: { id: gameId },
      select: {
        categoryId: true,
        status: true,
        homeScore: true,
        awayScore: true,
      },
    })

    if (!game || game.status !== 'FINISHED' || game.homeScore === null || game.awayScore === null) {
      return
    }

    await recalculateStandings(game.categoryId)
  }
}
