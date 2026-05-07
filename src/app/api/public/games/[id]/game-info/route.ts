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

const OFFICIAL_TYPE_LABELS: Record<string, string> = {
  REFEREE: 'Árbitro',
  TABLE: 'Mesário',
  STATS: 'Estatístico',
  COMMISSIONER: 'Comissário',
  DELEGATE: 'Delegado',
  OTHER: 'Outro',
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
      select: {
        id: true,
        isLivePublished: true,
        liveStatus: true,
        status: true,
        dateTime: true,
        location: true,
        city: true,
        court: true,
        venue: true,
        attendance: true,
        championship: { select: { name: true, year: true } },
        category: { select: { name: true } },
        officials: {
          orderBy: { createdAt: 'asc' },
        },
        refereeAssignments: {
          include: {
            referee: {
              select: { id: true, name: true, licenseNumber: true },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    })

    if (!game) {
      return NextResponse.json({ error: 'Jogo não encontrado' }, { status: 404 })
    }

    const isVisible =
      game.isLivePublished ||
      LIVE_VISIBLE_STATUSES.has(game.liveStatus) ||
      game.status === 'FINISHED'

    if (!isVisible) {
      return NextResponse.json({ error: 'Jogo ainda não publicado' }, { status: 403 })
    }

    const officials = game.officials.map((o) => ({
      id: o.id,
      name: o.name,
      officialType: o.officialType,
      typeLabel: OFFICIAL_TYPE_LABELS[o.officialType] ?? o.officialType,
      role: o.role,
    }))

    const referees = game.refereeAssignments.map((a) => ({
      id: a.id,
      name: a.referee.name,
      licenseNumber: a.referee.licenseNumber,
      role: a.role,
    }))

    return NextResponse.json(
      {
        game: {
          id: game.id,
          dateTime: game.dateTime,
          location: game.location,
          city: game.city,
          court: game.court,
          venue: game.venue,
          attendance: game.attendance,
          championship: game.championship
            ? `${game.championship.name} ${game.championship.year ?? ''}`.trim()
            : null,
          category: game.category?.name ?? null,
        },
        officials,
        referees,
      },
      { headers: { 'Cache-Control': 'no-store' } }
    )
  } catch (error: any) {
    console.error('[PUBLIC][game-info GET]', error)
    return NextResponse.json(
      { error: error.message || 'Erro ao carregar informações do jogo' },
      { status: 500 }
    )
  }
}
