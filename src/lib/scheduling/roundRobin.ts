import { prisma } from '@/lib/db'

type Team = { id: string; name: string }

type GeneratedGame = {
  categoryId: string
  homeTeamId: string
  awayTeamId: string
  round: number
  phase: number
  dateTime: Date
}

export function generateRoundRobin(
  teams: Team[],
  turns: number = 1
): { homeTeamId: string; awayTeamId: string; round: number }[] {
  const n = teams.length
  if (n < 2) return []

  const games: { homeTeamId: string; awayTeamId: string; round: number }[] = []
  const ids = teams.map(t => t.id)

  if (n % 2 !== 0) ids.push('BYE')
  const total = ids.length
  const rounds = total - 1

  for (let round = 0; round < rounds; round++) {
    for (let i = 0; i < total / 2; i++) {
      const home = ids[i]
      const away = ids[total - 1 - i]
      if (home !== 'BYE' && away !== 'BYE') {
        games.push({ homeTeamId: home, awayTeamId: away, round: round + 1 })
        if (turns === 2) {
          games.push({
            homeTeamId: away,
            awayTeamId: home,
            round: rounds + round + 1
          })
        }
      }
    }
    ids.splice(1, 0, ids.pop()!)
  }

  return games
}

export function distributeGameDates(
  games: { homeTeamId: string; awayTeamId: string; round: number }[],
  startDate: Date,
  gamesPerDay: number = 4
): { homeTeamId: string; awayTeamId: string; round: number; dateTime: Date }[] {
  const result = []
  let currentDate = new Date(startDate)
  let gamesOnCurrentDay = 0

  for (const game of games) {
    if (gamesOnCurrentDay >= gamesPerDay) {
      currentDate = new Date(currentDate)
      currentDate.setDate(currentDate.getDate() + 7)
      gamesOnCurrentDay = 0
    }
    result.push({ ...game, dateTime: new Date(currentDate) })
    gamesOnCurrentDay++
  }

  return result
}

export async function generateChampionshipSchedule(championshipId: string) {
  const championship = await prisma.championship.findUnique({
    where: { id: championshipId },
    include: {
      categories: {
        include: {
          registrations: {
            where: { registration: { status: 'CONFIRMED' } },
            include: { registration: { include: { team: true } } }
          }
        }
      }
    }
  })

  if (!championship) throw new Error('Campeonato não encontrado')

  const startDate = (championship as any).startDate
    || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  const turns = (championship as any).turns || 1
  const allGames: GeneratedGame[] = []
  const categoryResults = []

  for (const category of championship.categories) {
    const teams = category.registrations.map((r: any) => ({
      id: r.registration.teamId,
      name: r.registration.team.name
    }))

    if (teams.length < 2) continue

    const rrGames = generateRoundRobin(teams, turns)
    const gamesWithDates = distributeGameDates(rrGames, startDate)

    const categoryGames: GeneratedGame[] = gamesWithDates.map(g => ({
      categoryId: category.id,
      homeTeamId: g.homeTeamId,
      awayTeamId: g.awayTeamId,
      round: g.round,
      phase: 1,
      dateTime: g.dateTime
    }))

    allGames.push(...categoryGames)
    categoryResults.push({
      id: category.id,
      name: category.name,
      teams: teams.length,
      games: categoryGames,
      gamesCount: categoryGames.length
    })
  }

  const totalRounds = allGames.length > 0
    ? Math.max(...allGames.map(g => g.round))
    : 0

  return {
    success: true,
    totalGames: allGames.length,
    categories: categoryResults,
    games: allGames,
    summary: `${allGames.length} jogos gerados para ${categoryResults.length} categorias em ${totalRounds} rodadas`
  }
}
