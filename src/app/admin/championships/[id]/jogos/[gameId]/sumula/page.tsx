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
        select: {
          teamId: true,
          coachName: true,
          assistantCoachName: true,
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
        rosters: game.rosters,
      }}
    />
  )
}
