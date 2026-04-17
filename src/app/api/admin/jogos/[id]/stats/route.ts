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
    const { id } = await params
    const supabase = await createClient()

    // 1. Buscar o jogo para saber os times
    const { data: game, error: gameError } = await (supabase as any)
      .from('games')
      .select('id, home_team_id, away_team_id, home_score, away_score, status')
      .eq('id', id)
      .single()

    if (gameError) throw gameError

    // 2. Buscar atletas dos dois times
    const { data: athletes, error: athletesError } = await (supabase as any)
      .from('athletes')
      .select('id, name, nickname, team_id, jersey_number, photo_url')
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
      .eq('game_id', id)

    if (rostersError) throw rostersError

    // 4. Buscar estatísticas existentes do jogo
    const { data: stats, error: statsError } = await (supabase as any)
      .from('game_stats')
      .select('*')
      .eq('game_id', id)

    if (statsError) throw statsError

    return NextResponse.json({
      game,
      athletes,
      rosters,
      stats
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
    const { stats } = body // Array de InsertGameStat

    if (!Array.isArray(stats)) {
      return NextResponse.json({ error: 'Payload de stats inválido' }, { status: 400 })
    }

    const supabase = await createClient()

    // 1. Validação: buscar rosters para verificar DNP e pertencimento
    const { data: gamePlayers, error: playersError } = await (supabase as any)
      .from('game_roster_players')
      .select('athlete_id, is_available, game_rosters!inner(game_id)')
      .eq('game_rosters.game_id', gameId)

    if (playersError) throw playersError

    // Mapa de elegibilidade
    const eligibilityMap = new Map(
      gamePlayers.map((p: any) => [p.athlete_id, p.is_available])
    )

    // 2. Preparar novos dados e validar
    const statsToInsert = []
    for (const s of stats) {
      if (!eligibilityMap.has(s.athlete_id)) {
        return NextResponse.json({ error: `Atleta ${s.athlete_id} não está no roster oficial.` }, { status: 400 })
      }
      if (!eligibilityMap.get(s.athlete_id)) {
        return NextResponse.json({ error: `Atleta ${s.athlete_id} está marcado como DNP.` }, { status: 400 })
      }

      statsToInsert.push({
        ...s,
        game_id: gameId
      })
    }

    // 3. Limpar estatísticas anteriores do jogo (Lógica "Limpar e Reinserir")
    const { error: deleteError } = await (supabase as any)
      .from('game_stats')
      .delete()
      .eq('game_id', gameId)

    if (deleteError) throw deleteError

    // 4. Inserir lote completo
    if (statsToInsert.length > 0) {
      const { error: insertError } = await (supabase as any)
        .from('game_stats')
        .insert(statsToInsert)

      if (insertError) throw insertError
    }

    return NextResponse.json({ 
      success: true, 
      count: statsToInsert.length,
      message: `${statsToInsert.length} estatísticas salvas com sucesso.`
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
