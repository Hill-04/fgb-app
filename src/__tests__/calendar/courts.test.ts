import { describe, it, expect } from 'vitest'
import { assignCourts } from '../../lib/calendar/courts'

describe('assignCourts', () => {
  it('atribui quadras diferentes para jogos no mesmo horário', () => {
    const slots = [
      { id: 'g1', dateTime: new Date('2024-05-04T08:00:00') },
      { id: 'g2', dateTime: new Date('2024-05-04T08:00:00') },
    ]
    const assigned = assignCourts(slots as any)
    expect(assigned[0].court).not.toBe(assigned[1].court)
  })

  it('usa Quadra A e Quadra B como nomes padrão', () => {
    const slots = [
      { id: 'g1', dateTime: new Date('2024-05-04T08:00:00') },
      { id: 'g2', dateTime: new Date('2024-05-04T08:00:00') },
    ]
    const assigned = assignCourts(slots as any)
    const courts = assigned.map(a => a.court)
    expect(courts).toContain('Quadra A')
    expect(courts).toContain('Quadra B')
  })
})
