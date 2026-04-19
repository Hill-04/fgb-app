import { AdminLiveTablePage } from '@/modules/live-game/components/admin-live-table-page'

export default async function ChampionshipGameLivePage({
  params,
}: {
  params: Promise<{ id: string; gameId: string }>
}) {
  const { gameId } = await params
  return <AdminLiveTablePage gameId={gameId} />
}
