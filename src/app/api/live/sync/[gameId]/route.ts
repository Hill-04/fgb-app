import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/db'
import { authOptions } from '@/lib/auth'
import { fibaGetGameState, fibaGetBoxScore, fibaGetActions } from '@/lib/fiba/client'
import { mapFibaBoxScoreToStatLine, mapFibaActionType, buildActionDescription, clockToMs } from '@/lib/fiba/mapper'

export async function POST(req: NextRequest, { params }: { params: Promise<{ gameId: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session || !(session.user as any).isAdmin) {
    return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })
  }

  const { gameId } = await params
  const body = await req.json().catch(() => ({}))
  const fixtureId: string = body.fixtureId

  if (!fixtureId) {
    return NextResponse.json({ error: 'fixtureId required' }, { status: 400 })
  }

  const game = await prisma.game.findUnique({ where: { id: gameId } })
  if (!game) return NextResponse.json({ error: 'Game not found' }, { status: 404 })

  const [state, boxScore] = await Promise.all([
    fibaGetGameState(fixtureId),
    fibaGetBoxScore(fixtureId),
  ])

  if (!state) {
    return NextResponse.json({ error: 'FIBA LiveStats offline or fixture not found' }, { status: 503 })
  }

  // Update Game live fields
  await prisma.game.update({
    where: { id: gameId },
    data: {
      fibaFixtureId: fixtureId,
      lastFibaSyncAt: new Date(),
      homeScore: state.homeScore,
      awayScore: state.awayScore,
      currentPeriod: state.period,
      homeTimeoutsUsed: (game.homeTimeoutsUsed ?? 0),
      awayTimeoutsUsed: (game.awayTimeoutsUsed ?? 0),
      homeTeamFoulsCurrentPeriod: state.homeFoulsPeriod,
      awayTeamFoulsCurrentPeriod: state.awayFoulsPeriod,
    },
  })

  // Upsert box score stats
  if (boxScore) {
    const allPlayers = [
      ...boxScore.homeTeam.players.map(p => ({ ...p, teamSide: 'home' as const })),
      ...boxScore.awayTeam.players.map(p => ({ ...p, teamSide: 'away' as const })),
    ]

    for (const fp of allPlayers) {
      // Find the athlete by linking via GameRosterPlayer + Athlete jersey/name
      const roster = await prisma.gameRoster.findFirst({
        where: { gameId },
        include: {
          players: {
            include: { athlete: true },
            where: { jerseyNumber: parseInt(fp.shirtNumber) || undefined },
          },
        },
      })

      const rosterPlayer = roster?.players[0]
      if (!rosterPlayer) continue

      const statData = mapFibaBoxScoreToStatLine(fp)
      await prisma.gamePlayerStatLine.upsert({
        where: { gameId_athleteId: { gameId, athleteId: rosterPlayer.athleteId } },
        create: {
          gameId,
          athleteId: rosterPlayer.athleteId,
          teamId: roster!.teamId,
          ...statData,
        },
        update: statData,
      })
    }
  }

  // Sync FIBA actions as GameEvents (only new ones)
  const liveSession = await prisma.gameLiveSession.findFirst({
    where: { gameId },
    orderBy: { createdAt: 'desc' },
  })

  if (liveSession) {
    const lastEvent = await prisma.gameEvent.findFirst({
      where: { gameId, liveSessionId: liveSession.id },
      orderBy: { sequenceNumber: 'desc' },
    })
    const fromAction = lastEvent ? (lastEvent.sequenceNumber + 1) : undefined
    const actions = await fibaGetActions(fixtureId, fromAction)

    if (actions && actions.length > 0) {
      const eventsToCreate = actions.flatMap((action) => {
        const eventType = mapFibaActionType(action)
        if (!eventType) return []
        return [{
          gameId,
          liveSessionId: liveSession.id,
          sequenceNumber: action.actionNumber,
          period: action.period,
          clockTime: action.clock,
          clockMs: clockToMs(action.clock),
          eventType,
          homeScoreAfter: action.scoreHome,
          awayScoreAfter: action.scoreAway,
          payloadJson: JSON.stringify({
            description: buildActionDescription(action),
            x: action.x,
            y: action.y,
            subType: action.subType,
            success: action.success,
            fibaActionNumber: action.actionNumber,
          }),
        }]
      })

      if (eventsToCreate.length > 0) {
        await prisma.gameEvent.createMany({ data: eventsToCreate })
      }
    }
  }

  return NextResponse.json({ ok: true, period: state.period, homeScore: state.homeScore, awayScore: state.awayScore })
}
