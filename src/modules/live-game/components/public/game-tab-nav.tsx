'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

type GameTab = {
  label: string
  mobileLabel?: string
  segment: string
}

const TABS: GameTab[] = [
  { label: 'Acompanhar', mobileLabel: 'Live', segment: 'live' },
  { label: 'Estatisticas', mobileLabel: 'Stats', segment: 'stats' },
  { label: 'Box Score', segment: 'box-score' },
  { label: 'Play-by-Play', segment: 'play-by-play' },
  { label: 'Info', segment: 'game-info' },
]

export function GameTabNav({ gameId }: { gameId: string }) {
  const pathname = usePathname()

  return (
    <div className="sticky top-0 z-30 mt-4 -mx-4 border-y border-[var(--border)] bg-[#f7f4ea]/95 px-3 backdrop-blur sm:-mx-6 sm:px-6">
      <nav className="flex snap-x gap-2 overflow-x-auto py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {TABS.map((tab) => {
          const href = `/games/${gameId}/${tab.segment}`
          const isActive = pathname === href || pathname.startsWith(href + '/')

          return (
            <Link
              key={tab.segment}
              href={href}
              aria-current={isActive ? 'page' : undefined}
              className={`relative min-h-10 shrink-0 snap-start rounded-full px-4 py-2.5 text-[10px] font-black uppercase tracking-widest transition-colors sm:min-h-0 sm:rounded-none sm:px-4 sm:pb-3 sm:pt-3 sm:text-[11px] ${
                isActive
                  ? 'bg-[var(--verde)] text-white sm:bg-transparent sm:text-[var(--verde)]'
                  : 'bg-white/70 text-[var(--gray)] hover:text-[var(--black)] sm:bg-transparent'
              }`}
            >
              <span className="sm:hidden">{tab.mobileLabel ?? tab.label}</span>
              <span className="hidden sm:inline">{tab.label}</span>
              {isActive ? (
                <span className="absolute bottom-0 left-3 right-3 hidden h-0.5 rounded-full bg-[var(--verde)] sm:block" />
              ) : null}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
