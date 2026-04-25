'use client'

import { useEffect, useState } from 'react'

import type { LiveTableEvent } from '../live-game-table-adapter'

type LiveFibaEventLogProps = {
  events: LiveTableEvent[]
  recentInteractionId?: string
}

function toneClasses(tone: LiveTableEvent['tone']) {
  switch (tone) {
    case 'score':
      return {
        wrapper: 'border-[#F5C200]/30 bg-[#F5C200]/10',
        chip: 'bg-[#F5C200]/18 text-[#F5C200]',
      }
    case 'foul':
      return {
        wrapper: 'border-[#CC1016]/25 bg-[#CC1016]/10',
        chip: 'bg-[#CC1016]/16 text-[#FFB4B7]',
      }
    case 'turnover':
      return {
        wrapper: 'border-white/12 bg-white/[0.05]',
        chip: 'bg-white/[0.08] text-white/72',
      }
    case 'control':
      return {
        wrapper: 'border-[#145530]/28 bg-[#145530]/10',
        chip: 'bg-[#145530]/18 text-emerald-100',
      }
    default:
      return {
        wrapper: 'border-white/10 bg-white/[0.04]',
        chip: 'bg-white/[0.08] text-white/72',
      }
  }
}

export function LiveFibaEventLog({ events, recentInteractionId = '' }: LiveFibaEventLogProps) {
  const [highlightedId, setHighlightedId] = useState('')
  const [latestEvent, ...remainingEvents] = events
  const latestEventId = latestEvent?.id ?? ''

  useEffect(() => {
    if (!latestEventId) return undefined
    setHighlightedId(latestEventId)

    const timeoutId = window.setTimeout(() => {
      setHighlightedId((current) => (current === latestEventId ? '' : current))
    }, 820)

    return () => window.clearTimeout(timeoutId)
  }, [latestEventId, recentInteractionId])

  return (
    <section className="grid min-h-0 grid-rows-[auto_1fr] overflow-hidden rounded-[28px] border border-white/10 bg-[#0a0e14] text-white shadow-[0_24px_72px_rgba(0,0,0,0.34)]">
      <header className="border-b border-white/10 bg-[linear-gradient(90deg,rgba(245,194,0,0.14),rgba(255,255,255,0.02))] px-4 py-4">
        <p className="text-[10px] font-black uppercase tracking-[0.26em] text-[#F5C200]">Live feed</p>
        <h2 className="mt-1 text-xl font-black uppercase tracking-[0.04em]">Event log</h2>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/38">Leitura operacional em tempo real</p>
      </header>

      <div className="min-h-0 overflow-auto p-3">
        {events.length === 0 ? (
          <div className="grid h-full place-items-center rounded-[22px] border border-dashed border-white/10 bg-white/[0.03] p-6 text-center">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.18em] text-white/55">Sem eventos</p>
              <p className="mt-2 text-sm text-white/35">O feed entra aqui assim que a operacao live comecar.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {latestEvent ? (
              <div
                className={[
                  'rounded-[24px] border p-4 transition duration-200',
                  toneClasses(latestEvent.tone).wrapper,
                  latestEvent.isOptimistic ? 'ring-2 ring-[#F5C200]/35' : '',
                  highlightedId === latestEvent.id ? 'scale-[1.01] ring-2 ring-white/16' : '',
                ].join(' ')}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className={['rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em]', toneClasses(latestEvent.tone).chip].join(' ')}>
                      {latestEvent.actionLabel}
                    </span>
                    <span className="rounded-full bg-black/20 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-white/58">
                      {latestEvent.periodLabel}
                    </span>
                    <span className="rounded-full bg-black/20 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-white/58">
                      {latestEvent.clockTime}
                    </span>
                  </div>
                  {latestEvent.isOptimistic ? (
                    <span className="rounded-full bg-[#F5C200] px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-black">
                      Pending
                    </span>
                  ) : null}
                </div>

                <div className="mt-3 grid grid-cols-[1fr_auto] items-start gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-[1.05rem] font-black uppercase tracking-[0.04em] text-white">{latestEvent.compactLabel}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <p className="text-[11px] font-black uppercase tracking-[0.16em] text-white/45">{latestEvent.teamName}</p>
                      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-white/34">{latestEvent.description}</p>
                    </div>
                  </div>
                  <div className="grid h-14 w-14 shrink-0 place-items-center rounded-[18px] border border-white/10 bg-black/20 text-base font-black text-white">
                    {latestEvent.icon}
                  </div>
                </div>
              </div>
            ) : null}

            <ol className="space-y-2">
              {remainingEvents.map((event) => (
                <li
                  key={event.id}
                  className={[
                    'grid grid-cols-[54px_1fr] gap-3 rounded-[20px] border p-3 transition duration-150',
                    toneClasses(event.tone).wrapper,
                    event.isOptimistic ? 'ring-1 ring-[#F5C200]/25' : '',
                    highlightedId === event.id ? 'ring-2 ring-white/14' : '',
                  ].join(' ')}
                >
                  <div className="grid content-center gap-1 rounded-2xl border border-white/10 bg-black/20 px-2 py-2 text-center">
                    <span className="text-[11px] font-black uppercase tracking-[0.04em] text-white">{event.icon}</span>
                    <span className="text-[9px] font-black uppercase tracking-[0.14em] text-white/40">{event.clockTime}</span>
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="truncate text-[12px] font-black uppercase tracking-[0.04em] text-white">{event.compactLabel}</p>
                      <span className={['shrink-0 rounded-full px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em]', toneClasses(event.tone).chip].join(' ')}>
                        {event.actionLabel}
                      </span>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-[10px] font-black uppercase tracking-[0.14em] text-white/45">
                      <span>{event.periodLabel}</span>
                      <span>{event.teamName}</span>
                      {event.isOptimistic ? <span className="text-[#F5C200]">Pending</span> : null}
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>
    </section>
  )
}
