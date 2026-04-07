import { describe, it, expect } from 'vitest'
import { scheduleGamesByTimeWindow } from '../../lib/calendar/time-window-scheduler'

describe('Scheduler Integration - 49 Games Test', () => {
  const categories = [
    { id: 'cat1', name: 'Sub 12', teams: 4 }, // 6 jogos
    { id: 'cat2', name: 'Sub 15', teams: 7 }, // 21 jogos
    { id: 'cat3', name: 'Sub 17', teams: 5 }  // 10 jogos
  ]

  // Gerar 37 jogos (ida) + alguns volta para chegar ~49
  const mockGames: any[] = []
  categories.forEach(cat => {
    for (let i = 0; i < cat.teams; i++) {
        for (let j = i + 1; j < cat.teams; j++) {
            mockGames.push({
                categoryId: cat.id,
                homeTeamId: `team-${cat.id}-${i}`,
                awayTeamId: `team-${cat.id}-${j}`,
                round: 1,
                category: cat.name
            })
            // Simular volta para alguns para testar volume
            if (cat.id === 'cat1') {
                mockGames.push({
                    categoryId: cat.id,
                    homeTeamId: `team-${cat.id}-${j}`,
                    awayTeamId: `team-${cat.id}-${i}`,
                    round: 1,
                    category: cat.name,
                    isReturn: true
                })
            }
        }
    }
  })

  // Adicionar mais jogos para chegar perto de 49
  while (mockGames.length < 49) {
    mockGames.push({
        categoryId: 'cat2',
        homeTeamId: `extra-h-${mockGames.length}`,
        awayTeamId: `extra-a-${mockGames.length}`,
        round: 2,
        category: 'Sub 15'
    })
  }

  const config = {
    numberOfCourts: 1,
    dayStartTime: '08:00',
    regularDayEndTime: '19:00',
    extendedDayEndTime: '20:30',
    slotDurationMinutes: 75,
    minRestSlotsPerTeam: 1,
    blockFormat: 'SAT_SUN' as const,
    startWeekend: new Date('2025-05-10'),
  }

  it('deve agendar exatamente 49 jogos', () => {
    const result = scheduleGamesByTimeWindow(mockGames, config)
    expect(result.length).toBe(49)
  })

  it('não deve haver colisão de horário em 1 quadra', () => {
    const result = scheduleGamesByTimeWindow(mockGames, config)
    const slots = result.map(g => `${g.date}-${g.time}`)
    const uniqueSlots = new Set(slots)
    expect(uniqueSlots.size).toBe(result.length)
  })

  it('respeita descanso de 1 slot para o mesmo time/categoria', () => {
    const result = scheduleGamesByTimeWindow(mockGames, config)
    // Verificar jogos de um time específico (team-cat1-0)
    const teamGames = result.filter(g => 
        (g.homeTeamId === 'team-cat1-0' || g.awayTeamId === 'team-cat1-0') && 
        g.categoryId === 'cat1'
    ).sort((a, b) => a.dateTime.getTime() - b.dateTime.getTime())

    for (let i = 0; i < teamGames.length - 1; i++) {
        if (teamGames[i].date === teamGames[i+1].date) {
            // Se no mesmo dia, verificar slots
            // Com slots de 75 min, o tempo entre jogos deve ser >= 150 min (1 slot livre)
            const diff = (teamGames[i+1].dateTime.getTime() - teamGames[i].dateTime.getTime()) / (1000 * 60)
            expect(diff).toBeGreaterThanOrEqual(150)
        }
    }
  })
})
