import { LiveGameService } from '@/modules/live-game/services/live-game-service'

type RawSnapshot = Awaited<ReturnType<typeof LiveGameService.getSnapshot>>

type PublicLeader = {
  athleteName: string
  teamName: string
  value: number
} | null

function toShortName(name: string | null | undefined) {
  const safeName = String(name || '').trim()
  if (!safeName) return ''
  const parts = safeName.split(/\s+/)
  if (parts.length === 1) return safeName.slice(0, 12)
  const compact = parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('')
  return compact || safeName.slice(0, 12)
}

function normalizeStatus(raw: RawSnapshot['game']) {
  const status = String(raw.status || '').toUpperCase()
  const liveStatus = String(raw.liveStatus || '').toUpperCase()

  if (status === 'FINISHED' || liveStatus === 'FINAL_PENDING_CONFIRMATION' || liveStatus === 'FINAL_OFFICIAL') {
    return 'FINISHED' as const
  }

  if (
    status === 'LIVE' ||
    liveStatus === 'LIVE' ||
    liveStatus === 'HALFTIME' ||
    liveStatus === 'PERIOD_BREAK' ||
    liveStatus === 'PRE_GAME_READY'
  ) {
    return 'LIVE' as const
  }

  return 'SCHEDULED' as const
}

function getLeader(
  players: RawSnapshot['boxScore']['players'],
  stat: 'points' | 'assists' | 'reboundsTotal'
): PublicLeader {
  const sorted = [...players].sort((a, b) => (b[stat] ?? 0) - (a[stat] ?? 0))
  const leader = sorted.find((entry) => Number(entry[stat] ?? 0) > 0)
  if (!leader) return null
  return {
    athleteName: leader.athleteName,
    teamName: leader.teamName,
    value: Number(leader[stat] ?? 0),
  }
}

export function buildPublicLiveSnapshot(snapshot: RawSnapshot) {
  const normalizedStatus = normalizeStatus(snapshot.game)
  const isLive = normalizedStatus === 'LIVE'
  const isFinished = normalizedStatus === 'FINISHED'
  const players = snapshot.boxScore?.players || []
  const events = snapshot.events || []
  const recentEvents = events
    .slice(-20)
    .reverse()
    .map((event) => ({
      period: event.period,
      clockTime: event.clockTime,
      description: event.description,
      teamName: event.teamName || null,
      athleteName: event.athleteName || null,
      pointsDelta: event.pointsDelta ?? 0,
      occurredAt: event.createdAt,
    }))

  return {
    game: {
      id: snapshot.game.id,
      status: normalizedStatus,
      isLive,
      isFinished,
      scheduledAt: snapshot.game.dateTime,
      venue: snapshot.game.venue || snapshot.game.location || null,
    },
    homeTeam: {
      id: snapshot.game.homeTeam.id,
      name: snapshot.game.homeTeam.name,
      shortName: toShortName(snapshot.game.homeTeam.name),
      logoUrl: snapshot.game.homeTeam.logoUrl || null,
      score: Number(snapshot.game.homeScore ?? 0),
    },
    awayTeam: {
      id: snapshot.game.awayTeam.id,
      name: snapshot.game.awayTeam.name,
      shortName: toShortName(snapshot.game.awayTeam.name),
      logoUrl: snapshot.game.awayTeam.logoUrl || null,
      score: Number(snapshot.game.awayScore ?? 0),
    },
    leaders: {
      points: getLeader(players, 'points'),
      assists: getLeader(players, 'assists'),
      rebounds: getLeader(players, 'reboundsTotal'),
    },
    recentEvents,
    summary: {
      totalEvents: events.length,
      lastEventAt: events.length > 0 ? events[events.length - 1].createdAt : null,
      currentPeriod: snapshot.game.currentPeriod || null,
    },
  }
}

