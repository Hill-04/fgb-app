import { describe, it, expect } from 'vitest'
import { validateCategoryTeams } from '../../lib/calendar/validation'

describe('validateCategoryTeams', () => {
  it('rejeita categoria com 2 equipes', () => {
    const result = validateCategoryTeams(2)
    expect(result.isValid).toBe(false)
    expect(result.error).toContain('no mínimo 3 equipes')
  })

  it('aceita categoria com 3 equipes com aviso', () => {
    const result = validateCategoryTeams(3)
    expect(result.isValid).toBe(true)
    expect(result.warning).toBeDefined()
  })

  it('aceita categoria com 4 equipes sem restrição', () => {
    const result = validateCategoryTeams(4)
    expect(result.isValid).toBe(true)
    expect(result.warning).toBeUndefined()
  })
})
