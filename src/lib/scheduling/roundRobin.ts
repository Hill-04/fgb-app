import { prisma } from '@/lib/db'
import { buildBlockedMap, isDateBlockedForTeam, type TeamBlockedRange } from '@/lib/scheduling/availability'
import {
  getSchedulingConfig,
  isWeekdayAllowed,
  isDateInBlackout,
  type WeekdayNumber,
  type BlackoutDate,
  type HomePattern,
} from '@/lib/championship/scheduling-config'

// PM-02: as 8 constantes hardcoded antigas foram movidas para
// src/lib/championship/scheduling-config.ts (campos do Championship).
// As que sobrevivem como fallback final ainda vivem aqui para nao
// reintroduzir magic numbers em multiplos lugares:
const DEFAULT_SLOT_DURATION_MIN = 75   // GAME_DURATION_MIN antigo
const DEFAULT_MAX_CATS_PER_DAY = 2     // MAX_CATS_PER_DAY antigo
const DEFAULT_MIN_AGE_GAP = 3          // MIN_AGE_GAP antigo

type TeamInfo = {
  id: string
  name: string
}

type RegistrationInfo = {
  teamId: string
  teamName: string
  blockedDates: TeamBlockedRange[]
  athletePlayers: Array<{
    athleteName: string
    athleteDoc: string | null
    categoryIds: string
  }>
  coachKey: string | null
}

type CategoryInfo = {
  id: string
  name: string
  ageGroup: number
  teams: TeamInfo[]
  registrations: RegistrationInfo[]
}

type UniquePair = {
  categoryId: string
  categoryName: string
  homeTeamId: string
  awayTeamId: string
  round: number
}

type MatchBundle = {
  bundleId: string
  categoryId: string
  categoryName: string
  homeTeamId: string
  awayTeamId: string
  phase: number
  round: number
}

type ScheduledGame = {
  categoryId: string
  categoryName: string
  homeTeamId: string
  homeTeamName: string
  awayTeamId: string
  awayTeamName: string
  round: number
  phase: number
  isReturn: boolean
  date: string
  time: string
  dateTime: string
  period: string
  venue: string
  court?: string
  wasRescheduled: boolean
  rescheduleReason?: string
  blockedByTeamId?: string
  location: string
  city: string
}

type ScheduledInterval = {
  start: Date
  end: Date
}

type ScheduledBundlePlacement = {
  date: Date
  games: ScheduledGame[]
  wasRescheduled: boolean
  rescheduleReason?: string
  blockedByTeamId?: string
}

type UnresolvableConflict = {
  groupCategories: string[]
  phase: number
  message: string
  suggestion: string
}

type ConflictResolved = {
  categoryName: string
  phase: number
  originalDate: string
  newDate: string
  reason: string
}

type SchedulingConfig = {
  // ─── janela do dia (timezone-aware) ───
  dayStartTime: string
  regularDayEndTime: string
  extendedDayEndTime: string
  slotDurationMinutes: number

  // ─── limites por equipe ───
  minRestHoursBetweenGames: number  // 3.C: substitui minRestSlotsPerTeam
  maxGamesPerTeamPerDay: number
  maxGamesPerTeamPerWeek: number    // 3.C: novo limite respeitado pelo motor

  // ─── modo de operacao ───
  optimizationMode: string          // 3.B: agora vem de Championship.scheduleOptimizationMode

  // ─── janela do calendario (substituem blockFormat) ───
  allowedWeekdays: WeekdayNumber[]  // 3.C: substitui blockFormat
  blackoutDates: BlackoutDate[]     // 3.C: novas datas excluidas

  // ─── PM-02 (3.B) — configs explicitas vindas do Championship ───
  maxCategoriesPerDay: number
  minAgeGapBetweenGames: number

  // ─── PM-02 (3.D) — padrao de mando ───
  homePattern: HomePattern
}

function parseAgeGroup(name: string) {
  const match = name.match(/(\d+)/)
  return match ? Number(match[1]) : 0
}

function nextSaturday(from: Date) {
  const candidate = new Date(from)
  candidate.setUTCHours(0, 0, 0, 0)
  const day = candidate.getUTCDay()
  const offset = day <= 6 ? (6 - day + 7) % 7 : 0
  candidate.setUTCDate(candidate.getUTCDate() + offset)
  return candidate
}

function addDays(date: Date, amount: number) {
  const next = new Date(date)
  next.setUTCDate(next.getUTCDate() + amount)
  return next
}

function startOfUtcDay(date: Date) {
  const normalized = new Date(date)
  normalized.setUTCHours(0, 0, 0, 0)
  return normalized
}

function addMinutes(date: Date, amount: number) {
  return new Date(date.getTime() + amount * 60_000)
}

function toDateKey(date: Date) {
  return date.toISOString().slice(0, 10)
}

function toTimeLabel(date: Date) {
  return date.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'America/Sao_Paulo',
  })
}

function createUtcDate(day: Date, hour: number, minute: number) {
  const result = new Date(day)
  result.setUTCHours(hour, minute, 0, 0)
  return result
}

function parseClockTime(value: string) {
  const [hour, minute] = value.split(':').map(Number)
  return {
    hour: Number.isFinite(hour) ? hour : 0,
    minute: Number.isFinite(minute) ? minute : 0,
  }
}

function createUtcDateFromLocalTime(day: Date, time: string) {
  const { hour, minute } = parseClockTime(time)
  const utcHour = hour + 3
  const result = new Date(day)
  result.setUTCHours(utcHour, minute, 0, 0)
  return result
}

function getLocalHour(time: string) {
  return parseClockTime(time).hour
}

// 3.D: createVenueName agora honra homePattern. NEUTRAL sempre joga em sede.
function createVenueName(homePattern: HomePattern, fieldControl: string, homeTeamName: string) {
  if (homePattern === 'NEUTRAL' || fieldControl === 'fixo' || fieldControl === 'neutro') {
    return 'Sede central'
  }

  return `Ginásio ${homeTeamName}`
}

// 3.D: aplica o pattern de mando configurado no Championship.
// Retorna quem manda no jogo a partir do par "ida" (bundle.home/away).
//
//   ALTERNATED:   1o turno home original, 2o turno troca (legacy default)
//   FIXED_HOST:   home original sempre manda (nao troca em isReturn)
//   NEUTRAL:      home/away mantem para fins de estatistica; venue forcado em sede
//   SERIES_2_2_1: best-of-5; rounds 1,2 = home original; 3,4 = troca; 5 = home original
function applyHomePattern(
  bundle: MatchBundle,
  isReturn: boolean,
  homePattern: HomePattern,
): { homeId: string; awayId: string; homeName: 'first' | 'second' } {
  switch (homePattern) {
    case 'FIXED_HOST':
      return { homeId: bundle.homeTeamId, awayId: bundle.awayTeamId, homeName: 'first' }

    case 'SERIES_2_2_1': {
      const layout = [0, 0, 1, 1, 0]
      const pos = layout[bundle.round - 1] ?? 0
      return pos === 0
        ? { homeId: bundle.homeTeamId, awayId: bundle.awayTeamId, homeName: 'first' }
        : { homeId: bundle.awayTeamId, awayId: bundle.homeTeamId, homeName: 'second' }
    }

    case 'NEUTRAL':
    case 'ALTERNATED':
    default:
      return isReturn
        ? { homeId: bundle.awayTeamId, awayId: bundle.homeTeamId, homeName: 'second' }
        : { homeId: bundle.homeTeamId, awayId: bundle.awayTeamId, homeName: 'first' }
  }
}

function buildCategoryGroups(categories: CategoryInfo[], minAgeGap: number = DEFAULT_MIN_AGE_GAP) {
  const sorted = [...categories].sort((a, b) => a.ageGroup - b.ageGroup)
  const groups: CategoryInfo[][] = []
  const usedIds = new Set<string>()
  const half = Math.ceil(sorted.length / 2)

  for (let index = 0; index < half; index += 1) {
    const first = sorted[index]
    if (!first || usedIds.has(first.id)) {
      continue
    }

    const candidate = sorted[index + half]
    if (candidate && !usedIds.has(candidate.id) && Math.abs(candidate.ageGroup - first.ageGroup) >= minAgeGap) {
      groups.push([first, candidate])
      usedIds.add(first.id)
      usedIds.add(candidate.id)
      continue
    }

    groups.push([first])
    usedIds.add(first.id)
  }

  for (const category of sorted) {
    if (!usedIds.has(category.id)) {
      groups.push([category])
      usedIds.add(category.id)
    }
  }

  return groups
}

function generateRoundRobinPairs(teams: TeamInfo[], categoryId: string, categoryName: string) {
  const pairs: UniquePair[] = []
  let round = 1

  for (let homeIndex = 0; homeIndex < teams.length; homeIndex += 1) {
    for (let awayIndex = homeIndex + 1; awayIndex < teams.length; awayIndex += 1) {
      pairs.push({
        categoryId,
        categoryName,
        homeTeamId: teams[homeIndex].id,
        awayTeamId: teams[awayIndex].id,
        round,
      })
      round += 1
    }
  }

  return pairs
}

function generateEliminationPairs(teams: TeamInfo[], categoryId: string, categoryName: string) {
  const pairs: UniquePair[] = []
  let round = 1

  for (let index = 0; index + 1 < teams.length; index += 2) {
    pairs.push({
      categoryId,
      categoryName,
      homeTeamId: teams[index].id,
      awayTeamId: teams[index + 1].id,
      round,
    })
    round += 1
  }

  return pairs
}

function usesRoundRobinCycle(format: string) {
  return format !== 'eliminatoria' && format !== 'eliminatorio'
}

function reorderPairsForRest(pairs: UniquePair[]) {
  const remaining = [...pairs]
  const ordered: UniquePair[] = []
  let lastTeams: string[] = []

  while (remaining.length > 0) {
    const nextIndex = remaining.findIndex(
      (pair) => !lastTeams.includes(pair.homeTeamId) && !lastTeams.includes(pair.awayTeamId)
    )

    const indexToUse = nextIndex >= 0 ? nextIndex : 0
    const [pair] = remaining.splice(indexToUse, 1)
    ordered.push(pair)
    lastTeams = [pair.homeTeamId, pair.awayTeamId]
  }

  return ordered
}

function interleaveCategoryBundles(categoryQueues: Map<string, MatchBundle[]>) {
  const ordered: MatchBundle[] = []
  const queueEntries = Array.from(categoryQueues.entries())
  let madeProgress = true

  while (madeProgress) {
    madeProgress = false

    for (const [, queue] of queueEntries) {
      const next = queue.shift()
      if (next) {
        ordered.push(next)
        madeProgress = true
      }
    }
  }

  return ordered
}

function reservePlayoffWindow(endDate: Date | null, hasPlayoffs: boolean, playoffTeams: number) {
  if (!endDate || !hasPlayoffs) {
    return endDate
  }

  const reservedWeekends = playoffTeams > 4 ? 2 : 1
  return addDays(endDate, -(reservedWeekends * 7))
}

const MIN_PHASE_GAP_DAYS = 14

function buildPhaseAnchors(startDate: Date, endDate: Date | null, phases: number) {
  const start = nextSaturday(startOfUtcDay(startDate))

  if (phases <= 1) {
    return [start]
  }

  if (!endDate) {
    const gapDays = Math.max(MIN_PHASE_GAP_DAYS, 14)
    return Array.from({ length: phases }, (_, index) => nextSaturday(addDays(start, index * gapDays)))
  }

  const end = startOfUtcDay(endDate)
  if (end <= start) {
    return Array.from({ length: phases }, (_, index) => nextSaturday(addDays(start, index * MIN_PHASE_GAP_DAYS)))
  }

  const totalDays = Math.floor((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000))
  const intervalDays = Math.max(MIN_PHASE_GAP_DAYS, Math.floor(totalDays / phases))

  return Array.from({ length: phases }, (_, index) => {
    const rawDate = addDays(start, index * intervalDays)
    return nextSaturday(rawDate)
  })
}

function buildAthleteMaps(categories: CategoryInfo[]) {
  const athleteCategoryMap = new Map<string, string[]>()
  const athleteKeysByCategoryTeam = new Map<string, string[]>()

  for (const category of categories) {
    for (const registration of category.registrations) {
      for (const athlete of registration.athletePlayers) {
        const athleteKey = athlete.athleteDoc || athlete.athleteName.trim().toLowerCase()
        let categoryIds: string[] = []

        try {
          const parsed = JSON.parse(athlete.categoryIds)
          categoryIds = Array.isArray(parsed) ? parsed.map(String) : []
        } catch {
          categoryIds = []
        }

        if (!athleteCategoryMap.has(athleteKey)) {
          athleteCategoryMap.set(athleteKey, [])
        }

        for (const categoryId of categoryIds) {
          if (!athleteCategoryMap.get(athleteKey)!.includes(categoryId)) {
            athleteCategoryMap.get(athleteKey)!.push(categoryId)
          }
        }

        if (categoryIds.includes(category.id)) {
          const mapKey = `${category.id}:${registration.teamId}`
          const keys = athleteKeysByCategoryTeam.get(mapKey) || []
          if (!keys.includes(athleteKey)) {
            keys.push(athleteKey)
            athleteKeysByCategoryTeam.set(mapKey, keys)
          }
        }
      }
    }
  }

  return {
    athleteCategoryMap,
    athleteKeysByCategoryTeam,
  }
}

function buildCoachMap(categories: CategoryInfo[]) {
  const coachToTeams = new Map<string, Set<string>>()

  for (const category of categories) {
    for (const registration of category.registrations) {
      if (!registration.coachKey) {
        continue
      }

      if (!coachToTeams.has(registration.coachKey)) {
        coachToTeams.set(registration.coachKey, new Set())
      }

      coachToTeams.get(registration.coachKey)!.add(registration.teamId)
    }
  }

  const teamToCoach = new Map<string, string>()

  for (const [coachKey, teams] of coachToTeams.entries()) {
    if (teams.size < 2) {
      continue
    }

    for (const teamId of teams) {
      teamToCoach.set(teamId, coachKey)
    }
  }

  return teamToCoach
}

function overlaps(start: Date, end: Date, other: ScheduledInterval) {
  return start < other.end && end > other.start
}

function hasMinGap(start: Date, end: Date, other: ScheduledInterval, gapMinutes: number) {
  const gapMs = gapMinutes * 60_000
  if (start >= other.end) {
    return start.getTime() - other.end.getTime() >= gapMs
  }
  if (other.start >= end) {
    return other.start.getTime() - end.getTime() >= gapMs
  }
  return false
}

function findAvailableWeekend(
  from: Date,
  groupTeamIds: string[],
  blockedMap: Map<string, TeamBlockedRange[]>,
  fieldControl: string,
  config: SchedulingConfig,
  maxAttempts = 20
) {
  let candidate = nextSaturday(from)

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    let blocked = false

    if (fieldControl === 'fixo' || fieldControl === 'neutro') {
      const candidateDays = getPhaseDays(candidate, config)
      blocked = groupTeamIds.some((teamId) =>
        candidateDays.some((candidateDay) => isDateBlockedForTeam(candidateDay, teamId, blockedMap))
      )
    }

    if (!blocked) {
      return candidate
    }

    candidate = nextSaturday(addDays(candidate, 7))
  }

  return null
}

// 3.C: getPhaseDays agora respeita allowedWeekdays + blackoutDates da config.
// Itera 7 dias a partir do weekendStart (sabado) e mantem apenas dias que:
//   1. estao em config.allowedWeekdays (configurado no wizard)
//   2. NAO estao em config.blackoutDates
function getPhaseDays(weekendStart: Date, config: SchedulingConfig): Date[] {
  const days: Date[] = []
  for (let offset = 0; offset < 7; offset += 1) {
    const candidate = addDays(weekendStart, offset)
    if (
      isWeekdayAllowed(candidate, { allowedWeekdays: config.allowedWeekdays } as any) &&
      !isDateInBlackout(candidate, { blackoutDates: config.blackoutDates } as any)
    ) {
      days.push(candidate)
    }
  }
  // Garante que nunca retorna vazio: se a config eliminou tudo nesse weekend,
  // mantemos pelo menos o sabado (weekendStart) — o caller (findAvailableWeekend)
  // ja pula pra proximo se houver bloqueio de equipe.
  if (days.length === 0) days.push(new Date(weekendStart))
  return days
}

// 3.D: orderPhaseDays cobre os 3 modos oficiais de Championship:
//   - less_idle_time: cronologico puro, preenche slots o mais cedo possivel
//   - balanced:       distribui dias usando intercalacao first-half/second-half
//   - less_travel:    cenario sex+sab+dom prioriza sab>dom>sex (default historico)
// O modo legacy 'compact' (que era usado antigamente) e tratado como
// 'less_idle_time'.
function orderPhaseDays(phaseDays: Date[], optimizationMode: string, config: SchedulingConfig) {
  if (phaseDays.length <= 1) return phaseDays

  if (optimizationMode === 'compact' || optimizationMode === 'less_idle_time') {
    return [...phaseDays].sort((a, b) => a.getTime() - b.getTime())
  }

  if (optimizationMode === 'balanced') {
    return distributeEvenly(phaseDays)
  }

  // less_travel (default)
  const allows = new Set(config.allowedWeekdays)
  const isFriSatSun =
    allows.has(5 as WeekdayNumber) &&
    allows.has(6 as WeekdayNumber) &&
    allows.has(0 as WeekdayNumber)
  if (!isFriSatSun) {
    return phaseDays
  }

  const saturday = phaseDays.find((day) => day.getUTCDay() === 6)
  const sunday = phaseDays.find((day) => day.getUTCDay() === 0)
  const friday = phaseDays.find((day) => day.getUTCDay() === 5)
  return [saturday, sunday, friday].filter(Boolean) as Date[]
}

// 3.D: heuristica simples de distribuicao "balanced" — intercala primeira
// metade dos dias com a segunda metade, gerando espalhamento aproximadamente
// uniforme dentro da janela disponivel.
function distributeEvenly(days: Date[]): Date[] {
  const sorted = [...days].sort((a, b) => a.getTime() - b.getTime())
  const half = Math.ceil(sorted.length / 2)
  const front = sorted.slice(0, half)
  const back = sorted.slice(half)
  const out: Date[] = []
  for (let i = 0; i < half; i += 1) {
    if (front[i]) out.push(front[i])
    if (back[i]) out.push(back[i])
  }
  return out
}

function getDailyTeamCountKey(teamId: string, categoryId: string, dateKey: string) {
  return `${teamId}:${categoryId}:${dateKey}`
}

// 3.C: chave por (teamId, semana ISO) — usada para limitar maxGamesPerTeamPerWeek.
// A semana comeca na segunda (ISO 8601). Date nativo: getUTCDay() retorna 0=dom..6=sab.
function startOfIsoWeek(date: Date): Date {
  const d = new Date(date)
  d.setUTCHours(0, 0, 0, 0)
  const day = d.getUTCDay()
  const distanceFromMonday = (day + 6) % 7
  d.setUTCDate(d.getUTCDate() - distanceFromMonday)
  return d
}

function getWeeklyTeamCountKey(teamId: string, date: Date): string {
  return `${teamId}:${toDateKey(startOfIsoWeek(date))}`
}

function getConfiguredDayEndTime(day: Date, config: SchedulingConfig) {
  return day.getUTCDay() === 6 ? config.extendedDayEndTime : config.regularDayEndTime
}

function buildConfiguredDaySlots(day: Date, config: SchedulingConfig) {
  const slots: Array<{ start: Date; period: string }> = []
  const start = createUtcDateFromLocalTime(day, config.dayStartTime)
  const end = createUtcDateFromLocalTime(day, getConfiguredDayEndTime(day, config))
  let cursor = new Date(start)

  while (addMinutes(cursor, config.slotDurationMinutes) <= end) {
    const localHour = (cursor.getUTCHours() + 21) % 24
    slots.push({
      start: new Date(cursor),
      period: localHour < 12 ? 'manha' : 'tarde',
    })
    cursor = addMinutes(cursor, config.slotDurationMinutes)
  }

  return slots
}

function candidateConfiguredSingleSlots(day: Date, config: SchedulingConfig) {
  return buildConfiguredDaySlots(day, config)
}

function candidateConfiguredTurnPairs(day: Date, config: SchedulingConfig) {
  const slots = buildConfiguredDaySlots(day, config)
  const morning = slots.filter((slot) => slot.period === 'manha')
  const afternoon = slots.filter((slot) => slot.period === 'tarde')
  const count = Math.min(morning.length, afternoon.length)

  return Array.from({ length: count }).map((_, index) => ({
    ida: morning[index],
    volta: afternoon[index],
  }))
}

function withinConfiguredAllowedWindow(start: Date, day: Date, config: SchedulingConfig) {
  const dayStart = createUtcDateFromLocalTime(day, config.dayStartTime)
  const dayEnd = createUtcDateFromLocalTime(day, getConfiguredDayEndTime(day, config))
  return start >= dayStart && start <= dayEnd
}

function bundleAthleteKeys(
  bundle: MatchBundle,
  athleteKeysByCategoryTeam: Map<string, string[]>
) {
  const homeKeys = athleteKeysByCategoryTeam.get(`${bundle.categoryId}:${bundle.homeTeamId}`) || []
  const awayKeys = athleteKeysByCategoryTeam.get(`${bundle.categoryId}:${bundle.awayTeamId}`) || []
  return Array.from(new Set([...homeKeys, ...awayKeys]))
}

function bundleCoachKeys(bundle: MatchBundle, teamToCoach: Map<string, string>) {
  return Array.from(
    new Set([teamToCoach.get(bundle.homeTeamId), teamToCoach.get(bundle.awayTeamId)].filter(Boolean) as string[])
  )
}

function createGameOutput(
  bundle: MatchBundle,
  start: Date,
  period: string,
  isReturn: boolean,
  homeTeamName: string,
  awayTeamName: string,
  fieldControl: string,
  homePattern: HomePattern,
  wasRescheduled: boolean,
  rescheduleReason?: string,
  blockedByTeamId?: string,
  court?: string
): ScheduledGame {
  // 3.D: applyHomePattern decide quem manda baseado no padrao configurado.
  // bundle.homeTeamId = primeiro team do par. homeName='first' significa que
  // o primeiro time do par manda; 'second' significa que o segundo manda.
  const assignment = applyHomePattern(bundle, isReturn, homePattern)
  const actualHomeTeamId = assignment.homeId
  const actualAwayTeamId = assignment.awayId
  const actualHomeTeamName = assignment.homeName === 'first' ? homeTeamName : awayTeamName
  const actualAwayTeamName = assignment.homeName === 'first' ? awayTeamName : homeTeamName
  const venue = createVenueName(homePattern, fieldControl, actualHomeTeamName)

  return {
    categoryId: bundle.categoryId,
    categoryName: bundle.categoryName,
    homeTeamId: actualHomeTeamId,
    homeTeamName: actualHomeTeamName,
    awayTeamId: actualAwayTeamId,
    awayTeamName: actualAwayTeamName,
    round: bundle.round,
    phase: bundle.phase,
    isReturn,
    date: toDateKey(start),
    time: toTimeLabel(start),
    dateTime: start.toISOString(),
    period,
    venue,
    court,
    location: venue,
    city: 'A definir',
    wasRescheduled,
    rescheduleReason,
    blockedByTeamId,
  }
}

export async function generateChampionshipSchedule(championshipId: string) {
  const championship = await prisma.championship.findUnique({
    where: { id: championshipId },
    include: {
      categories: {
        include: {
          registrations: {
            where: { registration: { status: 'CONFIRMED' } },
            include: {
              registration: {
                include: {
                  team: true,
                  blockedDates: true,
                  athletePlayers: true,
                },
              },
            },
          },
        },
      },
    },
  })

  if (!championship) {
    throw new Error('Campeonato não encontrado')
  }

  const format = championship.format || 'todos_contra_todos'
  const turns = championship.turns || 1
  const phases = championship.phases || 1
  const fieldControl = championship.fieldControl || 'alternado'
  const hasPlayoffs = championship.hasPlayoffs || false
  const playoffTeams = championship.playoffTeams || 4
  const minTeamsPerCat = championship.minTeamsPerCat || 2
  const maxCourts = Math.max(1, championship.numberOfCourts || 1)
  // PM-02 (3.B+3.C): config oficial vinda do Championship.
  const officialConfig = getSchedulingConfig(championship)
  const gameDuration = officialConfig.slotDurationMinutes || DEFAULT_SLOT_DURATION_MIN
  const schedulingConfig: SchedulingConfig = {
    dayStartTime: officialConfig.dayStartTime,
    regularDayEndTime: officialConfig.regularDayEndTime,
    extendedDayEndTime: officialConfig.extendedDayEndTime,
    slotDurationMinutes: gameDuration,
    minRestHoursBetweenGames: officialConfig.minRestHoursBetweenGames,
    maxGamesPerTeamPerDay: officialConfig.maxGamesPerTeamPerDay,
    maxGamesPerTeamPerWeek: officialConfig.maxGamesPerTeamPerWeek,
    optimizationMode: officialConfig.scheduleOptimizationMode,
    allowedWeekdays: officialConfig.allowedWeekdays,
    blackoutDates: officialConfig.blackoutDates,
    maxCategoriesPerDay: officialConfig.maxCategoriesPerDay,
    minAgeGapBetweenGames: officialConfig.minAgeGapBetweenGames,
    homePattern: officialConfig.homePattern,
  }
  // 3.C: minRestHoursBetweenGames substitui o calculo antigo
  // (minRestSlotsPerTeam * gameDuration). Conversao h -> min.
  const minTeamRestMinutes = schedulingConfig.minRestHoursBetweenGames * 60

  const startDate = championship.startDate
    ? new Date(championship.startDate)
    : addDays(new Date(), 21)
  const regularSeasonEndDate = reservePlayoffWindow(
    championship.endDate ? new Date(championship.endDate) : null,
    hasPlayoffs,
    playoffTeams
  )

  const categories: CategoryInfo[] = championship.categories
    .map((category) => ({
      id: category.id,
      name: category.name,
      ageGroup: parseAgeGroup(category.name),
      teams: category.registrations.map((registration) => ({
        id: registration.registration.team.id,
        name: registration.registration.team.name,
      })),
      registrations: category.registrations.map((registration) => {
        const coachPieces = [
          registration.registration.coachEmail,
          registration.registration.coachPhone,
          registration.registration.coachName,
        ]
          .filter(Boolean)
          .map((value) => String(value).trim().toLowerCase())
        const coachKey =
          registration.registration.coachMultiTeam || coachPieces.length > 0
            ? coachPieces.join('|') || null
            : null

        return {
          teamId: registration.registration.team.id,
          teamName: registration.registration.team.name,
          blockedDates: registration.registration.blockedDates.map((blockedDate) => ({
            startDate: new Date(blockedDate.startDate),
            endDate: new Date(blockedDate.endDate),
            affectsAllCats: blockedDate.affectsAllCats,
            reason: blockedDate.reason,
          })),
          athletePlayers: registration.registration.athletePlayers.map((athlete) => ({
            athleteName: athlete.athleteName,
            athleteDoc: athlete.athleteDoc,
            categoryIds: athlete.categoryIds,
          })),
          coachKey,
        }
      }),
    }))
    .filter((category) => category.teams.length >= minTeamsPerCat)

  if (categories.length === 0) {
    throw new Error('Nenhuma categoria com equipes suficientes para gerar calendário')
  }

  const groups = buildCategoryGroups(categories, schedulingConfig.minAgeGapBetweenGames)
  const blockedMap = buildBlockedMap(
    categories.flatMap((category) =>
      category.registrations.map((registration) => ({
        teamId: registration.teamId,
        blockedDates: registration.blockedDates,
      }))
    )
  )
  const { athleteKeysByCategoryTeam } = buildAthleteMaps(categories)
  const teamToCoach = buildCoachMap(categories)
  const phasePairsByCategory = new Map<string, Map<number, UniquePair[]>>()
  const roundRobinByPhase = usesRoundRobinCycle(format)
  const phaseAnchors = buildPhaseAnchors(startDate, regularSeasonEndDate, phases)

  for (const category of categories) {
    const basePairs =
      !roundRobinByPhase
        ? generateEliminationPairs(category.teams, category.id, category.name)
        : generateRoundRobinPairs(category.teams, category.id, category.name)
    const orderedPairs = reorderPairsForRest(basePairs)
    const perPhase = new Map<number, UniquePair[]>()

    {
      const pairsPerPhase = Math.max(1, Math.ceil(orderedPairs.length / phases))
      for (let phase = 1; phase <= phases; phase += 1) {
        const startIndex = (phase - 1) * pairsPerPhase
        const endIndex = Math.min(startIndex + pairsPerPhase, orderedPairs.length)
        perPhase.set(
          phase,
          orderedPairs.slice(startIndex, endIndex).map((pair) => ({
            ...pair,
          }))
        )
      }
    }

    phasePairsByCategory.set(category.id, perPhase)
  }

  const teamNameMap = new Map(categories.flatMap((category) => category.teams).map((team) => [team.id, team.name]))
  const categoryNameMap = new Map(categories.map((category) => [category.id, category.name]))

  const scheduledGames: ScheduledGame[] = []
  const unresolvableConflicts: UnresolvableConflict[] = []
  const conflictsResolved: ConflictResolved[] = []
  const dayGamesMap = new Map<string, ScheduledGame[]>()
  const teamGamesPerDay = new Map<string, number>()
  // 3.C: contador semanal para respeitar maxGamesPerTeamPerWeek
  const teamGamesPerWeek = new Map<string, number>()
  const athleteSchedule = new Map<string, ScheduledInterval[]>()
  const coachSchedule = new Map<string, ScheduledInterval[]>()
  const teamSchedule = new Map<string, ScheduledInterval[]>()
  const groupLastWeekend = new Map<string, Date>()
  let globalCursor = nextSaturday(startDate)

  for (let phase = 1; phase <= phases; phase += 1) {
    const phaseAnchor = phaseAnchors[phase - 1] || addDays(startDate, (phase - 1) * 7)

    for (const group of groups) {
      const groupKey = group.map((category) => category.id).join('|')
      const teamIds = Array.from(new Set(group.flatMap((category) => category.teams.map((team) => team.id))))
      const categoryQueues = new Map<string, MatchBundle[]>()
      for (const category of group) {
        const phasePairs = phasePairsByCategory.get(category.id)?.get(phase) || []
        categoryQueues.set(
          category.id,
          phasePairs.map((pair, index) => ({
            bundleId: `${category.id}-${phase}-${index}`,
            categoryId: category.id,
            categoryName: category.name,
            homeTeamId: pair.homeTeamId,
            awayTeamId: pair.awayTeamId,
            phase,
            round: pair.round,
          }))
        )
      }

      const bundles = interleaveCategoryBundles(categoryQueues)
      if (bundles.length === 0) {
        continue
      }

      const groupGapAnchor = groupLastWeekend.get(groupKey)
        ? addDays(groupLastWeekend.get(groupKey)!, 7)
        : startDate
      const fromDate = [globalCursor, phaseAnchor, groupGapAnchor].reduce(
        (latest, current) => (current > latest ? current : latest),
        groupGapAnchor
      )
      const weekendStart = findAvailableWeekend(
        fromDate,
        teamIds,
        blockedMap,
        fieldControl,
        schedulingConfig
      )

      if (!weekendStart || (regularSeasonEndDate && weekendStart > regularSeasonEndDate)) {
        const suggestedEndDate = addDays(regularSeasonEndDate || fromDate, 21).toLocaleDateString('pt-BR')
        unresolvableConflicts.push({
          groupCategories: group.map((category) => category.name),
          phase,
          message: `Impossível agendar fase ${phase} para ${group.map((category) => category.name).join('+')}. Todas as datas estão bloqueadas.`,
          suggestion: `Opções: (1) Estender o período até ${suggestedEndDate}, (2) Negociar datas com as equipes, (3) Separar estas categorias em fases diferentes.`,
        })
        continue
      }

      groupLastWeekend.set(groupKey, weekendStart)
      globalCursor = addDays(weekendStart, 7)
      const phaseDays = orderPhaseDays(
        getPhaseDays(weekendStart, schedulingConfig),
        schedulingConfig.optimizationMode,
        schedulingConfig
      )

      for (const bundle of bundles) {
        const homeTeamName = teamNameMap.get(bundle.homeTeamId) || 'Mandante'
        const awayTeamName = teamNameMap.get(bundle.awayTeamId) || 'Visitante'
        const athleteKeys = bundleAthleteKeys(bundle, athleteKeysByCategoryTeam)
        const coachKeys = bundleCoachKeys(bundle, teamToCoach)

        let placement: ScheduledBundlePlacement | null = null
        let encounteredBlockedTeamId: string | undefined

        for (let attempt = 0; attempt < 20 && !placement; attempt += 1) {
          const weekendOffset = Math.floor(attempt / phaseDays.length)
          const dayIndex = attempt % phaseDays.length
          const day = addDays(phaseDays[dayIndex], weekendOffset * 7)

          if (regularSeasonEndDate && day > regularSeasonEndDate) {
            continue
          }

          const dateKey = toDateKey(day)
          const existingDayGames = dayGamesMap.get(dateKey) || []
          const categoriesInDay = new Set(existingDayGames.map((game) => game.categoryId))
          const homeGamesCount =
            teamGamesPerDay.get(getDailyTeamCountKey(bundle.homeTeamId, bundle.categoryId, dateKey)) || 0
          const awayGamesCount =
            teamGamesPerDay.get(getDailyTeamCountKey(bundle.awayTeamId, bundle.categoryId, dateKey)) || 0

          if (categoriesInDay.size >= schedulingConfig.maxCategoriesPerDay && !categoriesInDay.has(bundle.categoryId)) {
            continue
          }

          if (
            homeGamesCount >= schedulingConfig.maxGamesPerTeamPerDay ||
            awayGamesCount >= schedulingConfig.maxGamesPerTeamPerDay
          ) {
            continue
          }

          // 3.C: respeita maxGamesPerTeamPerWeek
          const homeWeekCount =
            teamGamesPerWeek.get(getWeeklyTeamCountKey(bundle.homeTeamId, day)) || 0
          const awayWeekCount =
            teamGamesPerWeek.get(getWeeklyTeamCountKey(bundle.awayTeamId, day)) || 0
          if (
            homeWeekCount >= schedulingConfig.maxGamesPerTeamPerWeek ||
            awayWeekCount >= schedulingConfig.maxGamesPerTeamPerWeek
          ) {
            continue
          }

          const blockedTeamId =
            fieldControl === 'alternado'
              ? [bundle.homeTeamId, bundle.awayTeamId].find((teamId) => isDateBlockedForTeam(day, teamId, blockedMap))
              : undefined
          if (blockedTeamId) {
            encounteredBlockedTeamId = blockedTeamId
            continue
          }

          if (turns >= 2) {
            for (const slotPair of candidateConfiguredTurnPairs(day, schedulingConfig)) {
              if (
                !withinConfiguredAllowedWindow(slotPair.ida.start, day, schedulingConfig) ||
                !withinConfiguredAllowedWindow(slotPair.volta.start, day, schedulingConfig)
              ) {
                continue
              }

              const idaEnd = addMinutes(slotPair.ida.start, gameDuration)
              const voltaEnd = addMinutes(slotPair.volta.start, gameDuration)
              const candidateIntervals = [
                { start: slotPair.ida.start, end: idaEnd },
                { start: slotPair.volta.start, end: voltaEnd },
              ]

              const timeCounts = candidateIntervals.map((interval) => ({
                start: interval.start,
                count: existingDayGames.filter(
                  (game) => new Date(game.dateTime).getTime() === interval.start.getTime()
                ).length,
              }))
              if (timeCounts.some((slot) => slot.count >= maxCourts)) {
                continue
              }

              const athleteConflict = athleteKeys.some((athleteKey) =>
                (athleteSchedule.get(athleteKey) || []).some(
                  (interval) =>
                    candidateIntervals.some(
                      (candidate) => overlaps(candidate.start, candidate.end, interval) || !hasMinGap(candidate.start, candidate.end, interval, 120)
                    )
                )
              )
              if (athleteConflict) {
                continue
              }

              const coachConflict = coachKeys.some((coachKey) =>
                (coachSchedule.get(coachKey) || []).some((interval) =>
                  candidateIntervals.some((candidate) => overlaps(candidate.start, candidate.end, interval))
                )
              )
              if (coachConflict) {
                continue
              }

              const teamConflict = [bundle.homeTeamId, bundle.awayTeamId].some((teamId) =>
                (teamSchedule.get(teamId) || []).some((interval) =>
                  candidateIntervals.some(
                    (candidate) =>
                      overlaps(candidate.start, candidate.end, interval) ||
                      !hasMinGap(candidate.start, candidate.end, interval, minTeamRestMinutes)
                  )
                )
              )
              if (teamConflict) {
                continue
              }

              const wasRescheduled = Boolean(encounteredBlockedTeamId) || attempt > 0
              const rescheduleReason = encounteredBlockedTeamId
                ? `Confronto movido por bloqueio de data da equipe ${teamNameMap.get(encounteredBlockedTeamId) || encounteredBlockedTeamId}.`
                : attempt > 0
                  ? 'Confronto ajustado para respeitar conflitos logísticos e de agenda.'
                  : undefined

              placement = {
                date: day,
                games: [
                  createGameOutput(
                    bundle,
                    slotPair.ida.start,
                    slotPair.ida.period,
                    false,
                    homeTeamName,
                    awayTeamName,
                    fieldControl,
                    schedulingConfig.homePattern,
                    wasRescheduled,
                    rescheduleReason,
                    encounteredBlockedTeamId,
                    `Quadra ${timeCounts[0].count + 1}`
                  ),
                  createGameOutput(
                    bundle,
                    slotPair.volta.start,
                    slotPair.volta.period,
                    true,
                    homeTeamName,
                    awayTeamName,
                    fieldControl,
                    schedulingConfig.homePattern,
                    wasRescheduled,
                    rescheduleReason,
                    encounteredBlockedTeamId,
                    `Quadra ${timeCounts[1].count + 1}`
                  ),
                ],
                wasRescheduled,
                rescheduleReason,
                blockedByTeamId: encounteredBlockedTeamId,
              }
              break
            }
          } else {
            for (const slot of candidateConfiguredSingleSlots(day, schedulingConfig)) {
              if (!withinConfiguredAllowedWindow(slot.start, day, schedulingConfig)) {
                continue
              }

              const candidateEnd = addMinutes(slot.start, gameDuration)
              const slotCount = existingDayGames.filter(
                (game) => new Date(game.dateTime).getTime() === slot.start.getTime()
              ).length
              if (slotCount >= maxCourts) {
                continue
              }

              const athleteConflict = athleteKeys.some((athleteKey) =>
                (athleteSchedule.get(athleteKey) || []).some(
                  (interval) =>
                    overlaps(slot.start, candidateEnd, interval) || !hasMinGap(slot.start, candidateEnd, interval, 120)
                )
              )
              if (athleteConflict) {
                continue
              }

              const coachConflict = coachKeys.some((coachKey) =>
                (coachSchedule.get(coachKey) || []).some((interval) => overlaps(slot.start, candidateEnd, interval))
              )
              if (coachConflict) {
                continue
              }

              const teamConflict = [bundle.homeTeamId, bundle.awayTeamId].some((teamId) =>
                (teamSchedule.get(teamId) || []).some(
                  (interval) =>
                    overlaps(slot.start, candidateEnd, interval) ||
                    !hasMinGap(slot.start, candidateEnd, interval, minTeamRestMinutes)
                )
              )
              if (teamConflict) {
                continue
              }

              const wasRescheduled = Boolean(encounteredBlockedTeamId) || attempt > 0
              const rescheduleReason = encounteredBlockedTeamId
                ? `Confronto movido por bloqueio de data da equipe ${teamNameMap.get(encounteredBlockedTeamId) || encounteredBlockedTeamId}.`
                : attempt > 0
                  ? 'Confronto ajustado para respeitar conflitos logísticos e de agenda.'
                  : undefined

              placement = {
                date: day,
                games: [
                  createGameOutput(
                    bundle,
                    slot.start,
                    slot.period,
                    false,
                    homeTeamName,
                    awayTeamName,
                    fieldControl,
                    schedulingConfig.homePattern,
                    wasRescheduled,
                    rescheduleReason,
                    encounteredBlockedTeamId,
                    `Quadra ${slotCount + 1}`
                  ),
                ],
                wasRescheduled,
                rescheduleReason,
                blockedByTeamId: encounteredBlockedTeamId,
              }
              break
            }
          }
        }

        if (!placement) {
          const suggestedEndDate = addDays(regularSeasonEndDate || weekendStart, 14).toLocaleDateString('pt-BR')
          unresolvableConflicts.push({
            groupCategories: group.map((category) => category.name),
            phase,
            message: `Não foi possível agendar ${bundle.categoryName} na fase ${phase} respeitando bloqueios e conflitos de agenda.`,
            suggestion: `Opções: (1) Estender o período até ${suggestedEndDate}, (2) Negociar datas com as equipes, (3) Separar estas categorias em fases diferentes.`,
          })
          continue
        }

        for (const game of placement.games) {
          scheduledGames.push(game)
          const dateKey = game.date
          const currentGames = dayGamesMap.get(dateKey) || []
          currentGames.push(game)
          dayGamesMap.set(dateKey, currentGames)
          teamGamesPerDay.set(
            getDailyTeamCountKey(game.homeTeamId, game.categoryId, dateKey),
            (teamGamesPerDay.get(getDailyTeamCountKey(game.homeTeamId, game.categoryId, dateKey)) || 0) + 1
          )
          teamGamesPerDay.set(
            getDailyTeamCountKey(game.awayTeamId, game.categoryId, dateKey),
            (teamGamesPerDay.get(getDailyTeamCountKey(game.awayTeamId, game.categoryId, dateKey)) || 0) + 1
          )

          // 3.C: incrementa contador semanal (maxGamesPerTeamPerWeek)
          const gameDay = new Date(game.dateTime)
          const homeWeekKey = getWeeklyTeamCountKey(game.homeTeamId, gameDay)
          const awayWeekKey = getWeeklyTeamCountKey(game.awayTeamId, gameDay)
          teamGamesPerWeek.set(homeWeekKey, (teamGamesPerWeek.get(homeWeekKey) || 0) + 1)
          teamGamesPerWeek.set(awayWeekKey, (teamGamesPerWeek.get(awayWeekKey) || 0) + 1)

          const start = new Date(game.dateTime)
          const end = addMinutes(start, gameDuration)

          for (const athleteKey of athleteKeys) {
            const intervals = athleteSchedule.get(athleteKey) || []
            intervals.push({ start, end })
            athleteSchedule.set(athleteKey, intervals)
          }

          for (const coachKey of coachKeys) {
            const intervals = coachSchedule.get(coachKey) || []
            intervals.push({ start, end })
            coachSchedule.set(coachKey, intervals)
          }

          for (const teamId of [game.homeTeamId, game.awayTeamId]) {
            const intervals = teamSchedule.get(teamId) || []
            intervals.push({ start, end })
            teamSchedule.set(teamId, intervals)
          }
        }

        if (placement.wasRescheduled) {
          conflictsResolved.push({
            categoryName: bundle.categoryName,
            phase: bundle.phase,
            originalDate: toDateKey(weekendStart),
            newDate: toDateKey(placement.date),
            reason: placement.rescheduleReason || 'Conflito resolvido automaticamente pelo agendador.',
          })
        }
      }
    }
  }

  const categoriesResult = categories.map((category) => ({
    id: category.id,
    name: category.name,
    teams: category.teams.length,
    gamesCount: scheduledGames.filter((game) => game.categoryId === category.id).length,
    games: scheduledGames
      .filter((game) => game.categoryId === category.id)
      .sort((left, right) => left.dateTime.localeCompare(right.dateTime)),
  }))

  const schedulePreview = Array.from(dayGamesMap.entries())
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([date, games]) => ({
      date,
      phase: Math.min(...games.map((game) => game.phase)),
      dayOfWeek: new Date(`${date}T12:00:00.000Z`).toLocaleDateString('pt-BR', { weekday: 'long', timeZone: 'UTC' }),
      gamesCount: games.length,
      categories: Array.from(new Set(games.map((game) => game.categoryName))),
      timeSlots: games
        .sort((left, right) => left.dateTime.localeCompare(right.dateTime))
        .map((game) => ({
          time: game.time,
          categoryId: game.categoryId,
          categoryName: game.categoryName,
          homeTeamId: game.homeTeamId,
          homeTeamName: game.homeTeamName,
          awayTeamId: game.awayTeamId,
          awayTeamName: game.awayTeamName,
          round: game.round,
          phase: game.phase,
          isReturn: game.isReturn,
          court: game.court,
          period: game.period,
          wasRescheduled: game.wasRescheduled,
          rescheduleReason: game.rescheduleReason,
        })),
    }))

  return {
    success: true,
    totalGames: scheduledGames.length,
    totalDays: schedulePreview.length,
    totalBlockedDates: Array.from(blockedMap.values()).reduce((accumulator, ranges) => accumulator + ranges.length, 0),
    maxGamesPerDay: Math.max(...Array.from(dayGamesMap.values()).map((games) => games.length), 0),
    groups: groups.map((group) => group.map((category) => ({ id: category.id, name: category.name }))),
    format,
    turns,
    phases,
    hasPlayoffs,
    games: scheduledGames.sort((left, right) => left.dateTime.localeCompare(right.dateTime)),
    categories: categoriesResult,
    schedulePreview,
    conflictsResolved,
    unresolvableConflicts,
    summary: `${scheduledGames.length} jogos · ${schedulePreview.length} dias · ${groups.length} grupos · ${phases} fases`,
  }
}
