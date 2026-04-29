import { LiveGameService } from '@/modules/live-game/services/live-game-service'

type RawSnapshot = Awaited<ReturnType<typeof LiveGameService.getSnapshot>>
type RawPlayer = RawSnapshot['boxScore']['players'][number]
type RawTeam = RawSnapshot['boxScore']['teams'][number]
type ScoreTimelineEvent = {
  period: number | null
  clockTime: string | null
  eventType: string
  teamId: string | null
  homeScoreAfter: number | null
  awayScoreAfter: number | null
  pointsDelta: number | null
}

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
  minutesPlayed: number
  efficiency: number
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

type KeyMomentValue = {
  team: 'home' | 'away' | 'tie'
  value: number
  label: string
}

type LeadTrackerSegment = {
  team: 'home' | 'away' | 'tie'
  widthPct: number
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
  const ftMade = toNumber(line.freeThrowsMade)
  const ftAttempted = toNumber(line.freeThrowsAttempted)
  const rebounds = toNumber(line.reboundsTotal)
  const assists = toNumber(line.assists)
  const steals = toNumber(line.steals)
  const blocks = toNumber(line.blocks)
  const turnovers = toNumber(line.turnovers)
  const points = toNumber(line.points)
  const fgMade = twoMade + threeMade
  const fgAttempted = twoAttempted + threeAttempted
  const efficiency =
    points +
    rebounds +
    assists +
    steals +
    blocks -
    (fgAttempted - fgMade) -
    (ftAttempted - ftMade) -
    turnovers

  return {
    athleteId: line.athleteId,
    name: line.athleteName,
    jerseyNumber: line.jerseyNumber ?? null,
    teamId: line.teamId,
    teamName: line.teamName,
    minutesPlayed: toNumber(line.minutesPlayed),
    efficiency,
    points,
    rebounds,
    assists,
    fouls: toNumber(line.fouls),
    steals,
    blocks,
    turnovers,
    fgMade,
    fgAttempted,
    twoMade,
    twoAttempted,
    threeMade,
    threeAttempted,
    ftMade,
    ftAttempted,
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

function getPeriodDuration(period: number) {
  return period <= 4 ? 600 : 300
}

function getElapsedSeconds(period: number | null, clockTime: string | null) {
  if (!period || !clockTime) return null

  const match = /^(\d{1,2}):(\d{2})$/.exec(clockTime.trim())
  if (!match) return null

  const minutes = Number(match[1])
  const seconds = Number(match[2])
  if (!Number.isFinite(minutes) || !Number.isFinite(seconds)) return null

  let elapsed = 0
  for (let current = 1; current < period; current += 1) {
    elapsed += getPeriodDuration(current)
  }

  const remaining = minutes * 60 + seconds
  return elapsed + Math.max(0, getPeriodDuration(period) - remaining)
}

function buildGameInsights(
  snapshot: RawSnapshot,
  scoreTimeline: ScoreTimelineEvent[]
) {
  const sortedEvents = [...scoreTimeline]
    .filter(
      (event) =>
        typeof event.homeScoreAfter === 'number' &&
        typeof event.awayScoreAfter === 'number'
    )
    .sort((a, b) => {
      const aPeriod = a.period ?? 0
      const bPeriod = b.period ?? 0
      if (aPeriod !== bPeriod) return aPeriod - bPeriod
      const aElapsed = getElapsedSeconds(a.period, a.clockTime) ?? 0
      const bElapsed = getElapsedSeconds(b.period, b.clockTime) ?? 0
      return aElapsed - bElapsed
    })

  const homeTeamId = snapshot.game.homeTeam.id
  const awayTeamId = snapshot.game.awayTeam.id

  let largestLead: KeyMomentValue = { team: 'tie', value: 0, label: 'Jogo parelho' }
  let largestRun: KeyMomentValue = { team: 'tie', value: 0, label: 'Sem sequencia' }
  let leadChanges = 0
  let ties = 0

  let previousLeader: 'home' | 'away' | 'tie' = 'tie'
  let previousElapsed = 0
  let activeRunTeam: 'home' | 'away' | 'tie' = 'tie'
  let activeRunValue = 0

  const segments: Array<{ team: 'home' | 'away' | 'tie'; start: number; end: number }> = []

  const pushSegment = (team: 'home' | 'away' | 'tie', start: number, end: number) => {
    if (end <= start) return
    segments.push({ team, start, end })
  }

  for (const event of sortedEvents) {
    const elapsed = getElapsedSeconds(event.period, event.clockTime) ?? previousElapsed
    pushSegment(previousLeader, previousElapsed, elapsed)

    const homeScore = Number(event.homeScoreAfter ?? 0)
    const awayScore = Number(event.awayScoreAfter ?? 0)
    const diff = homeScore - awayScore
    const leader: 'home' | 'away' | 'tie' = diff > 0 ? 'home' : diff < 0 ? 'away' : 'tie'
    const absoluteLead = Math.abs(diff)

    if (absoluteLead > largestLead.value) {
      largestLead = {
        team: leader,
        value: absoluteLead,
        label:
          leader === 'tie'
            ? 'Jogo parelho'
            : `${leader === 'home' ? 'Casa' : 'Visitante'} +${absoluteLead}`,
      }
    }

    if (leader === 'tie') ties += 1
    if (leader !== 'tie' && previousLeader !== 'tie' && leader !== previousLeader) leadChanges += 1

    const scoringTeam: 'home' | 'away' | 'tie' =
      event.teamId === homeTeamId ? 'home' : event.teamId === awayTeamId ? 'away' : 'tie'

    if ((event.pointsDelta ?? 0) > 0 && scoringTeam !== 'tie') {
      if (activeRunTeam === scoringTeam) {
        activeRunValue += Number(event.pointsDelta ?? 0)
      } else {
        activeRunTeam = scoringTeam
        activeRunValue = Number(event.pointsDelta ?? 0)
      }

      if (activeRunValue > largestRun.value) {
        largestRun = {
          team: activeRunTeam,
          value: activeRunValue,
          label: `${activeRunTeam === 'home' ? 'Casa' : 'Visitante'} ${activeRunValue}-0`,
        }
      }
    }

    previousLeader = leader
    previousElapsed = elapsed
  }

  const lastPeriodFromEvents = sortedEvents[sortedEvents.length - 1]?.period ?? snapshot.game.currentPeriod ?? 4
  const currentElapsed =
    getElapsedSeconds(snapshot.game.currentPeriod ?? null, snapshot.game.clockDisplay ?? null) ?? previousElapsed
  const regulationLength =
    lastPeriodFromEvents > 4 ? 2400 + (lastPeriodFromEvents - 4) * 300 : 2400
  const totalElapsed = snapshot.game.status === 'FINISHED'
    ? Math.max(regulationLength, previousElapsed)
    : Math.max(currentElapsed, previousElapsed, 1)

  if (sortedEvents.length === 0) {
    return {
      keyMoments: {
        largestLead,
        largestRun,
        leadChanges,
        ties,
      },
      leadTracker: [{ team: 'tie' as const, widthPct: 100 }],
    }
  }

  pushSegment(previousLeader, previousElapsed, totalElapsed)

  const leadTracker: LeadTrackerSegment[] = segments
    .map((segment) => ({
      team: segment.team,
      widthPct: (segment.end - segment.start) / totalElapsed * 100,
    }))
    .filter((segment) => segment.widthPct > 0)

  return {
    keyMoments: {
      largestLead,
      largestRun,
      leadChanges,
      ties,
    },
    leadTracker,
  }
}

export function buildPublicLiveSnapshot(
  snapshot: RawSnapshot,
  scoreTimeline: ScoreTimelineEvent[] = []
) {
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
  const insights = buildGameInsights(snapshot, scoreTimeline)

  const playerEfficiencies = players.map((p) => ({ athleteId: p.athleteId, efficiency: p.efficiency }))

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
    keyMoments: insights.keyMoments,
    leadTracker: insights.leadTracker,
    analytics: {
      keyMoments: insights.keyMoments,
      leadTracker: insights.leadTracker,
      playerEfficiencies,
    },
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
