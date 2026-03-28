interface GameData {
  categoryName: string
  round: number
  time: string
  homeTeamName: string
  awayTeamName: string
  court?: string
}

interface GameSlotData {
  label: string
  matchup: string
  court?: string
}

export function formatGameSlot(game: GameData): GameSlotData {
  return {
    label: `${game.categoryName} · Rod. ${game.round} · ${game.time}`,
    matchup: `${game.homeTeamName} × ${game.awayTeamName}`,
    court: game.court,
  }
}
