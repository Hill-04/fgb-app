export function optimizeGameDistribution(games: any[], maxPerDay: number): number[] {
  if (games.length === 0) return []
  
  const totalGames = games.length
  let numDays = Math.ceil(totalGames / maxPerDay)
  
  // Se for maior que 1 dia e o último tiver apenas 1 jogo
  if (numDays > 1 && totalGames % maxPerDay === 1) {
    // Tentar equilibrar os dois últimos dias
    // Ex: 9 jogos com max 8. Em vez de [8, 1], fazemos [5, 4]
    const lastBlock = maxPerDay + 1
    const half = Math.ceil(lastBlock / 2)
    
    const distribution: number[] = []
    for (let i = 0; i < numDays - 2; i++) distribution.push(maxPerDay)
    distribution.push(lastBlock - half)
    distribution.push(half)
    return distribution
  }
  
  // Distribuição padrão
  const distribution: number[] = []
  let remaining = totalGames
  while (remaining > 0) {
    const take = Math.min(remaining, maxPerDay)
    distribution.push(take)
    remaining -= take
  }
  return distribution
}
