import { prisma } from '@/lib/db'

// ═══════════════════════════════════════════
// CONSTANTES
// ═══════════════════════════════════════════
const GAME_DURATION_MIN = 75
const DAY_START_HOUR = 11  // 08:00 Brasília = 11:00 UTC
const DAY_END_HOUR = 21    // 18:00 Brasília = 21:00 UTC
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

  const format = championship.format || 'todos_contra_todos'
  const turns = championship.turns || 1
  const phases = championship.phases || 1
  const hasPlayoffs = championship.hasPlayoffs || false
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

  // ─────────────────────────────────────────────
  // PASSO 1: Gerar PARES de confronto por categoria
  // Cada par = [homeTeamId, awayTeamId]
  // Com turns=2, cada par gera 2 jogos (ida e volta)
  // ─────────────────────────────────────────────
  type GamePair = {
    homeTeamId: string
    awayTeamId: string
    pairIndex: number  // índice do par (para agrupar ida+volta)
    isReturn: boolean  // false=ida, true=volta
  }

  type CategoryPairs = {
    categoryId: string
    categoryName: string
    teams: number
    pairs: GamePair[]
  }

  const allCategoryPairs: CategoryPairs[] = []

  for (const category of championship.categories) {
    const teams: { id: string; name: string }[] = category.registrations.map((r: any) => ({
      id: r.registration.teamId,
      name: r.registration.team.name
    }))

    if (teams.length < 2) continue

    // Gerar pares únicos (round-robin sem turnos ainda)
    const uniquePairs: { homeTeamId: string; awayTeamId: string }[] = []

    if (format === 'eliminatoria') {
      // Para eliminatória, par = confronto direto
      for (let i = 0; i < teams.length - 1; i += 2) {
        uniquePairs.push({
          homeTeamId: teams[i].id,
          awayTeamId: teams[i + 1]?.id || teams[i].id
        })
      }
    } else {
      // Round-robin: todos contra todos
      for (let i = 0; i < teams.length; i++) {
        for (let j = i + 1; j < teams.length; j++) {
          uniquePairs.push({
            homeTeamId: teams[i].id,
            awayTeamId: teams[j].id
          })
        }
      }
    }

    // Aplicar fieldControl
    const adjustedPairs = uniquePairs.map(p => {
      if (fieldControl === 'fixo') {
        return { homeTeamId: teams[0].id, awayTeamId: p.homeTeamId === teams[0].id ? p.awayTeamId : p.homeTeamId }
      }
      return p
    })

    // Gerar GamePairs com turns
    const gamePairs: GamePair[] = []
    adjustedPairs.forEach((pair, pairIndex) => {
      // Jogo de ida
      gamePairs.push({ ...pair, pairIndex, isReturn: false })
      // Jogo de volta (mesmo pairIndex = mesma fase)
      if (turns >= 2) {
        gamePairs.push({
          homeTeamId: pair.awayTeamId,
          awayTeamId: pair.homeTeamId,
          pairIndex,
          isReturn: true
        })
      }
    })

    allCategoryPairs.push({
      categoryId: category.id,
      categoryName: category.name,
      teams: teams.length,
      pairs: gamePairs
    })
  }

  // ─────────────────────────────────────────────
  // PASSO 2: Distribuir pares em fases
  // REGRA: pares com mesmo pairIndex ficam na MESMA FASE
  // (ida e volta juntos na mesma viagem)
  // ─────────────────────────────────────────────

  // Calcular quantos pares únicos existem por categoria
  const maxUniquePairs = Math.max(
    ...allCategoryPairs.map(cat =>
      cat.pairs.filter(p => !p.isReturn).length
    ),
    0
  )

  // Dividir pares em N fases
  const pairsPerPhase = Math.ceil(maxUniquePairs / phases)

  // Mapear pairIndex → phaseNumber (1-indexed)
  function getPhaseForPair(pairIndex: number): number {
    return Math.min(Math.ceil((pairIndex + 1) / pairsPerPhase), phases)
  }

  // ─────────────────────────────────────────────
  // PASSO 3: Calcular fins de semana para cada fase
  // ─────────────────────────────────────────────

  // Encontrar primeiro sábado após startDate
  function nextSaturday(from: Date): Date {
    const d = new Date(from)
    while (d.getDay() !== 6) d.setDate(d.getDate() + 1)
    d.setUTCHours(DAY_START_HOUR, 0, 0, 0)
    return d
  }

  // Reservar fins de semana para playoffs (últimos da janela)
  let availableEnd = endDate ? new Date(endDate) : null
  const playoffWeekends: Date[] = []

  if (hasPlayoffs && availableEnd) {
    // Reservar 1-2 fins de semana para playoffs no final
    const playoffWeekend = new Date(availableEnd)
    while (playoffWeekend.getDay() !== 6) playoffWeekend.setDate(playoffWeekend.getDate() - 1)
    playoffWeekends.push(new Date(playoffWeekend))
    // Recuar availableEnd para não usar esse fim de semana na fase regular
    availableEnd = new Date(playoffWeekend)
    availableEnd.setDate(availableEnd.getDate() - 7)
  }

  // Calcular início de cada fase (fim de semana)
  const phaseStartDates: Date[] = []
  let currentSaturday = nextSaturday(startDate)

  for (let phase = 1; phase <= phases; phase++) {
    // Verificar se esta data não está nos fins de semana de playoff
    const isPlayoffWeekend = playoffWeekends.some(pw =>
      pw.toISOString().split('T')[0] === currentSaturday.toISOString().split('T')[0]
    )
    if (isPlayoffWeekend) {
      currentSaturday.setDate(currentSaturday.getDate() + 7)
    }

    phaseStartDates.push(new Date(currentSaturday))
    // Próxima fase = 1 semana depois
    currentSaturday = new Date(currentSaturday)
    currentSaturday.setDate(currentSaturday.getDate() + 7)
    currentSaturday.setUTCHours(DAY_START_HOUR, 0, 0, 0)
  }

  // ─────────────────────────────────────────────
  // PASSO 4: Alocar jogos nos dias de cada fase
  // ─────────────────────────────────────────────

  type ScheduledGame = {
    categoryId: string
    homeTeamId: string
    awayTeamId: string
    round: number
    phase: number
    dateTime: Date
  }

  const allScheduled: ScheduledGame[] = []
  let globalRound = 0  // contador global de rodadas

  for (let phaseNum = 1; phaseNum <= phases; phaseNum++) {
    const phaseStart = phaseStartDates[phaseNum - 1]
    if (!phaseStart) continue

    // Coletar todos os jogos desta fase de todas as categorias
    // Intercalando categorias (não colocar todos Sub12 juntos)
    const phaseGames: {
      categoryId: string
      homeTeamId: string
      awayTeamId: string
      pairIndex: number
      isReturn: boolean
    }[] = []

    // Agregar por pairIndex desta fase, intercalando categorias
    const pairIndicesInPhase = Array.from(
      { length: pairsPerPhase },
      (_, i) => (phaseNum - 1) * pairsPerPhase + i
    ).filter(pi => pi < maxUniquePairs)

    // Para cada pairIndex desta fase, adicionar jogos de todas as cats
    // Primeiro todas as idas, depois todas as voltas (para concentrar)
    for (const isReturn of [false, true]) {
      if (!isReturn || turns >= 2) {
        for (const pairIndex of pairIndicesInPhase) {
          for (const catPairs of allCategoryPairs) {
            const matchingGames = catPairs.pairs.filter(
              p => p.pairIndex === pairIndex && p.isReturn === isReturn
            )
            phaseGames.push(...matchingGames.map(g => ({
              categoryId: catPairs.categoryId,
              homeTeamId: g.homeTeamId,
              awayTeamId: g.awayTeamId,
              pairIndex: g.pairIndex,
              isReturn: g.isReturn
            })))
          }
        }
      }
    }

    if (phaseGames.length === 0) continue

    // Calcular quantos dias são necessários
    const daysNeeded = Math.ceil(phaseGames.length / MAX_GAMES_PER_DAY)

    // Construir lista de dias disponíveis para esta fase
    const phaseDays: Date[] = []
    const sat = new Date(phaseStart)
    sat.setUTCHours(DAY_START_HOUR, 0, 0, 0)

    if (daysNeeded >= 3) {
      // Incluir sexta
      const fri = new Date(sat)
      fri.setDate(fri.getDate() - 1)
      fri.setUTCHours(DAY_START_HOUR, 0, 0, 0)
      phaseDays.push(fri)
    }
    phaseDays.push(new Date(sat))  // sábado
    if (daysNeeded >= 2) {
      const sun = new Date(sat)
      sun.setDate(sun.getDate() + 1)
      sun.setUTCHours(DAY_START_HOUR, 0, 0, 0)
      phaseDays.push(sun)  // domingo
    }

    // Distribuir jogos nos dias da fase
    let dayIdx = 0
    let currentTime = new Date(phaseDays[0])
    let gamesToday = 0
    globalRound++

    for (let i = 0; i < phaseGames.length; i++) {
      const game = phaseGames[i]

      // Verificar se muda de dia (ida→volta = nova rodada = novo dia preferencial)
      const prevGame = phaseGames[i - 1]
      const isNewRoundWithin = prevGame &&
        prevGame.isReturn === false && game.isReturn === true

      if (isNewRoundWithin && dayIdx < phaseDays.length - 1) {
        // Jogos de volta começam no próximo dia da fase
        dayIdx++
        currentTime = new Date(phaseDays[dayIdx])
        gamesToday = 0
        globalRound++
      }

      // Se dia cheio, avançar
      if (gamesToday >= MAX_GAMES_PER_DAY || currentTime.getUTCHours() >= DAY_END_HOUR) {
        if (dayIdx < phaseDays.length - 1) {
          dayIdx++
          currentTime = new Date(phaseDays[dayIdx])
          gamesToday = 0
        }
      }

      // Verificar bloqueio
      const blocked = isBlocked(currentTime, game.homeTeamId, game.awayTeamId, blockedMap)
      if (blocked && dayIdx < phaseDays.length - 1) {
        dayIdx++
        currentTime = new Date(phaseDays[dayIdx])
        gamesToday = 0
      }

      allScheduled.push({
        categoryId: game.categoryId,
        homeTeamId: game.homeTeamId,
        awayTeamId: game.awayTeamId,
        round: globalRound,
        phase: phaseNum,
        dateTime: new Date(currentTime)
      })

      currentTime = addMinutes(currentTime, GAME_DURATION_MIN)
      gamesToday++

      if (currentTime.getUTCHours() >= DAY_END_HOUR && dayIdx < phaseDays.length - 1) {
        dayIdx++
        currentTime = new Date(phaseDays[dayIdx])
        gamesToday = 0
      }
    }
  }

  // ─────────────────────────────────────────────
  // PASSO 5: Montar categoryResults
  // ─────────────────────────────────────────────
  const categoryResults = allCategoryPairs.map(cat => ({
    id: cat.categoryId,
    name: cat.categoryName,
    teams: cat.teams,
    gamesCount: allScheduled.filter(g => g.categoryId === cat.categoryId).length,
    games: allScheduled.filter(g => g.categoryId === cat.categoryId)
  }))

  // ─────────────────────────────────────────────
  // PASSO 6: Preview por data
  // ─────────────────────────────────────────────
  const gamesByDate = new Map<string, ScheduledGame[]>()
  for (const game of allScheduled) {
    const key = game.dateTime.toISOString().split('T')[0]
    if (!gamesByDate.has(key)) gamesByDate.set(key, [])
    gamesByDate.get(key)!.push(game)
  }

  const catNameMap = new Map(categoryResults.map(c => [c.id, c.name]))

  const schedulePreview = Array.from(gamesByDate.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, games]) => ({
      date,
      phase: games[0]?.phase || 1,
      dayOfWeek: new Date(date + 'T12:00:00').toLocaleDateString('pt-BR', {
        weekday: 'long'
      }),
      gamesCount: games.length,
      timeSlots: games.map(g => ({
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
        isReturn: (g as any).isReturn || false
      }))
    }))

  const totalBlockedDates = Array.from(blockedMap.values())
    .reduce((acc, arr) => acc + arr.length, 0)

  const totalDays = gamesByDate.size
  const maxPerDay = Math.max(
    ...Array.from(gamesByDate.values()).map(g => g.length), 0
  )

  const totalGames = allScheduled.length

  return {
    success: true,
    totalGames,
    totalBlockedDates,
    totalDays,
    totalPhases: phases,
    maxGamesPerDay: maxPerDay,
    format,
    turns,
    hasPlayoffs,
    playoffWeekends: playoffWeekends.map(d => d.toISOString()),
    schedulePreview,
    categories: categoryResults,
    games: allScheduled,
    summary: [
      `${totalGames} jogos`,
      `${phases} fase(s)`,
      `${totalDays} dias`,
      `${categoryResults.length} categorias`,
      turns === 2 ? 'Ida e volta por fase' : '1 turno',
      format === 'eliminatoria' ? 'Eliminatória' : 'Liga',
      hasPlayoffs ? `+ Playoffs (top ${playoffTeams})` : '',
      totalBlockedDates > 0 ? `${totalBlockedDates} restrições` : ''
    ].filter(Boolean).join(' · ')
  }
}
