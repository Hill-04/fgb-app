import { notFound } from 'next/navigation'
import { prisma } from '@/lib/db'
import { readGameLifecycle } from '@/lib/game-close-service'
import { deriveLifecycleFromLegacy, type GameLifecycleState } from '@/lib/game-lifecycle'
import { GameLifecycleBanner } from '@/components/admin/GameLifecycleBanner'
import { VersionHistoryPanel } from '@/components/admin/VersionHistoryPanel'
import MesaClient from './MesaClient'

export const dynamic = 'force-dynamic'

export default async function SumulaAdminPage({
  params,
}: {
  params: Promise<{ id: string; gameId: string }>
}) {
  const { id: championshipId, gameId } = await params

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

  // Lifecycle data (independente do MesaClient — Fase 5.B)
  const lifecycle = await readGameLifecycle(gameId).catch(() => null)
  const rawState = (lifecycle?.game?.lifecycleState ?? null) as GameLifecycleState | null
  const lifecycleState: GameLifecycleState = rawState
    ?? deriveLifecycleFromLegacy({
      status: game.status,
      liveStatus: game.liveStatus,
      isLivePublished: game.isLivePublished,
    })
  const currentVersion = lifecycle?.report?.currentVersion ?? 0
  const hasReport = Boolean(lifecycle?.report)

  return (
    <div className="space-y-5 px-1">
      <GameLifecycleBanner
        gameId={gameId}
        championshipId={championshipId}
        state={lifecycleState}
        currentVersion={currentVersion}
        hasReport={hasReport}
      />

      <MesaClient
        game={{
          id: game.id,
          championshipId,
          status: game.status,
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

      {(currentVersion > 0 || (lifecycle?.recentAudit?.length ?? 0) > 0) && (
        <VersionHistoryPanel
          versions={lifecycle?.versions ?? []}
          audit={lifecycle?.recentAudit ?? []}
        />
      )}
    </div>
  )
}
