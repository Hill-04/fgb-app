import { NextResponse } from 'next/server'

import { prisma } from '@/lib/db'
import { ensureDatabaseSchema } from '@/lib/db-patch'

const LIVE_VISIBLE_STATUSES = new Set([
  'PRE_GAME_READY',
  'LIVE',
  'HALFTIME',
  'PERIOD_BREAK',
  'FINAL_PENDING_CONFIRMATION',
  'FINAL_OFFICIAL',
])

function periodLabel(period: number) {
  return period <= 4 ? `Q${period}` : `OT${period - 4}`
}

function describeEvent(
  eventType: string,
  athleteName: string | null,
  teamName: string | null,
  pointsDelta: number | null
): string {
  const actor = athleteName || teamName || 'Equipe'

  switch (eventType) {
    case 'SHOT_MADE_2':
      return `Cesta 2 pts - ${actor}`
    case 'SHOT_MADE_3':
      return `Cesta 3 pts - ${actor}`
    case 'FREE_THROW_MADE':
      return `Lance livre - ${actor}`
    case 'SHOT_MISSED_2':
      return `Erro 2 pts - ${actor}`
    case 'SHOT_MISSED_3':
      return `Erro 3 pts - ${actor}`
    case 'FREE_THROW_MISSED':
      return `LL perdido - ${actor}`
    case 'REBOUND_OFFENSIVE':
      return `Rebote ofensivo - ${actor}`
    case 'REBOUND_DEFENSIVE':
      return `Rebote defensivo - ${actor}`
    case 'TURNOVER':
      return `TO - ${actor}`
    case 'STEAL':
      return `Roubo - ${actor}`
    case 'BLOCK':
      return `Toco - ${actor}`
    case 'ASSIST':
      return `Assistencia - ${actor}`
    case 'FOUL_PERSONAL':
      return `Falta - ${actor}`
    case 'FOUL_TECHNICAL':
      return `Falta tecnica - ${actor}`
    case 'FOUL_UNSPORTSMANLIKE':
      return `Falta antidesportiva - ${actor}`
    case 'FOUL_DISQUALIFYING':
      return `Falta desqualificante - ${actor}`
    case 'TIMEOUT_CONFIRMED':
      return `Tempo tecnico - ${teamName || actor}`
    case 'GAME_START':
      return 'Inicio do jogo'
    case 'PERIOD_START':
      return `Inicio do periodo ${pointsDelta ?? ''}`.trim()
    case 'PERIOD_END':
      return `Fim do periodo ${pointsDelta ?? ''}`.trim()
    case 'HALFTIME_START':
      return 'Intervalo'
    case 'HALFTIME_END':
      return 'Retorno do intervalo'
    case 'GAME_END':
      return 'Fim do jogo'
    default:
      return `${actor} - ${eventType}`
  }
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureDatabaseSchema()
    const { id } = await params

    const game = await prisma.game.findUnique({
      where: { id },
      select: { id: true, isLivePublished: true, liveStatus: true, status: true },
    })

    if (!game) {
      return NextResponse.json({ error: 'Jogo nao encontrado' }, { status: 404 })
    }

    const isVisible =
      game.isLivePublished ||
      LIVE_VISIBLE_STATUSES.has(game.liveStatus) ||
      game.status === 'FINISHED'

    if (!isVisible) {
      return NextResponse.json({ error: 'Jogo ainda nao publicado' }, { status: 403 })
    }

    const events = await prisma.gameEvent.findMany({
      where: { gameId: id, isCancelled: false, isReverted: false },
      include: {
        team: { select: { id: true, name: true } },
        athlete: { select: { id: true, name: true } },
      },
      orderBy: [{ sequenceNumber: 'asc' }, { createdAt: 'asc' }],
    })

    const periodMap = new Map<
      number,
      Array<{
        id: string
        sequenceNumber: number
        clockTime: string | null
        eventType: string
        description: string
        teamId: string | null
        teamName: string | null
        athleteId: string | null
        athleteName: string | null
        homeScoreAfter: number | null
        awayScoreAfter: number | null
        pointsDelta: number
      }>
    >()

    for (const event of events) {
      const period = event.period ?? 0
      if (!periodMap.has(period)) periodMap.set(period, [])

      periodMap.get(period)!.push({
        id: event.id,
        sequenceNumber: event.sequenceNumber ?? 0,
        clockTime: event.clockTime,
        eventType: event.eventType,
        description: describeEvent(
          event.eventType,
          event.athlete?.name ?? null,
          event.team?.name ?? null,
          event.pointsDelta
        ),
        teamId: event.teamId,
        teamName: event.team?.name ?? null,
        athleteId: event.athleteId,
        athleteName: event.athlete?.name ?? null,
        homeScoreAfter: event.homeScoreAfter,
        awayScoreAfter: event.awayScoreAfter,
        pointsDelta: event.pointsDelta ?? 0,
      })
    }

    const periods = Array.from(periodMap.entries())
      .sort(([a], [b]) => a - b)
      .map(([period, evts]) => ({
        period,
        label: period === 0 ? 'Pre-jogo' : periodLabel(period),
        events: evts,
      }))

    return NextResponse.json({ periods }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error: any) {
    console.error('[PUBLIC][play-by-play GET]', error)
    return NextResponse.json(
      { error: error.message || 'Erro ao carregar play-by-play' },
      { status: 500 }
    )
  }
}
