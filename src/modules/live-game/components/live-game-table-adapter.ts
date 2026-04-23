import { buildCanonicalLiveEventDescription, getLiveEventPresentation } from '../live-fiba-config'

export type LiveTableTab = 'home' | 'away' | 'log' | 'box'

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
  side: 'home' | 'away'
  name: string
  shortName: string
  score: number
  fouls: number
  timeoutsUsed: number
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
  teamSide: 'home' | 'away' | 'neutral'
  clockTime: string
  periodLabel: string
  eventType: string
  actionLabel: string
  detailLabel: string
  actorName: string
  description: string
  icon: string
  isOptimistic: boolean
  teamName: string
}

export type LiveTableBoxRow = {
  id: string
  teamSide: 'home' | 'away'
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

function buildTeamLineMap(snapshot: any) {
  const teamLines = new Map<string, any>()
  for (const line of snapshot?.boxScore?.teams || []) {
    if (line?.teamId) {
      teamLines.set(line.teamId, line)
    }
  }
  return teamLines
}

function buildTeam(
  snapshot: any,
  side: 'home' | 'away',
  playerLinesByAthleteId: Map<string, any>,
  rostersByTeamId: Map<string, any>,
  teamLinesByTeamId: Map<string, any>
): LiveTableTeam {
  const gameTeam = side === 'home' ? snapshot?.game?.homeTeam : snapshot?.game?.awayTeam
  const roster = rostersByTeamId.get(gameTeam?.id)
  const teamLine = teamLinesByTeamId.get(gameTeam?.id)

  return {
    id: gameTeam?.id || `${side}-team`,
    side,
    name: gameTeam?.name || 'Equipe',
    shortName: shortTeamName(gameTeam?.name),
    score:
      side === 'home'
        ? snapshot?.game?.homeScore ?? teamLine?.points ?? 0
        : snapshot?.game?.awayScore ?? teamLine?.points ?? 0,
    fouls:
      side === 'home'
        ? snapshot?.game?.homeTeamFoulsCurrentPeriod ?? teamLine?.fouls ?? 0
        : snapshot?.game?.awayTeamFoulsCurrentPeriod ?? teamLine?.fouls ?? 0,
    timeoutsUsed:
      side === 'home'
        ? snapshot?.game?.homeTimeoutsUsed ?? teamLine?.timeoutsUsed ?? 0
        : snapshot?.game?.awayTimeoutsUsed ?? teamLine?.timeoutsUsed ?? 0,
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
        disqualified: Boolean(statLine?.disqualified),
      } satisfies LiveTablePlayer
    }),
  }
}

export function buildLiveGameTableModel(snapshot: any): LiveGameTableModel {
  const playerLinesByAthleteId = buildPlayerMap(snapshot)
  const rostersByTeamId = buildRosterMap(snapshot)
  const teamLinesByTeamId = buildTeamLineMap(snapshot)
  const home = buildTeam(snapshot, 'home', playerLinesByAthleteId, rostersByTeamId, teamLinesByTeamId)
  const away = buildTeam(snapshot, 'away', playerLinesByAthleteId, rostersByTeamId, teamLinesByTeamId)

  return {
    championshipName: snapshot?.game?.championship?.name || 'Campeonato',
    categoryName: snapshot?.game?.category?.name || 'Categoria',
    venueLabel:
      snapshot?.game?.venue ||
      snapshot?.game?.location ||
      [snapshot?.game?.city, snapshot?.game?.court].filter(Boolean).join(' · ') ||
      'Local a definir',
    liveStatus: snapshot?.game?.liveStatus || 'SCHEDULED',
    currentPeriod: snapshot?.game?.currentPeriod || 1,
    currentPeriodLabel: formatPeriodLabel(snapshot?.game?.currentPeriod),
    clockDisplay: snapshot?.game?.clockDisplay || '10:00',
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
        return {
          id: event.id,
          teamSide:
            event.teamId === snapshot?.game?.homeTeam?.id
              ? 'home'
              : event.teamId === snapshot?.game?.awayTeam?.id
                ? 'away'
                : 'neutral',
          clockTime: event.clockTime || '10:00',
          periodLabel: formatPeriodLabel(event.period),
          eventType: event.eventType || 'EVENT',
          actionLabel: presentation.actionLabel,
          detailLabel: presentation.detailLabel,
          actorName: event.athleteName || event.teamName || 'Mesa',
          description:
            event.description ||
            buildCanonicalLiveEventDescription({
              eventType: event.eventType || 'EVENT',
              athleteName: event.athleteName,
              teamName: event.teamName,
              period: event.period,
            }),
          icon: presentation.icon,
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
