import { prisma } from '@/lib/db'

// ═══════════════════════════════════════════
// CONSTANTES
// ═══════════════════════════════════════════
const GAME_DURATION_MIN = 75
const DAY_START_HOUR = 8
const DAY_END_HOUR = 18
const MAX_GAMES_PER_DAY = Math.floor(
  ((DAY_END_HOUR - DAY_START_HOUR) * 60) / GAME_DURATION_MIN
) // = 8

// Sexta=5, Sábado=6, Domingo=0
const PREFERRED_WEEKDAYS = [5, 6, 0]

// ═══════════════════════════════════════════
// TIPOS
// ═══════════════════════════════════════════
type Team = { id: string; name: string }

type PendingGame = {
  categoryId: string
  homeTeamId: string
  awayTeamId: string
  round: number
  phase: number
}

type ScheduledGame = PendingGame & { dateTime: Date }

type CategoryResult = {
  id: string
  name: string
  teams: number
  gamesCount: number
  games: ScheduledGame[]
}

// ═══════════════════════════════════════════
// HELPERS DE DATA
// ═══════════════════════════════════════════
function isPreferredDay(date: Date): boolean {
  return PREFERRED_WEEKDAYS.includes(date.getDay())
}

function nextPreferredDay(from: Date): Date {
  const d = new Date(from)
  d.setDate(d.getDate() + 1)
  while (!isPreferredDay(d)) d.setDate(d.getDate() + 1)
  d.setHours(DAY_START_HOUR, 0, 0, 0)
  d.setMilliseconds(0)
  return d
}

function addMinutes(date: Date, min: number): Date {
  return new Date(date.getTime() + min * 60_000)
}

function sameDay(a: Date, b: Date): boolean {
  return a.toISOString().split('T')[0] === b.toISOString().split('T')[0]
}

function isBlocked(
  date: Date,
  homeTeamId: string,
  awayTeamId: string,
  blockedMap: Map<string, Date[]>
): boolean {
  const dateStr = date.toISOString().split('T')[0]
  const check = (id: string) =>
    (blockedMap.get(id) || []).some(
      d => d.toISOString().split('T')[0] === dateStr
    )
  return check(homeTeamId) || check(awayTeamId)
}

// ═══════════════════════════════════════════
// GERAÇÃO ROUND-ROBIN
// ═══════════════════════════════════════════
export function generateRoundRobin(
  teams: Team[],
  turns: number = 1
): { homeTeamId: string; awayTeamId: string; round: number }[] {
  if (teams.length < 2) return []

  const ids = [...teams.map(t => t.id)]
  if (ids.length % 2 !== 0) ids.push('BYE')

  const total = ids.length
  const rounds = total - 1
  const games: { homeTeamId: string; awayTeamId: string; round: number }[] = []

  for (let round = 0; round < rounds; round++) {
    for (let i = 0; i < total / 2; i++) {
      const home = ids[i]
      const away = ids[total - 1 - i]
      if (home !== 'BYE' && away !== 'BYE') {
        games.push({ homeTeamId: home, awayTeamId: away, round: round + 1 })
        // Turno duplo: jogo de volta com mando invertido
        if (turns >= 2) {
          games.push({
            homeTeamId: away,
            awayTeamId: home,
            round: rounds + round + 1
          })
        }
      }
    }
    // Rotação de Berger
    ids.splice(1, 0, ids.pop()!)
  }

  return games
}

// ═══════════════════════════════════════════
// GERAÇÃO ELIMINATÓRIA
// ═══════════════════════════════════════════
function generateKnockout(
  teams: Team[]
): { homeTeamId: string; awayTeamId: string; round: number }[] {
  // Eliminatória simples: semeia times e gera confrontos
  const games: { homeTeamId: string; awayTeamId: string; round: number }[] = []
  const bracketSize = Math.pow(2, Math.ceil(Math.log2(teams.length)))
  const seeded = [...teams]

  // Preencher com BYEs se necessário
  while (seeded.length < bracketSize) {
    seeded.push({ id: 'BYE', name: 'BYE' })
  }

  let round = 1
  let currentRound = seeded

  while (currentRound.length > 1) {
    const nextRound: Team[] = []
    for (let i = 0; i < currentRound.length; i += 2) {
      const home = currentRound[i]
      const away = currentRound[i + 1]
      if (home.id !== 'BYE' && away.id !== 'BYE') {
        games.push({ homeTeamId: home.id, awayTeamId: away.id, round })
      }
      // Vencedor avança (placeholder para estrutura)
      nextRound.push(home)
    }
    currentRound = nextRound
    round++
  }

  return games
}

// ═══════════════════════════════════════════
// DISTRIBUIÇÃO GLOBAL DE DATAS
// (intercala categorias, respeita máx/dia e bloqueios)
// ═══════════════════════════════════════════
function distributeAllGames(
  games: PendingGame[],
  startDate: Date,
  endDate: Date | null,
  blockedMap: Map<string, Date[]>
): ScheduledGame[] {
  const result: ScheduledGame[] = []

  // Iniciar no primeiro dia preferencial a partir de startDate
  let currentDay = new Date(startDate)
  currentDay.setHours(DAY_START_HOUR, 0, 0, 0)
  if (!isPreferredDay(currentDay)) {
    currentDay = nextPreferredDay(currentDay)
  }

  let currentTime = new Date(currentDay)
  let gamesToday = 0

  for (const game of games) {
    // Avançar dia se: (1) atingiu máximo do dia, (2) data bloqueada
    let safety = 0
    while (safety < 365) {
      const overMax = gamesToday >= MAX_GAMES_PER_DAY
      const blocked = isBlocked(currentTime, game.homeTeamId, game.awayTeamId, blockedMap)
      
      if (!overMax && !blocked) break

      if (overMax || blocked) {
        currentDay = nextPreferredDay(currentDay)
        currentTime = new Date(currentDay)
        gamesToday = 0
      }

      safety++
    }

    result.push({ ...game, dateTime: new Date(currentTime) })

    // Avançar horário
    currentTime = addMinutes(currentTime, GAME_DURATION_MIN)
    gamesToday++

    // Se passou das 18h, avança para próximo dia preferencial
    if (currentTime.getHours() >= DAY_END_HOUR) {
      currentDay = nextPreferredDay(currentDay)
      currentTime = new Date(currentDay)
      gamesToday = 0
    }
  }

  return result
}

// ═══════════════════════════════════════════
// FUNÇÃO PRINCIPAL
// ═══════════════════════════════════════════
export async function generateChampionshipSchedule(championshipId: string) {
  // 1. Buscar campeonato com todas as configs e categorias
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

  // 2. Extrair configurações do campeonato
  const format = championship.format || 'todos_contra_todos'
  const turns = championship.turns || 1
  const hasPlayoffs = championship.hasPlayoffs || false
  const playoffTeams = championship.playoffTeams || 4
  const fieldControl = championship.fieldControl || 'alternado'
  const startDate = championship.startDate
    ? new Date(championship.startDate)
    : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  const endDate = championship.endDate ? new Date(championship.endDate) : null

  console.log(`[Scheduling] Campeonato: ${championship.name}`)
  console.log(`[Scheduling] Formato: ${format} | Turnos: ${turns} | Playoffs: ${hasPlayoffs}`)
  console.log(`[Scheduling] Período: ${startDate.toLocaleDateString('pt-BR')} → ${endDate?.toLocaleDateString('pt-BR') || 'sem fim definido'}`)

  // 3. Buscar datas bloqueadas das equipes
  const registrations = await prisma.registration.findMany({
    where: { championshipId, status: 'CONFIRMED' },
    include: { blockedDates: true }
  })

  const blockedMap = new Map<string, Date[]>()
  for (const reg of registrations) {
    const dates = reg.blockedDates.map((b: any) =>
      new Date(b.startDate || b.date || b.blockedDate)
    )
    if (dates.length > 0) blockedMap.set(reg.teamId, dates)
  }

  // 4. Gerar jogos por categoria conforme o formato
  const pendingByRound = new Map<number, PendingGame[]>()
  const categoryResults: CategoryResult[] = []

  for (const category of championship.categories) {
    const teams: Team[] = category.registrations.map((r: any) => ({
      id: r.registration.teamId,
      name: r.registration.team.name
    }))

    if (teams.length < 2) continue

    let rawGames: { homeTeamId: string; awayTeamId: string; round: number }[] = []

    if (format === 'eliminatoria') {
      // Eliminatória simples
      rawGames = generateKnockout(teams)
    } else {
      // Todos contra todos (padrão) ou grupos+mata-mata
      rawGames = generateRoundRobin(teams, turns)
    }

    // Aplicar mando de quadra conforme fieldControl
    const processedGames = rawGames.map((g, idx) => {
      if (fieldControl === 'neutro') {
        // Sem mando definido — manter como está
        return g
      }
      if (fieldControl === 'fixo') {
        // Time da casa sempre é o mesmo (primeiro inscrito)
        const firstTeam = teams[0].id
        return {
          ...g,
          homeTeamId: firstTeam,
          awayTeamId: g.homeTeamId === firstTeam ? g.awayTeamId : g.homeTeamId
        }
      }
      // alternado (padrão): manter como gerado pelo round-robin
      return g
    })

    const pending: PendingGame[] = processedGames.map(g => ({
      categoryId: category.id,
      homeTeamId: g.homeTeamId,
      awayTeamId: g.awayTeamId,
      round: g.round,
      phase: 1
    }))

    // Agrupar por rodada para intercalação
    for (const game of pending) {
      if (!pendingByRound.has(game.round)) {
        pendingByRound.set(game.round, [])
      }
      pendingByRound.get(game.round)!.push(game)
    }

    categoryResults.push({
      id: category.id,
      name: category.name,
      teams: teams.length,
      gamesCount: pending.length,
      games: [] // será preenchido após distribuição
    })
  }

  // 5. INTERCALAR jogos por rodada entre categorias
  // Garante que numa mesma data haverá jogos de categorias diferentes
  const maxRound = Math.max(...Array.from(pendingByRound.keys()), 0)
  const interleavedGames: PendingGame[] = []

  for (let round = 1; round <= maxRound; round++) {
    const roundGames = pendingByRound.get(round) || []
    interleavedGames.push(...roundGames)
  }

  // 6. Distribuir datas GLOBALMENTE para todos os jogos de uma vez
  const scheduled = distributeAllGames(
    interleavedGames,
    startDate,
    endDate,
    blockedMap
  )

  // 7. Preencher games por categoria com as datas
  for (const catResult of categoryResults) {
    catResult.games = scheduled.filter(g => g.categoryId === catResult.id)
    catResult.gamesCount = catResult.games.length
  }

  // 8. Construir preview agrupado por data
  const gamesByDate = new Map<string, ScheduledGame[]>()
  for (const game of scheduled) {
    const key = game.dateTime.toISOString().split('T')[0]
    if (!gamesByDate.has(key)) gamesByDate.set(key, [])
    gamesByDate.get(key)!.push(game)
  }

  // Mapear categoryId → name para o preview
  const catNameMap = new Map(categoryResults.map(c => [c.id, c.name]))

  const schedulePreview = Array.from(gamesByDate.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, games]) => ({
      date,
      dayOfWeek: new Date(date + 'T12:00:00').toLocaleDateString('pt-BR', {
        weekday: 'long'
      }),
      gamesCount: games.length,
      timeSlots: games.map(g => ({
        time: g.dateTime.toLocaleTimeString('pt-BR', {
          hour: '2-digit',
          minute: '2-digit'
        }),
        categoryId: g.categoryId,
        categoryName: catNameMap.get(g.categoryId) || '',
        homeTeamId: g.homeTeamId,
        awayTeamId: g.awayTeamId,
        round: g.round
      }))
    }))

  const totalBlockedDates = Array.from(blockedMap.values())
    .reduce((acc, arr) => acc + arr.length, 0)

  const totalDays = gamesByDate.size
  const maxPerDay = Math.max(
    ...Array.from(gamesByDate.values()).map(g => g.length),
    0
  )

  // Log de validação
  console.log(`[Scheduling] Total jogos: ${scheduled.length}`)
  console.log(`[Scheduling] Dias necessários: ${totalDays}`)
  console.log(`[Scheduling] Máx jogos/dia: ${maxPerDay} (limite: ${MAX_GAMES_PER_DAY})`)
  console.log(`[Scheduling] Restrições de datas: ${totalBlockedDates}`)

  return {
    success: true,
    totalGames: scheduled.length,
    totalBlockedDates,
    totalDays,
    maxGamesPerDay: maxPerDay,
    format,
    turns,
    hasPlayoffs,
    schedulePreview,
    categories: categoryResults,
    games: scheduled,
    summary: [
      `${scheduled.length} jogos`,
      `${totalDays} dias`,
      `${categoryResults.length} categorias`,
      `${turns} turno(s)`,
      format === 'eliminatoria' ? 'Eliminatória' : 'Liga',
      hasPlayoffs ? `Playoffs (top ${playoffTeams})` : '',
      totalBlockedDates > 0 ? `${totalBlockedDates} restrições` : ''
    ]
      .filter(Boolean)
      .join(' · ')
  }
}
