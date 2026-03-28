import { describe, it, expect } from 'vitest'
import { countDistinctDateBlocks } from '../../lib/calendar/summary'

describe('countDistinctDateBlocks', () => {
  it('identifica 2 blocos separados por semanas', () => {
    const dates = [
      new Date('2024-05-04'),
      new Date('2024-05-05'),
      new Date('2024-05-18'),
      new Date('2024-05-19'),
    ]
    expect(countDistinctDateBlocks(dates)).toBe(2)
  })

  it('identifica 1 bloco para 3 dias consecutivos', () => {
    const dates = [
      new Date('2024-05-03'),
      new Date('2024-05-04'),
      new Date('2024-05-05'),
    ]
    expect(countDistinctDateBlocks(dates)).toBe(1)
  })

  it('retorna 0 para lista vazia', () => {
    expect(countDistinctDateBlocks([])).toBe(0)
  })
})
