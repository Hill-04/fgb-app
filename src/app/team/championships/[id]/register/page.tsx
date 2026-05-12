import { redirect } from 'next/navigation'

export default async function ChampionshipRegisterRedirect({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  redirect(`/team/campeonatos/${id}/register`)
}
