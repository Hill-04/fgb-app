type LiveSnapshot = {
  game: {
    id: string
    status?: string | null
    liveStatus?: string | null
    homeScore?: number | null
    awayScore?: number | null
  }
  events?: Array<unknown>
  boxScore?: {
    players?: Array<{
      athleteId: string
      teamId: string
      points: number
      fouls: number
      assists: number
      reboundsOffensive: number
      reboundsDefensive: number
      steals: number
      blocks: number
      turnovers: number
      twoPtMade: number
      twoPtAttempted: number
      threePtMade: number
      threePtAttempted: number
      freeThrowsMade: number
      freeThrowsAttempted: number
    }>
  }
}

const LIVE_STATUSES = new Set(['PRE_GAME_READY', 'LIVE', 'HALFTIME', 'PERIOD_BREAK'])
const FINAL_STATUSES = new Set(['FINISHED', 'finished', 'FINAL_PENDING_CONFIRMATION', 'FINAL_OFFICIAL'])

function toLegacyStatus(snapshot: LiveSnapshot) {
  const gameStatus = snapshot.game.status ?? ''
  const liveStatus = snapshot.game.liveStatus ?? ''
  const hasEvents = (snapshot.events?.length ?? 0) > 0

  if (FINAL_STATUSES.has(gameStatus) || FINAL_STATUSES.has(liveStatus)) {
    return 'finished'
  }

  if (LIVE_STATUSES.has(liveStatus) || hasEvents) {
    return 'live'
  }

  return 'scheduled'
}

function buildEssentialLegacyStats(snapshot: LiveSnapshot) {
  const gameId = snapshot.game.id
  const players = snapshot.boxScore?.players ?? []

  return players.map((line) => ({
    game_id: gameId,
    athlete_id: line.athleteId,
    team_id: line.teamId,
    points: line.points,
    fouls: line.fouls,
    assists: line.assists,
    rebounds_offensive: line.reboundsOffensive,
    rebounds_defensive: line.reboundsDefensive,
    steals: line.steals,
    blocks: line.blocks,
    turnovers: line.turnovers,
    fg_made: line.twoPtMade + line.threePtMade,
    fg_attempted: line.twoPtAttempted + line.threePtAttempted,
    three_made: line.threePtMade,
    three_attempted: line.threePtAttempted,
    ft_made: line.freeThrowsMade,
    ft_attempted: line.freeThrowsAttempted,
  }))
}

export async function syncLiveSnapshotToLegacy(supabase: any, snapshot: LiveSnapshot) {
  if (!snapshot?.game?.id) {
    throw new Error('Snapshot live invÃ¡lido para sincronizaÃ§Ã£o com legado.')
  }

  const legacyStatus = toLegacyStatus(snapshot)
  const essentialStats = buildEssentialLegacyStats(snapshot)

  const { error: gameUpdateError } = await supabase
    .from('games')
    .update({
      home_score: Number(snapshot.game.homeScore ?? 0),
      away_score: Number(snapshot.game.awayScore ?? 0),
      status: legacyStatus,
    })
    .eq('id', snapshot.game.id)

  if (gameUpdateError) {
    throw new Error(`Falha ao sincronizar placar no legado: ${gameUpdateError.message}`)
  }

  const { error: deleteStatsError } = await supabase
    .from('game_stats')
    .delete()
    .eq('game_id', snapshot.game.id)

  if (deleteStatsError) {
    throw new Error(`Falha ao limpar stats legados: ${deleteStatsError.message}`)
  }

  if (essentialStats.length > 0) {
    const { error: insertStatsError } = await supabase
      .from('game_stats')
      .insert(essentialStats)

    if (insertStatsError) {
      throw new Error(`Falha ao sincronizar stats legados: ${insertStatsError.message}`)
    }
  }

  return {
    legacyStatus,
    syncedPlayers: essentialStats.length,
  }
}
