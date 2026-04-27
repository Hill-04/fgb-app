'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const TABS = [
  { label: 'Acompanhar', segment: 'live' },
  { label: 'Box Score', segment: 'box-score' },
  { label: 'Play-by-Play', segment: 'play-by-play' },
  { label: 'Info', segment: 'game-info' },
]

export function GameTabNav({ gameId }: { gameId: string }) {
  const pathname = usePathname()

  return (
    <nav className="mt-4 flex gap-1 border-b border-[var(--border)] overflow-x-auto">
      {TABS.map((tab) => {
        const href = `/games/${gameId}/${tab.segment}`
        const isActive = pathname === href || pathname.startsWith(href + '/')
        return (
          <Link
            key={tab.segment}
            href={href}
            className={`relative shrink-0 px-4 pb-3 pt-2 text-[11px] font-black uppercase tracking-widest transition-colors ${
              isActive
                ? 'text-[var(--verde)]'
                : 'text-[var(--gray)] hover:text-[var(--black)]'
            }`}
          >
            {tab.label}
            {isActive && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-[var(--verde)]" />
            )}
          </Link>
        )
      })}
    </nav>
  )
}
