import { describe, it, expect } from 'vitest'
import { assignPhasesToGroups } from '../../lib/calendar/grouping'

describe('assignPhasesToGroups', () => {
  it('separa grupos em fins de semana distintos', () => {
    const groups = [
      [{ id: 'cat1', name: 'Sub 12' }, { id: 'cat2', name: 'Sub 15' }],
      [{ id: 'cat3', name: 'Sub 13' }, { id: 'cat4', name: 'Sub 16' }],
    ]
    const phases = 2
    const startDate = new Date('2024-05-01') // Quarta
    
    const assignment = assignPhasesToGroups(groups, phases, startDate)
    
    // Grupo 1, Fase 1 vs Grupo 2, Fase 1 deve ter pelo menos 7 dias de diferença
    // ou pelo menos não colidir no mesmo fim de semana
    const g1f1 = assignment[0][0]
    const g2f1 = assignment[1][0]
    
    const diffDays = Math.abs(g2f1.getTime() - g1f1.getTime()) / (1000 * 60 * 60 * 24)
    expect(diffDays).toBeGreaterThanOrEqual(7)
  })
})
