import { notFound, redirect } from 'next/navigation'
import { buildChampionshipGamePath, findChampionshipIdByGameId } from '@/lib/admin-game-routing'

export default async function AdminGamePregamePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const championshipId = await findChampionshipIdByGameId(id)
  if (!championshipId) notFound()
  redirect(buildChampionshipGamePath(championshipId, id, 'roster'))
}
