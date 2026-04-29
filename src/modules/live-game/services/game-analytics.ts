import type {
  EfficiencyInput,
  GameAnalyticsInput,
  GameAnalyticsEvent,
  KeyMoments,
  LeadTracker,
  LeadState,
  TeamSide,
} from '../types/game-analytics'

// FIBA EFF/PIR: PTS + REB + AST + STL + BLK - (FGA-FGM) - (FTA-FTM) - TOV
export function calculateEfficiency(stat: EfficiencyInput): number {
  return (
    stat.points +
    stat.rebounds +
    stat.assists +
    stat.steals +
    stat.blocks -
    (stat.fgAttempted - stat.fgMade) -
    (stat.ftAttempted - stat.ftMade) -
    stat.turnovers
  )
}

function extractScoringEvents(input: GameAnalyticsInput): GameAnalyticsEvent[] {
  return input.events
    .filter((e) => !e.isReverted && (e.pointsDelta ?? 0) > 0 && e.teamId != null)
    .sort((a, b) => a.sequenceNumber - b.sequenceNumber)
}

export function calculateKeyMoments(input: GameAnalyticsInput): KeyMoments {
  const scoringEvents = extractScoringEvents(input)

  let homeScore = 0
  let awayScore = 0
  let lastLeader: 'HOME' | 'AWAY' | null = null
  let leadChanges = 0
  let ties = 0
  let largestLead = 0
  let largestLeadTeam: TeamSide | null = null
  let currentRunTeam: TeamSide | null = null
  let currentRunValue = 0
  let largestRun = 0
  let largestRunTeam: TeamSide | null = null

  for (const event of scoringEvents) {
    const side: TeamSide = event.teamId === input.homeTeamId ? 'HOME' : 'AWAY'
    const delta = event.pointsDelta ?? 0

    if (side === 'HOME') homeScore += delta
    else awayScore += delta

    const diff = homeScore - awayScore
    let currentLeader: LeadState
    if (diff > 0) currentLeader = 'HOME'
    else if (diff < 0) currentLeader = 'AWAY'
    else currentLeader = 'TIE'

    if (currentLeader === 'TIE') {
      ties++
    } else {
      if (lastLeader !== null && currentLeader !== lastLeader) leadChanges++
      lastLeader = currentLeader
    }

    const absDiff = Math.abs(diff)
    if (absDiff > largestLead) {
      largestLead = absDiff
      largestLeadTeam = diff > 0 ? 'HOME' : 'AWAY'
    }

    if (currentRunTeam === side) {
      currentRunValue += delta
    } else {
      currentRunTeam = side
      currentRunValue = delta
    }
    if (currentRunValue > largestRun) {
      largestRun = currentRunValue
      largestRunTeam = side
    }
  }

  return {
    largestLead: largestLeadTeam ? { team: largestLeadTeam, value: largestLead } : null,
    largestRun: largestRunTeam ? { team: largestRunTeam, value: largestRun } : null,
    leadChanges,
    ties,
  }
}

export function calculateLeadTracker(input: GameAnalyticsInput): LeadTracker {
  const scoringEvents = extractScoringEvents(input)

  let homeScore = 0
  let awayScore = 0
  let homeLeadEvents = 0
  let awayLeadEvents = 0
  let tiedEvents = 0

  type SegmentStart = { seq: number; leader: LeadState; homeScore: number; awayScore: number }
  const segments: ReturnType<typeof calculateLeadTracker>['segments'] = []
  let segmentStart: SegmentStart | null = null

  for (const event of scoringEvents) {
    const side: TeamSide = event.teamId === input.homeTeamId ? 'HOME' : 'AWAY'
    const delta = event.pointsDelta ?? 0

    if (side === 'HOME') homeScore += delta
    else awayScore += delta

    const diff = homeScore - awayScore
    let leader: LeadState
    if (diff > 0) { leader = 'HOME'; homeLeadEvents++ }
    else if (diff < 0) { leader = 'AWAY'; awayLeadEvents++ }
    else { leader = 'TIE'; tiedEvents++ }

    if (segmentStart === null) {
      segmentStart = { seq: event.sequenceNumber, leader, homeScore, awayScore }
    } else if (segmentStart.leader !== leader) {
      segments.push({
        fromSeq: segmentStart.seq,
        toSeq: event.sequenceNumber - 1,
        leader: segmentStart.leader,
        homeScore: segmentStart.homeScore,
        awayScore: segmentStart.awayScore,
      })
      segmentStart = { seq: event.sequenceNumber, leader, homeScore, awayScore }
    }
  }

  if (segmentStart !== null && scoringEvents.length > 0) {
    const last = scoringEvents[scoringEvents.length - 1]
    segments.push({
      fromSeq: segmentStart.seq,
      toSeq: last.sequenceNumber,
      leader: segmentStart.leader,
      homeScore,
      awayScore,
    })
  }

  return {
    homeLeadEvents,
    awayLeadEvents,
    tiedEvents,
    totalScoringEvents: scoringEvents.length,
    segments,
  }
}
