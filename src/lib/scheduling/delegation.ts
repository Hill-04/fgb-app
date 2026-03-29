interface ScheduledGame {
  categoryId: string
  homeTeamId: string
  awayTeamId: string
  dateTime: Date
  [key: string]: any
}

interface TeamInfo {
  id: string
  city: string | null
}

export function detectDelegationOverload(
  games: ScheduledGame[],
  teams: TeamInfo[],
  maxLoad: number
): { teamId: string; date: string; games: ScheduledGame[] }[] {
  const overloads: { teamId: string; date: string; games: ScheduledGame[] }[] = []
  
  // Mapear teamId -> city
  const teamCityMap = new Map(teams.map(t => [t.id, t.city || t.id])) // fallback id se sem cidade
  
  // Agrupar jogos por dia e por cidade/delegação
  const gamesByDayAndDelegation = new Map<string, Map<string, ScheduledGame[]>>()

  for (const game of games) {
    const dateStr = game.dateTime.toISOString().split('T')[0]
    if (!gamesByDayAndDelegation.has(dateStr)) {
      gamesByDayAndDelegation.set(dateStr, new Map())
    }

    const dayMap = gamesByDayAndDelegation.get(dateStr)!
    
    // Contar para ambos os times (quem viaja é a delegação)
    const teamsInGame = [game.homeTeamId, game.awayTeamId]
    
    for (const tId of teamsInGame) {
      const city = teamCityMap.get(tId)!
      if (!dayMap.has(city)) {
        dayMap.set(city, [])
      }
      dayMap.get(city)!.push(game)
    }
  }

  // Verificar sobrecargas
  for (const [date, dayMap] of gamesByDayAndDelegation.entries()) {
    for (const [city, cityGames] of dayMap.entries()) {
      // Nota: cityGames contém duplicatas se dois times da mesma cidade jogam entre si? 
      // Não, pois as delegações geralmente viajam juntas. Mas vamos ser precisos.
      // O limite é por cidade (delegação). 
      // Removemos duplicatas de jogos (ID) para contar jogos únicos da delegação no dia.
      const uniqueGames = Array.from(new Set(cityGames))
      
      if (uniqueGames.length > maxLoad) {
        overloads.push({
          teamId: city, // Aqui usamos a cidade como identificador da delegação
          date,
          games: uniqueGames
        })
      }
    }
  }

  return overloads
}

/**
 * Tenta mover jogos excedentes para o próximo dia disponível.
 * Esta função é complexa pois impacta toda a malha.
 */
export function redistributeOverloadedGames(
  games: ScheduledGame[],
  teams: TeamInfo[],
  maxLoad: number
): ScheduledGame[] {
  let result = [...games]
  let hasOverload = true
  let attempts = 0
  const MAX_ATTEMPTS = 5 // Evita loop infinito se impossível

  while (hasOverload && attempts < MAX_ATTEMPTS) {
    const overloads = detectDelegationOverload(result, teams, maxLoad)
    if (overloads.length === 0) {
      hasOverload = false
      break
    }

    // Para cada sobrecarga, tentamos mover o último jogo do dia para o dia seguinte
    for (const overload of overloads) {
      const excessGames = overload.games.slice(maxLoad)
      
      for (const gameToMove of excessGames) {
        const idx = result.indexOf(gameToMove)
        if (idx === -1) continue

        // Mover para +24h (próximo dia do bloco)
        const newDate = new Date(gameToMove.dateTime)
        newDate.setDate(newDate.getDate() + 1)
        
        result[idx] = {
          ...gameToMove,
          dateTime: newDate
        }
      }
    }
    attempts++
  }

  return result
}
