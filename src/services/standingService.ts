import { prisma } from '@/lib/db'

export async function updateStandingsForGame(gameId: string) {
  const game = await prisma.game.findUnique({ 
    where: { id: gameId },
    include: { championship: true }
  })
  
  if (!game || game.status !== 'COMPLETED' || game.homeScore === null || game.awayScore === null) return

  // Determine points based on result (Basketball typically: Win = 2, Loss = 1)
  const homeWon = game.homeScore > game.awayScore

  // Home team
  await prisma.standing.upsert({
    where: { teamId_categoryId_championshipId: { 
      teamId: game.homeTeamId, 
      categoryId: game.categoryId,
      championshipId: game.championshipId
    } },
    create: {
      teamId: game.homeTeamId, 
      categoryId: game.categoryId,
      championshipId: game.championshipId,
      played: 1, 
      wins: homeWon ? 1 : 0, 
      losses: homeWon ? 0 : 1,
      points: homeWon ? 2 : 1, 
      pointsFor: game.homeScore, 
      pointsAg: game.awayScore,
    },
    update: {
      played: { increment: 1 }, 
      wins: { increment: homeWon ? 1 : 0 }, 
      losses: { increment: homeWon ? 0 : 1 },
      points: { increment: homeWon ? 2 : 1 }, 
      pointsFor: { increment: game.homeScore }, 
      pointsAg: { increment: game.awayScore },
    }
  })

  // Away team
  await prisma.standing.upsert({
    where: { teamId_categoryId_championshipId: { 
      teamId: game.awayTeamId, 
      categoryId: game.categoryId,
      championshipId: game.championshipId
    } },
    create: {
      teamId: game.awayTeamId, 
      categoryId: game.categoryId,
      championshipId: game.championshipId,
      played: 1, 
      wins: homeWon ? 0 : 1, 
      losses: homeWon ? 1 : 0,
      points: homeWon ? 1 : 2, 
      pointsFor: game.awayScore, 
      pointsAg: game.homeScore,
    },
    update: {
      played: { increment: 1 }, 
      wins: { increment: homeWon ? 0 : 1 }, 
      losses: { increment: homeWon ? 1 : 0 },
      points: { increment: homeWon ? 1 : 2 }, 
      pointsFor: { increment: game.awayScore }, 
      pointsAg: { increment: game.homeScore },
    }
  })
}

export async function recalculateStandingsForCategory(championshipId: string, categoryId: string) {
  // Clear existing standings for this category
  await prisma.standing.deleteMany({
    where: { championshipId, categoryId }
  })

  // Fetch all completed games
  const games = await prisma.game.findMany({
    where: { 
      championshipId, 
      categoryId, 
      status: 'COMPLETED',
      homeScore: { not: null },
      awayScore: { not: null }
    }
  })

  for (const game of games) {
    await updateStandingsForGame(game.id)
  }
}
