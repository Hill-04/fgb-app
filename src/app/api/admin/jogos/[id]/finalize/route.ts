import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { checkGameConsistency } from '@/lib/games-consistency'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const session = await getServerSession(authOptions)

  if (!session?.user || (session.user as any).role !== 'ADMIN') {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const { ignoreDiscrepancy } = await request.json()
  const supabase = await createClient()

  // 1. Buscar dados do jogo
  const { data, error: gameError } = await supabase
    .from('games')
    .select('*')
    .eq('id', id)
    .single()

  const game = data as any

  if (gameError || !game) {
    return NextResponse.json({ error: 'Jogo não encontrado' }, { status: 404 })
  }

  if (game.status === 'finished') {
    return NextResponse.json({ error: 'O jogo já está finalizado' }, { status: 400 })
  }

  // 2. Buscar estatísticas para conferência
  const { data: statsData, error: statsError } = await supabase
    .from('game_stats')
    .select('*')
    .eq('game_id', id)

  const stats = (statsData || []) as any[]

  if (statsError) {
    return NextResponse.json({ error: 'Erro ao carregar estatísticas' }, { status: 500 })
  }

  // 3. Validar consistência
  const consistency = checkGameConsistency(game, stats)

  if (!consistency.isConsistent && !ignoreDiscrepancy) {
    return NextResponse.json({
      error: 'Divergência detectada entre placar e estatísticas',
      consistency
    }, { status: 422 })
  }

  const logMessage = `[SISTEMA] Finalizado em ${new Date().toLocaleString('pt-BR')}${!consistency.isConsistent ? ' (com divergência aceita)' : ''}`

  // 4. Finalizar o jogo
  const { error: updateError } = await (supabase.from('games') as any)
    .update({
      status: 'finished',
      updated_at: new Date().toISOString(),
      notes: game.notes 
        ? `${game.notes}\n${logMessage}`
        : logMessage
    })
    .eq('id', id)

  if (updateError) {
    return NextResponse.json({ error: 'Erro ao finalizar jogo: ' + updateError.message }, { status: 500 })
  }

  return NextResponse.json({
    success: true,
    message: 'Jogo finalizado com sucesso'
  })
}
