import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  try {
    const count = await prisma.game.count({
      where: {
        isLivePublished: true,
        liveStatus: { in: ['LIVE', 'PRE_GAME_READY', 'HALFTIME', 'PERIOD_BREAK'] },
      },
    })
    return NextResponse.json({ count }, {
      headers: { 'Cache-Control': 'no-store, max-age=0' },
    })
  } catch {
    return NextResponse.json({ count: 0 })
  }
}
