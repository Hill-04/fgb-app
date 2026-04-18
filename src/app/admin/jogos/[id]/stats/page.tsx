import { notFound, redirect } from 'next/navigation'
import { buildAdminGamePath, findChampionshipIdByGameId } from '@/lib/admin-game-routing'

export default async function AdminJogoStatsCompatibilityPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const championshipId = await findChampionshipIdByGameId(id)
  if (!championshipId) notFound()
  redirect(buildAdminGamePath(id, 'stats', championshipId))
}
