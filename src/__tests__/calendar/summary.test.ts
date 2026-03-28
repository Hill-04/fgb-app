import { describe, it, expect } from 'vitest'
import { calculateCalendarSummary } from '../../lib/calendar/summary'

describe('calculateCalendarSummary', () => {
  it('calcula gamesPerDay corretamente', () => {
    const mockCalendar = {
      totalGames: 47,
      totalDays: 11,
    }
    const summary = calculateCalendarSummary(mockCalendar)
    expect(summary.gamesPerDay).toBeCloseTo(4.3, 1)
  })

  it('retorna 0 quando totalDays é 0', () => {
    const summary = calculateCalendarSummary({ totalGames: 0, totalDays: 0 })
    expect(summary.gamesPerDay).toBe(0)
  })
})
