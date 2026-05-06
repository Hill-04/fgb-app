import { NextRequest } from 'next/server'
import { buildPublicLiveSnapshot } from '@/modules/live-game/services/live-public-snapshot'
import { LiveGameService } from '@/modules/live-game/services/live-game-service'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest, { params }: { params: Promise<{ gameId: string }> }) {
  const { gameId } = await params

  const encoder = new TextEncoder()
  let closed = false

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: unknown) => {
        if (closed) return
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
        } catch {
          closed = true
        }
      }

      const tick = async () => {
        if (closed) return
        try {
          const snapshot = await LiveGameService.getSnapshot(gameId)
          send(buildPublicLiveSnapshot(snapshot))
        } catch {
          send({ error: 'snapshot_failed' })
        }
      }

      // Send initial snapshot immediately
      await tick()

      // Poll every 3s
      const interval = setInterval(tick, 3000)

      req.signal.addEventListener('abort', () => {
        closed = true
        clearInterval(interval)
        try { controller.close() } catch { /* already closed */ }
      })
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
}
