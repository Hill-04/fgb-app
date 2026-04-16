import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session || !(session.user as any).isAdmin) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  try {
    const supabase = await createClient()
    
    // @ts-ignore
    const { data, error } = await (supabase as any)
      .from('games')
      .select(`
        *,
        home_team:teams!home_team_id(*),
        away_team:teams!away_team_id(*)
      `)
      .order('scheduled_at', { ascending: true })

    if (error) throw error

    return NextResponse.json(data)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session || !(session.user as any)?.isAdmin) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  try {
    const supabase = await createClient()
    const body = await req.json()

    // Validations
    if (!body.home_team_id || !body.away_team_id || !body.scheduled_at) {
      return NextResponse.json({ error: 'Campos obrigatórios ausentes.' }, { status: 400 })
    }

    if (body.home_team_id === body.away_team_id) {
      return NextResponse.json({ error: 'O time mandante deve ser diferente do visitante.' }, { status: 400 })
    }

    // Get active season if not provided
    let seasonId = body.season_id
    if (!seasonId) {
      const { data: activeSeason, error: seasonError } = await (supabase as any)
        .from('seasons')
        .select('id')
        .eq('is_active', true)
        // @ts-ignore
        .maybeSingle()
      
      if (seasonError || !activeSeason) {
        return NextResponse.json({ error: 'Nenhuma temporada ativa encontrada.' }, { status: 400 })
      }
      // @ts-ignore
      seasonId = activeSeason.id
    }

    // @ts-ignore
    const { data, error } = await (supabase as any)
      .from('games')
      // @ts-ignore
      .insert({
        season_id: seasonId,
        home_team_id: body.home_team_id,
        away_team_id: body.away_team_id,
        scheduled_at: body.scheduled_at,
        venue: body.venue || null,
        round: body.round || null,
        status: 'scheduled'
      })
      .select()
      // @ts-ignore
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
