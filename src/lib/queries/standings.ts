import { prisma } from '@/lib/db'

/**
 * Standings agregadas por equipe dentro de uma "season" (ano de Championship).
 * Retorna no shape antigo do Supabase para manter compatibilidade.
 */
export async function getStandings(seasonId: string) {
  const year = Number(seasonId)
  if (!year) return []

  const rows = await prisma.standing.findMany({
    where: {
      category: { championship: { year, isSimulation: false } },
    },
    include: {
      category: { select: { id: true, name: true, championshipId: true } },
    },
    orderBy: [{ points: 'desc' }, { diff: 'desc' }],
  })

  // Carrega nomes/logo das equipes em uma única query
  const teamIds = Array.from(new Set(rows.map(r => r.teamId)))
  const teams = teamIds.length > 0
    ? await prisma.team.findMany({
        where: { id: { in: teamIds } },
        select: { id: true, name: true, logoUrl: true, city: true },
      })
    : []
  const teamById = new Map(teams.map(t => [t.id, t]))

  return rows.map(r => {
    const team = teamById.get(r.teamId)
    const winPct = r.played > 0 ? r.wins / r.played : 0
    return {
      season_id: seasonId,
      team_id: r.teamId,
      team_name: team?.name ?? null,
      team_logo_url: team?.logoUrl ?? null,
      team_city: team?.city ?? null,
      category_id: r.categoryId,
      category_name: r.category?.name ?? null,
      played: r.played,
      wins: r.wins,
      losses: r.losses,
      draws: r.draws,
      points: r.points,
      points_for: r.pointsFor,
      points_against: r.pointsAgainst,
      diff: r.diff,
      win_pct: winPct,
    }
  })
}
