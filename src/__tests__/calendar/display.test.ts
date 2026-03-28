import { describe, it, expect } from 'vitest'
import { formatGameSlot } from '../../lib/calendar/display'

describe('formatGameSlot', () => {
  it('inclui nomes dos times no slot', () => {
    const game = {
      categoryName: 'Sub 12',
      round: 1,
      time: '08:00',
      homeTeamName: 'Caxias',
      awayTeamName: 'Porto Alegre',
    }
    const slot = formatGameSlot(game as any)
    expect(slot.matchup).toBe('Caxias × Porto Alegre')
  })

  it('exibe mandante antes do visitante', () => {
    const game = {
      categoryName: 'Sub 15',
      round: 2,
      time: '09:15',
      homeTeamName: 'Gaúcho',
      awayTeamName: 'Serra',
    }
    const slot = formatGameSlot(game as any)
    expect(slot.matchup).toMatch(/^Gaúcho × Serra$/)
  })
})
