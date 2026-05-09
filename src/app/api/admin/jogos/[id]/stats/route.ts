import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { revalidatePath } from 'next/cache'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

function toSafeInt(value: unknown) {
  const parsed = Number.parseInt(String(value ?? 0), 10)
  return Number.isFinite(parsed) ? Math.max(parsed, 0) : 0
}

function sanitizeIncomingStat(stat: Record<string, unknown>) {
  const fgMade = toSafeInt(stat.fg_made)
  const fgAttempted = Math.max(toSafeInt(stat.fg_attempted), fgMade)
  const threeMade = Math.min(toSafeInt(stat.three_made), fgMade)
  const threeAttempted = Math.max(toSafeInt(stat.three_attempted), threeMade)
  const ftMade = toSafeInt(stat.ft_made)
  const ftAttempted = Math.max(toSafeInt(stat.ft_attempted), ftMade)
  const twoPtMade = Math.max(0, fgMade - threeMade)
  const twoPtAttempted = Math.max(0, fgAttempted - threeAttempted)
  const points = twoPtMade * 2 + threeMade * 3 + ftMade
  const reboundsOff = toSafeInt(stat.rebounds_offensive)
  const reboundsDef = toSafeInt(stat.rebounds_defensive)

  return {
    athleteId: String(stat.athlete_id),
    teamId: String(stat.team_id),
    minutesPlayed: toSafeInt(stat.minutes_played),
    points,
    fouls: toSafeInt(stat.fouls),
    assists: toSafeInt(stat.assists),
    reboundsOffensive: reboundsOff,
    reboundsDefensive: reboundsDef,
    reboundsTotal: reboundsOff + reboundsDef,
    steals: toSafeInt(stat.steals),
    blocks: toSafeInt(stat.blocks),
    turnovers: toSafeInt(stat.turnovers),
    twoPtMade,
    twoPtAttempted,
    threePtMade: threeMade,
    threePtAttempted: threeAttempted,
    freeThrowsMade: ftMade,
    freeThrowsAttempted: ftAttempted,
    dunks: toSafeInt(stat.dunks),
  }
}

function mapStatLineToLegacy(line: any) {
  const fgMade = line.twoPtMade + line.threePtMade
  const fgAttempted = line.twoPtAttempted + line.threePtAttempted
  return {
    id: line.id,
    game_id: line.gameId,
    athlete_id: line.athleteId,
    team_id: line.teamId,
    minutes_played: line.minutesPlayed,
    dnp: false,
    points: line.points,
    rebounds_offensive: line.reboundsOffensive,
    rebounds_defensive: line.reboundsDefensive,
    rebounds: line.reboundsTotal,
    assists: line.assists,
    steals: line.steals,
    blocks: line.blocks,
    turnovers: line.turnovers,
    fouls: line.fouls,
    fg_made: fgMade,
    fg_attempted: fgAttempted,
    three_made: line.threePtMade,
    three_attempted: line.threePtAttempted,
    ft_made: line.freeThrowsMade,
    ft_attempted: line.freeThrowsAttempted,
    dunks: 0,
  }
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session || !(session.user as any)?.isAdmin) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  try {
    const { id } = await params

    const game = await prisma.game.findUnique({
      where: { id },
      include: {
        homeTeam: { select: { id: true, name: true } },
        awayTeam: { select: { id: true, name: true } },
      },
    })
    if (!game) return NextResponse.json({ error: 'Jogo não encontrado' }, { status: 404 })

    const [athletes, rostersRaw, statLines] = await Promise.all([
      prisma.athlete.findMany({
        where: { teamId: { in: [game.homeTeamId, game.awayTeamId] }, status: 'ACTIVE' },
        select: { id: true, name: true, teamId: true, jerseyNumber: true, photoUrl: true },
      }),
      prisma.gameRoster.findMany({
        where: { gameId: id },
        include: { players: true },
      }),
      prisma.gamePlayerStatLine.findMany({ where: { gameId: id } }),
    ])

    const rosters = rostersRaw.map((r) => ({
      id: r.id,
      game_id: r.gameId,
      team_id: r.teamId,
      coach_name: r.coachName,
      assistant_coach_name: r.assistantCoachName,
      is_locked: r.isLocked,
      players: r.players.map((p) => ({
        id: p.id,
        game_roster_id: p.gameRosterId,
        athlete_id: p.athleteId,
        jersey_number: p.jerseyNumber,
        is_starter: p.isStarter,
        is_captain: p.isCaptain,
        is_available: p.isAvailable,
        is_on_court: p.isOnCourt,
        is_disqualified: p.isDisqualified,
        status: p.status,
      })),
    }))

    const homeShort = (game.homeTeam.name ?? '').slice(0, 3).toUpperCase()
    const awayShort = (game.awayTeam.name ?? '').slice(0, 3).toUpperCase()

    return NextResponse.json({
      game: {
        id: game.id,
        home_team_id: game.homeTeamId,
        away_team_id: game.awayTeamId,
        home_score: game.homeScore,
        away_score: game.awayScore,
        status: game.status,
        venue: game.venue ?? game.location,
        homeTeam: { id: game.homeTeam.id, name: game.homeTeam.name, short_name: homeShort },
        awayTeam: { id: game.awayTeam.id, name: game.awayTeam.name, short_name: awayShort },
      },
      athletes: athletes.map((a) => ({
        id: a.id,
        name: a.name,
        nickname: null,
        team_id: a.teamId,
        jersey_number: a.jerseyNumber,
        photo_url: a.photoUrl,
      })),
      rosters,
      stats: statLines.map(mapStatLineToLegacy),
    })
  } catch (error: any) {
    console.error('[ADMIN JOGO STATS GET]', error)
    return NextResponse.json({ error: error.message ?? 'Erro ao carregar estatísticas' }, { status: 500 })
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session || !(session.user as any)?.isAdmin) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  try {
    const { id: gameId } = await params
    const body = await req.json()
    const { stats } = body
    if (!Array.isArray(stats)) {
      return NextResponse.json({ error: 'Payload de stats inválido' }, { status: 400 })
    }

    // Verifica elegibilidade pelo roster oficial
    const rosters = await prisma.gameRoster.findMany({
      where: { gameId },
      include: { players: { select: { athleteId: true, isAvailable: true } } },
    })
    const eligibility = new Map<string, boolean>()
    for (const r of rosters) {
      for (const p of r.players) eligibility.set(p.athleteId, p.isAvailable)
    }

    const sanitized: ReturnType<typeof sanitizeIncomingStat>[] = []
    for (const s of stats) {
      const aid = String(s.athlete_id ?? '')
      if (!aid) continue
      if (!eligibility.has(aid)) {
        return NextResponse.json({ error: `Atleta ${aid} não está no roster oficial.` }, { status: 400 })
      }
      if (!eligibility.get(aid)) {
        return NextResponse.json({ error: `Atleta ${aid} está marcado como DNP.` }, { status: 400 })
      }
      sanitized.push(sanitizeIncomingStat(s))
    }

    // Estratégia "limpa e reinsere" — equivalente ao Supabase original
    await prisma.$transaction([
      prisma.gamePlayerStatLine.deleteMany({ where: { gameId } }),
      ...(sanitized.length > 0
        ? [
            prisma.gamePlayerStatLine.createMany({
              data: sanitized.map((s) => ({ gameId, ...s })),
            }),
          ]
        : []),
    ])

    // Recalcula score derivado (placar = soma dos pontos por time)
    const allLines = await prisma.gamePlayerStatLine.findMany({
      where: { gameId },
      select: { teamId: true, points: true },
    })
    const game = await prisma.game.findUnique({
      where: { id: gameId },
      select: { homeTeamId: true, awayTeamId: true },
    })
    if (game) {
      const home = allLines.filter((l) => l.teamId === game.homeTeamId).reduce((s, l) => s + l.points, 0)
      const away = allLines.filter((l) => l.teamId === game.awayTeamId).reduce((s, l) => s + l.points, 0)
      await prisma.game.update({
        where: { id: gameId },
        data: { homeScore: home, awayScore: away },
      })
    }

    revalidatePath(`/admin/championships`)
    revalidatePath(`/jogos/${gameId}`)
    revalidatePath(`/jogos`)
    revalidatePath(`/`)
    revalidatePath(`/estatisticas`)

    return NextResponse.json({
      success: true,
      count: sanitized.length,
      message: `${sanitized.length} estatísticas salvas com sucesso.`,
    })
  } catch (error: any) {
    console.error('[ADMIN JOGO STATS POST]', error)
    return NextResponse.json({ error: error.message ?? 'Erro ao salvar estatísticas' }, { status: 500 })
  }
}
