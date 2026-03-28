import { prisma } from '@/lib/db'

// ═══════════════════════════════════════════
// CONSTANTES
// ═══════════════════════════════════════════
const GAME_DURATION_MIN   = 75
const DAY_START_HOUR      = 11   // 08:00 BRT = 11:00 UTC
const DAY_END_HOUR        = 21   // 18:00 BRT = 21:00 UTC
const LAST_GAME_START_UTC = 19   // 16:45 BRT = 19:45 UTC (último início)
const MAX_GAMES_PER_DAY   = 8
const LUNCH_BREAK_MIN     = 120  // intervalo almoço
const AFTERNOON_START_UTC = 17   // 14:00 BRT = 17:00 UTC
const MAX_CATS_PER_DAY    = 2    // ABSOLUTO

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

  // PASSO 1: Buscar campeonato
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

  const format       = championship.format       || 'todos_contra_todos'
  const turns        = championship.turns        || 1
  const phases       = championship.phases       || 1
  const hasPlayoffs  = championship.hasPlayoffs  || false
  const playoffTeams = championship.playoffTeams || 4
  const fieldControl = championship.fieldControl || 'alternado'

  // startDate vazio = hoje + 21 dias
  const startDate = championship.startDate
    ? new Date(championship.startDate)
    : new Date(Date.now() + 21 * 24 * 60 * 60 * 1000)
  const endDate = championship.endDate
    ? new Date(championship.endDate)
    : null

  // PASSO 2: Datas bloqueadas
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

  // PASSO 3: Categorias válidas com número de idade
  type Team = { id: string; name: string }
  type CategoryInfo = {
    id: string
    name: string
    ageGroup: number
    teams: Team[]
  }

  const validCategories: CategoryInfo[] = []
  for (const cat of championship.categories) {
    const teams: Team[] = cat.registrations.map((r: any) => ({
      id: r.registration.teamId,
      name: r.registration.team.name
    }))
    if (teams.length < 3) continue
    const ageMatch = cat.name.match(/\d+/)
    const ageGroup = ageMatch ? parseInt(ageMatch[0]) : 0
    validCategories.push({ id: cat.id, name: cat.name, ageGroup, teams })
  }

  if (validCategories.length === 0) {
    throw new Error('Nenhuma categoria com equipes suficientes')
  }

  // PASSO 4: Agrupar categorias (máx 2, sem consecutivas)
  // Ordenar por idade crescente
  const sorted = [...validCategories].sort((a, b) => a.ageGroup - b.ageGroup)

  // Parear primeira metade com segunda metade
  // Ex: [12,13,14,15,16,17] → [12+15, 13+16, 14+17]
  const groups: CategoryInfo[][] = []
  const used = new Set<string>()
  const half = Math.ceil(sorted.length / 2)

  for (let i = 0; i < half; i++) {
    const cat1 = sorted[i]
    const cat2 = sorted[i + half]
    if (!cat1 || used.has(cat1.id)) continue
    const group: CategoryInfo[] = [cat1]
    used.add(cat1.id)
    if (cat2 && !used.has(cat2.id)) {
      group.push(cat2)
      used.add(cat2.id)
    }
    groups.push(group)
  }
  // Categorias restantes
  for (const cat of sorted) {
    if (!used.has(cat.id)) {
      groups.push([cat])
      used.add(cat.id)
    }
  }

  // PASSO 5: Gerar pares únicos por categoria
  type UniquePair = {
    homeTeamId: string
    awayTeamId: string
    pairIndex: number
    categoryId: string
  }

  const pairsByCat = new Map<string, UniquePair[]>()
  let maxPairs = 0

  for (const cat of validCategories) {
    const pairs: UniquePair[] = []
    let idx = 0

    if (format === 'eliminatoria') {
      for (let i = 0; i + 1 < cat.teams.length; i += 2) {
        pairs.push({
          homeTeamId: cat.teams[i].id,
          awayTeamId: cat.teams[i + 1].id,
          pairIndex: idx++,
          categoryId: cat.id
        })
      }
    } else {
      // Todos contra todos
      for (let i = 0; i < cat.teams.length; i++) {
        for (let j = i + 1; j < cat.teams.length; j++) {
          const home = fieldControl === 'fixo'
            ? cat.teams[0]
            : cat.teams[i]
          const away = fieldControl === 'fixo'
            ? (cat.teams[i].id === cat.teams[0].id ? cat.teams[j] : cat.teams[i])
            : cat.teams[j]
          pairs.push({
            homeTeamId: home.id,
            awayTeamId: away.id,
            pairIndex: idx++,
            categoryId: cat.id
          })
        }
      }
    }

    pairsByCat.set(cat.id, pairs)
    if (pairs.length > maxPairs) maxPairs = pairs.length
  }

  // PASSO 6: Calcular capacidade real de jogos por dia por grupo
  const pairsPerPhase = Math.ceil(maxPairs / phases)

  // PASSO 7: Calcular datas das fases para cada grupo
  function nextSaturday(from: Date): Date {
    const d = new Date(from)
    while (d.getDay() !== 6) d.setDate(d.getDate() + 1)
    d.setUTCHours(DAY_START_HOUR, 0, 0, 0)
    return d
  }

  // Reservar fins de semana de playoff no final
  let regularEnd = endDate ? new Date(endDate) : null
  const playoffDates: Date[] = []
  if (hasPlayoffs && regularEnd) {
    const lastSat = nextSaturday(
      new Date(regularEnd.getTime() - 14 * 24 * 60 * 60 * 1000)
    )
    playoffDates.push(lastSat)
    regularEnd = new Date(lastSat.getTime() - 7 * 24 * 60 * 60 * 1000)
  }

  // Calcular data de início de cada fase distribuída
  const firstSat = nextSaturday(startDate)
  const totalPeriodMs = regularEnd
    ? regularEnd.getTime() - firstSat.getTime()
    : phases * 28 * 24 * 60 * 60 * 1000

  const groupPhaseStarts: Date[][] = groups.map((_, gIdx) => {
    const phaseDates: Date[] = []
    for (let p = 0; p < phases; p++) {
      const offset = Math.round((p / phases) * totalPeriodMs)
      const candidate = new Date(firstSat.getTime() + offset)
      const sat = nextSaturday(candidate)
      const phaseDate = new Date(sat)
      if (gIdx % 2 === 1) {
        phaseDate.setDate(phaseDate.getDate() + 1)
      } else if (gIdx >= 2) {
        phaseDate.setDate(phaseDate.getDate() + 7 * Math.floor(gIdx / 2))
      }
      const isPlayoff = playoffDates.some(pd =>
        Math.abs(pd.getTime() - phaseDate.getTime()) < 7 * 24 * 60 * 60 * 1000
      )
      if (isPlayoff) phaseDate.setDate(phaseDate.getDate() + 7)
      phaseDate.setUTCHours(DAY_START_HOUR, 0, 0, 0)
      phaseDates.push(phaseDate)
    }
    return phaseDates
  })

  // PASSO 8: Gerar jogos com horários
  type ScheduledGame = {
    categoryId: string
    homeTeamId: string
    awayTeamId: string
    round: number
    phase: number
    isReturn: boolean
    dateTime: Date
  }

  const allScheduled: ScheduledGame[] = []
  let globalRound = 0

  for (let phaseNum = 1; phaseNum <= phases; phaseNum++) {
    globalRound++

    for (let gIdx = 0; gIdx < groups.length; gIdx++) {
      const group = groups[gIdx]
      const phaseDate = groupPhaseStarts[gIdx][phaseNum - 1]
      if (!phaseDate) continue

      const startPairIdx = (phaseNum - 1) * pairsPerPhase
      const endPairIdx   = Math.min(startPairIdx + pairsPerPhase, maxPairs)

      type Slot = {
        categoryId: string
        homeTeamId: string
        awayTeamId: string
        isReturn: boolean
      }

      const morningSlots: Slot[] = []
      const afternoonSlots: Slot[] = []

      for (let pi = startPairIdx; pi < endPairIdx; pi++) {
        for (const cat of group) {
          const pair = pairsByCat.get(cat.id)?.find(p => p.pairIndex === pi)
          if (!pair) continue
          morningSlots.push({
            categoryId: cat.id,
            homeTeamId: pair.homeTeamId,
            awayTeamId: pair.awayTeamId,
            isReturn: false
          })
          if (turns >= 2) {
            afternoonSlots.push({
              categoryId: cat.id,
              homeTeamId: pair.awayTeamId,
              awayTeamId: pair.homeTeamId,
              isReturn: true
            })
          }
        }
      }

      const slotsPerDay = Math.floor(
        (LAST_GAME_START_UTC - DAY_START_HOUR) * 60 / GAME_DURATION_MIN
      )

      const morningDays = Math.ceil(morningSlots.length / slotsPerDay)
      const afternoonDays = turns >= 2
        ? Math.ceil(afternoonSlots.length / slotsPerDay)
        : 0

      const allFitsOneDay = (
        morningSlots.length <= slotsPerDay &&
        afternoonSlots.length <= slotsPerDay
      )
      const totalDaysNeeded = allFitsOneDay
        ? 1
        : Math.max(morningDays, afternoonDays) + (turns >= 2 ? 1 : 0)

      const phaseDays: Date[] = []
      const baseSat = new Date(phaseDate)
      while (baseSat.getDay() !== 6) baseSat.setDate(baseSat.getDate() - 1)

      if (totalDaysNeeded >= 3) {
        const fri = new Date(baseSat)
        fri.setDate(fri.getDate() - 1)
        fri.setUTCHours(DAY_START_HOUR, 0, 0, 0)
        phaseDays.push(fri)
      }
      baseSat.setUTCHours(DAY_START_HOUR, 0, 0, 0)
      phaseDays.push(new Date(baseSat))
      if (totalDaysNeeded >= 2) {
        const sun = new Date(baseSat)
        sun.setDate(sun.getDate() + 1)
        sun.setUTCHours(DAY_START_HOUR, 0, 0, 0)
        phaseDays.push(sun)
      }

      let dayIdx = 0
      let currentTime = new Date(phaseDays[0])
      let slotsToday = 0

      for (const slot of morningSlots) {
        if (slotsToday >= slotsPerDay && dayIdx < phaseDays.length - 1) {
          dayIdx++
          currentTime = new Date(phaseDays[dayIdx])
          currentTime.setUTCHours(DAY_START_HOUR, 0, 0, 0)
          slotsToday = 0
        }

        allScheduled.push({
          categoryId: slot.categoryId,
          homeTeamId: slot.homeTeamId,
          awayTeamId: slot.awayTeamId,
          round: globalRound,
          phase: phaseNum,
          isReturn: false,
          dateTime: new Date(currentTime)
        })
        currentTime = addMinutes(currentTime, GAME_DURATION_MIN)
        slotsToday++
      }

      if (turns >= 2 && afternoonSlots.length > 0) {
        const afternoonBase = new Date(phaseDays[dayIdx])
        afternoonBase.setUTCHours(AFTERNOON_START_UTC, 0, 0, 0)
        if (currentTime < afternoonBase) {
          currentTime = afternoonBase
        }
        slotsToday = 0

        for (const slot of afternoonSlots) {
          if (slotsToday >= slotsPerDay || currentTime.getUTCHours() > LAST_GAME_START_UTC) {
            if (dayIdx < phaseDays.length - 1) {
              dayIdx++
              currentTime = new Date(phaseDays[dayIdx])
              currentTime.setUTCHours(AFTERNOON_START_UTC, 0, 0, 0)
              slotsToday = 0
            }
          }

          allScheduled.push({
            categoryId: slot.categoryId,
            homeTeamId: slot.homeTeamId,
            awayTeamId: slot.awayTeamId,
            round: globalRound,
            phase: phaseNum,
            isReturn: true,
            dateTime: new Date(currentTime)
          })
          currentTime = addMinutes(currentTime, GAME_DURATION_MIN)
          slotsToday++
        }
      }
    }
  }

  const catNameMap = new Map(validCategories.map(c => [c.id, c.name]))
  const teamNameMap = new Map(validCategories.flatMap(c => c.teams).map(t => [t.id, t.name]))

  // PASSO 9: Montar resultados com nomes
  const gamesWithNames = allScheduled.map(g => ({
    ...g,
    categoryName: catNameMap.get(g.categoryId) || '',
    homeTeamName: teamNameMap.get(g.homeTeamId) || 'Time A',
    awayTeamName: teamNameMap.get(g.awayTeamId) || 'Time B'
  }))

  const categoryResults = validCategories.map(cat => ({
    id: cat.id,
    name: cat.name,
    teams: cat.teams.length,
    gamesCount: gamesWithNames.filter(g => g.categoryId === cat.id).length,
    games: gamesWithNames.filter(g => g.categoryId === cat.id)
  }))

  const gamesByDate = new Map<string, any[]>()
  for (const game of gamesWithNames) {
    const key = game.dateTime.toISOString().split('T')[0]
    if (!gamesByDate.has(key)) gamesByDate.set(key, [])
    gamesByDate.get(key)!.push(game)
  }

  const schedulePreview = Array.from(gamesByDate.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, games]) => {
      const lateGames = games.filter(g => g.dateTime.getUTCHours() > LAST_GAME_START_UTC)
      if (lateGames.length > 0) {
        console.warn(`[Scheduling] ALERTA: ${lateGames.length} jogo(s) após 16:45 em ${date}`)
      }
      return {
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
            categoryName: g.categoryName,
            homeTeamId: g.homeTeamId,
            homeTeamName: g.homeTeamName,
            awayTeamId: g.awayTeamId,
            awayTeamName: g.awayTeamName,
            round: g.round,
            phase: g.phase,
            isReturn: g.isReturn,
            period: g.isReturn ? 'tarde' : 'manhã',
            court: (g as any).court // Placeholder for Task 8
          }))
      }
    })

  const totalBlockedDates = Array.from(blockedMap.values())
    .reduce((acc, arr) => acc + arr.length, 0)

  const groupsDesc = groups.map(g => g.map(c => c.name).join(' + ')).join(', ')

  return {
    success: true,
    totalGames: allScheduled.length,
    totalBlockedDates,
    totalDays: gamesByDate.size,
    totalPhases: phases,
    maxGamesPerDay: Math.max(...Array.from(gamesByDate.values()).map(g => g.length), 0),
    groups: groups.map(g => g.map(c => ({ id: c.id, name: c.name }))),
    format, turns, hasPlayoffs,
    playoffWeekends: playoffDates.map(d => d.toISOString()),
    schedulePreview,
    categories: categoryResults,
    games: allScheduled,
    summary: [
      `${allScheduled.length} jogos`,
      `${phases} fase(s)/viagem(ns)`,
      `${gamesByDate.size} dias`,
      `${validCategories.length} categorias`,
      `Grupos: ${groupsDesc}`,
      turns === 2 ? 'Manhã (ida) + Tarde (volta)' : '1 turno',
      hasPlayoffs ? `+ Playoffs (top ${playoffTeams})` : '',
      totalBlockedDates > 0 ? `${totalBlockedDates} restrições de data` : ''
    ].filter(Boolean).join(' · ')
  }
}
