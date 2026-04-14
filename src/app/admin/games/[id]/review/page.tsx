import { LiveGameAdminView } from '@/modules/live-game/components/live-game-admin-view'

export default async function AdminGameReviewPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <LiveGameAdminView gameId={id} mode="review" />
}
