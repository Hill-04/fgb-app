import { describe, it, expect } from 'vitest'
import { optimizeGameDistribution } from '../../lib/calendar/distribution'

describe('optimizeGameDistribution', () => {
  it('não deixa o último dia com apenas 1 jogo se puder mover para o anterior', () => {
    const games = Array(9).fill({ id: 'game' })
    const maxPerDay = 8
    const distribution = optimizeGameDistribution(games, maxPerDay)
    
    // Antigamente: [8, 1]
    // Novo esperado: [5, 4] ou [4, 5] para equilibrar, ou [7, 2] se for o mínimo
    expect(distribution[distribution.length - 1]).toBeGreaterThanOrEqual(2)
  })

  it('mantém total de jogos correto', () => {
    const games = Array(15).fill({ id: 'game' })
    const maxPerDay = 6
    const distribution = optimizeGameDistribution(games, maxPerDay)
    const total = distribution.reduce((a, b) => a + b, 0)
    expect(total).toBe(15)
  })
})
