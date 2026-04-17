import { NextResponse } from 'next/server'

import { ensureDatabaseSchema } from '@/lib/db-patch'
import { buildPublicLiveSnapshot } from '@/modules/live-game/services/live-public-snapshot'
import { LiveGameService } from '@/modules/live-game/services/live-game-service'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureDatabaseSchema()
    const { id } = await params
    const snapshot = await LiveGameService.getSnapshot(id, true)
    const payload = buildPublicLiveSnapshot(snapshot)

    return NextResponse.json(payload, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    })
  } catch (error: any) {
    console.error('[LIVE][Public Snapshot GET]', error)
    return NextResponse.json(
      { error: error.message || 'Erro ao carregar snapshot publico ao vivo' },
      { status: 500 }
    )
  }
}

