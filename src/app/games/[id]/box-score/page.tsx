import { LiveGamePublicView } from '@/modules/live-game/components/live-game-public-view'

export default async function PublicBoxScorePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <LiveGamePublicView gameId={id} mode="box-score" />
}
