import { prisma } from '@/lib/db'
import { GameStepNav } from './GameStepNav'

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
    },
  })

  return (
    <div>
      {game && (
        <GameStepNav
          championshipId={id}
          gameId={gameId}
          homeTeamName={game.homeTeam.name}
          awayTeamName={game.awayTeam.name}
        />
      )}
      {children}
    </div>
  )
}
