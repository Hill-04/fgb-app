import { redirect } from 'next/navigation'

export default async function ChampionshipPublicRedirect({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  redirect(`/campeonatos/${id}`)
}
