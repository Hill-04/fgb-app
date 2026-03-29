import { describe, it, expect } from 'vitest'
import { detectDelegationOverload, redistributeOverloadedGames } from '../../lib/scheduling/delegation'

describe('delegation scheduling rules', () => {
  const teams = [
    { id: 'T1', city: 'Cidade A' },
    { id: 'T2', city: 'Cidade A' },
    { id: 'T3', city: 'Cidade B' },
    { id: 'T4', city: 'Cidade C' },
    { id: 'T5', city: 'Cidade D' },
  ]

  const date1 = new Date('2026-05-23T14:00:00Z')

  it('detecta sobrecarga em uma mesma cidade (2 times diferentes)', () => {
    const games = [
      { categoryId: 'C1', homeTeamId: 'T1', awayTeamId: 'T3', dateTime: date1 },
      { categoryId: 'C2', homeTeamId: 'T2', awayTeamId: 'T4', dateTime: date1 },
      { categoryId: 'C3', homeTeamId: 'T1', awayTeamId: 'T5', dateTime: date1 },
    ]

    // Max 2 games per city
    const overloads = detectDelegationOverload(games, teams, 2)
    expect(overloads.length).toBe(1)
    expect(overloads[0].teamId).toBe('Cidade A')
    expect(overloads[0].games.length).toBe(3)
  })

  it('não detecta sobrecarga se dentro do limite', () => {
    const games = [
      { categoryId: 'C1', homeTeamId: 'T1', awayTeamId: 'T3', dateTime: date1 },
      { categoryId: 'C2', homeTeamId: 'T2', awayTeamId: 'T3', dateTime: date1 },
    ]

    const overloads = detectDelegationOverload(games, teams, 2)
    expect(overloads.length).toBe(0)
  })

  it('redistribui jogos excedentes para o dia seguinte', () => {
    const games = [
      { categoryId: 'C1', homeTeamId: 'T1', awayTeamId: 'T3', dateTime: new Date(date1) },
      { categoryId: 'C2', homeTeamId: 'T2', awayTeamId: 'T3', dateTime: new Date(date1) },
      { categoryId: 'C3', homeTeamId: 'T1', awayTeamId: 'T3', dateTime: new Date(date1) },
    ]

    const redistributed = redistributeOverloadedGames(games, teams, 2)
    
    // O terceiro jogo deve ter sido movido para +24h
    const movedGame = redistributed.find(g => g.categoryId === 'C3')
    expect(movedGame?.dateTime.toISOString()).toContain('2026-05-24')
    
    // Verifica se agora não há sobrecarga no dia 23
    const overloads = detectDelegationOverload(redistributed, teams, 2)
    expect(overloads.length).toBe(0)
  })
})
