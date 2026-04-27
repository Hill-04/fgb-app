import { LiveGameService } from '@/modules/live-game/services/live-game-service'

type RawSnapshot = Awaited<ReturnType<typeof LiveGameService.getSnapshot>>
type RawPlayer = RawSnapshot['boxScore']['players'][number]
type RawTeam = RawSnapshot['boxScore']['teams'][number]

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

function toNumber(value: unknown) {
  return Number(value ?? 0)
}

type PublicPlayerLine = {
  athleteId: string
  name: string
  jerseyNumber: number | null
  teamId: string
  teamName: string
  points: number
  rebounds: number
  assists: number
  fouls: number
  steals: number
  blocks: number
  turnovers: number
  fgMade: number
  fgAttempted: number
  twoMade: number
  twoAttempted: number
  threeMade: number
  threeAttempted: number
  ftMade: number
  ftAttempted: number
  reboundsOffensive: number
  reboundsDefensive: number
  isStarter: boolean
  disqualified: boolean
  fouledOut: boolean
}

type TeamSummary = {
  teamId: string
  teamName: string
  points: number
  rebounds: number
  assists: number
  fouls: number
  turnovers: number
  steals: number
  blocks: number
}

function mapPlayerLine(line: RawPlayer): PublicPlayerLine {
  const twoMade = toNumber(line.twoPtMade)
  const twoAttempted = toNumber(line.twoPtAttempted)
  const threeMade = toNumber(line.threePtMade)
  const threeAttempted = toNumber(line.threePtAttempted)

  return {
    athleteId: line.athleteId,
    name: line.athleteName,
    jerseyNumber: line.jerseyNumber ?? null,
    teamId: line.teamId,
    teamName: line.teamName,
    points: toNumber(line.points),
    rebounds: toNumber(line.reboundsTotal),
    assists: toNumber(line.assists),
    fouls: toNumber(line.fouls),
    steals: toNumber(line.steals),
    blocks: toNumber(line.blocks),
    turnovers: toNumber(line.turnovers),
    fgMade: twoMade + threeMade,
    fgAttempted: twoAttempted + threeAttempted,
    twoMade,
    twoAttempted,
    threeMade,
    threeAttempted,
    ftMade: toNumber(line.freeThrowsMade),
    ftAttempted: toNumber(line.freeThrowsAttempted),
    reboundsOffensive: toNumber(line.reboundsOffensive),
    reboundsDefensive: toNumber(line.reboundsDefensive),
    isStarter: Boolean(line.isStarter),
    disqualified: Boolean(line.disqualified),
    fouledOut: Boolean(line.fouledOut),
  }
}

function sortPlayerLines(players: PublicPlayerLine[]) {
  return [...players].sort((a, b) => {
    if (a.isStarter !== b.isStarter) return a.isStarter ? -1 : 1
    return b.points - a.points || b.rebounds - a.rebounds || a.name.localeCompare(b.name)
  })
}

function buildTeamSummary(
  teamId: string,
  teamName: string,
  teamLines: RawTeam[],
  players: PublicPlayerLine[],
  fallbackScore: number
): TeamSummary {
  const teamLine = teamLines.find((line) => line.teamId === teamId)
  if (teamLine) {
    return {
      teamId,
      teamName,
      points: toNumber(teamLine.points),
      rebounds: toNumber(teamLine.reboundsTotal),
      assists: toNumber(teamLine.assists),
      fouls: toNumber(teamLine.fouls),
      turnovers: toNumber(teamLine.turnovers),
      steals: toNumber(teamLine.steals),
      blocks: toNumber(teamLine.blocks),
    }
  }

  const teamPlayers = players.filter((line) => line.teamId === teamId)
  return {
    teamId,
    teamName,
    points: fallbackScore,
    rebounds: teamPlayers.reduce((sum, line) => sum + line.rebounds, 0),
    assists: teamPlayers.reduce((sum, line) => sum + line.assists, 0),
    fouls: teamPlayers.reduce((sum, line) => sum + line.fouls, 0),
    turnovers: teamPlayers.reduce((sum, line) => sum + line.turnovers, 0),
    steals: teamPlayers.reduce((sum, line) => sum + line.steals, 0),
    blocks: teamPlayers.reduce((sum, line) => sum + line.blocks, 0),
  }
}

function getLeader(
  players: PublicPlayerLine[],
  stat: 'points' | 'assists' | 'rebounds' | 'steals' | 'blocks'
): PublicLeader {
  const sorted = [...players].sort((a, b) => (b[stat] ?? 0) - (a[stat] ?? 0))
  const leader = sorted.find((entry) => Number(entry[stat] ?? 0) > 0)
  if (!leader) return null
  return {
    athleteName: leader.name,
    teamName: leader.teamName,
    value: Number(leader[stat] ?? 0),
  }
}

export function buildPublicLiveSnapshot(snapshot: RawSnapshot) {
  const normalizedStatus = normalizeStatus(snapshot.game)
  const isLive = normalizedStatus === 'LIVE'
  const isFinished = normalizedStatus === 'FINISHED'
  const players = (snapshot.boxScore?.players || []).map(mapPlayerLine)
  const teamLines = snapshot.boxScore?.teams || []
  const events = snapshot.events || []

  const homePlayers = sortPlayerLines(players.filter((line) => line.teamId === snapshot.game.homeTeam.id))
  const awayPlayers = sortPlayerLines(players.filter((line) => line.teamId === snapshot.game.awayTeam.id))

  const homeSummary = buildTeamSummary(
    snapshot.game.homeTeam.id,
    snapshot.game.homeTeam.name,
    teamLines,
    players,
    toNumber(snapshot.game.homeScore)
  )
  const awaySummary = buildTeamSummary(
    snapshot.game.awayTeam.id,
    snapshot.game.awayTeam.name,
    teamLines,
    players,
    toNumber(snapshot.game.awayScore)
  )

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

  const periods = (snapshot.boxScore?.periods ?? []).map((p) => ({
    period: p.period,
    label: p.period <= 4 ? `Q${p.period}` : `OT${p.period - 4}`,
    homePoints: p.homePoints,
    awayPoints: p.awayPoints,
  }))

  return {
    game: {
      id: snapshot.game.id,
      status: normalizedStatus,
      isLive,
      isFinished,
      scheduledAt: snapshot.game.dateTime,
      venue: snapshot.game.venue || snapshot.game.location || null,
      clockDisplay: snapshot.game.clockDisplay || null,
      championship: snapshot.game.championship?.name ?? null,
      category: snapshot.game.category?.name ?? null,
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
      rebounds: getLeader(players, 'rebounds'),
      steals: getLeader(players, 'steals'),
      blocks: getLeader(players, 'blocks'),
    },
    recentEvents,
    teamSummary: {
      home: homeSummary,
      away: awaySummary,
    },
    boxScore: {
      homePlayers,
      awayPlayers,
    },
    periodScores: periods,
    summary: {
      totalEvents: events.length,
      lastEventAt: events.length > 0 ? events[events.length - 1].createdAt : null,
      currentPeriod: snapshot.game.currentPeriod || null,
    },
  }
}

export function buildLegacyPublicLiveCompatSnapshot(
  publicSnapshot: ReturnType<typeof buildPublicLiveSnapshot>
) {
  const compatibilityPlayers = [...publicSnapshot.boxScore.homePlayers, ...publicSnapshot.boxScore.awayPlayers].map(
    (player) => ({
      athleteId: player.athleteId,
      athleteName: player.name,
      jerseyNumber: player.jerseyNumber,
      teamId: player.teamId,
      teamName: player.teamName,
      points: player.points,
      rebounds: player.rebounds,
      assists: player.assists,
      fouls: player.fouls,
      steals: player.steals,
      blocks: player.blocks,
    })
  )

  return {
    game: {
      id: publicSnapshot.game.id,
      status: publicSnapshot.game.status,
      liveStatus: publicSnapshot.game.status,
      isLive: publicSnapshot.game.isLive,
      isFinished: publicSnapshot.game.isFinished,
      scheduledAt: publicSnapshot.game.scheduledAt,
      homeScore: publicSnapshot.homeTeam.score,
      awayScore: publicSnapshot.awayTeam.score,
      homeTeam: {
        id: publicSnapshot.homeTeam.id,
        name: publicSnapshot.homeTeam.name,
        shortName: publicSnapshot.homeTeam.shortName,
        logoUrl: publicSnapshot.homeTeam.logoUrl,
      },
      awayTeam: {
        id: publicSnapshot.awayTeam.id,
        name: publicSnapshot.awayTeam.name,
        shortName: publicSnapshot.awayTeam.shortName,
        logoUrl: publicSnapshot.awayTeam.logoUrl,
      },
    },
    leaders: {
      points: publicSnapshot.leaders.points,
      assists: publicSnapshot.leaders.assists,
      rebounds: publicSnapshot.leaders.rebounds,
    },
    events: publicSnapshot.recentEvents.map((event) => ({
      period: event.period,
      clockTime: event.clockTime,
      description: event.description,
      teamName: event.teamName,
      athleteName: event.athleteName,
      pointsDelta: event.pointsDelta,
      occurredAt: event.occurredAt,
    })),
    boxScore: {
      teams: [
        {
          teamId: publicSnapshot.teamSummary.home.teamId,
          teamName: publicSnapshot.teamSummary.home.teamName,
          points: publicSnapshot.teamSummary.home.points,
          rebounds: publicSnapshot.teamSummary.home.rebounds,
          assists: publicSnapshot.teamSummary.home.assists,
          fouls: publicSnapshot.teamSummary.home.fouls,
          turnovers: publicSnapshot.teamSummary.home.turnovers,
          steals: publicSnapshot.teamSummary.home.steals,
          blocks: publicSnapshot.teamSummary.home.blocks,
        },
        {
          teamId: publicSnapshot.teamSummary.away.teamId,
          teamName: publicSnapshot.teamSummary.away.teamName,
          points: publicSnapshot.teamSummary.away.points,
          rebounds: publicSnapshot.teamSummary.away.rebounds,
          assists: publicSnapshot.teamSummary.away.assists,
          fouls: publicSnapshot.teamSummary.away.fouls,
          turnovers: publicSnapshot.teamSummary.away.turnovers,
          steals: publicSnapshot.teamSummary.away.steals,
          blocks: publicSnapshot.teamSummary.away.blocks,
        },
      ],
      players: compatibilityPlayers,
    },
    summary: publicSnapshot.summary,
  }
}
