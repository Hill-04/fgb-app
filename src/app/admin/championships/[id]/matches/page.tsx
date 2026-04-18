import { redirect } from 'next/navigation'

export default async function ChampionshipMatchesCompatibilityPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  redirect(`/admin/championships/${id}/jogos`)
}
