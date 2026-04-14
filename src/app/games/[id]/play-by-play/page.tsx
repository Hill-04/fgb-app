import { LiveGamePublicView } from '@/modules/live-game/components/live-game-public-view'

export default async function PublicPlayByPlayPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <LiveGamePublicView gameId={id} mode="play-by-play" />
}
