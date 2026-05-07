import { notFound } from 'next/navigation'
import { prisma } from '@/lib/db'
import MesaClient from './MesaClient'

export const dynamic = 'force-dynamic'

export default async function SumulaAdminPage({
  params,
}: {
  params: Promise<{ id: string; gameId: string }>
}) {
  const { gameId } = await params

  const game = await prisma.game.findUnique({
    where: { id: gameId },
    include: {
      homeTeam: { select: { id: true, name: true } },
      awayTeam: { select: { id: true, name: true } },
      championship: { select: { name: true, year: true } },
      category: { select: { name: true } },
      periodScores: { orderBy: { period: 'asc' } },
      officials: { orderBy: { createdAt: 'asc' } },
      rosters: {
        include: {
          players: {
            include: { athlete: { select: { id: true, name: true, jerseyNumber: true, position: true } } },
            orderBy: { jerseyNumber: 'asc' },
          },
        },
      },
      playerStatLines: {
        select: {
          athleteId: true,
          teamId: true,
          minutesPlayed: true,
          twoPtMade: true,
          twoPtAttempted: true,
          threePtMade: true,
          threePtAttempted: true,
          freeThrowsMade: true,
          freeThrowsAttempted: true,
          reboundsOffensive: true,
          reboundsDefensive: true,
          assists: true,
          turnovers: true,
          fouls: true,
          steals: true,
          blocks: true,
        },
      },
    },
  })

  if (!game) notFound()

  return (
    <MesaClient
      game={{
        id: game.id,
        homeTeamId: game.homeTeamId,
        awayTeamId: game.awayTeamId,
        homeTeam: game.homeTeam,
        awayTeam: game.awayTeam,
        homeScore: game.homeScore,
        awayScore: game.awayScore,
        attendance: game.attendance,
        championship: game.championship,
        category: game.category,
        dateTime: game.dateTime.toISOString(),
        venue: game.venue,
        periodScores: game.periodScores,
        officials: game.officials,
        rosters: game.rosters.map(r => ({
          teamId: r.teamId,
          coachName: r.coachName,
          assistantCoachName: r.assistantCoachName,
          players: r.players.map(p => ({
            jerseyNumber: p.jerseyNumber,
            athlete: p.athlete,
          })),
        })),
        playerStatLines: game.playerStatLines,
      }}
    />
  )
}
