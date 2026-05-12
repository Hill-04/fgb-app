export type WeekdayNumber = 0 | 1 | 2 | 3 | 4 | 5 | 6
// 0=domingo, 1=segunda, ..., 6=sábado

export type TimeSlot = {
  start: string // "HH:MM"
  end: string   // "HH:MM"
  label?: string
}

export type BlackoutDate = {
  date: string         // "YYYY-MM-DD"
  endDate?: string     // opcional, intervalo
  reason?: string
}

export type HomePattern = 'ALTERNATED' | 'FIXED_HOST' | 'NEUTRAL' | 'SERIES_2_2_1'
export type SharedGymHandlingMode = 'SEQUENTIAL' | 'PARALLEL'
export type ScheduleOptimizationMode = 'less_travel' | 'less_idle_time' | 'balanced'

export type SchedulingConfig = {
  // ─── janela do calendario ───
  allowedWeekdays: WeekdayNumber[]
  timeSlots: TimeSlot[]
  blackoutDates: BlackoutDate[]

  // ─── descanso e limites ───
  minRestHoursBetweenGames: number
  maxGamesPerTeamPerDay: number
  maxGamesPerTeamPerWeek: number
  homePattern: HomePattern

  // ─── PM-02: configs explicitas que substituem hardcoded em roundRobin.ts ───
  maxCategoriesPerDay: number
  minAgeGapBetweenGames: number
  lunchBreakMinutes: number
  afternoonStartTime: string  // "HH:MM"
  fridayEnabled: boolean
  sharedGymHandlingMode: SharedGymHandlingMode

  // ─── herdados do Championship (capacidade fisica) ───
  dayStartTime: string          // "HH:MM"
  regularDayEndTime: string     // "HH:MM"
  extendedDayEndTime: string    // "HH:MM"
  slotDurationMinutes: number
  numberOfCourts: number
  scheduleOptimizationMode: ScheduleOptimizationMode
}

const VALID_WEEKDAYS: ReadonlySet<number> = new Set([0, 1, 2, 3, 4, 5, 6])

export function parseAllowedWeekdays(json: string | null | undefined): WeekdayNumber[] {
  try {
    const arr = JSON.parse(json ?? '[6,0]')
    if (!Array.isArray(arr)) return [6, 0]
    const filtered = arr
      .map((n) => Number(n))
      .filter((n) => Number.isInteger(n) && VALID_WEEKDAYS.has(n)) as WeekdayNumber[]
    return filtered.length > 0 ? filtered : [6, 0]
  } catch {
    return [6, 0]
  }
}

export function parseTimeSlots(json: string | null | undefined): TimeSlot[] {
  try {
    const arr = JSON.parse(json ?? '[]')
    if (!Array.isArray(arr)) return []
    return arr.filter(
      (s): s is TimeSlot =>
        s &&
        typeof s.start === 'string' &&
        typeof s.end === 'string' &&
        /^\d{2}:\d{2}$/.test(s.start) &&
        /^\d{2}:\d{2}$/.test(s.end),
    )
  } catch {
    return []
  }
}

export function parseBlackoutDates(json: string | null | undefined): BlackoutDate[] {
  try {
    const arr = JSON.parse(json ?? '[]')
    if (!Array.isArray(arr)) return []
    return arr.filter(
      (d): d is BlackoutDate =>
        d && typeof d.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d.date),
    )
  } catch {
    return []
  }
}

export type SchedulingConfigInput = {
  // janela
  allowedWeekdaysJson?: string | null
  timeSlotsJson?: string | null
  blackoutDatesJson?: string | null
  blockFormat?: string | null

  // limites/descanso
  minRestHoursBetweenGames?: number | null
  maxGamesPerTeamPerDay?: number | null
  maxGamesPerTeamPerWeek?: number | null
  homePattern?: string | null

  // PM-02 — novos campos
  maxCategoriesPerDay?: number | null
  minAgeGapBetweenGames?: number | null
  lunchBreakMinutes?: number | null
  afternoonStartTime?: string | null
  fridayEnabled?: boolean | null
  sharedGymHandlingMode?: string | null

  // herdados — capacidade fisica
  dayStartTime?: string | null
  regularDayEndTime?: string | null
  extendedDayEndTime?: string | null
  slotDurationMinutes?: number | null
  numberOfCourts?: number | null
  scheduleOptimizationMode?: string | null
}

const VALID_HOME_PATTERNS: ReadonlySet<HomePattern> = new Set([
  'ALTERNATED', 'FIXED_HOST', 'NEUTRAL', 'SERIES_2_2_1',
])
const VALID_GYM_MODES: ReadonlySet<SharedGymHandlingMode> = new Set(['SEQUENTIAL', 'PARALLEL'])
const VALID_OPT_MODES: ReadonlySet<ScheduleOptimizationMode> = new Set([
  'less_travel', 'less_idle_time', 'balanced',
])

function coerceEnum<T extends string>(
  value: unknown,
  valid: ReadonlySet<T>,
  fallback: T,
): T {
  return typeof value === 'string' && valid.has(value as T) ? (value as T) : fallback
}

export function getSchedulingConfig(championship: SchedulingConfigInput): SchedulingConfig {
  const fromBlockFormat = (bf: string | null | undefined): WeekdayNumber[] => {
    if (bf === 'SAT_ONLY') return [6]
    if (bf === 'FRI_SAT_SUN') return [5, 6, 0]
    return [6, 0]
  }

  const explicitWeekdays = parseAllowedWeekdays(championship.allowedWeekdaysJson)
  const fallbackWeekdays = championship.allowedWeekdaysJson
    ? explicitWeekdays
    : fromBlockFormat(championship.blockFormat)

  return {
    allowedWeekdays: fallbackWeekdays,
    timeSlots: parseTimeSlots(championship.timeSlotsJson),
    blackoutDates: parseBlackoutDates(championship.blackoutDatesJson),

    minRestHoursBetweenGames: championship.minRestHoursBetweenGames ?? 20,
    maxGamesPerTeamPerDay: championship.maxGamesPerTeamPerDay ?? 2,
    maxGamesPerTeamPerWeek: championship.maxGamesPerTeamPerWeek ?? 3,
    homePattern: coerceEnum(championship.homePattern, VALID_HOME_PATTERNS, 'ALTERNATED'),

    maxCategoriesPerDay: championship.maxCategoriesPerDay ?? 2,
    minAgeGapBetweenGames: championship.minAgeGapBetweenGames ?? 3,
    lunchBreakMinutes: championship.lunchBreakMinutes ?? 120,
    afternoonStartTime: championship.afternoonStartTime ?? '13:00',
    fridayEnabled: championship.fridayEnabled ?? false,
    sharedGymHandlingMode: coerceEnum(championship.sharedGymHandlingMode, VALID_GYM_MODES, 'SEQUENTIAL'),

    dayStartTime: championship.dayStartTime ?? '08:00',
    regularDayEndTime: championship.regularDayEndTime ?? '19:00',
    extendedDayEndTime: championship.extendedDayEndTime ?? '20:30',
    slotDurationMinutes: championship.slotDurationMinutes ?? 75,
    numberOfCourts: championship.numberOfCourts ?? 1,
    scheduleOptimizationMode: coerceEnum(championship.scheduleOptimizationMode, VALID_OPT_MODES, 'less_travel'),
  }
}

/**
 * Helper: extrai a hora (0-23) de uma string "HH:MM".
 * Usado pelo motor para comparar com lunchBreakMinutes etc.
 */
export function parseHourFromTime(hhmm: string): number {
  const [h] = hhmm.split(':').map(Number)
  return Number.isFinite(h) ? h : 0
}

/**
 * Helper: minutos absolutos desde 00:00.
 * Ex: "13:30" -> 810
 */
export function parseMinutesFromTime(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number)
  return ((Number.isFinite(h) ? h : 0) * 60) + (Number.isFinite(m) ? m : 0)
}

export function isWeekdayAllowed(date: Date, config: SchedulingConfig): boolean {
  const day = date.getDay() as WeekdayNumber
  return config.allowedWeekdays.includes(day)
}

export function isDateInBlackout(date: Date, config: SchedulingConfig): boolean {
  const ymd = date.toISOString().slice(0, 10)
  for (const b of config.blackoutDates) {
    const start = b.date
    const end = b.endDate ?? b.date
    if (ymd >= start && ymd <= end) return true
  }
  return false
}

export const WEEKDAY_LABELS: Record<WeekdayNumber, string> = {
  0: 'Domingo',
  1: 'Segunda',
  2: 'Terça',
  3: 'Quarta',
  4: 'Quinta',
  5: 'Sexta',
  6: 'Sábado',
}

export const SHORT_WEEKDAY_LABELS: Record<WeekdayNumber, string> = {
  0: 'Dom',
  1: 'Seg',
  2: 'Ter',
  3: 'Qua',
  4: 'Qui',
  5: 'Sex',
  6: 'Sáb',
}
