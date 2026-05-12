import type { Metadata } from 'next'

import { prisma } from '@/lib/db'
import { PublishedSumulaBadge } from '@/components/public/PublishedSumulaBadge'
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

  // PM-05.B: fetch metadados de publicação direto do banco pra renderizar o badge.
  // Server-side, paralelo ao GameDataProvider que faz polling client. Pode retornar
  // null se game nao existe (renderiza sem badge — children faz seu proprio handle).
  const gamePublication = await prisma.game.findUnique({
    where: { id },
    select: {
      lifecycleState: true,
      isHistoricallyLocked: true,
      officialReport: {
        select: {
          currentVersion: true,
          finalizedAt: true,
          officialPdfUrl: true,
        },
      },
    },
  })

  const showBadge =
    gamePublication?.lifecycleState === 'PUBLISHED' &&
    gamePublication.officialReport?.finalizedAt != null

  return (
    <GameDataProvider gameId={id}>
      <div className="mx-auto max-w-[1240px] px-4 pb-20 sm:px-6">
        <div className="pt-6">
          <GameHeroClient />
          {showBadge && gamePublication?.officialReport?.finalizedAt && (
            <div className="mt-4">
              <PublishedSumulaBadge
                publishedAt={gamePublication.officialReport.finalizedAt}
                isHistoricallyLocked={gamePublication.isHistoricallyLocked}
                version={gamePublication.officialReport.currentVersion}
                pdfUrl={gamePublication.officialReport.officialPdfUrl}
              />
            </div>
          )}
          <GameTabNav gameId={id} />
          <div className="mt-6">{children}</div>
        </div>
      </div>
    </GameDataProvider>
  )
}
