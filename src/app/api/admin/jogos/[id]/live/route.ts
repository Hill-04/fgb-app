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
      return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })
    }

    const { id } = await params
    const snapshot = await LiveGameService.getSnapshot(id)
    const eventsCount = snapshot.events.length
    const rostersLocked = snapshot.rosters.length > 0 && snapshot.rosters.every((roster) => roster.isLocked)

    return NextResponse.json({
      ...snapshot,
      liveSummary: {
        hasLiveScout: eventsCount > 0,
        eventsCount,
        rostersLocked,
      },
    })
  } catch (error: any) {
    console.error('[LIVE][Admin Jogos GET]', error)
    return NextResponse.json({ error: error.message || 'Erro ao carregar live scout' }, { status: 500 })
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
      return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const action = String(body.action || '').toUpperCase()

    if (action !== 'OPEN_SESSION') {
      return NextResponse.json({ error: 'Acao de live invalida' }, { status: 400 })
    }

    const snapshot = await LiveGameService.handlePregameAction(
      id,
      'open-session',
      (session.user as any).id,
      body
    )

    return NextResponse.json(snapshot)
  } catch (error: any) {
    console.error('[LIVE][Admin Jogos POST]', error)
    return NextResponse.json({ error: error.message || 'Erro ao operar live scout' }, { status: 500 })
  }
}
