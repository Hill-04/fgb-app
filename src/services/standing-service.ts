import { prisma } from '@/lib/db'

export class StandingService {
  /**
   * Recalculates all standings for a specific category.
   * Useful when a game is deleted, score changed, or for bulk corrections.
   */
  static async recalculateForCategory(categoryId: string) {
    // 1. Get all finished games for this category
    const games = await prisma.game.findMany({
      where: {
        categoryId,
        status: 'FINISHED',
        homeScore: { not: null },
        awayScore: { not: null }
      }
    })

    // 2. Identify all teams in these games (or registered in this category)
    // We get them from registrations to include teams with 0 games
    const registrations = await prisma.registrationCategory.findMany({
      where: { categoryId },
      include: { registration: { select: { teamId: true } } }
    })
    
    const teamIds = Array.from(new Set(registrations.map(r => r.registration.teamId)))

    // 3. Reset or Delete old standings
    await prisma.standing.deleteMany({ where: { categoryId } })

    // 4. Calculate new stats
    const stats: Record<string, any> = {}
    teamIds.forEach(id => {
      stats[id] = {
        teamId: id,
        categoryId,
        played: 0,
        wins: 0,
        losses: 0,
        points: 0,
        pointsFor: 0,
        pointsAg: 0
      }
    })

    for (const game of games) {
      if (game.homeScore === null || game.awayScore === null) continue

      const homeId = game.homeTeamId
      const awayId = game.awayTeamId

      if (!stats[homeId] || !stats[awayId]) continue // Should not happen if registered

      stats[homeId].played += 1
      stats[awayId].played += 1
      stats[homeId].pointsFor += game.homeScore
      stats[homeId].pointsAg += game.awayScore
      stats[awayId].pointsFor += game.awayScore
      stats[awayId].pointsAg += game.homeScore

      if (game.homeScore > game.awayScore) {
        stats[homeId].wins += 1
        stats[homeId].points += 2
        stats[awayId].losses += 1
        stats[awayId].points += 1
      } else if (game.awayScore > game.homeScore) {
        stats[awayId].wins += 1
        stats[awayId].points += 2
        stats[homeId].losses += 1
        stats[homeId].points += 1
      } else {
        // Tie (optional in basketball, usually points are 1 each)
        stats[homeId].points += 1
        stats[awayId].points += 1
      }
    }

    // 5. Save all standings
    for (const teamId of Object.keys(stats)) {
      await prisma.standing.create({
        data: stats[teamId]
      })
    }

    console.log(`✅ Standings recalculated for category ${categoryId}`)
  }

  /**
   * Incremental update for a single game.
   * Less expensive than full recalculation.
   */
  static async updateFromGame(gameId: string) {
    const game = await prisma.game.findUnique({
      where: { id: gameId }
    })

    if (!game || game.status !== 'FINISHED' || game.homeScore === null || game.awayScore === null) {
      return
    }

    await this.recalculateForCategory(game.categoryId)
  }
}
