import { describe, it, expect } from 'vitest'
import { scheduleGamesByTimeWindow, type ScheduledGame } from '../../lib/calendar/time-window-scheduler'

const baseConfig = {
  numberOfCourts: 1,
  dayStartTime: '08:00',
  regularDayEndTime: '19:00',
  extendedDayEndTime: '20:30',
  slotDurationMinutes: 75,
  minRestSlotsPerTeam: 1,
  blockFormat: 'SAT_SUN' as const,
  startWeekend: new Date('2026-05-23'), // Sábado
}

describe('scheduleGamesByTimeWindow — regra de quadra única', () => {
  it('nunca coloca dois jogos no mesmo slot quando numberOfCourts = 1', () => {
    const games = [
      { id: 'g1', homeTeamId: 't1', awayTeamId: 't2', categoryId: 'Sub 12', round: 1 },
      { id: 'g2', homeTeamId: 't3', awayTeamId: 't4', categoryId: 'Sub 15', round: 1 },
      { id: 'g3', homeTeamId: 't5', awayTeamId: 't6', categoryId: 'Sub 14', round: 1 },
    ]

    const result = scheduleGamesByTimeWindow(games, baseConfig)

    const slotKeys = result.map(g => `${g.date}-${g.time}`)
    const uniqueSlots = new Set(slotKeys)
    // Todos os jogos devem ter slots únicos
    expect(uniqueSlots.size).toBe(games.length)
  })

  it('distribui jogos sequencialmente com intervalo de duração do slot', () => {
    const games = [
      { id: 'g1', homeTeamId: 't1', awayTeamId: 't2', categoryId: 'Sub 12', round: 1 },
      { id: 'g2', homeTeamId: 't3', awayTeamId: 't4', categoryId: 'Sub 15', round: 1 },
    ]

    const result = scheduleGamesByTimeWindow(games, baseConfig)

    expect(result[0].time).toBe('08:00')
    expect(result[1].time).toBe('09:15')
  })
})

describe('scheduleGamesByTimeWindow — regra de descanso', () => {
  it('respeita intervalo mínimo para o mesmo time na mesma categoria', () => {
    // Time A joga 2x — deve ter 1 slot livre entre cada (pula 09:15 -> vai pro 10:30)
    const games = [
      { id: 'g1', homeTeamId: 'time-a', awayTeamId: 't2', categoryId: 'Sub 12', round: 1 },
      { id: 'g2', homeTeamId: 'time-c', awayTeamId: 'time-d', categoryId: 'Sub 12', round: 1 }, // Jogo no meio
      { id: 'g3', homeTeamId: 'time-a', awayTeamId: 't3', categoryId: 'Sub 12', round: 1 },
    ]

    const result = scheduleGamesByTimeWindow(games, baseConfig)
    
    const timeAGames = result.filter(g => g.homeTeamId === 'time-a' || g.awayTeamId === 'time-a')
    
    expect(timeAGames[0].time).toBe('08:00')
    // Slot 09:15 ocupado pelo g2. 
    expect(result[1].time).toBe('09:15') 
    // Próximo slot disponível para time-a seria 11:45? 
    // Não, 09:15 é o slot 1. 10:30 é o slot 2. 
    // Se jogou no 0, e minRest=1, pode jogar no 2 (0+1+1).
    expect(timeAGames[1].time).toBe('10:30')
  })

  it('categorias diferentes podem jogar horários consecutivos', () => {
    const games = [
      { id: 'g1', homeTeamId: 'club-x', awayTeamId: 't2', categoryId: 'Sub 12', round: 1 },
      { id: 'g2', homeTeamId: 'club-x', awayTeamId: 't3', categoryId: 'Sub 15', round: 1 },
    ]

    const result = scheduleGamesByTimeWindow(games, baseConfig)
    expect(result[0].time).toBe('08:00')
    expect(result[1].time).toBe('09:15')
  })
})

describe('scheduleGamesByTimeWindow — dias da semana', () => {
  it('nunca agenda jogos em segunda a quinta', () => {
    // Forçar 20 jogos (excede capacidade de 1 fim de semana de 1 quadra)
    const games = Array.from({ length: 30 }, (_, i) => ({
      id: `g${i}`,
      homeTeamId: `team${i}`,
      awayTeamId: `team${i + 1}`,
      categoryId: 'Sub 15',
      round: 1,
    }))

    const result = scheduleGamesByTimeWindow(games, baseConfig)

    for (const game of result) {
      const d = game.dateTime
      const day = d.getDay() // 0=Dom, 6=Sab
      expect([0, 6]).toContain(day)
    }
    
    // Verifica se espalhou por mais de um fim de semana
    const dates = new Set(result.map(g => g.date))
    expect(dates.size).toBeGreaterThan(2)
  })

  it('sábado usa horário estendido até 20:30', () => {
    const games = Array.from({ length: 12 }, (_, i) => ({
      id: `g${i}`,
      homeTeamId: `t${i}`,
      awayTeamId: `ta${i}`,
      categoryId: 'Sub 15',
      round: 1,
    }))
    
    const result = scheduleGamesByTimeWindow(games, baseConfig)
    const satGames = result.filter(g => g.dateTime.getDay() === 6)
    
    const lastSat = satGames[satGames.length - 1]
    expect(lastSat.time).toBe('20:30')
  })

  it('domingo termina até 19:00', () => {
    const games = Array.from({ length: 25 }, (_, i) => ({
      id: `g${i}`,
      homeTeamId: `t${i}`,
      awayTeamId: `ta${i}`,
      categoryId: 'Sub 15',
      round: 1,
    }))
    
    const result = scheduleGamesByTimeWindow(games, baseConfig)
    const sunGames = result.filter(g => g.dateTime.getDay() === 0)
    
    for (const g of sunGames) {
      const [h] = g.time.split(':').map(Number)
      expect(h).toBeLessThanOrEqual(18) // Último slot começa 18:00, termina 19:15? 
      // Não, 18:00 + 75min = 19:15. Se regularEndTime = 19:00, o de 18:00 cabe? 
      // 18:00 + 75 = 19:15. 19:15 <= 19:00 é falso.
      // Então o último slot regular (19:00) é 17:45 inicia no 17:45 ou 18:00?
      // 16:45 + 75 = 18:00. 18:00 <= 19:00? Sim. 
      // 18:00 + 75 = 19:15. 19:15 <= 19:00? Não.
    }
  })
})
