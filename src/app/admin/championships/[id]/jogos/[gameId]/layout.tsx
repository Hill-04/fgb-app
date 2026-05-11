import { prisma } from '@/lib/db'
import { GameStepNav } from './GameStepNav'
import { deriveLifecycleFromLegacy, type GameLifecycleState } from '@/lib/game-lifecycle'

export default async function ChampionshipGameLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ id: string; gameId: string }>
}) {
  const { id, gameId } = await params

  const game = await prisma.game.findFirst({
    where: { id: gameId },
    select: {
      homeTeam: { select: { name: true } },
      awayTeam: { select: { name: true } },
      lifecycleState: true,
      status: true,
      liveStatus: true,
      isLivePublished: true,
    },
  })

  const lifecycleState: GameLifecycleState | undefined = game
    ? ((game.lifecycleState as GameLifecycleState | null) ??
        deriveLifecycleFromLegacy({
          status: game.status,
          liveStatus: game.liveStatus,
          isLivePublished: game.isLivePublished,
        }))
    : undefined

  return (
    <div>
      {game && (
        <GameStepNav
          championshipId={id}
          gameId={gameId}
          homeTeamName={game.homeTeam.name}
          awayTeamName={game.awayTeam.name}
          lifecycleState={lifecycleState}
        />
      )}
      {children}
    </div>
  )
}
