import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'

import { authOptions } from '@/lib/auth'
import { ensureDatabaseSchema } from '@/lib/db-patch'
import { LiveGameService } from '@/modules/live-game/services/live-game-service'
import { closeGame } from '@/lib/game-close-service'

async function requireAdmin() {
  const session = await getServerSession(authOptions)
  if (!session || !(session.user as any).isAdmin) {
    return null
  }
  return session
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureDatabaseSchema()
    const session = await requireAdmin()
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { id } = await params
    const data = await LiveGameService.reviewGame(id)
    return NextResponse.json(data)
  } catch (error: any) {
    console.error('[LIVE][Review GET]', error)
    return NextResponse.json({ error: error.message || 'Erro ao revisar partida' }, { status: 500 })
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureDatabaseSchema()
    const session = await requireAdmin()
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const action = String(body.action || '')
    const userId = (session.user as any).id
    const data = await LiveGameService.handleReviewAction(id, action as any, userId)

    // ─── Fase 4.B Bridge: rotear finalize-official tambem pelo closeGame Fase 5 ───
    // Cria GameOfficialReportVersion + valida paridade + recalc Standings + gera PDF
    // (idempotente — se ja em CONFIRMED/PUBLISHED, retorna ok:false sem efeito)
    let fase5Result: any = null
    if (action === 'finalize-official') {
      try {
        fase5Result = await closeGame({
          gameId: id,
          actorUserId: userId,
          allowParityErrors: true, // legacy path ja finalizou — nao bloqueia
          reason: 'Encerramento via review/finalize-official (Fase 4.B bridge)',
        })
      } catch (err: any) {
        console.error('[LIVE][Review POST][Fase5 bridge]', err)
        fase5Result = { ok: false, error: err?.message ?? 'erro' }
      }
    }

    return NextResponse.json({ ...data, fase5: fase5Result })
  } catch (error: any) {
    console.error('[LIVE][Review POST]', error)
    return NextResponse.json({ error: error.message || 'Erro ao fechar oficialmente o jogo' }, { status: 500 })
  }
}
