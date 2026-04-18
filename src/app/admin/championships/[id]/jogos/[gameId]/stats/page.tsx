import GameStatsPageClient from '../GameStatsPageClient'

export default async function ChampionshipGameStatsPage({
  params,
}: {
  params: Promise<{ id: string; gameId: string }>
}) {
  const { id, gameId } = await params
  return <GameStatsPageClient gameId={gameId} championshipId={id} />
}
