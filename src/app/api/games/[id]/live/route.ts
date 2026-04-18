import { NextResponse } from 'next/server'

import { ensureDatabaseSchema } from '@/lib/db-patch'
import {
  buildLegacyPublicLiveCompatSnapshot,
  buildPublicLiveSnapshot,
} from '@/modules/live-game/services/live-public-snapshot'
import { LiveGameService } from '@/modules/live-game/services/live-game-service'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureDatabaseSchema()
    const { id } = await params
    const rawSnapshot = await LiveGameService.getSnapshot(id, true)
    const officialSnapshot = buildPublicLiveSnapshot(rawSnapshot)
    const compatibilityPayload = buildLegacyPublicLiveCompatSnapshot(officialSnapshot)

    // Legacy compatibility route. Official public live endpoint is /api/public/games/[id]/live.
    return NextResponse.json(compatibilityPayload, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        Deprecation: 'true',
        Sunset: 'Wed, 31 Dec 2026 23:59:59 GMT',
        Link: `</api/public/games/${id}/live>; rel="successor-version"`,
        Warning: '299 - "Deprecated API. Use /api/public/games/[id]/live"',
      },
    })
  } catch (error: any) {
    console.error('[LIVE][Public GET]', error)
    return NextResponse.json({ error: error.message || 'Erro ao carregar jogo ao vivo' }, { status: 500 })
  }
}
