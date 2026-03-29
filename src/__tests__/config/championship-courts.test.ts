import { describe, it, expect } from 'vitest'
import { validateChampionshipConfig } from '../../lib/championship/validation'

describe('championship courts configuration', () => {
  it('aceita numberOfCourts = 1 (padrão)', () => {
    const config = { numberOfCourts: 1 }
    const result = validateChampionshipConfig(config)
    expect(result.valid).toBe(true)
  })

  it('aceita numberOfCourts = 2', () => {
    const config = { numberOfCourts: 2 }
    const result = validateChampionshipConfig(config)
    expect(result.valid).toBe(true)
  })

  it('rejeita numberOfCourts = 0', () => {
    const config = { numberOfCourts: 0 }
    const result = validateChampionshipConfig(config)
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('Número de quadras deve ser pelo menos 1.')
  })

  it('usa 1 como padrão quando numberOfCourts não é informado', () => {
    const config = {}
    const result = validateChampionshipConfig(config)
    expect(result.numberOfCourts).toBe(1)
  })
})
