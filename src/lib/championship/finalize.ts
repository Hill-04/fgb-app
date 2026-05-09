import { prisma } from '@/lib/db'
import { transitionChampionship } from './lifecycle'
import { getChampionshipTiebreakers } from './tiebreakers'

export type FinalizeIssue = {
  code: string
  severity: 'error' | 'warning'
  message: string
}

export type FinalizeResult = {
  ok: boolean
  issues: FinalizeIssue[]
  finalStandingsByCategory?: Record<string, Array<{
    teamId: string
    teamName: string
    points: number
    wins: number
    losses: number
    draws: number
    pointsFor: number
    pointsAgainst: number
    diff: number
  }>>
}

export async function validateChampionshipFinalize(
  championshipId: string,
): Promise<{ ok: boolean; issues: FinalizeIssue[] }> {
  const issues: FinalizeIssue[] = []

  const games = await prisma.game.findMany({
    where: { championshipId },
    select: { id: true, status: true, homeScore: true, awayScore: true },
  })

  if (games.length === 0) {
    issues.push({
      code: 'NO_GAMES',
      severity: 'error',
      message: 'Campeonato não tem jogos cadastrados',
    })
    return { ok: false, issues }
  }

  const unfinished = games.filter((g) => g.status !== 'FINISHED')
  if (unfinished.length > 0) {
    issues.push({
      code: 'GAMES_NOT_FINISHED',
      severity: 'error',
      message: `${unfinished.length} jogos ainda não foram finalizados`,
    })
  }

  const missingScores = games.filter(
    (g) => g.status === 'FINISHED' && (g.homeScore === null || g.awayScore === null),
  )
  if (missingScores.length > 0) {
    issues.push({
      code: 'MISSING_SCORES',
      severity: 'error',
      message: `${missingScores.length} jogos finalizados sem placar`,
    })
  }

  return { ok: issues.length === 0, issues }
}

export async function finalizeChampionship(
  championshipId: string,
  performedBy?: string,
): Promise<FinalizeResult> {
  const validation = await validateChampionshipFinalize(championshipId)
  if (!validation.ok) {
    return { ok: false, issues: validation.issues }
  }

  const categories = await prisma.championshipCategory.findMany({
    where: { championshipId },
    include: {
      standings: {
        include: { team: { select: { id: true, name: true } } },
      },
    },
  })

  const finalStandingsByCategory: FinalizeResult['finalStandingsByCategory'] = {}

  const tiebreakerChain = await getChampionshipTiebreakers(championshipId)

  for (const cat of categories) {
    const standings = await sortStandingsWithTiebreakers(
      championshipId,
      cat.id,
      cat.standings.map((s: any) => ({
        teamId: s.teamId,
        teamName: s.team.name,
        points: s.points,
        wins: s.wins,
        losses: s.losses,
        draws: s.draws,
        pointsFor: s.pointsFor,
        pointsAgainst: s.pointsAgainst,
        diff: s.diff,
      })),
      tiebreakerChain,
    )
    finalStandingsByCategory[cat.id] = standings
  }

  const championship = await prisma.championship.findUnique({
    where: { id: championshipId },
    select: { year: true, registrations: { where: { status: 'CONFIRMED' }, select: { teamId: true } } },
  })

  if (championship) {
    for (const reg of championship.registrations) {
      const teamGames = await prisma.game.findMany({
        where: {
          championshipId,
          status: 'FINISHED',
          OR: [{ homeTeamId: reg.teamId }, { awayTeamId: reg.teamId }],
        },
        select: { homeTeamId: true, awayTeamId: true, homeScore: true, awayScore: true },
      })
      let wins = 0, losses = 0
      for (const g of teamGames) {
        const isHome = g.homeTeamId === reg.teamId
        const my = isHome ? g.homeScore ?? 0 : g.awayScore ?? 0
        const opp = isHome ? g.awayScore ?? 0 : g.homeScore ?? 0
        if (my > opp) wins++
        else if (my < opp) losses++
      }

      await prisma.seasonRanking.upsert({
        where: { teamId_season: { teamId: reg.teamId, season: championship.year } },
        update: {
          points: { increment: wins * 2 + losses },
          wins: { increment: wins },
          losses: { increment: losses },
          games: { increment: teamGames.length },
        },
        create: {
          teamId: reg.teamId,
          season: championship.year,
          points: wins * 2 + losses,
          wins,
          losses,
          games: teamGames.length,
        },
      })
    }
  }

  await transitionChampionship(championshipId, 'FINISHED', {
    performedBy,
    reason: 'Encerramento automático após validação',
    metadata: { finalStandingsCount: Object.keys(finalStandingsByCategory).length },
  })

  return { ok: true, issues: [], finalStandingsByCategory }
}

async function sortStandingsWithTiebreakers(
  championshipId: string,
  categoryId: string,
  standings: Array<{
    teamId: string
    teamName: string
    points: number
    wins: number
    losses: number
    draws: number
    pointsFor: number
    pointsAgainst: number
    diff: number
  }>,
  chain: string[],
): Promise<typeof standings> {
  const games = await prisma.game.findMany({
    where: { categoryId, status: 'FINISHED' },
    select: { homeTeamId: true, awayTeamId: true, homeScore: true, awayScore: true },
  })

  const h2h: Record<string, Record<string, { wins: number; losses: number; for: number; against: number }>> = {}
  for (const g of games) {
    if (g.homeScore === null || g.awayScore === null) continue
    const h = g.homeTeamId, a = g.awayTeamId
    h2h[h] = h2h[h] ?? {}
    h2h[a] = h2h[a] ?? {}
    h2h[h][a] = h2h[h][a] ?? { wins: 0, losses: 0, for: 0, against: 0 }
    h2h[a][h] = h2h[a][h] ?? { wins: 0, losses: 0, for: 0, against: 0 }
    h2h[h][a].for += g.homeScore
    h2h[h][a].against += g.awayScore
    h2h[a][h].for += g.awayScore
    h2h[a][h].against += g.homeScore
    if (g.homeScore > g.awayScore) {
      h2h[h][a].wins += 1
      h2h[a][h].losses += 1
    } else if (g.awayScore > g.homeScore) {
      h2h[a][h].wins += 1
      h2h[h][a].losses += 1
    }
  }

  return [...standings].sort((a, b) => {
    if (a.points !== b.points) return b.points - a.points
    for (const rule of chain) {
      const v = compareByRule(a, b, rule, h2h)
      if (v !== 0) return v
    }
    return 0
  })
}

function compareByRule(
  a: any,
  b: any,
  rule: string,
  h2h: Record<string, Record<string, { wins: number; losses: number; for: number; against: number }>>,
): number {
  switch (rule) {
    case 'h2h_record': {
      const ab = h2h[a.teamId]?.[b.teamId]
      const ba = h2h[b.teamId]?.[a.teamId]
      if (!ab || !ba) return 0
      return ba.wins - ab.wins
    }
    case 'h2h_diff': {
      const ab = h2h[a.teamId]?.[b.teamId]
      if (!ab) return 0
      return (ab.for - ab.against) - 0
    }
    case 'h2h_for': {
      const ab = h2h[a.teamId]?.[b.teamId]
      if (!ab) return 0
      return ab.for - 0
    }
    case 'all_diff': return b.diff - a.diff
    case 'all_for': return b.pointsFor - a.pointsFor
    case 'all_against': return a.pointsAgainst - b.pointsAgainst
    case 'wins': return b.wins - a.wins
    case 'draw': return 0
    default: return 0
  }
}
