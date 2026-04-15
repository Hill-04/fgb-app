import { createClient } from '@/lib/supabase/server'

export async function getGamesBySeasonId(seasonId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('games')
    .select(`
      *,
      home_team:teams!home_team_id(*),
      away_team:teams!away_team_id(*)
    `)
    .eq('season_id', seasonId)
    .order('scheduled_at', { ascending: true })
  return data ?? []
}

export async function getLiveGames() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('games')
    .select(`
      *,
      home_team:teams!home_team_id(*),
      away_team:teams!away_team_id(*)
    `)
    .eq('status', 'live')
  return data ?? []
}

export async function getRecentResults(limit = 5) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('games')
    .select(`
      *,
      home_team:teams!home_team_id(*),
      away_team:teams!away_team_id(*)
    `)
    .eq('status', 'finished')
    .order('scheduled_at', { ascending: false })
    .limit(limit)
  return data ?? []
}

export async function getGameWithStats(gameId: string) {
  const supabase = await createClient()
  const { data: game } = await supabase
    .from('games')
    .select(`
      *,
      home_team:teams!home_team_id(*),
      away_team:teams!away_team_id(*)
    `)
    .eq('id', gameId)
    .single()

  const { data: stats } = await supabase
    .from('game_stats')
    .select(`*, athlete:athletes(id, name, nickname, position, jersey_number, photo_url)`)
    .eq('game_id', gameId)
    .order('points', { ascending: false })

  return { game, stats: stats ?? [] }
}
