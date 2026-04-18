import { redirect } from 'next/navigation'

export default async function ChampionshipGameStatsCompatibilityPage({
  params,
}: {
  params: Promise<{ id: string; gameId: string }>
}) {
  const { gameId } = await params
  redirect(`/admin/jogos/${gameId}/stats`)
}
