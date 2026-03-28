interface CalendarInput {
  totalGames: number
  totalDays: number
}

interface CalendarSummary {
  gamesPerDay: number
  gamesPerDayDisplay: string
}

export function calculateCalendarSummary(input: CalendarInput): CalendarSummary {
  const gamesPerDay = input.totalDays > 0
    ? Number((input.totalGames / input.totalDays).toFixed(1))
    : 0

  return {
    gamesPerDay,
    gamesPerDayDisplay: gamesPerDay > 0 ? gamesPerDay.toString() : '—',
  }
}
