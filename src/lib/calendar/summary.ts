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

export function countDistinctDateBlocks(dates: Date[]): number {
  if (dates.length === 0) return 0
  
  const sorted = [...dates].sort((a, b) => a.getTime() - b.getTime())
  let blocks = 1
  
  for (let i = 1; i < sorted.length; i++) {
    const diffDays = Math.abs(sorted[i].getTime() - sorted[i-1].getTime()) / (1000 * 60 * 60 * 24)
    if (diffDays > 2) {
      blocks++
    }
  }
  
  return blocks
}
