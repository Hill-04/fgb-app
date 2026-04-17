import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'

import { authOptions } from '@/lib/auth'
import { ensureDatabaseSchema } from '@/lib/db-patch'
import { createClient } from '@/lib/supabase/server'
import { syncLiveSnapshotToLegacy } from '@/modules/live-game/services/live-legacy-sync'
import { LiveGameService } from '@/modules/live-game/services/live-game-service'

const EVENT_TYPE_MAP: Record<string, { eventType: string; pointsDelta?: number }> = {
  POINT_1: { eventType: 'FREE_THROW_MADE', pointsDelta: 1 },
  POINT_2: { eventType: 'SHOT_MADE_2', pointsDelta: 2 },
  POINT_3: { eventType: 'SHOT_MADE_3', pointsDelta: 3 },
  REBOUND_OFF: { eventType: 'REBOUND_OFFENSIVE' },
  REBOUND_DEF: { eventType: 'REBOUND_DEFENSIVE' },
  ASSIST: { eventType: 'ASSIST' },
  STEAL: { eventType: 'STEAL' },
  BLOCK: { eventType: 'BLOCK' },
  TURNOVER: { eventType: 'TURNOVER' },
  FOUL: { eventType: 'FOUL_PERSONAL' },
}

async function requireAdmin() {
  const session = await getServerSession(authOptions)
  if (!session || !(session.user as any).isAdmin) {
    return null
  }
  return session
}

function mapToLiveEventType(rawType: unknown) {
  const normalized = String(rawType || '').toUpperCase()
  return EVENT_TYPE_MAP[normalized] ?? { eventType: normalized }
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

    return NextResponse.json({
      events: snapshot.events,
      game: snapshot.game,
      boxScore: snapshot.boxScore,
      rosters: snapshot.rosters,
      liveSummary: {
        hasLiveScout: snapshot.events.length > 0,
        eventsCount: snapshot.events.length,
      },
    })
  } catch (error: any) {
    console.error('[LIVE][Admin Jogos Events GET]', error)
    return NextResponse.json({ error: error.message || 'Erro ao carregar eventos' }, { status: 500 })
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
    const actorUserId = (session.user as any).id

    let snapshot: any
    if (action === 'UNDO_LAST') {
      snapshot = await LiveGameService.handleLiveAction(id, 'revert-event', actorUserId, {})
    } else {
      const baseSnapshot = await LiveGameService.getSnapshot(id)
      const mapped = mapToLiveEventType(body.event_type ?? body.eventType)
      const athleteId = body.athlete_id ? String(body.athlete_id) : body.athleteId ? String(body.athleteId) : ''
      const teamId = body.team_id ? String(body.team_id) : body.teamId ? String(body.teamId) : ''
      const period = Number(body.period ?? baseSnapshot.game.currentPeriod ?? 1) || 1
      const clockTime = String(body.clock_time ?? body.clockTime ?? baseSnapshot.game.clockDisplay ?? '10:00')

      if (!mapped.eventType) {
        return NextResponse.json({ error: 'event_type e obrigatorio' }, { status: 400 })
      }
      if (!athleteId || !teamId) {
        return NextResponse.json({ error: 'athlete_id e team_id sao obrigatorios' }, { status: 400 })
      }

      snapshot = await LiveGameService.handleLiveAction(id, 'event', actorUserId, {
        eventType: mapped.eventType,
        pointsDelta: mapped.pointsDelta,
        athleteId,
        teamId,
        period,
        clockTime,
      })
    }

    const supabase = await createClient()
    const legacySync = await syncLiveSnapshotToLegacy(supabase as any, snapshot)

    return NextResponse.json({
      ...snapshot,
      legacySync,
    })
  } catch (error: any) {
    console.error('[LIVE][Admin Jogos Events POST]', error)
    return NextResponse.json({ error: error.message || 'Erro ao registrar evento' }, { status: 500 })
  }
}
