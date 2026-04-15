import { createClient } from '@/lib/supabase/server'

export async function getStandings(seasonId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('standings')
    .select('*')
    .eq('season_id', seasonId)
    .order('win_pct', { ascending: false })
  return data ?? []
}
