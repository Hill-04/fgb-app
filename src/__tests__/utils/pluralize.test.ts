import { describe, it, expect } from 'vitest'
import { pluralizeJogos } from '../../utils/pluralize'

describe('pluralizeJogos', () => {
  it('retorna "1 jogo" quando count é 1', () => {
    expect(pluralizeJogos(1)).toBe('1 jogo')
  })
  it('retorna "0 jogos" quando count é 0', () => {
    expect(pluralizeJogos(0)).toBe('0 jogos')
  })
  it('retorna "21 jogos" quando count é 21', () => {
    expect(pluralizeJogos(21)).toBe('21 jogos')
  })
})
