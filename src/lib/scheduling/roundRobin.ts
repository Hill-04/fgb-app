import { prisma } from '@/lib/db'

// ═══════════════════════════════════════════
// CONSTANTES
// ═══════════════════════════════════════════
const GAME_DURATION_MIN = 75
const DAY_START_HOUR = 11   // 08:00 BRT = 11:00 UTC
const DAY_END_HOUR = 21     // 18:00 BRT = 21:00 UTC
const MAX_GAMES_PER_DAY = 8

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
// DISTRIBUIÇÃO POR BLOCOS DE RODADA
// Cada rodada = 1 fim de semana isolado
// Jogos concentrados: sáb e dom quando necessário
// ═══════════════════════════════════════════
function distributeAllGames(
  games: PendingGame[],
  startDate: Date,
  endDate: Date | null,
  blockedMap: Map<string, Date[]>
): ScheduledGame[] {
  const result: ScheduledGame[] = []

  // Agrupar jogos por rodada para criar blocos
  const gamesByRound = new Map<number, PendingGame[]>()
  for (const game of games) {
    if (!gamesByRound.has(game.round)) {
      gamesByRound.set(game.round, [])
    }
    gamesByRound.get(game.round)!.push(game)
  }

  // Iniciar no primeiro fim de semana disponível
  let currentWeekStart = new Date(startDate)
  currentWeekStart.setHours(DAY_START_HOUR, 0, 0, 0)

  // Avançar para primeiro sábado (dia 6) disponível
  while (currentWeekStart.getDay() !== 6) {
    currentWeekStart.setDate(currentWeekStart.getDate() + 1)
  }
  currentWeekStart.setHours(DAY_START_HOUR, 0, 0, 0)

  const maxRound = Math.max(...Array.from(gamesByRound.keys()), 0)

  for (let round = 1; round <= maxRound; round++) {
    const roundGames = gamesByRound.get(round) || []
    if (roundGames.length === 0) continue

    // Cada rodada começa no sábado do fim de semana atual
    let currentDay = new Date(currentWeekStart)
    let currentTime = new Date(currentDay)
    currentTime.setHours(DAY_START_HOUR, 0, 0, 0)
    let gamesToday = 0

    for (const game of roundGames) {
      // Verificar se precisa avançar de dia
      let safety = 0
      while (safety < 365) {
        const overMax = gamesToday >= MAX_GAMES_PER_DAY
        const blocked = isBlocked(currentTime, game.homeTeamId, game.awayTeamId, blockedMap)

        if (!overMax && !blocked) break

        if (overMax || blocked) {
          // Tentar o domingo do mesmo fim de semana
          const nextDay = new Date(currentDay)
          nextDay.setDate(nextDay.getDate() + 1)
          nextDay.setHours(DAY_START_HOUR, 0, 0, 0)

          const daysDiff = Math.round((nextDay.getTime() - currentWeekStart.getTime()) / 86400000)

          if (isPreferredDay(nextDay) && daysDiff <= 1) {
            // Usar o domingo do mesmo fim de semana
            currentDay = nextDay
            currentTime = new Date(currentDay)
            currentTime.setHours(DAY_START_HOUR, 0, 0, 0)
            gamesToday = 0
          } else {
            // Sem espaço neste fim de semana, usar próximo
            // (será corrigido no bloco de avanço de semana abaixo)
            currentDay = nextDay
            currentTime = new Date(currentDay)
            currentTime.setHours(DAY_START_HOUR, 0, 0, 0)
            gamesToday = 0
          }
        }
        safety++
      }

      result.push({ ...game, dateTime: new Date(currentTime) })

      // Avançar horário
      currentTime = addMinutes(currentTime, GAME_DURATION_MIN)
      gamesToday++

      // Se passou das 18h, tentar o domingo
      if (currentTime.getHours() >= DAY_END_HOUR) {
        const nextDay = new Date(currentDay)
        nextDay.setDate(nextDay.getDate() + 1)
        nextDay.setHours(DAY_START_HOUR, 0, 0, 0)

        const daysDiff = Math.round((nextDay.getTime() - currentWeekStart.getTime()) / 86400000)

        if (isPreferredDay(nextDay) && daysDiff <= 1) {
          currentDay = nextDay
          currentTime = new Date(currentDay)
          currentTime.setHours(DAY_START_HOUR, 0, 0, 0)
          gamesToday = 0
        } else {
          // Estouro: anotar mas deixar o próximo bloco avançar
          currentDay = nextDay
          currentTime = new Date(currentDay)
          gamesToday = 0
        }
      }
    }

    // Avançar para o próximo fim de semana (sábado seguinte)
    const nextSaturday = new Date(currentWeekStart)
    nextSaturday.setDate(nextSaturday.getDate() + 7)
    nextSaturday.setHours(DAY_START_HOUR, 0, 0, 0)
    currentWeekStart = nextSaturday
  }

  return result
}


// ═══════════════════════════════════════════
// FUNÇÃO PRINCIPAL
// ═══════════════════════════════════════════
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

  const format     = championship.format      || 'todos_contra_todos'
  const turns      = championship.turns       || 1
  const phases     = championship.phases      || 1
  const hasPlayoffs  = championship.hasPlayoffs  || false
  const playoffTeams = championship.playoffTeams || 4
  const fieldControl = championship.fieldControl || 'alternado'

  const startDate = championship.startDate
    ? new Date(championship.startDate)
    : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  const endDate = championship.endDate ? new Date(championship.endDate) : null

  // Buscar datas bloqueadas
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

  // ─────────────────────────────────────────
  // PASSO 1: Gerar pares únicos por categoria
  // Um "par" = 2 equipes que vão se enfrentar
  // Com turns=2: se enfrentam 2x (ida+volta) na MESMA FASE
  // ─────────────────────────────────────────

  type UniquePair = {
    homeTeamId: string
    awayTeamId: string
    pairIndex: number
  }

  type CategoryData = {
    id: string
    name: string
    teams: number
    pairs: UniquePair[]
  }

  const MAX_CATS_PER_DAY = 2
  const LUNCH_BREAK_MIN = 120
  const DAY_START_UTC = DAY_START_HOUR  // 11 UTC = 08 BRT

  const categoryDataList: CategoryData[] = []

  for (const category of championship.categories) {
    const teams = category.registrations.map((r: any) => ({
      id: r.registration.teamId,
      name: r.registration.team.name
    }))
    if (teams.length < 2) continue

    const pairs: UniquePair[] = []
    let pairIndex = 0

    if (format === 'eliminatoria') {
      for (let i = 0; i < teams.length - 1; i += 2) {
        const away = teams[i + 1] || teams[i]
        const home = fieldControl === 'fixo' ? teams[0] : teams[i]
        pairs.push({ homeTeamId: home.id, awayTeamId: away.id, pairIndex: pairIndex++ })
      }
    } else {
      // Todos contra todos: pares únicos
      for (let i = 0; i < teams.length; i++) {
        for (let j = i + 1; j < teams.length; j++) {
          const home = fieldControl === 'fixo' ? teams[0] : teams[i]
          const away = fieldControl === 'fixo'
            ? (teams[i].id === teams[0].id ? teams[j] : teams[i])
            : teams[j]
          pairs.push({ homeTeamId: home.id, awayTeamId: away.id, pairIndex: pairIndex++ })
        }
      }
    }

    categoryDataList.push({
      id: category.id,
      name: category.name,
      teams: teams.length,
      pairs
    })
  }

  const totalCategories = categoryDataList.length
  if (totalCategories === 0) throw new Error('Nenhuma categoria com equipes suficientes')

  // Número máximo de pares únicos (para distribuir em fases)
  const maxPairs = Math.max(...categoryDataList.map(c => c.pairs.length), 0)
  const pairsPerPhase = Math.ceil(maxPairs / phases)

  // ─────────────────────────────────────────
  // PASSO 2: Calcular datas das fases
  // Distribuir fases igualmente no período disponível
  // ─────────────────────────────────────────

  function nextSaturday(from: Date): Date {
    const d = new Date(from)
    while (d.getDay() !== 6) d.setDate(d.getDate() + 1)
    d.setUTCHours(DAY_START_HOUR, 0, 0, 0)
    return d
  }

  // Reservar fins de semana de playoff no final do período
  let regularEndDate = endDate ? new Date(endDate) : null
  const playoffDates: Date[] = []

  if (hasPlayoffs && regularEndDate) {
    const lastSat = nextSaturday(
      new Date(regularEndDate.getTime() - 14 * 24 * 60 * 60 * 1000)
    )
    playoffDates.push(lastSat)
    regularEndDate = new Date(lastSat.getTime() - 7 * 24 * 60 * 60 * 1000)
  }

  // Calcular datas de início de cada fase distribuídas igualmente
  const firstSat = nextSaturday(startDate)
  const periodMs = regularEndDate
    ? regularEndDate.getTime() - firstSat.getTime()
    : phases * 14 * 24 * 60 * 60 * 1000

  const phaseStartDates: Date[] = []
  for (let p = 0; p < phases; p++) {
    const offset = Math.round((p / phases) * periodMs)
    const candidateDate = new Date(firstSat.getTime() + offset)
    const sat = nextSaturday(candidateDate)
    // Garantir que não cai em fim de semana de playoff
    const isPlayoff = playoffDates.some(pd =>
      Math.abs(pd.getTime() - sat.getTime()) < 7 * 24 * 60 * 60 * 1000
    )
    if (isPlayoff && p < phases - 1) {
      sat.setDate(sat.getDate() + 7)
    }
    phaseStartDates.push(sat)
  }

  // ─────────────────────────────────────────
  // PASSO 3: Para cada fase, organizar jogos em dias
  // Regra: máx 2 categorias por dia
  // Com turns=2: manhã=ida, tarde=volta (mesmo dia, mesmo par)
  // ─────────────────────────────────────────

  const allScheduled: any[] = []
  let globalRound = 0

  for (let phaseNum = 1; phaseNum <= phases; phaseNum++) {
    const phaseSaturday = phaseStartDates[phaseNum - 1]
    if (!phaseSaturday) continue

    // Pares desta fase (por índice)
    const phaseStartPairIdx = (phaseNum - 1) * pairsPerPhase
    const phaseEndPairIdx = Math.min(phaseStartPairIdx + pairsPerPhase, maxPairs)

    // Montar lista de slots de jogo para esta fase
    type Slot = {
      categoryId: string
      homeTeamId: string
      awayTeamId: string
      isReturn: boolean
    }

    const slotsIda: Slot[] = []
    const slotsVolta: Slot[] = []

    for (let pi = phaseStartPairIdx; pi < phaseEndPairIdx; pi++) {
      for (const cat of categoryDataList) {
        const pair = cat.pairs.find(p => p.pairIndex === pi)
        if (!pair) continue
        slotsIda.push({
          categoryId: cat.id,
          homeTeamId: pair.homeTeamId,
          awayTeamId: pair.awayTeamId,
          isReturn: false
        })
        if (turns >= 2) {
          slotsVolta.push({
            categoryId: cat.id,
            homeTeamId: pair.awayTeamId,
            awayTeamId: pair.homeTeamId,
            isReturn: true
          })
        }
      }
    }

    // Agrupar slots em DIAS respeitando MAX_CATS_PER_DAY
    type DaySchedule = {
      date: Date
      slotsIda: Slot[]
      slotsVolta: Slot[]
    }

    function groupSlotsByDay(
      idaSlots: Slot[],
      voltaSlots: Slot[],
      startSaturday: Date
    ): DaySchedule[] {
      const days: DaySchedule[] = []

      const idaByCat = new Map<string, Slot[]>()
      for (const slot of idaSlots) {
        if (!idaByCat.has(slot.categoryId)) idaByCat.set(slot.categoryId, [])
        idaByCat.get(slot.categoryId)!.push(slot)
      }

      const voltaByCat = new Map<string, Slot[]>()
      for (const slot of voltaSlots) {
        if (!voltaByCat.has(slot.categoryId)) voltaByCat.set(slot.categoryId, [])
        voltaByCat.get(slot.categoryId)!.push(slot)
      }

      const catIds = Array.from(idaByCat.keys())

      let dayOffset = 0
      for (let i = 0; i < catIds.length; i += MAX_CATS_PER_DAY) {
        const catsThisDay = catIds.slice(i, i + MAX_CATS_PER_DAY)

        let dayDate = new Date(startSaturday)
        dayDate.setDate(dayDate.getDate() + dayOffset)
        if (dayOffset > 0 && !isPreferredDay(dayDate)) {
          dayOffset++
          dayDate.setDate(dayDate.getDate() + 1)
        }
        dayDate.setUTCHours(DAY_START_HOUR, 0, 0, 0)

        const dayIda: Slot[] = []
        const dayVolta: Slot[] = []
        for (const catId of catsThisDay) {
          dayIda.push(...(idaByCat.get(catId) || []))
          dayVolta.push(...(voltaByCat.get(catId) || []))
        }

        days.push({ date: dayDate, slotsIda: dayIda, slotsVolta: dayVolta })
        dayOffset++
      }
      return days
    }

    const phaseDays = groupSlotsByDay(slotsIda, slotsVolta, phaseSaturday)
    globalRound++

    for (const day of phaseDays) {
      let morningTime = new Date(day.date)
      morningTime.setUTCHours(DAY_START_HOUR, 0, 0, 0)

      for (const slot of day.slotsIda) {
        allScheduled.push({
          categoryId: slot.categoryId,
          homeTeamId: slot.homeTeamId,
          awayTeamId: slot.awayTeamId,
          round: globalRound,
          phase: phaseNum,
          isReturn: false,
          dateTime: new Date(morningTime)
        })
        morningTime = addMinutes(morningTime, GAME_DURATION_MIN)
      }

      if (turns >= 2 && day.slotsVolta.length > 0) {
        let afternoonStart = addMinutes(morningTime, LUNCH_BREAK_MIN)
        const minAfternoonUTC = new Date(day.date)
        minAfternoonUTC.setUTCHours(17, 0, 0, 0) // 14:00 BRT
        if (afternoonStart < minAfternoonUTC) afternoonStart = minAfternoonUTC

        let afternoonTime = new Date(afternoonStart)

        for (const slot of day.slotsVolta) {
          allScheduled.push({
            categoryId: slot.categoryId,
            homeTeamId: slot.homeTeamId,
            awayTeamId: slot.awayTeamId,
            round: globalRound,
            phase: phaseNum,
            isReturn: true,
            dateTime: new Date(afternoonTime)
          })
          afternoonTime = addMinutes(afternoonTime, GAME_DURATION_MIN)
        }
      }
    }
  }

  // ─────────────────────────────────────────
  // PASSO 4: Montar resultados
  // ─────────────────────────────────────────

  const categoryResults = categoryDataList.map(cat => ({
    id: cat.id,
    name: cat.name,
    teams: cat.teams,
    gamesCount: allScheduled.filter(g => g.categoryId === cat.id).length,
    games: allScheduled.filter(g => g.categoryId === cat.id)
  }))

  const gamesByDate = new Map<string, any[]>()
  for (const game of allScheduled) {
    const key = game.dateTime.toISOString().split('T')[0]
    if (!gamesByDate.has(key)) gamesByDate.set(key, [])
    gamesByDate.get(key)!.push(game)
  }

  const catNameMap = new Map(categoryDataList.map(c => [c.id, c.name]))

  const schedulePreview = Array.from(gamesByDate.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, games]) => ({
      date,
      phase: games[0]?.phase || 1,
      dayOfWeek: new Date(date + 'T12:00:00').toLocaleDateString('pt-BR', {
        weekday: 'long'
      }),
      gamesCount: games.length,
      categories: [...new Set(games.map(g => catNameMap.get(g.categoryId) || ''))],
      timeSlots: games
        .sort((a, b) => a.dateTime.getTime() - b.dateTime.getTime())
        .map(g => ({
          time: g.dateTime.toLocaleTimeString('pt-BR', {
            hour: '2-digit', minute: '2-digit',
            timeZone: 'America/Sao_Paulo'
          }),
          categoryId: g.categoryId,
          categoryName: catNameMap.get(g.categoryId) || '',
          homeTeamId: g.homeTeamId,
          awayTeamId: g.awayTeamId,
          round: g.round,
          phase: g.phase,
          isReturn: g.isReturn,
          period: g.isReturn ? 'tarde' : 'manhã'
        }))
    }))

  const totalBlockedDates = Array.from(blockedMap.values())
    .reduce((acc, arr) => acc + arr.length, 0)

  const totalDays = gamesByDate.size
  const maxPerDay = Math.max(
    ...Array.from(gamesByDate.values()).map(g => g.length), 0
  )

  return {
    success: true,
    totalGames: allScheduled.length,
    totalBlockedDates,
    totalDays,
    totalPhases: phases,
    maxGamesPerDay: maxPerDay,
    format,
    turns,
    hasPlayoffs,
    playoffWeekends: playoffDates.map(d => d.toISOString()),
    schedulePreview,
    categories: categoryResults,
    games: allScheduled,
    summary: [
      `${allScheduled.length} jogos`,
      `${phases} viagem(ns)`,
      `${totalDays} dias`,
      `${categoryDataList.length} categorias`,
      `máx ${MAX_CATS_PER_DAY} cats/dia`,
      turns === 2 ? 'Manhã (ida) + Tarde (volta)' : '1 turno',
      hasPlayoffs ? `+ Playoffs (top ${playoffTeams})` : '',
      totalBlockedDates > 0 ? `${totalBlockedDates} restrições` : ''
    ].filter(Boolean).join(' · ')
  }
}
