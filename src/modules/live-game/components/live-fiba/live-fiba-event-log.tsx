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
  const latestEventId = events[0]?.id ?? ''

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
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/38">Ultimo evento no topo / leitura operacional compacta</p>
      </header>

      <div className="min-h-0 overflow-y-auto p-3">
        {events.length === 0 ? (
          <div className="grid h-full place-items-center rounded-[22px] border border-dashed border-white/10 bg-white/[0.03] p-6 text-center">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.18em] text-white/55">Sem eventos</p>
              <p className="mt-2 text-sm text-white/35">O feed entra aqui assim que a operacao live comecar.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-2.5">
            {events.map((event, index) => {
              const tone = toneClasses(event.tone)

              return (
                <div
                  key={event.id}
                  className={[
                    'grid grid-cols-[72px_minmax(0,1fr)_auto] items-center gap-3 rounded-[20px] border px-3 py-3 transition duration-150',
                    tone.wrapper,
                    event.isOptimistic ? 'ring-1 ring-[#F5C200]/25' : '',
                    highlightedId === event.id ? 'ring-2 ring-white/18 shadow-[0_0_0_1px_rgba(255,255,255,0.08)]' : '',
                    index === 0 ? 'shadow-[0_14px_32px_rgba(0,0,0,0.25)]' : '',
                  ].join(' ')}
                >
                  <div className="grid gap-1 text-center">
                    <span className="text-[11px] font-black uppercase tracking-[0.14em] text-white/42">{event.periodLabel}</span>
                    <span className="rounded-full bg-black/20 px-2 py-1 text-[11px] font-black uppercase tracking-[0.1em] text-white">
                      {event.clockTime}
                    </span>
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={['rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em]', tone.chip].join(' ')}>
                        {event.actionLabel}
                      </span>
                      {event.isOptimistic ? (
                        <span className="rounded-full bg-[#F5C200] px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-black">
                          Pending
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-2 truncate text-[13px] font-black uppercase tracking-[0.06em] text-white">{event.compactLabel}</p>
                    <p className="mt-1 truncate text-[10px] font-black uppercase tracking-[0.14em] text-white/40">{event.teamName}</p>
                  </div>

                  <div className="grid min-w-[48px] place-items-center rounded-2xl border border-white/10 bg-black/20 px-2 py-3 text-[11px] font-black uppercase tracking-[0.12em] text-white">
                    {event.icon}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}
