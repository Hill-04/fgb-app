import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session || !(session.user as any)?.isAdmin) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  try {
    const { id: gameId } = await params
    const supabase = await createClient()

    // 1. Buscar jogo e times
    const { data: game, error: gameError } = await (supabase as any)
      .from('games')
      .select(`
        *,
        homeTeam:teams!home_team_id (*),
        awayTeam:teams!away_team_id (*)
      `)
      .eq('id', gameId)
      .single()

    if (gameError || !game) {
      return NextResponse.json({ error: 'Jogo não encontrado' }, { status: 404 })
    }

    // 2. Buscar atletas ativos dos dois times
    const { data: athletes, error: athletesError } = await (supabase as any)
      .from('athletes')
      .select('*')
      .in('team_id', [game.home_team_id, game.away_team_id])
      .eq('status', 'ACTIVE')

    if (athletesError) throw athletesError

    // 3. Buscar rosters atuais
    const { data: rosters, error: rostersError } = await (supabase as any)
      .from('game_rosters')
      .select(`
        *,
        players:game_roster_players (*)
      `)
      .eq('game_id', gameId)

    if (rostersError) throw rostersError

    return NextResponse.json({
      game,
      athletes,
      rosters
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session || !(session.user as any)?.isAdmin) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  try {
    const { id: gameId } = await params
    const body = await req.json()
    const { rosters, lock } = body // rosters: { teamId: { players: [] }, ... }

    const supabase = await createClient()

    // 1. Validar status do jogo
    const { data: game, error: gameError } = await (supabase as any)
      .from('games')
      .select('status')
      .eq('id', gameId)
      .single()

    if (gameError || !game) throw new Error('Jogo não encontrado')
    if (game.status === 'finished') {
      return NextResponse.json({ error: 'Não é possível alterar o roster de um jogo finalizado' }, { status: 403 })
    }

    // 2. Processar cada time
    for (const teamId of Object.keys(rosters)) {
      const teamData = rosters[teamId]
      const players = teamData.players || []

      // Validação de 5 titulares se estiver travando
      if (lock) {
        const starters = players.filter((p: any) => p.is_starter && !p.is_dnp && p.status === 'ACTIVE')
        if (starters.length < 5) {
          return NextResponse.json({ 
            error: `O time ${teamId === (game as any).home_team_id ? 'Mandante' : 'Visitante'} precisa de pelo menos 5 titulares elegíveis.` 
          }, { status: 400 })
        }
      }

      // 2.1 Upsert GameRoster
      const { data: roster, error: rosterError } = await (supabase as any)
        .from('game_rosters')
        .upsert({
          game_id: gameId,
          team_id: teamId,
          is_locked: lock || false,
          updated_at: new Date().toISOString()
        }, { onConflict: 'game_id,team_id' })
        .select()
        .single()

      if (rosterError) throw rosterError

      // 2.2 Limpar e Reinserir Players
      await (supabase as any)
        .from('game_roster_players')
        .delete()
        .eq('game_roster_id', roster.id)

      if (players.length > 0) {
        const playersToInsert = players.map((p: any) => ({
          game_roster_id: roster.id,
          athlete_id: p.athlete_id,
          jersey_number: p.jersey_number,
          is_starter: p.is_starter || false,
          is_available: !p.is_dnp,
          status: p.status || 'ACTIVE'
        }))

        const { error: insertError } = await (supabase as any)
          .from('game_roster_players')
          .insert(playersToInsert)

        if (insertError) throw insertError
      }
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
