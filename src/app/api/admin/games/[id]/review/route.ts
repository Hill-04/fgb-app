import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'

import { authOptions } from '@/lib/auth'
import { ensureDatabaseSchema } from '@/lib/db-patch'
import { LiveGameService } from '@/modules/live-game/services/live-game-service'

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
    const data = await LiveGameService.handleReviewAction(id, action as any, (session.user as any).id)

    return NextResponse.json(data)
  } catch (error: any) {
    console.error('[LIVE][Review POST]', error)
    return NextResponse.json({ error: error.message || 'Erro ao fechar oficialmente o jogo' }, { status: 500 })
  }
}
