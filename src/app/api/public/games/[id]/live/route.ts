import { NextResponse } from 'next/server'

import { ensureDatabaseSchema } from '@/lib/db-patch'
import { prisma } from '@/lib/db'
import { buildPublicLiveSnapshot } from '@/modules/live-game/services/live-public-snapshot'
import { LiveGameService } from '@/modules/live-game/services/live-game-service'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureDatabaseSchema()
    const { id } = await params
    const [snapshot, scoreTimeline] = await Promise.all([
      LiveGameService.getSnapshot(id, true),
      prisma.gameEvent.findMany({
        where: {
          gameId: id,
          isCancelled: false,
          isReverted: false,
        },
        select: {
          period: true,
          clockTime: true,
          eventType: true,
          teamId: true,
          pointsDelta: true,
          homeScoreAfter: true,
          awayScoreAfter: true,
          sequenceNumber: true,
          createdAt: true,
        },
        orderBy: [{ sequenceNumber: 'asc' }, { createdAt: 'asc' }],
      }),
    ])
    const payload = buildPublicLiveSnapshot(snapshot, scoreTimeline)

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
