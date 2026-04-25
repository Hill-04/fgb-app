import { buildCanonicalLiveEventDescription, getLiveEventPresentation, type LiveEventTone } from '../live-fiba-config'

export type LiveTableTab = 'home' | 'away' | 'log' | 'box'
export type LiveTableSide = 'home' | 'away'

export const LIVE_VISIBLE_EVENTS_LIMIT = 18

export type LiveTablePlayer = {
  id: string
  athleteId: string
  name: string
  jerseyNumber: number | null
  isStarter: boolean
  isCaptain: boolean
  isAvailable: boolean
  isOnCourt: boolean
  status: string
  points: number
  rebounds: number
  assists: number
  fouls: number
  steals: number
  blocks: number
  turnovers: number
  twoPtMade: number
  twoPtAttempted: number
  threePtMade: number
  threePtAttempted: number
  freeThrowsMade: number
  freeThrowsAttempted: number
  disqualified: boolean
}

export type LiveTableTeam = {
  id: string
  side: LiveTableSide
  name: string
  shortName: string
  score: number
  fouls: number
  inBonus: boolean
  timeoutsUsed: number
  remainingTimeouts: number
  rebounds: number
  assists: number
  steals: number
  blocks: number
  turnovers: number
  coachName: string
  players: LiveTablePlayer[]
}

export type LiveTableEvent = {
  id: string
  teamSide: LiveTableSide | 'neutral'
  clockTime: string
  periodLabel: string
  eventType: string
  actionLabel: string
  detailLabel: string
  actorName: string
  actorJerseyNumber: number | null
  description: string
  compactLabel: string
  icon: string
  tone: LiveEventTone
  isOptimistic: boolean
  teamName: string
}

export type LiveTableBoxRow = {
  id: string
  teamSide: LiveTableSide
  jerseyNumber: number | null
  athleteName: string
  teamName: string
  points: number
  rebounds: number
  assists: number
  steals: number
  blocks: number
  turnovers: number
  fouls: number
  twoPtMade: number
  twoPtAttempted: number
  threePtMade: number
  threePtAttempted: number
  freeThrowsMade: number
  freeThrowsAttempted: number
  isOnCourt: boolean
  disqualified: boolean
}

export type LiveTablePeriodScore = {
  period: number
  label: string
  homePoints: number
  awayPoints: number
}

export type LiveGameTableModel = {
  championshipName: string
  categoryName: string
  venueLabel: string
  liveStatus: string
  currentPeriod: number
  currentPeriodLabel: string
  clockDisplay: string
  possessionSide: LiveTableSide | null
  home: LiveTableTeam
  away: LiveTableTeam
  periodScores: LiveTablePeriodScore[]
  events: LiveTableEvent[]
  boxRows: LiveTableBoxRow[]
}

function shortTeamName(name?: string | null) {
  const safeName = (name || 'Equipe').trim()
  const words = safeName.split(/\s+/).filter(Boolean)
  if (words.length === 1) return words[0].slice(0, 3).toUpperCase()
  return words
    .slice(0, 3)
    .map((word) => word[0])
    .join('')
    .toUpperCase()
}

function shortActorName(name?: string | null) {
  const safeName = (name || 'Mesa').trim()
  const parts = safeName.split(/\s+/).filter(Boolean)
  if (parts.length === 0) return 'MESA'
  if (parts.length === 1) return parts[0].toUpperCase()
  return `${parts[0]} ${parts[parts.length - 1]}`.toUpperCase()
}

function formatPeriodLabel(period?: number | null) {
  const safePeriod = period && period > 0 ? period : 1
  if (safePeriod <= 4) return `${safePeriod}o PERIODO`
  return `PRORR. ${safePeriod - 4}`
}

function buildPlayerMap(snapshot: any) {
  const playerLines = new Map<string, any>()
  for (const line of snapshot?.boxScore?.players || []) {
    if (line?.athleteId) {
      playerLines.set(line.athleteId, line)
    }
  }
  return playerLines
}

function buildRosterMap(snapshot: any) {
  const rosters = new Map<string, any>()
  for (const roster of snapshot?.rosters || []) {
    if (roster?.teamId) {
      rosters.set(roster.teamId, roster)
    }
  }
  return rosters
}

function buildAthleteMetaMap(snapshot: any) {
  const athletes = new Map<string, { athleteName: string; jerseyNumber: number | null; teamId: string | null }>()
  for (const roster of snapshot?.rosters || []) {
    for (const player of roster?.players || []) {
      if (player?.athleteId) {
        athletes.set(player.athleteId, {
          athleteName: player.athleteName || 'Atleta',
          jerseyNumber: player.jerseyNumber ?? null,
          teamId: roster.teamId ?? null,
        })
      }
    }
  }
  return athletes
}

function buildTeamLineMap(snapshot: any) {
  const teamLines = new Map<string, any>()
  for (const line of snapshot?.boxScore?.teams || []) {
    if (line?.teamId) {
      teamLines.set(line.teamId, line)
    }
  }
  return teamLines
}

function getTeamSide(teamId: string | null | undefined, snapshot: any): LiveTableSide | 'neutral' {
  if (teamId && teamId === snapshot?.game?.homeTeam?.id) return 'home'
  if (teamId && teamId === snapshot?.game?.awayTeam?.id) return 'away'
  return 'neutral'
}

function oppositeSide(side: LiveTableSide | null): LiveTableSide | null {
  if (side === 'home') return 'away'
  if (side === 'away') return 'home'
  return null
}

function derivePossessionSide(snapshot: any): LiveTableSide | null {
  const events = snapshot?.events || []

  for (let index = events.length - 1; index >= 0; index -= 1) {
    const event = events[index]
    const teamSide = getTeamSide(event?.teamId, snapshot)

    switch (event?.eventType) {
      case 'SHOT_MADE_2':
      case 'SHOT_MADE_3':
      case 'FREE_THROW_MADE':
      case 'TURNOVER':
        return oppositeSide(teamSide === 'neutral' ? null : teamSide)
      case 'REBOUND_OFFENSIVE':
      case 'REBOUND_DEFENSIVE':
      case 'ASSIST':
      case 'STEAL':
      case 'BLOCK':
      case 'SUBSTITUTION_IN':
      case 'SUBSTITUTION_OUT':
        return teamSide === 'neutral' ? null : teamSide
      default:
        break
    }
  }

  return null
}

function buildCompactEventLabel({
  actionLabel,
  athleteName,
  jerseyNumber,
  teamName,
}: {
  actionLabel: string
  athleteName?: string | null
  jerseyNumber?: number | null
  teamName?: string | null
}) {
  const actor = shortActorName(athleteName || teamName || 'Mesa')
  const jersey = jerseyNumber !== null && jerseyNumber !== undefined ? String(jerseyNumber).padStart(2, '0') : '--'
  return `#${jersey} ${actor} ${actionLabel}`
}

function buildTeam(
  snapshot: any,
  side: LiveTableSide,
  playerLinesByAthleteId: Map<string, any>,
  rostersByTeamId: Map<string, any>,
  teamLinesByTeamId: Map<string, any>
): LiveTableTeam {
  const gameTeam = side === 'home' ? snapshot?.game?.homeTeam : snapshot?.game?.awayTeam
  const roster = rostersByTeamId.get(gameTeam?.id)
  const teamLine = teamLinesByTeamId.get(gameTeam?.id)
  const fouls =
    side === 'home'
      ? snapshot?.game?.homeTeamFoulsCurrentPeriod ?? teamLine?.fouls ?? 0
      : snapshot?.game?.awayTeamFoulsCurrentPeriod ?? teamLine?.fouls ?? 0
  const timeoutsUsed =
    side === 'home'
      ? snapshot?.game?.homeTimeoutsUsed ?? teamLine?.timeoutsUsed ?? 0
      : snapshot?.game?.awayTimeoutsUsed ?? teamLine?.timeoutsUsed ?? 0

  return {
    id: gameTeam?.id || `${side}-team`,
    side,
    name: gameTeam?.name || 'Equipe',
    shortName: shortTeamName(gameTeam?.name),
    score:
      side === 'home'
        ? snapshot?.game?.homeScore ?? teamLine?.points ?? 0
        : snapshot?.game?.awayScore ?? teamLine?.points ?? 0,
    fouls,
    inBonus: fouls >= 5,
    timeoutsUsed,
    remainingTimeouts: Math.max(0, 5 - timeoutsUsed),
    rebounds: teamLine?.reboundsTotal ?? 0,
    assists: teamLine?.assists ?? 0,
    steals: teamLine?.steals ?? 0,
    blocks: teamLine?.blocks ?? 0,
    turnovers: teamLine?.turnovers ?? 0,
    coachName: roster?.coachName || 'Sem coach definido',
    players: (roster?.players || []).map((player: any) => {
      const statLine = playerLinesByAthleteId.get(player.athleteId)
      return {
        id: player.id,
        athleteId: player.athleteId,
        name: player.athleteName || 'Atleta',
        jerseyNumber: player.jerseyNumber ?? null,
        isStarter: Boolean(player.isStarter),
        isCaptain: Boolean(player.isCaptain),
        isAvailable: Boolean(player.isAvailable),
        isOnCourt: Boolean(player.isOnCourt),
        status: player.status || 'ACTIVE',
        points: statLine?.points ?? 0,
        rebounds: statLine?.reboundsTotal ?? 0,
        assists: statLine?.assists ?? 0,
        fouls: statLine?.fouls ?? 0,
        steals: statLine?.steals ?? 0,
        blocks: statLine?.blocks ?? 0,
        turnovers: statLine?.turnovers ?? 0,
        twoPtMade: statLine?.twoPtMade ?? 0,
        twoPtAttempted: statLine?.twoPtAttempted ?? 0,
        threePtMade: statLine?.threePtMade ?? 0,
        threePtAttempted: statLine?.threePtAttempted ?? 0,
        freeThrowsMade: statLine?.freeThrowsMade ?? 0,
        freeThrowsAttempted: statLine?.freeThrowsAttempted ?? 0,
        disqualified: Boolean(statLine?.disqualified || player?.isDisqualified),
      } satisfies LiveTablePlayer
    }),
  }
}

export function buildLiveGameTableModel(snapshot: any): LiveGameTableModel {
  const playerLinesByAthleteId = buildPlayerMap(snapshot)
  const rostersByTeamId = buildRosterMap(snapshot)
  const athleteMetaById = buildAthleteMetaMap(snapshot)
  const teamLinesByTeamId = buildTeamLineMap(snapshot)
  const home = buildTeam(snapshot, 'home', playerLinesByAthleteId, rostersByTeamId, teamLinesByTeamId)
  const away = buildTeam(snapshot, 'away', playerLinesByAthleteId, rostersByTeamId, teamLinesByTeamId)

  return {
    championshipName: snapshot?.game?.championship?.name || 'Campeonato',
    categoryName: snapshot?.game?.category?.name || 'Categoria',
    venueLabel:
      snapshot?.game?.venue ||
      snapshot?.game?.location ||
      [snapshot?.game?.city, snapshot?.game?.court].filter(Boolean).join(' / ') ||
      'Local a definir',
    liveStatus: snapshot?.game?.liveStatus || 'SCHEDULED',
    currentPeriod: snapshot?.game?.currentPeriod || 1,
    currentPeriodLabel: formatPeriodLabel(snapshot?.game?.currentPeriod),
    clockDisplay: snapshot?.game?.clockDisplay || '10:00',
    possessionSide: derivePossessionSide(snapshot),
    home,
    away,
    periodScores: (snapshot?.boxScore?.periods || []).map((periodLine: any) => ({
      period: periodLine.period,
      label: `P${periodLine.period}`,
      homePoints: periodLine.homePoints ?? 0,
      awayPoints: periodLine.awayPoints ?? 0,
    })),
    events: [...(snapshot?.events || [])]
      .reverse()
      .slice(0, LIVE_VISIBLE_EVENTS_LIMIT)
      .map((event: any) => {
        const presentation = getLiveEventPresentation(event.eventType)
        const athleteMeta = event.athleteId ? athleteMetaById.get(event.athleteId) : null
        const actorName = event.athleteName || athleteMeta?.athleteName || event.teamName || 'Mesa'
        const actorJerseyNumber = athleteMeta?.jerseyNumber ?? null
        return {
          id: event.id,
          teamSide: getTeamSide(event.teamId, snapshot),
          clockTime: event.clockTime || '10:00',
          periodLabel: formatPeriodLabel(event.period),
          eventType: event.eventType || 'EVENT',
          actionLabel: presentation.actionLabel,
          detailLabel: presentation.detailLabel,
          actorName,
          actorJerseyNumber,
          description:
            event.description ||
            buildCanonicalLiveEventDescription({
              eventType: event.eventType || 'EVENT',
              athleteName: actorName,
              teamName: event.teamName,
              period: event.period,
            }),
          compactLabel: buildCompactEventLabel({
            actionLabel: presentation.actionLabel,
            athleteName: actorName,
            jerseyNumber: actorJerseyNumber,
            teamName: event.teamName,
          }),
          icon: presentation.icon,
          tone: presentation.tone,
          isOptimistic: Boolean(event.isOptimistic),
          teamName: event.teamName || 'Mesa',
        }
      }),
    boxRows: [home, away].flatMap((team) =>
      team.players.map((player) => ({
        id: player.id,
        teamSide: team.side,
        jerseyNumber: player.jerseyNumber,
        athleteName: player.name,
        teamName: team.name,
        points: player.points,
        rebounds: player.rebounds,
        assists: player.assists,
        steals: player.steals,
        blocks: player.blocks,
        turnovers: player.turnovers,
        fouls: player.fouls,
        twoPtMade: player.twoPtMade,
        twoPtAttempted: player.twoPtAttempted,
        threePtMade: player.threePtMade,
        threePtAttempted: player.threePtAttempted,
        freeThrowsMade: player.freeThrowsMade,
        freeThrowsAttempted: player.freeThrowsAttempted,
        isOnCourt: player.isOnCourt,
        disqualified: player.disqualified,
      }))
    ),
  }
}
