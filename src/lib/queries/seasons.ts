import { createClient } from '@/lib/supabase/server'

export async function getActiveSeason() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('seasons')
    .select('*')
    .eq('is_active', true)
    .single()
  return data
}
