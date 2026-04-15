import { createClient } from '@/lib/supabase/server'

export async function getTopScorers(seasonId: string, limit = 10) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('athlete_season_stats')
    .select('*')
    .eq('season_id', seasonId)
    .order('avg_points', { ascending: false })
    .limit(limit)
  return data ?? []
}

export async function getTopRebounders(seasonId: string, limit = 10) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('athlete_season_stats')
    .select('*')
    .eq('season_id', seasonId)
    .order('avg_rebounds', { ascending: false })
    .limit(limit)
  return data ?? []
}

export async function getAthleteStats(athleteId: string, seasonId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('athlete_season_stats')
    .select('*')
    .eq('athlete_id', athleteId)
    .eq('season_id', seasonId)
    .single()
  return data
}
