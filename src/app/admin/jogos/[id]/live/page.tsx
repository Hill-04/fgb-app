import { AdminLiveTablePage } from '@/modules/live-game/components/admin-live-table-page'

export default async function AdminJogoLivePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <AdminLiveTablePage gameId={id} />
}

