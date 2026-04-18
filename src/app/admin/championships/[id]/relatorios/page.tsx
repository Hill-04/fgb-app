import { redirect } from 'next/navigation'

export default async function ChampionshipReportsRedirectPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  redirect(`/admin/championships/${id}/documents`)
}
