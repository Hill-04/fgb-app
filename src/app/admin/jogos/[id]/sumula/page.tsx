import { notFound, redirect } from 'next/navigation'
import { buildAdminGamePath, findChampionshipIdByGameId } from '@/lib/admin-game-routing'

export default async function AdminJogoSumulaCompatibilityPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const championshipId = await findChampionshipIdByGameId(id)
  if (!championshipId) notFound()
  redirect(buildAdminGamePath(id, 'sumula', championshipId))
}
