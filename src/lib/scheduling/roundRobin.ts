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
  endDate: Date | null,
  gamesPerDay: number = 4,
  blockedDatesByTeam: Map<string, Date[]> = new Map()
): { homeTeamId: string; awayTeamId: string; round: number; dateTime: Date }[] {
  const result = []
  let currentDate = new Date(startDate)
  let gamesOnCurrentDay = 0

  // Função auxiliar: verificar se uma data está bloqueada para um jogo
  function isDateBlocked(date: Date, homeTeamId: string, awayTeamId: string): boolean {
    const dateStr = date.toISOString().split('T')[0]
    const homeDates = blockedDatesByTeam.get(homeTeamId) || []
    const awayDates = blockedDatesByTeam.get(awayTeamId) || []
    const allBlocked = [...homeDates, ...awayDates]
    return allBlocked.some(d => d.toISOString().split('T')[0] === dateStr)
  }

  // Função auxiliar: avançar para próximo sábado disponível (mantendo o intervalo semanal)
  function nextAvailableDate(date: Date): Date {
    const next = new Date(date)
    next.setDate(next.getDate() + 7)
    return next
  }

  for (const game of games) {
    // Verificar se a data atual está bloqueada para este jogo específico (ou time do jogo)
    let attempts = 0
    while (
      isDateBlocked(currentDate, game.homeTeamId, game.awayTeamId) &&
      attempts < 52 // máximo 52 semanas de tentativas
    ) {
      currentDate = nextAvailableDate(currentDate)
      gamesOnCurrentDay = 0 // Reiniciar contador de jogos no dia ao mudar de data
      attempts++
    }

    if (gamesOnCurrentDay >= gamesPerDay) {
      currentDate = nextAvailableDate(currentDate)
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

  // 1. Buscar datas bloqueadas de todas as equipes inscritas e confirmadas
  const registrations = await prisma.registration.findMany({
    where: { championshipId, status: 'CONFIRMED' },
    include: {
      blockedDates: true
    }
  })

  // Mapear datas bloqueadas por teamId
  const blockedDatesByTeam = new Map<string, Date[]>()
  for (const reg of registrations) {
    // No schema BlockedDate tem startDate. Usaremos como a data do bloqueio.
    const dates = reg.blockedDates.map(b => new Date(b.startDate))
    blockedDatesByTeam.set(reg.teamId, dates)
  }

  const startDate = championship.startDate
    || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  const turns = championship.turns || 1
  const allGames: GeneratedGame[] = []
  const categoryResults = []

  for (const category of championship.categories) {
    const teams = category.registrations.map((r: any) => ({
      id: r.registration.teamId,
      name: r.registration.team.name
    }))

    if (teams.length < 2) continue

    const rrGames = generateRoundRobin(teams, turns)
    const gamesWithDates = distributeGameDates(
      rrGames,
      startDate,
      championship.endDate || null,
      4,
      blockedDatesByTeam
    )

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

  const totalBlockedDates = Array.from(blockedDatesByTeam.values())
    .reduce((acc, dates) => acc + dates.length, 0)

  const summary = `${allGames.length} jogos gerados para ${categoryResults.length} categorias em ${totalRounds} rodadas${totalBlockedDates > 0 ? ` · ${totalBlockedDates} restrições de datas consideradas` : ''}`

  return {
    success: true,
    totalGames: allGames.length,
    totalBlockedDates,
    categories: categoryResults,
    games: allGames,
    summary
  }
}
