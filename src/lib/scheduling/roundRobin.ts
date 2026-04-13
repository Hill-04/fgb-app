import { prisma } from '@/lib/db'
import { buildBlockedMap, isDateBlockedForTeam, type TeamBlockedRange } from '@/lib/scheduling/availability'

const GAME_DURATION_MIN = 75
const DAY_START_HOUR = 11
const DAY_END_HOUR = 21
const LAST_GAME_START_UTC = 19
const LUNCH_BREAK_MIN = 120
const AFTERNOON_START_UTC = 17
const MAX_CATS_PER_DAY = 2
const MIN_AGE_GAP = 3

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
  dayStartTime: string
  regularDayEndTime: string
  extendedDayEndTime: string
  slotDurationMinutes: number
  minRestSlotsPerTeam: number
  blockFormat: string
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

function createVenueName(fieldControl: string, homeTeamName: string) {
  if (fieldControl === 'fixo' || fieldControl === 'neutro') {
    return 'Sede central'
  }

  return `Ginásio ${homeTeamName}`
}

function buildCategoryGroups(categories: CategoryInfo[]) {
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
    if (candidate && !usedIds.has(candidate.id) && Math.abs(candidate.ageGroup - first.ageGroup) >= MIN_AGE_GAP) {
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
  blockFormat: string,
  maxAttempts = 20
) {
  let candidate = nextSaturday(from)

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    let blocked = false

    if (fieldControl === 'fixo' || fieldControl === 'neutro') {
      const candidateDays = getPhaseDays(candidate, blockFormat)
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

function getPhaseDays(weekendStart: Date, blockFormat: string) {
  if (blockFormat === 'SAT_ONLY') {
    return [new Date(weekendStart)]
  }

  if (blockFormat === 'SAT_SUN') {
    return [new Date(weekendStart), addDays(weekendStart, 1)]
  }

  return [addDays(weekendStart, -1), new Date(weekendStart), addDays(weekendStart, 1)]
}

function buildDaySlots(day: Date, gameDuration: number) {
  const slots: Array<{ start: Date; period: string }> = []
  const morningEnd = addMinutes(createUtcDate(day, AFTERNOON_START_UTC, 0), -LUNCH_BREAK_MIN)
  let cursor = createUtcDate(day, DAY_START_HOUR, 0)

  while (addMinutes(cursor, gameDuration) <= morningEnd) {
    slots.push({ start: cursor, period: 'manhã' })
    cursor = addMinutes(cursor, gameDuration)
  }

  const dayEnd = createUtcDate(day, DAY_END_HOUR, 0)
  cursor = createUtcDate(day, AFTERNOON_START_UTC, 0)

  while (
    cursor <= createUtcDate(day, LAST_GAME_START_UTC, 0) &&
    addMinutes(cursor, gameDuration) <= dayEnd
  ) {
    slots.push({ start: cursor, period: 'tarde' })
    cursor = addMinutes(cursor, gameDuration)
  }

  return slots
}

function candidateSingleSlots(day: Date, gameDuration: number) {
  return buildDaySlots(day, gameDuration)
}

function candidateTurnPairs(day: Date, gameDuration: number) {
  const slots = buildDaySlots(day, gameDuration)
  const morning = slots.filter((slot) => slot.period === 'manhã')
  const afternoon = slots.filter((slot) => slot.period === 'tarde')
  const count = Math.min(morning.length, afternoon.length)

  return Array.from({ length: count }).map((_, index) => ({
    ida: morning[index],
    volta: afternoon[index],
  }))
}

function withinAllowedWindow(start: Date) {
  const hour = start.getUTCHours() + start.getUTCMinutes() / 60
  return hour >= DAY_START_HOUR && hour <= DAY_END_HOUR && hour <= LAST_GAME_START_UTC + 0.25
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
  wasRescheduled: boolean,
  rescheduleReason?: string,
  blockedByTeamId?: string,
  court?: string
): ScheduledGame {
  const actualHomeTeamName = isReturn ? awayTeamName : homeTeamName
  const actualAwayTeamName = isReturn ? homeTeamName : awayTeamName
  const actualHomeTeamId = isReturn ? bundle.awayTeamId : bundle.homeTeamId
  const actualAwayTeamId = isReturn ? bundle.homeTeamId : bundle.awayTeamId
  const venue = createVenueName(fieldControl, actualHomeTeamName)

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
  const gameDuration = championship.slotDurationMinutes || GAME_DURATION_MIN
  const schedulingConfig: SchedulingConfig = {
    dayStartTime: championship.dayStartTime || '08:00',
    regularDayEndTime: championship.regularDayEndTime || '19:00',
    extendedDayEndTime: championship.extendedDayEndTime || championship.regularDayEndTime || '20:30',
    slotDurationMinutes: gameDuration,
    minRestSlotsPerTeam: Math.max(0, championship.minRestSlotsPerTeam || 0),
    blockFormat: championship.blockFormat || 'SAT_SUN',
  }
  const minTeamRestMinutes = schedulingConfig.minRestSlotsPerTeam * gameDuration

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

  const groups = buildCategoryGroups(categories)
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

  const pairsByCategory = new Map<string, UniquePair[]>()
  let maxPairs = 0

  for (const category of categories) {
    const basePairs =
      format === 'eliminatoria'
        ? generateEliminationPairs(category.teams, category.id, category.name)
        : generateRoundRobinPairs(category.teams, category.id, category.name)
    const orderedPairs = reorderPairsForRest(basePairs)
    pairsByCategory.set(category.id, orderedPairs)
    maxPairs = Math.max(maxPairs, orderedPairs.length)
  }

  const teamNameMap = new Map(categories.flatMap((category) => category.teams).map((team) => [team.id, team.name]))
  const categoryNameMap = new Map(categories.map((category) => [category.id, category.name]))

  const pairsPerPhase = Math.max(1, Math.ceil(maxPairs / phases))
  const scheduledGames: ScheduledGame[] = []
  const unresolvableConflicts: UnresolvableConflict[] = []
  const conflictsResolved: ConflictResolved[] = []
  const dayGamesMap = new Map<string, ScheduledGame[]>()
  const athleteSchedule = new Map<string, ScheduledInterval[]>()
  const coachSchedule = new Map<string, ScheduledInterval[]>()
  const teamSchedule = new Map<string, ScheduledInterval[]>()
  const groupLastWeekend = new Map<string, Date>()
  let globalCursor = nextSaturday(startDate)

  for (let phase = 1; phase <= phases; phase += 1) {
    const phaseAnchor = new Date(startDate)
    phaseAnchor.setUTCDate(phaseAnchor.getUTCDate() + (phase - 1) * 7)

    for (const group of groups) {
      const groupKey = group.map((category) => category.id).join('|')
      const teamIds = Array.from(new Set(group.flatMap((category) => category.teams.map((team) => team.id))))
      const phaseStartIndex = (phase - 1) * pairsPerPhase
      const phaseEndIndex = phaseStartIndex + pairsPerPhase

      const categoryQueues = new Map<string, MatchBundle[]>()
      for (const category of group) {
        const phasePairs = (pairsByCategory.get(category.id) || []).slice(phaseStartIndex, phaseEndIndex)
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
        schedulingConfig.blockFormat
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
      const phaseDays = getPhaseDays(weekendStart, schedulingConfig.blockFormat)

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

          if (categoriesInDay.size >= MAX_CATS_PER_DAY && !categoriesInDay.has(bundle.categoryId)) {
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
