import { NextResponse } from 'next/server'

import { ensureDatabaseSchema } from '@/lib/db-patch'
import { LiveGameService } from '@/modules/live-game/services/live-game-service'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureDatabaseSchema()
    const { id } = await params
    const data = await LiveGameService.getSnapshot(id, true)
    return NextResponse.json(data)
  } catch (error: any) {
    console.error('[LIVE][Public GET]', error)
    return NextResponse.json({ error: error.message || 'Erro ao carregar jogo ao vivo' }, { status: 500 })
  }
}
