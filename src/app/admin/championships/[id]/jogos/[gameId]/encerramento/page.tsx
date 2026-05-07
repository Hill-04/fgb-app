import { redirect } from 'next/navigation'

export default async function ChampionshipGameEncerramentoPage({
  params,
}: {
  params: Promise<{ id: string; gameId: string }>
}) {
  const { id, gameId } = await params
  redirect(`/admin/championships/${id}/jogos/${gameId}/sumula`)
}
