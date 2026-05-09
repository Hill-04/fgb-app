import { prisma } from '@/lib/db'

/**
 * Agrega GamePlayerStatLine (Prisma) por atleta dentro de uma "season" (ano de Championship)
 * e devolve no shape antigo do Supabase para manter compatível com /estatisticas e /atletas/[id].
 */

type Aggregate = {
  athleteId: string
  games: number
  points: number
  rebounds: number
  assists: number
  steals: number
  blocks: number
  turnovers: number
  fouls: number
  minutesPlayed: number
  twoPtMade: number
  twoPtAttempted: number
  threePtMade: number
  threePtAttempted: number
  freeThrowsMade: number
  freeThrowsAttempted: number
  athlete: {
    id: string
    name: string
    photoUrl: string | null
    jerseyNumber: number | null
    position: string | null
  } | null
  team: { id: string; name: string; logoUrl: string | null } | null
}

async function aggregateBySeason(seasonId: string, opts: { athleteId?: string } = {}) {
  const year = Number(seasonId)
  if (!year) return new Map<string, Aggregate>()

  const lines = await prisma.gamePlayerStatLine.findMany({
    where: {
      ...(opts.athleteId ? { athleteId: opts.athleteId } : {}),
      game: {
        status: 'FINISHED',
        championship: { year, isSimulation: false },
      },
    },
    include: {
      athlete: { select: { id: true, name: true, photoUrl: true, jerseyNumber: true, position: true } },
      team: { select: { id: true, name: true, logoUrl: true } },
    },
  })

  const byAthlete = new Map<string, Aggregate>()
  for (const l of lines) {
    if (!l.athleteId) continue
    const cur = byAthlete.get(l.athleteId) ?? {
      athleteId: l.athleteId,
      games: 0,
      points: 0,
      rebounds: 0,
      assists: 0,
      steals: 0,
      blocks: 0,
      turnovers: 0,
      fouls: 0,
      minutesPlayed: 0,
      twoPtMade: 0,
      twoPtAttempted: 0,
      threePtMade: 0,
      threePtAttempted: 0,
      freeThrowsMade: 0,
      freeThrowsAttempted: 0,
      athlete: l.athlete,
      team: l.team,
    }
    cur.games += 1
    cur.points += l.points
    cur.rebounds += l.reboundsTotal
    cur.assists += l.assists
    cur.steals += l.steals
    cur.blocks += l.blocks
    cur.turnovers += l.turnovers
    cur.fouls += l.fouls
    cur.minutesPlayed += l.minutesPlayed
    cur.twoPtMade += l.twoPtMade
    cur.twoPtAttempted += l.twoPtAttempted
    cur.threePtMade += l.threePtMade
    cur.threePtAttempted += l.threePtAttempted
    cur.freeThrowsMade += l.freeThrowsMade
    cur.freeThrowsAttempted += l.freeThrowsAttempted
    if (!cur.athlete) cur.athlete = l.athlete
    if (!cur.team) cur.team = l.team
    byAthlete.set(l.athleteId, cur)
  }
  return byAthlete
}

function rowFromAggregate(a: Aggregate, seasonId: string) {
  const safeAvg = (n: number) => (a.games > 0 ? n / a.games : 0)
  return {
    season_id: seasonId,
    athlete_id: a.athleteId,
    athlete_name: a.athlete?.name ?? 'Atleta',
    photo_url: a.athlete?.photoUrl ?? null,
    jersey_number: a.athlete?.jerseyNumber ?? null,
    position: a.athlete?.position ?? null,
    team_id: a.team?.id ?? null,
    team_name: a.team?.name ?? null,
    team_logo_url: a.team?.logoUrl ?? null,
    games_played: a.games,
    total_points: a.points,
    total_rebounds: a.rebounds,
    total_assists: a.assists,
    total_steals: a.steals,
    total_blocks: a.blocks,
    total_turnovers: a.turnovers,
    total_fouls: a.fouls,
    total_minutes_played: a.minutesPlayed,
    avg_points: safeAvg(a.points),
    avg_rebounds: safeAvg(a.rebounds),
    avg_assists: safeAvg(a.assists),
    avg_steals: safeAvg(a.steals),
    avg_blocks: safeAvg(a.blocks),
    avg_turnovers: safeAvg(a.turnovers),
    avg_fouls: safeAvg(a.fouls),
    two_pt_made: a.twoPtMade,
    two_pt_attempted: a.twoPtAttempted,
    three_pt_made: a.threePtMade,
    three_pt_attempted: a.threePtAttempted,
    free_throws_made: a.freeThrowsMade,
    free_throws_attempted: a.freeThrowsAttempted,
    fg_pct: a.twoPtAttempted + a.threePtAttempted > 0
      ? (a.twoPtMade + a.threePtMade) / (a.twoPtAttempted + a.threePtAttempted)
      : 0,
    three_pt_pct: a.threePtAttempted > 0 ? a.threePtMade / a.threePtAttempted : 0,
    ft_pct: a.freeThrowsAttempted > 0 ? a.freeThrowsMade / a.freeThrowsAttempted : 0,
  }
}

export async function getTopScorers(seasonId: string, limit = 10) {
  const map = await aggregateBySeason(seasonId)
  return Array.from(map.values())
    .map(a => rowFromAggregate(a, seasonId))
    .sort((a, b) => b.avg_points - a.avg_points)
    .slice(0, limit)
}

export async function getTopRebounders(seasonId: string, limit = 10) {
  const map = await aggregateBySeason(seasonId)
  return Array.from(map.values())
    .map(a => rowFromAggregate(a, seasonId))
    .sort((a, b) => b.avg_rebounds - a.avg_rebounds)
    .slice(0, limit)
}

export async function getAthleteStats(athleteId: string, seasonId: string) {
  const map = await aggregateBySeason(seasonId, { athleteId })
  const agg = map.get(athleteId)
  if (!agg) return null
  return rowFromAggregate(agg, seasonId)
}
