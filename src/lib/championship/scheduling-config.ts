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

export type SchedulingConfig = {
  allowedWeekdays: WeekdayNumber[]
  timeSlots: TimeSlot[]
  blackoutDates: BlackoutDate[]
  minRestHoursBetweenGames: number
  maxGamesPerTeamPerDay: number
  maxGamesPerTeamPerWeek: number
  homePattern: 'ALTERNATED' | 'FIXED_HOST' | 'NEUTRAL' | 'SERIES_2_2_1'
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

export function getSchedulingConfig(championship: {
  allowedWeekdaysJson?: string | null
  timeSlotsJson?: string | null
  blackoutDatesJson?: string | null
  minRestHoursBetweenGames?: number | null
  maxGamesPerTeamPerDay?: number | null
  maxGamesPerTeamPerWeek?: number | null
  homePattern?: string | null
  blockFormat?: string | null
}): SchedulingConfig {
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
    homePattern: (championship.homePattern as SchedulingConfig['homePattern']) ?? 'ALTERNATED',
  }
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
