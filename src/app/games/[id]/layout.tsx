import type { Metadata } from 'next'

import { GameDataProvider } from '@/modules/live-game/components/public/game-data-provider'
import { GameHeroClient } from '@/modules/live-game/components/public/game-hero-client'
import { GameTabNav } from '@/modules/live-game/components/public/game-tab-nav'

export const metadata: Metadata = {
  title: 'Jogo ao vivo — FGB',
}

export default async function GamePublicLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  return (
    <GameDataProvider gameId={id}>
      <div className="mx-auto max-w-[1240px] px-4 pb-20 sm:px-6">
        <div className="pt-6">
          <GameHeroClient />
          <GameTabNav gameId={id} />
          <div className="mt-6">{children}</div>
        </div>
      </div>
    </GameDataProvider>
  )
}
