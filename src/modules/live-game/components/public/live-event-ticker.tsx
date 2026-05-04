'use client'

import { useGameData } from './game-data-provider'

function formatEventTime(period: number | null, clockTime: string | null) {
  const periodLabel = period ? (period <= 4 ? `Q${period}` : `OT${period - 4}`) : null
  return [periodLabel, clockTime].filter(Boolean).join(' - ')
}

export function LiveEventTicker() {
  const { data } = useGameData()

  if (!data?.game.isLive || data.recentEvents.length === 0) return null

  const latestEvent = data.recentEvents[0]
  const eventTime = formatEventTime(latestEvent.period, latestEvent.clockTime)

  return (
    <div className="mt-3 overflow-hidden rounded-2xl border border-[#F5C200]/35 bg-[#111111] text-white shadow-sm">
      <div className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <div className="flex min-w-0 items-center gap-3">
          <span className="inline-flex h-2.5 w-2.5 shrink-0 rounded-full bg-[#F5C200] shadow-[0_0_18px_rgba(245,194,0,0.9)]" />
          <div className="min-w-0">
            <p className="text-[9px] font-black uppercase tracking-[0.28em] text-[#F5C200]">
              Ultimo evento ao vivo
            </p>
            <p className="truncate text-sm font-black text-white sm:text-base">
              {latestEvent.athleteName ? `${latestEvent.athleteName} - ` : ''}
              {latestEvent.description}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/55">
          {latestEvent.teamName ? <span>{latestEvent.teamName}</span> : null}
          {eventTime ? <span className="rounded-full bg-white/10 px-2 py-1">{eventTime}</span> : null}
          {latestEvent.pointsDelta > 0 ? (
            <span className="rounded-full bg-[#F5C200] px-2 py-1 text-[#111111]">
              +{latestEvent.pointsDelta}
            </span>
          ) : null}
        </div>
      </div>
    </div>
  )
}
