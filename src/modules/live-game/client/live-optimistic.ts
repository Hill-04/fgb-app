import type { PendingMutation } from '../types/live-admin'
import { buildCanonicalLiveEventDescription } from '../live-fiba-config'

function cloneSnapshot(snapshot: any) {
  return JSON.parse(JSON.stringify(snapshot))
}

function ensureTeamLine(snapshot: any, teamId: string) {
  snapshot.boxScore ||= { players: [], teams: [], periods: [] }
  let teamLine = snapshot.boxScore.teams.find((entry: any) => entry.teamId === teamId)
  if (!teamLine) {
    const teamName =
      snapshot.game.homeTeam.id === teamId
        ? snapshot.game.homeTeam.name
        : snapshot.game.awayTeam.id === teamId
          ? snapshot.game.awayTeam.name
          : 'Equipe'
    teamLine = {
      id: `temp-team-${teamId}`,
      teamId,
      teamName,
      points: 0,
      fouls: 0,
      timeoutsUsed: 0,
      reboundsTotal: 0,
      assists: 0,
      steals: 0,
      turnovers: 0,
      blocks: 0,
      twoPtMade: 0,
      twoPtAttempted: 0,
      threePtMade: 0,
      threePtAttempted: 0,
      freeThrowsMade: 0,
      freeThrowsAttempted: 0,
    }
    snapshot.boxScore.teams.push(teamLine)
  }
  return teamLine
}

function ensurePlayerLine(snapshot: any, teamId: string, athleteId?: string | null) {
  if (!athleteId) return null

  snapshot.boxScore ||= { players: [], teams: [], periods: [] }
  let playerLine = snapshot.boxScore.players.find((entry: any) => entry.athleteId === athleteId)

  if (!playerLine) {
    const rosterPlayer = snapshot.rosters
      ?.flatMap((roster: any) => roster.players || [])
      ?.find((player: any) => player.athleteId === athleteId)

    playerLine = {
      id: `temp-player-${athleteId}`,
      athleteId,
      athleteName: rosterPlayer?.athleteName || 'Atleta',
      jerseyNumber: rosterPlayer?.jerseyNumber ?? null,
      teamId,
      teamName:
        snapshot.game.homeTeam.id === teamId
          ? snapshot.game.homeTeam.name
          : snapshot.game.awayTeam.id === teamId
            ? snapshot.game.awayTeam.name
            : 'Equipe',
      minutesPlayed: 0,
      points: 0,
      fouls: 0,
      assists: 0,
      reboundsOffensive: 0,
      reboundsDefensive: 0,
      reboundsTotal: 0,
      steals: 0,
      blocks: 0,
      turnovers: 0,
      twoPtMade: 0,
      twoPtAttempted: 0,
      threePtMade: 0,
      threePtAttempted: 0,
      freeThrowsMade: 0,
      freeThrowsAttempted: 0,
      isStarter: Boolean(rosterPlayer?.isStarter),
      fouledOut: false,
      disqualified: false,
    }
    snapshot.boxScore.players.push(playerLine)
  }

  return playerLine
}

function ensurePeriodLine(snapshot: any, period: number) {
  snapshot.boxScore ||= { players: [], teams: [], periods: [] }
  let periodLine = snapshot.boxScore.periods.find((entry: any) => entry.period === period)
  if (!periodLine) {
    periodLine = {
      id: `temp-period-${period}`,
      period,
      homePoints: 0,
      awayPoints: 0,
    }
    snapshot.boxScore.periods.push(periodLine)
    snapshot.boxScore.periods.sort((left: any, right: any) => left.period - right.period)
  }
  return periodLine
}

function updateRosterPlayerOnCourt(snapshot: any, teamId: string, athleteId: string, isOnCourt: boolean) {
  const roster = snapshot.rosters?.find((entry: any) => entry.teamId === teamId)
  const player = roster?.players?.find((entry: any) => entry.athleteId === athleteId)
  if (player) {
    player.isOnCourt = isOnCourt
  }
}

function sortLeaders(snapshot: any) {
  snapshot.boxScore.players.sort((left: any, right: any) => {
    if (right.points !== left.points) return right.points - left.points
    if (right.reboundsTotal !== left.reboundsTotal) return right.reboundsTotal - left.reboundsTotal
    return left.athleteName.localeCompare(right.athleteName)
  })
}

function buildOptimisticDescription(snapshot: any, eventType: string, teamId?: string | null, athleteId?: string | null, period?: number | null) {
  const athleteName = athleteId
    ? snapshot.rosters?.flatMap((roster: any) => roster.players || [])?.find((player: any) => player.athleteId === athleteId)?.athleteName
    : null
  const teamName =
    teamId === snapshot.game.homeTeam.id
      ? snapshot.game.homeTeam.name
      : teamId === snapshot.game.awayTeam.id
        ? snapshot.game.awayTeam.name
        : null

  return buildCanonicalLiveEventDescription({
    eventType,
    athleteName,
    teamName,
    period,
  })
}

export function applyOptimisticEvent(snapshot: any, mutation: PendingMutation) {
  const next = cloneSnapshot(snapshot)
  const body = mutation.requestBody
  const eventType = String(body.eventType || '')
  const teamId = body.teamId ? String(body.teamId) : null
  const athleteId = body.athleteId ? String(body.athleteId) : null
  const period = Number(body.period || next.game.currentPeriod || 1)
  const clockTime = String(body.clockTime || next.game.clockDisplay || '10:00')
  const pointsDelta = body.pointsDelta !== undefined && body.pointsDelta !== null ? Number(body.pointsDelta) : null

  next.game.currentPeriod = period
  next.game.clockDisplay = clockTime

  const optimisticEvent = {
    id: mutation.id,
    sequenceNumber: mutation.optimisticSequenceNumber,
    period,
    clockTime,
    eventType,
    teamId,
    teamName:
      teamId === next.game.homeTeam.id
        ? next.game.homeTeam.name
        : teamId === next.game.awayTeam.id
          ? next.game.awayTeam.name
          : null,
    athleteId,
    athleteName:
      athleteId
        ? next.rosters?.flatMap((roster: any) => roster.players || [])?.find((player: any) => player.athleteId === athleteId)?.athleteName ?? null
        : null,
    secondaryAthleteId: null,
    secondaryAthleteName: null,
    pointsDelta,
    payload: {},
    createdAt: new Date().toISOString(),
    isReverted: false,
    correctionReason: null,
    isOptimistic: true,
    syncStatus: 'syncing',
    description: buildOptimisticDescription(next, eventType, teamId, athleteId, period),
  }

  next.events.push(optimisticEvent)

  if (teamId) {
    const teamLine = ensureTeamLine(next, teamId)
    const playerLine = ensurePlayerLine(next, teamId, athleteId)
    const periodLine = ensurePeriodLine(next, period)
    const isHome = teamId === next.game.homeTeam.id

    switch (eventType) {
      case 'SHOT_MADE_2':
        next.game[isHome ? 'homeScore' : 'awayScore'] += 2
        teamLine.points += 2
        teamLine.twoPtMade += 1
        teamLine.twoPtAttempted += 1
        if (playerLine) {
          playerLine.points += 2
          playerLine.twoPtMade += 1
          playerLine.twoPtAttempted += 1
        }
        if (isHome) periodLine.homePoints += 2
        else periodLine.awayPoints += 2
        break
      case 'SHOT_MADE_3':
        next.game[isHome ? 'homeScore' : 'awayScore'] += 3
        teamLine.points += 3
        teamLine.threePtMade += 1
        teamLine.threePtAttempted += 1
        if (playerLine) {
          playerLine.points += 3
          playerLine.threePtMade += 1
          playerLine.threePtAttempted += 1
        }
        if (isHome) periodLine.homePoints += 3
        else periodLine.awayPoints += 3
        break
      case 'FREE_THROW_MADE':
        next.game[isHome ? 'homeScore' : 'awayScore'] += 1
        teamLine.points += 1
        teamLine.freeThrowsMade += 1
        teamLine.freeThrowsAttempted += 1
        if (playerLine) {
          playerLine.points += 1
          playerLine.freeThrowsMade += 1
          playerLine.freeThrowsAttempted += 1
        }
        if (isHome) periodLine.homePoints += 1
        else periodLine.awayPoints += 1
        break
      case 'REBOUND_OFFENSIVE':
        teamLine.reboundsTotal += 1
        if (playerLine) {
          playerLine.reboundsOffensive += 1
          playerLine.reboundsTotal += 1
        }
        break
      case 'REBOUND_DEFENSIVE':
        teamLine.reboundsTotal += 1
        if (playerLine) {
          playerLine.reboundsDefensive += 1
          playerLine.reboundsTotal += 1
        }
        break
      case 'ASSIST':
        teamLine.assists += 1
        if (playerLine) playerLine.assists += 1
        break
      case 'STEAL':
        teamLine.steals += 1
        if (playerLine) playerLine.steals += 1
        break
      case 'BLOCK':
        teamLine.blocks += 1
        if (playerLine) playerLine.blocks += 1
        break
      case 'TURNOVER':
        teamLine.turnovers += 1
        if (playerLine) playerLine.turnovers += 1
        break
      case 'FOUL_PERSONAL':
        teamLine.fouls += 1
        if (playerLine) playerLine.fouls += 1
        next.game[isHome ? 'homeTeamFoulsCurrentPeriod' : 'awayTeamFoulsCurrentPeriod'] += 1
        break
      case 'TIMEOUT_CONFIRMED':
        teamLine.timeoutsUsed += 1
        next.game[isHome ? 'homeTimeoutsUsed' : 'awayTimeoutsUsed'] += 1
        break
      case 'SUBSTITUTION_IN':
        if (athleteId) updateRosterPlayerOnCourt(next, teamId, athleteId, true)
        break
      case 'SUBSTITUTION_OUT':
        if (athleteId) updateRosterPlayerOnCourt(next, teamId, athleteId, false)
        break
    }
  }

  switch (eventType) {
    case 'GAME_START':
      next.game.liveStatus = 'LIVE'
      break
    case 'PERIOD_START':
      next.game.liveStatus = 'LIVE'
      next.game.homeTeamFoulsCurrentPeriod = 0
      next.game.awayTeamFoulsCurrentPeriod = 0
      break
    case 'PERIOD_END':
      next.game.liveStatus = 'PERIOD_BREAK'
      break
    case 'HALFTIME_START':
      next.game.liveStatus = 'HALFTIME'
      break
    case 'HALFTIME_END':
      next.game.liveStatus = 'LIVE'
      break
    case 'GAME_END':
      next.game.liveStatus = 'FINAL_PENDING_CONFIRMATION'
      next.game.status = 'FINISHED'
      break
  }

  sortLeaders(next)
  return next
}

export function reapplyPendingMutations(baseSnapshot: any, queue: PendingMutation[]) {
  let snapshot = cloneSnapshot(baseSnapshot)
  for (const mutation of queue) {
    snapshot = applyOptimisticEvent(snapshot, mutation)
  }
  return snapshot
}

export function isSameActionSignature(signature: string, last: { signature: string; at: number } | null, now: number) {
  return Boolean(last && last.signature === signature && now - last.at < 450)
}

export function resolveShotClockReset(eventType?: string) {
  switch (eventType) {
    case 'REBOUND_OFFENSIVE':
      return 14
    case 'REBOUND_DEFENSIVE':
    case 'SHOT_MADE_2':
    case 'SHOT_MADE_3':
    case 'FREE_THROW_MADE':
    case 'TURNOVER':
    case 'STEAL':
    case 'TIMEOUT_CONFIRMED':
    case 'PERIOD_START':
    case 'HALFTIME_END':
    case 'GAME_START':
      return 24
    default:
      return null
  }
}
