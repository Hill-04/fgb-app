import { prisma } from '@/lib/db'
import { scheduleGamesByTimeWindow, type GameToSchedule, type ScheduledGame } from '@/lib/calendar/time-window-scheduler'
import { BlockFormat } from '@/lib/championship/time-window'
import { addDays } from 'date-fns'
import { countDistinctDateBlocks } from '@/lib/calendar/summary'
import { assignPhasesToGroups } from '@/lib/calendar/grouping'

// ═══════════════════════════════════════════
// TIPOS
// ═══════════════════════════════════════════
type Team = { id: string; name: string }

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
        if (turns >= 2) {
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

  const format              = championship.format              || 'todos_contra_todos'
  const turns               = championship.turns               || 1
  const phases              = championship.phases              || 1
  const hasPlayoffs         = championship.hasPlayoffs         || false
  const playoffTeams        = championship.playoffTeams        || 4
  const fieldControl        = championship.fieldControl        || 'alternado'
  const numberOfCourts      = (championship as any).numberOfCourts      || 1
  const dayStartTime        = (championship as any).dayStartTime        || '08:00'
  const regularDayEndTime   = (championship as any).regularDayEndTime   || '19:00'
  const extendedDayEndTime  = (championship as any).extendedDayEndTime  || '20:30'
  const slotDurationMinutes = (championship as any).slotDurationMinutes || 75
  const minRestSlotsPerTeam = (championship as any).minRestSlotsPerTeam || 1
  const blockFormat         = ((championship as any).blockFormat        || 'SAT_SUN') as BlockFormat

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

  // PASSO 3: Categorias válidas
  type CategoryInfo = {
    id: string
    name: string
    ageGroup: number
    teams: (Team & { city: string | null })[]
  }

  const validCategories: CategoryInfo[] = []
  for (const cat of championship.categories) {
    const teams = cat.registrations.map((r: any) => ({
      id: r.registration.teamId,
      name: r.registration.team.name,
      city: r.registration.team.city
    }))
    if (teams.length < 3) continue
    const ageMatch = cat.name.match(/\d+/)
    const ageGroup = ageMatch ? parseInt(ageMatch[0]) : 0
    validCategories.push({ id: cat.id, name: cat.name, ageGroup, teams })
  }

  if (validCategories.length === 0) {
    throw new Error('Nenhuma categoria com equipes suficientes')
  }

  // PASSO 4: Agrupar categorias
  const sorted = [...validCategories].sort((a, b) => a.ageGroup - b.ageGroup)
  const groups: CategoryInfo[][] = []
  const used = new Set<string>()
  const half = Math.ceil(sorted.length / 2)

  for (let i = 0; i < half; i++) {
    const cat1 = sorted[i]
    if (used.has(cat1.id)) continue
    const group: CategoryInfo[] = [cat1]
    used.add(cat1.id)
    const cat2 = sorted[i + half]
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
        pairs.push({ homeTeamId: cat.teams[i].id, awayTeamId: cat.teams[i + 1].id, pairIndex: idx++, categoryId: cat.id })
      }
    } else {
      for (let i = 0; i < cat.teams.length; i++) {
        for (let j = i + 1; j < cat.teams.length; j++) {
          const home = fieldControl === 'fixo' ? cat.teams[0] : cat.teams[i]
          const away = fieldControl === 'fixo' ? (cat.teams[i].id === cat.teams[0].id ? cat.teams[j] : cat.teams[i]) : cat.teams[j]
          pairs.push({ homeTeamId: home.id, awayTeamId: away.id, pairIndex: idx++, categoryId: cat.id })
        }
      }
    }
    pairsByCat.set(cat.id, pairs)
    if (pairs.length > maxPairs) maxPairs = pairs.length
  }

  const pairsPerPhase = Math.ceil(maxPairs / phases)
  const allGamesToSchedule: GameToSchedule[] = []
  let globalRound = 0

  for (let phaseNum = 1; phaseNum <= phases; phaseNum++) {
    globalRound++
    const startPairIdx = (phaseNum - 1) * pairsPerPhase
    const endPairIdx   = Math.min(startPairIdx + pairsPerPhase, maxPairs)

    for (let gIdx = 0; gIdx < groups.length; gIdx++) {
      const group = groups[gIdx]
      for (let pi = startPairIdx; pi < endPairIdx; pi++) {
        for (const cat of group) {
          const pair = pairsByCat.get(cat.id)?.find(p => p.pairIndex === pi)
          if (!pair) continue
          
          allGamesToSchedule.push({
            categoryId: cat.id,
            homeTeamId: pair.homeTeamId,
            awayTeamId: pair.awayTeamId,
            round: globalRound,
            phase: phaseNum,
            isReturn: false,
            groupIdx: gIdx
          })

          if (turns >= 2) {
            allGamesToSchedule.push({
              categoryId: cat.id,
              homeTeamId: pair.awayTeamId,
              awayTeamId: pair.homeTeamId,
              round: globalRound,
              phase: phaseNum,
              isReturn: true,
              groupIdx: gIdx
            })
          }
        }
      }
    }
  }

  // PASSO 6: Agrupar jogos por "Viagem" (Pairing Home-Away) e "Fase"
  // Uma viagem (Trip) na FGB contém todos os jogos de diferentes categorias entre os mesmos dois clubes.
  const gamesByTripMap = new Map<string, GameToSchedule[]>()
  
  for (const game of allGamesToSchedule) {
    // A chave da viagem é: Fase + Mandante + Visitante
    // Assim todos os Sub-13, Sub-15 etc entre Time A x Time B na Fase 1 ficam juntos
    const key = `phase${game.phase}-h${game.homeTeamId}-a${game.awayTeamId}`
    if (!gamesByTripMap.has(key)) gamesByTripMap.set(key, [])
    gamesByTripMap.get(key)!.push(game)
  }

  // Ordenar as chaves para garantir determinismo e separação por fase
  const tripKeys = Array.from(gamesByTripMap.keys()).sort()

  let nextWeekendStart = startDate
  const finalScheduled: ScheduledGame[] = []
  
  // Agora iteramos sobre cada Viagem (Trip)
  for (const tripKey of tripKeys) {
    const tripGames = gamesByTripMap.get(tripKey) || []
    if (tripGames.length === 0) continue

    // Agendar todos os jogos dessa viagem (ex: 3 categorias de uma vez)
    // O scheduler vai cuidar de colocar 2 no Sábado e 1 no Domingo se necessário
    const result = scheduleGamesByTimeWindow(tripGames, {
      numberOfCourts,
      dayStartTime,
      regularDayEndTime,
      extendedDayEndTime,
      slotDurationMinutes,
      minRestSlotsPerTeam,
      blockFormat,
      startWeekend: nextWeekendStart,
      maxCategoriesPerDay: 2 // Forçar o limite de 2 categorias/dia por viagem
    })

    finalScheduled.push(...result.games)
    
    // Avança para o próximo FINAL DE SEMANA para a próxima viagem
    // Isso garante que "Fases como viagens separadas" seja respeitado 
    // e que cada conjunto de jogos Home x Away seja em sua própria semana/viagem
    nextWeekendStart = addDays(result.lastWeekendStart, 7)
  }

  // PASSO 7: Montar resultados
  const catNameMap = new Map(validCategories.map(c => [c.id, c.name]))
  const teamNameMap = new Map(validCategories.flatMap(c => c.teams).map(t => [t.id, t.name]))

  const gamesWithNames = finalScheduled.map(g => ({
    ...g,
    categoryName: catNameMap.get(g.categoryId) || '',
    homeTeamName: teamNameMap.get(g.homeTeamId) || 'Time A',
    awayTeamName: teamNameMap.get(g.awayTeamId) || 'Time B',
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
    const key = game.date
    if (!gamesByDate.has(key)) gamesByDate.set(key, [])
    gamesByDate.get(key)!.push(game)
  }

  const schedulePreview = Array.from(gamesByDate.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, games]) => {
      return {
        date,
        phase: (games[0] as any).phase || 1,
        dayOfWeek: new Date(date + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'long' }),
        gamesCount: games.length,
        categories: [...new Set(games.map(g => catNameMap.get(g.categoryId) || ''))],
        timeSlots: games
          .sort((a, b) => a.time.localeCompare(b.time))
          .map(g => ({
            time: g.time,
            categoryId: g.categoryId,
            categoryName: g.categoryName,
            homeTeamId: g.homeTeamId,
            homeTeamName: g.homeTeamName,
            awayTeamId: g.awayTeamId,
            awayTeamName: g.awayTeamName,
            round: g.round,
            phase: (g as any).phase,
            isReturn: (g as any).isReturn,
            court: g.court
          }))
      }
    })

  const groupsDesc = groups.map(g => g.map(c => c.name).join(' + ')).join(', ')

  // Datas de playoff (mock por enquanto para manter compatibilidade)
  const playoffDates: string[] = []

  const totalBlockedDates = Array.from(blockedMap.values())
    .reduce((acc, arr) => acc + (arr as Date[]).length, 0)

  return {
    success: true,
    totalGames: finalScheduled.length,
    totalBlockedDates,
    totalDays: gamesByDate.size,
    totalPhases: countDistinctDateBlocks(Array.from(gamesByDate.keys()).map(d => new Date(d))),
    maxGamesPerDay: Math.max(...Array.from(gamesByDate.values()).map(g => g.length), 0),
    groups: groups.map(g => g.map(c => ({ id: c.id, name: c.name }))),
    format, turns, hasPlayoffs,
    playoffWeekends: playoffDates,
    schedulePreview,
    categories: categoryResults,
    games: gamesWithNames,
    summary: [
      `${finalScheduled.length} jogos`,
      `${countDistinctDateBlocks(Array.from(gamesByDate.keys()).map(d => new Date(d)))} fase(s)/viagem(ns)`,
      `${gamesByDate.size} dias`,
      `${validCategories.length} categorias`,
      `Grupos: ${groupsDesc}`,
      turns === 2 ? 'Ida + Volta' : '1 turno',
      hasPlayoffs ? `+ Playoffs` : '',
      totalBlockedDates > 0 ? `${totalBlockedDates} restrições de data` : ''
    ].filter(Boolean).join(' · ')
  }
}
