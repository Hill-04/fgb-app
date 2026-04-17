import { PublicLiveSnapshotView } from '@/modules/live-game/components/public-live-snapshot-view'

export default async function PublicLiveGamePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <PublicLiveSnapshotView gameId={id} />
}
