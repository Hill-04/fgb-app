import { prisma } from '@/lib/db'

// ═══════════════════════════════════════════
// CONSTANTES
// ═══════════════════════════════════════════
const GAME_DURATION_MIN = 75
const DAY_START_HOUR = 11    // 08:00 BRT = 11:00 UTC
const DAY_END_HOUR = 21      // 18:00 BRT = 21:00 UTC
const MAX_GAMES_PER_DAY = 8
const LUNCH_BREAK_MIN = 120  // 2h de intervalo entre manhã e tarde
const AFTERNOON_START_UTC = 17  // 14:00 BRT = 17:00 UTC

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

  // ── PASSO 1: Buscar campeonato e configurações ──────────────
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

  const format      = championship.format      || 'todos_contra_todos'
  const turns       = championship.turns       || 1
  const phases      = championship.phases      || 1
  const hasPlayoffs = championship.hasPlayoffs || false
  const playoffTeams = championship.playoffTeams || 4
  const fieldControl = championship.fieldControl || 'alternado'

  // startDate vazio = data de criação + 21 dias
  const startDate = championship.startDate
    ? new Date(championship.startDate)
    : new Date(Date.now() + 21 * 24 * 60 * 60 * 1000)
  const endDate = championship.endDate ? new Date(championship.endDate) : null

  // ── PASSO 2: Buscar datas bloqueadas das equipes ────────────
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

  // ── PASSO 3: Gerar categorias válidas com equipes ───────────
  type Team = { id: string; name: string }
  type CategoryInfo = {
    id: string
    name: string
    ageGroup: number  // extraído do nome (Sub12 → 12)
    teams: Team[]
  }

  const categories: CategoryInfo[] = []
  for (const cat of championship.categories) {
    const teams: Team[] = cat.registrations.map((r: any) => ({
      id: r.registration.teamId,
      name: r.registration.team.name
    }))
    if (teams.length < 2) continue

    // Extrair número da idade da categoria (Sub12 → 12, Sub 13 → 13)
    const ageMatch = cat.name.match(/\d+/)
    const ageGroup = ageMatch ? parseInt(ageMatch[0]) : 0

    categories.push({ id: cat.id, name: cat.name, ageGroup, teams })
  }

  if (categories.length === 0) {
    throw new Error('Nenhuma categoria com equipes suficientes confirmadas')
  }

  // ── PASSO 4: Agrupar categorias (máx 2, sem consecutivas) ──
  // Ordenar por idade
  const sorted = [...categories].sort((a, b) => a.ageGroup - b.ageGroup)

  // Algoritmo de agrupamento: distribuir evitando consecutivas
  // Estratégia: parear categoria mais nova com a mais velha possível
  // Ex: [12,13,14,15,16,17] → [12+15, 13+16, 14+17]
  const groups: CategoryInfo[][] = []
  const used = new Set<string>()

  // Primeiro: tentar parear com distância máxima de idade
  const half = Math.ceil(sorted.length / 2)
  for (let i = 0; i < half; i++) {
    const cat1 = sorted[i]
    const cat2 = sorted[i + half]
    if (cat1 && !used.has(cat1.id)) {
      const group: CategoryInfo[] = [cat1]
      used.add(cat1.id)
      if (cat2 && !used.has(cat2.id)) {
        group.push(cat2)
        used.add(cat2.id)
      }
      groups.push(group)
    }
  }

  // Categorias restantes (se número ímpar)
  for (const cat of sorted) {
    if (!used.has(cat.id)) {
      groups.push([cat])
      used.add(cat.id)
    }
  }

  // ── PASSO 5: Gerar pares únicos por categoria ───────────────
  type UniquePair = {
    homeTeamId: string
    awayTeamId: string
    pairIndex: number
    categoryId: string
  }

  const pairsByCat = new Map<string, UniquePair[]>()
  let maxPairsAcrossCategories = 0

  for (const cat of categories) {
    const pairs: UniquePair[] = []
    let idx = 0

    if (format === 'eliminatoria') {
      for (let i = 0; i < cat.teams.length - 1; i += 2) {
        pairs.push({
          homeTeamId: cat.teams[i].id,
          awayTeamId: (cat.teams[i+1] || cat.teams[i]).id,
          pairIndex: idx++,
          categoryId: cat.id
        })
      }
    } else {
      // Todos contra todos: pares únicos
      for (let i = 0; i < cat.teams.length; i++) {
        for (let j = i + 1; j < cat.teams.length; j++) {
          let home = cat.teams[i]
          let away = cat.teams[j]
          if (fieldControl === 'fixo') {
            home = cat.teams[0]
            away = cat.teams[i].id === cat.teams[0].id ? cat.teams[j] : cat.teams[i]
          }
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
    if (pairs.length > maxPairsAcrossCategories) {
      maxPairsAcrossCategories = pairs.length
    }
  }

  // ── PASSO 6: Dividir pares em fases ────────────────────────
  const pairsPerPhase = Math.ceil(maxPairsAcrossCategories / phases)

  // ── PASSO 7: Calcular fins de semana disponíveis ────────────
  function nextSaturday(from: Date): Date {
    const d = new Date(from)
    while (d.getDay() !== 6) d.setDate(d.getDate() + 1)
    d.setUTCHours(DAY_START_HOUR, 0, 0, 0)
    return d
  }

  function isDateBlocked(date: Date, teamId: string): boolean {
    const dateStr = date.toISOString().split('T')[0]
    return (blockedMap.get(teamId) || []).some(
      d => d.toISOString().split('T')[0] === dateStr
    )
  }

  // Reservar fins de semana para playoffs
  let regularEndDate = endDate ? new Date(endDate) : null
  const playoffDates: Date[] = []
  if (hasPlayoffs && regularEndDate) {
    const lastSat = nextSaturday(
      new Date(regularEndDate.getTime() - 14 * 24 * 60 * 60 * 1000)
    )
    playoffDates.push(lastSat)
    regularEndDate = new Date(lastSat.getTime() - 7 * 24 * 60 * 60 * 1000)
  }

  // Calcular data de início de cada fase por grupo
  // Distribuindo igualmente no período disponível
  const firstSat = nextSaturday(startDate)
  const periodMs = regularEndDate
    ? regularEndDate.getTime() - firstSat.getTime()
    : phases * 21 * 24 * 60 * 60 * 1000

  // Para cada grupo, calcular as datas das fases
  const groupPhaseStarts: Date[][] = groups.map((_, groupIdx) => {
    const groupDates: Date[] = []
    // Offset inicial do grupo (spread entre sáb e dom)
    const dayOffset = groupIdx % 2  // 0=sáb, 1=dom, 2=sáb...

    for (let p = 0; p < phases; p++) {
      const offset = Math.round((p / phases) * periodMs)
      const candidate = new Date(firstSat.getTime() + offset)
      const sat = nextSaturday(candidate)

      // Aplicar offset de dia do grupo
      const phaseDate = new Date(sat)
      phaseDate.setDate(phaseDate.getDate() + dayOffset)
      // Garantir que não é dia de playoff
      const isPlayoff = playoffDates.some(pd =>
        Math.abs(pd.getTime() - phaseDate.getTime()) < 7 * 24 * 60 * 60 * 1000
      )
      if (isPlayoff) {
        phaseDate.setDate(phaseDate.getDate() + 7)
      }
      phaseDate.setUTCHours(DAY_START_HOUR, 0, 0, 0)
      groupDates.push(phaseDate)
    }
    return groupDates
  })

  // ── PASSO 8: Gerar jogos com horários para cada fase ────────
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
  const AFTERNOON_START_UTC = DAY_START_HOUR + 6  // 14:00 BRT = 17:00 UTC

  for (let phaseNum = 1; phaseNum <= phases; phaseNum++) {
    globalRound++

    for (let groupIdx = 0; groupIdx < groups.length; groupIdx++) {
      const group = groups[groupIdx]
      const phaseDate = groupPhaseStarts[groupIdx][phaseNum - 1]
      if (!phaseDate) continue

      // Pares desta fase para este grupo
      const phaseStartIdx = (phaseNum - 1) * pairsPerPhase
      const phaseEndIdx = Math.min(phaseStartIdx + pairsPerPhase, maxPairsAcrossCategories)

      // Construir lista de jogos intercalados para o dia
      // Lógica: para cada pairIndex desta fase, intercalar categorias do grupo
      // Depois: se turns=2, adicionar voltas (tarde) na mesma intercalação

      type Slot = {
        categoryId: string
        homeTeamId: string
        awayTeamId: string
        isReturn: boolean
        pairIndex: number
      }

      const morningSlots: Slot[] = []
      const afternoonSlots: Slot[] = []

      for (let pi = phaseStartIdx; pi < phaseEndIdx; pi++) {
        for (const cat of group) {
          const pairs = pairsByCat.get(cat.id) || []
          const pair = pairs.find(p => p.pairIndex === pi)
          if (!pair) continue

          morningSlots.push({
            categoryId: cat.id,
            homeTeamId: pair.homeTeamId,
            awayTeamId: pair.awayTeamId,
            isReturn: false,
            pairIndex: pi
          })

          if (turns >= 2) {
            afternoonSlots.push({
              categoryId: cat.id,
              homeTeamId: pair.awayTeamId,
              awayTeamId: pair.homeTeamId,
              isReturn: true,
              pairIndex: pi
            })
          }
        }
      }

      // Calcular quantos dias são necessários
      const morningMinutes = morningSlots.length * GAME_DURATION_MIN
      const afternoonMinutes = afternoonSlots.length * GAME_DURATION_MIN
      const totalMinutes = morningMinutes + (turns >= 2 ? LUNCH_BREAK_MIN + afternoonMinutes : 0)
      const availableMinutes = (DAY_END_HOUR - DAY_START_HOUR) * 60  // 600min = 10h

      // Construir array de dias disponíveis para esta fase/grupo
      const phaseDays: Date[] = [new Date(phaseDate)]
      if (totalMinutes > availableMinutes) {
        // Adicionar domingo
        const sunday = new Date(phaseDate)
        sunday.setDate(sunday.getDate() + (phaseDate.getDay() === 6 ? 1 : 1))
        sunday.setUTCHours(DAY_START_HOUR, 0, 0, 0)
        phaseDays.push(sunday)
      }
      if (totalMinutes > availableMinutes * 2) {
        // Adicionar sexta (antes do sábado)
        const friday = new Date(phaseDate)
        friday.setDate(friday.getDate() - 1)
        friday.setUTCHours(DAY_START_HOUR, 0, 0, 0)
        phaseDays.unshift(friday)
      }

      // Distribuir slots nos dias disponíveis
      let dayIdx = 0
      let currentTime = new Date(phaseDays[0])
      let currentMinutesUsed = 0

      // Primeiro: manhã
      for (const slot of morningSlots) {
        // Verificar se passou das 18h ou excedeu o dia
        if (currentMinutesUsed + GAME_DURATION_MIN > availableMinutes) {
          if (dayIdx < phaseDays.length - 1) {
            dayIdx++
            currentTime = new Date(phaseDays[dayIdx])
            currentMinutesUsed = 0
          }
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
        currentMinutesUsed += GAME_DURATION_MIN
      }

      // Depois: tarde (com intervalo de almoço)
      if (turns >= 2 && afternoonSlots.length > 0) {
        // Calcular início da tarde = após almoço
        // Mínimo: 14:00 BRT = 17:00 UTC
        const afternoonUTC = new Date(phaseDays[dayIdx])
        afternoonUTC.setUTCHours(AFTERNOON_START_UTC, 0, 0, 0)
        currentTime = afternoonUTC
        currentMinutesUsed = (AFTERNOON_START_UTC - DAY_START_HOUR) * 60

        for (const slot of afternoonSlots) {
          if (currentMinutesUsed + GAME_DURATION_MIN > availableMinutes) {
            if (dayIdx < phaseDays.length - 1) {
              dayIdx++
              currentTime = new Date(phaseDays[dayIdx])
              currentTime.setUTCHours(AFTERNOON_START_UTC, 0, 0, 0)
              currentMinutesUsed = (AFTERNOON_START_UTC - DAY_START_HOUR) * 60
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
          currentMinutesUsed += GAME_DURATION_MIN
        }
      }
    }
  }

  // ── PASSO 9: Montar resultados ──────────────────────────────
  const categoryResults = categories.map(cat => ({
    id: cat.id,
    name: cat.name,
    teams: cat.teams.length,
    gamesCount: allScheduled.filter(g => g.categoryId === cat.id).length,
    games: allScheduled.filter(g => g.categoryId === cat.id)
  }))

  const gamesByDate = new Map<string, ScheduledGame[]>()
  for (const game of allScheduled) {
    const key = game.dateTime.toISOString().split('T')[0]
    if (!gamesByDate.has(key)) gamesByDate.set(key, [])
    gamesByDate.get(key)!.push(game)
  }

  const catNameMap = new Map(categories.map(c => [c.id, c.name]))

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

  const groupsDescription = groups.map(g =>
    g.map(c => c.name).join(' + ')
  ).join(', ')

  return {
    success: true,
    totalGames: allScheduled.length,
    totalBlockedDates,
    totalDays: gamesByDate.size,
    totalPhases: phases,
    maxGamesPerDay: Math.max(
      ...Array.from(gamesByDate.values()).map(g => g.length), 0
    ),
    groups: groups.map(g => g.map(c => ({ id: c.id, name: c.name }))),
    format,
    turns,
    hasPlayoffs,
    playoffWeekends: playoffDates.map(d => d.toISOString()),
    schedulePreview,
    categories: categoryResults,
    games: allScheduled,
    summary: [
      `${allScheduled.length} jogos`,
      `${phases} fase(s)/viagem(ns)`,
      `${gamesByDate.size} dias`,
      `${categories.length} categorias`,
      `${groups.length} grupos (${groupsDescription})`,
      turns === 2 ? 'Manhã (ida) + Tarde (volta)' : '1 turno',
      format === 'eliminatoria' ? 'Eliminatória' : 'Liga',
      hasPlayoffs ? `+ Playoffs (top ${playoffTeams})` : '',
      totalBlockedDates > 0 ? `${totalBlockedDates} restrições de data` : ''
    ].filter(Boolean).join(' · ')
  }
}
