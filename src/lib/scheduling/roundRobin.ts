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

// CONSTANTES DE AGENDAMENTO
const GAME_DURATION_MINUTES = 75
const DAY_START_HOUR = 8  // 08:00
const DAY_END_HOUR = 18   // 18:00
const MAX_GAMES_PER_DAY = Math.floor((DAY_END_HOUR - DAY_START_HOUR) * 60 / GAME_DURATION_MINUTES) // = 8
const PREFERRED_DAYS = [5, 6, 0] // Sexta=5, Sábado=6, Domingo=0

function isPreferredDay(date: Date): boolean {
  return PREFERRED_DAYS.includes(date.getDay())
}

function nextPreferredDay(date: Date): Date {
  const next = new Date(date)
  next.setDate(next.getDate() + 1)
  while (!isPreferredDay(next)) {
    next.setDate(next.getDate() + 1)
  }
  next.setHours(DAY_START_HOUR, 0, 0, 0)
  return next
}

function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60 * 1000)
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
  endDate: Date | null = null,
  blockedDatesByTeam: Map<string, Date[]> = new Map()
): { homeTeamId: string; awayTeamId: string; round: number; dateTime: Date }[] {
  const result = []

  // Encontrar primeiro dia preferencial a partir da startDate
  let currentDate = new Date(startDate)
  currentDate.setHours(DAY_START_HOUR, 0, 0, 0)

  // Se startDate não é dia preferencial, avança
  if (!isPreferredDay(currentDate)) {
    currentDate = nextPreferredDay(currentDate)
  }

  let currentTime = new Date(currentDate)
  let gamesOnCurrentDay = 0

  function isDateBlockedForGame(date: Date, homeTeamId: string, awayTeamId: string): boolean {
    const dateStr = date.toISOString().split('T')[0]
    const homeDates = blockedDatesByTeam.get(homeTeamId) || []
    const awayDates = blockedDatesByTeam.get(awayTeamId) || []
    return [...homeDates, ...awayDates].some(
      d => d.toISOString().split('T')[0] === dateStr
    )
  }

  for (const game of games) {
    // Se atingiu máximo do dia ou data bloqueada, avança para próximo dia preferencial
    let attempts = 0
    while (
      (gamesOnCurrentDay >= MAX_GAMES_PER_DAY ||
       isDateBlockedForGame(currentTime, game.homeTeamId, game.awayTeamId)) &&
      attempts < 365
    ) {
      currentDate = nextPreferredDay(currentDate)
      currentTime = new Date(currentDate)
      currentTime.setHours(DAY_START_HOUR, 0, 0, 0)
      gamesOnCurrentDay = 0
      attempts++
    }

    result.push({ ...game, dateTime: new Date(currentTime) })

    // Avançar horário para o próximo jogo do mesmo dia
    currentTime = addMinutes(currentTime, GAME_DURATION_MINUTES)
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

  // Agrupar jogos por data para preview
  const gamesByDate = new Map<string, typeof allGames>()
  for (const game of allGames) {
    const dateKey = game.dateTime.toISOString().split('T')[0]
    if (!gamesByDate.has(dateKey)) gamesByDate.set(dateKey, [])
    gamesByDate.get(dateKey)!.push(game)
  }

  const schedulePreview = Array.from(gamesByDate.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, games]) => ({
      date,
      dayOfWeek: new Date(date).toLocaleDateString('pt-BR', { weekday: 'long' }),
      gamesCount: games.length,
      timeSlots: games.map(g => ({
        time: g.dateTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        categoryId: g.categoryId,
        homeTeamId: g.homeTeamId,
        awayTeamId: g.awayTeamId,
        round: g.round
      }))
    }))

  const totalBlockedDates = Array.from(blockedDatesByTeam.values())
    .reduce((acc, dates) => acc + dates.length, 0)

  return {
    success: true,
    totalGames: allGames.length,
    totalBlockedDates,
    totalDays: gamesByDate.size,
    schedulePreview,
    categories: categoryResults,
    games: allGames,
    summary: `${allGames.length} jogos em ${gamesByDate.size} dias (${categoryResults.length} categorias, ${turns} turno(s))`
  }
}
