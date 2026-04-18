import { LiveGameAdminView } from '@/modules/live-game/components/live-game-admin-view'

export default async function ChampionshipGameReportPage({
  params,
}: {
  params: Promise<{ id: string; gameId: string }>
}) {
  const { id, gameId } = await params
  return <LiveGameAdminView gameId={gameId} mode="report" championshipId={id} />
}
