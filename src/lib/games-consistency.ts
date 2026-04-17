import { Game, GameStat } from '@/types/database'

export interface ConsistencyResult {
  homeMatch: boolean
  awayMatch: boolean
  homeDiff: number
  awayDiff: number
  isConsistent: boolean
  manualHome: number
  calculatedHome: number
  manualAway: number
  calculatedAway: number
}

/**
 * Calcula a consistência entre o placar manual do jogo e a soma dos pontos dos atletas.
 */
export function checkGameConsistency(
  game: Game,
  stats: GameStat[]
): ConsistencyResult {
  const manualHome = game.home_score ?? 0
  const manualAway = game.away_score ?? 0

  const calculatedHome = stats
    .filter((s) => s.team_id === game.home_team_id)
    .reduce((sum, s) => sum + (s.points || 0), 0)

  const calculatedAway = stats
    .filter((s) => s.team_id === game.away_team_id)
    .reduce((sum, s) => sum + (s.points || 0), 0)

  const homeDiff = calculatedHome - manualHome
  const awayDiff = calculatedAway - manualAway

  const homeMatch = homeDiff === 0
  const awayMatch = awayDiff === 0

  return {
    homeMatch,
    awayMatch,
    homeDiff,
    awayDiff,
    isConsistent: homeMatch && awayMatch,
    manualHome,
    calculatedHome,
    manualAway,
    calculatedAway
  }
}
