import { prisma } from '@/lib/db'

/**
 * Recalcula SeasonRanking para uma equipe num ano específico.
 * Agrega TODOS os jogos PUBLISHED dos campeonatos com countsForRanking=true.
 *
 * Pontuação FIBA: vitória = 2, derrota = 1, WO contra = 0
 */
export async function recalculateSeasonRanking(year: number, teamId: string): Promise<void> {
  const games = await prisma.game.findMany({
    where: {
      OR: [{ homeTeamId: teamId }, { awayTeamId: teamId }],
      lifecycleState: 'PUBLISHED',
      championship: {
        year,
        countsForRanking: true,
      },
    },
    select: {
      homeTeamId: true,
      awayTeamId: true,
      homeScore: true,
      awayScore: true,
      status: true,
    },
  })

  let wins = 0
  let losses = 0
  let points = 0

  for (const g of games) {
    const isHome = g.homeTeamId === teamId
    const ourScore = isHome ? (g.homeScore ?? 0) : (g.awayScore ?? 0)
    const oppScore = isHome ? (g.awayScore ?? 0) : (g.homeScore ?? 0)

    if (g.status === 'WO' && oppScore > ourScore) {
      losses++
      continue
    }

    if (ourScore > oppScore) {
      wins++
      points += 2
    } else {
      losses++
      points += 1
    }
  }

  await prisma.seasonRanking.upsert({
    where: { teamId_season: { teamId, season: year } },
    update: { points, wins, losses, games: games.length },
    create: { teamId, season: year, points, wins, losses, games: games.length },
  })
}

/**
 * Recalcula ranking pra ambas equipes envolvidas num jogo recém-publicado.
 * No-op se o campeonato tem countsForRanking=false.
 */
export async function recalculateRankingForGame(gameId: string): Promise<void> {
  const game = await prisma.game.findUnique({
    where: { id: gameId },
    select: {
      homeTeamId: true,
      awayTeamId: true,
      championship: { select: { year: true, countsForRanking: true } },
    },
  })
  if (!game || !game.championship.countsForRanking) return

  await Promise.all([
    recalculateSeasonRanking(game.championship.year, game.homeTeamId),
    recalculateSeasonRanking(game.championship.year, game.awayTeamId),
  ])
}
