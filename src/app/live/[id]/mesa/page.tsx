import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'

import { authOptions } from '@/lib/auth'
import { resolveUserContext } from '@/lib/access/resolve-user-context'
import { LiveGameAdminView } from '@/modules/live-game/components/live-game-admin-view'

export default async function LiveMesaFullscreenPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ championshipId?: string }>
}) {
  const session = await getServerSession(authOptions)
  const context = resolveUserContext(session?.user as any)

  if (!context.isAuthenticated) {
    redirect('/login')
  }

  if (!context.isAdmin) {
    redirect(context.nextRoute)
  }

  const { id } = await params
  const { championshipId } = await searchParams

  return <LiveGameAdminView gameId={id} mode="live" championshipId={championshipId} presentation="fullscreen" />
}
