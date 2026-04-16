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
    // @ts-ignore
    const { data: game, error: gameError } = await (supabase as any)
      .from('games')
      .select('id, home_team_id, away_team_id, home_score, away_score')
      .eq('id', id)
      .single()

    if (gameError) throw gameError

    // 2. Buscar atletas dos dois times
    // @ts-ignore
    const { data: athletes, error: athletesError } = await (supabase as any)
      .from('athletes')
      .select('id, name, nickname, team_id, jersey_number, photo_url')
      .in('team_id', [game.home_team_id, game.away_team_id])
      .eq('is_active', true)

    if (athletesError) throw athletesError

    // 3. Buscar estatísticas existentes do jogo
    // @ts-ignore
    const { data: stats, error: statsError } = await (supabase as any)
      .from('game_stats')
      .select('*')
      .eq('game_id', id)

    if (statsError) throw statsError

    return NextResponse.json({
      game,
      athletes,
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

    // 1. Validação de segurança: buscar times do jogo
    // @ts-ignore
    const { data: game, error: gameError } = await (supabase as any)
      .from('games')
      .select('home_team_id, away_team_id')
      .eq('id', gameId)
      .single()
    
    if (gameError) throw gameError

    const allowedTeams = [game.home_team_id, game.away_team_id]

    // 2. Limpar estatísticas anteriores do jogo (Lógica "Limpar e Reinserir")
    // @ts-ignore
    const { error: deleteError } = await (supabase as any)
      .from('game_stats')
      .delete()
      .eq('game_id', gameId)

    if (deleteError) throw deleteError

    // 3. Preparar novos dados e validar atletas
    const statsToInsert = stats.map((s: any) => ({
      ...s,
      game_id: gameId
    })).filter((s: any) => allowedTeams.includes(s.team_id))

    if (statsToInsert.length === 0 && stats.length > 0) {
      return NextResponse.json({ error: 'Nenhum atleta válido para os times deste jogo' }, { status: 400 })
    }

    // 4. Inserir lote completo
    if (statsToInsert.length > 0) {
      // @ts-ignore
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
