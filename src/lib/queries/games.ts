import { prisma } from '@/lib/db'

/**
 * Adapters: o admin grava/lê via Prisma (Turso/libSQL) com camelCase. As páginas públicas
 * antigas esperam objetos no shape do Supabase (snake_case). Para ter UMA fonte de verdade
 * sem reescrever todas as páginas públicas, este módulo lê do Prisma e mapeia o retorno.
 */

type TeamLite = {
  id: string
  name: string
  city: string | null
  logoUrl: string | null
} | null

function mapTeam(t: any): any {
  if (!t) return null
  return {
    id: t.id,
    name: t.name,
    short_name: (t.name ?? '').slice(0, 3).toUpperCase(),
    city: t.city,
    logoUrl: t.logoUrl,
  }
}

function mapStatus(prismaStatus: string): 'scheduled' | 'live' | 'finished' | 'cancelled' {
  switch ((prismaStatus || '').toUpperCase()) {
    case 'FINISHED': return 'finished'
    case 'IN_PROGRESS':
    case 'LIVE': return 'live'
    case 'CANCELLED': return 'cancelled'
    default: return 'scheduled'
  }
}

function mapGame(g: any): any {
  return {
    id: g.id,
    home_team_id: g.homeTeamId,
    away_team_id: g.awayTeamId,
    home_score: g.homeScore,
    away_score: g.awayScore,
    scheduled_at: g.dateTime,
    status: mapStatus(g.status),
    venue: g.venue ?? g.location ?? null,
    season_id: String(g.championship?.year ?? new Date(g.dateTime).getFullYear()),
    home_team: mapTeam(g.homeTeam),
    away_team: mapTeam(g.awayTeam),
  }
}

export async function getGamesBySeasonId(seasonId: string) {
  const year = Number(seasonId)
  if (!year) return []
  const games = await prisma.game.findMany({
    where: {
      championship: { year, isSimulation: false },
    },
    include: {
      homeTeam: { select: { id: true, name: true, city: true, logoUrl: true } },
      awayTeam: { select: { id: true, name: true, city: true, logoUrl: true } },
      championship: { select: { year: true } },
    },
    orderBy: { dateTime: 'asc' },
  })
  return games.map(mapGame)
}

export async function getLiveGames() {
  const games = await prisma.game.findMany({
    where: {
      isLivePublished: true,
      liveStatus: { in: ['LIVE', 'PRE_GAME_READY', 'HALFTIME', 'PERIOD_BREAK'] },
      championship: { isSimulation: false },
    },
    include: {
      homeTeam: { select: { id: true, name: true, city: true, logoUrl: true } },
      awayTeam: { select: { id: true, name: true, city: true, logoUrl: true } },
      championship: { select: { year: true } },
    },
    orderBy: { dateTime: 'asc' },
  })
  return games.map(mapGame)
}

export async function getRecentResults(limit = 5) {
  const games = await prisma.game.findMany({
    where: {
      status: 'FINISHED',
      championship: { isSimulation: false },
    },
    include: {
      homeTeam: { select: { id: true, name: true, city: true, logoUrl: true } },
      awayTeam: { select: { id: true, name: true, city: true, logoUrl: true } },
      championship: { select: { year: true } },
    },
    orderBy: { dateTime: 'desc' },
    take: limit,
  })
  return games.map(mapGame)
}

function mapStatLine(l: any): any {
  return {
    id: l.id,
    game_id: l.gameId,
    athlete_id: l.athleteId,
    team_id: l.teamId,
    minutes_played: l.minutesPlayed,
    points: l.points,
    fouls: l.fouls,
    assists: l.assists,
    rebounds_offensive: l.reboundsOffensive,
    rebounds_defensive: l.reboundsDefensive,
    rebounds: l.reboundsTotal,
    rebounds_total: l.reboundsTotal,
    steals: l.steals,
    blocks: l.blocks,
    turnovers: l.turnovers,
    two_pt_made: l.twoPtMade,
    two_pt_attempted: l.twoPtAttempted,
    three_pt_made: l.threePtMade,
    three_pt_attempted: l.threePtAttempted,
    free_throws_made: l.freeThrowsMade,
    free_throws_attempted: l.freeThrowsAttempted,
    athlete: l.athlete
      ? {
          id: l.athlete.id,
          name: l.athlete.name,
          nickname: null,
          position: l.athlete.position,
          jersey_number: l.athlete.jerseyNumber,
          photo_url: l.athlete.photoUrl,
        }
      : null,
  }
}

export async function getGameWithStats(gameId: string) {
  const game = await prisma.game.findUnique({
    where: { id: gameId },
    include: {
      homeTeam: { select: { id: true, name: true, city: true, logoUrl: true } },
      awayTeam: { select: { id: true, name: true, city: true, logoUrl: true } },
      championship: { select: { year: true, name: true } },
    },
  })
  if (!game) return { game: null, stats: [] }

  const lines = await prisma.gamePlayerStatLine.findMany({
    where: { gameId },
    include: {
      athlete: { select: { id: true, name: true, position: true, jerseyNumber: true, photoUrl: true } },
    },
    orderBy: { points: 'desc' },
  })

  return {
    game: mapGame(game),
    stats: lines.map(mapStatLine),
  }
}
