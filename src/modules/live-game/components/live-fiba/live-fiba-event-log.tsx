'use client'

import type { LiveTableEvent } from '../live-game-table-adapter'

type LiveFibaEventLogProps = {
  events: LiveTableEvent[]
}

export function LiveFibaEventLog({ events }: LiveFibaEventLogProps) {
  const [latestEvent, ...remainingEvents] = events

  return (
    <section className="overflow-hidden rounded-[24px] border border-white/10 bg-[#0b1019] text-white shadow-[0_22px_64px_rgba(0,0,0,0.28)]">
      <header className="border-b border-white/10 bg-[linear-gradient(90deg,rgba(245,200,73,0.16),rgba(255,255,255,0.03))] px-4 py-4">
        <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#f5c849]">Official event log</p>
        <h2 className="mt-1 text-2xl font-black uppercase tracking-[0.04em]">Timeline da partida</h2>
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-white/40">
          Ultimos eventos entregues pelo modelo da mesa
        </p>
      </header>

      <div className="max-h-[560px] overflow-auto p-4">
        {events.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/12 bg-white/[0.03] p-8 text-center">
            <p className="text-sm font-black uppercase tracking-[0.18em] text-white/55">Nenhum evento registrado</p>
            <p className="mt-2 text-sm text-white/35">Quando a partida iniciar, o log aparece aqui em ordem recente.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {latestEvent ? (
              <div
                className={[
                  'rounded-[22px] border p-4',
                  latestEvent.isOptimistic
                    ? 'border-[#f5c849]/45 bg-[#f5c849]/10'
                    : 'border-emerald-300/20 bg-emerald-400/10',
                ].join(' ')}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/45">Ultimo evento</p>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-black/25 px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-[#f5c849]">
                      {latestEvent.actionLabel}
                    </span>
                    {latestEvent.isOptimistic ? (
                      <span className="rounded-full bg-[#f5c849] px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-black">
                        Pending
                      </span>
                    ) : null}
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-black/25 px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-[#f5c849]">
                    {latestEvent.icon}
                  </span>
                  <span className="rounded-full bg-black/25 px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-white/60">
                    {latestEvent.periodLabel}
                  </span>
                  <span className="rounded-full bg-black/25 px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-white/60">
                    {latestEvent.clockTime}
                  </span>
                  <span className="rounded-full bg-black/25 px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-white/60">
                    {latestEvent.teamName}
                  </span>
                </div>
                <p className="mt-3 text-lg font-black uppercase tracking-[0.03em] text-white">
                  {latestEvent.actorName}
                </p>
                <p className="mt-1 text-[11px] font-black uppercase tracking-[0.16em] text-white/42">
                  {latestEvent.detailLabel}
                </p>
                <p className="mt-2 text-sm font-semibold leading-6 text-white/72">{latestEvent.description}</p>
              </div>
            ) : null}

            <ol className="space-y-3">
              {remainingEvents.map((event) => (
              <li
                key={event.id}
                className={[
                  'grid grid-cols-[56px_1fr] gap-3 rounded-2xl border p-3',
                  event.isOptimistic
                    ? 'border-[#f5c849]/35 bg-[#f5c849]/8'
                    : 'border-white/8 bg-white/[0.035]',
                ].join(' ')}
                >
                  <div className="grid h-12 w-12 place-items-center rounded-xl border border-white/10 bg-black/35 text-[11px] font-black uppercase text-[#f5c849]">
                    {event.icon}
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-[#f5c849]/16 px-2 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-[#f5c849]">
                        {event.actionLabel}
                      </span>
                      <span className="rounded-full bg-white/8 px-2 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-white/50">
                        {event.periodLabel}
                      </span>
                    <span className="rounded-full bg-white/8 px-2 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-white/50">
                      {event.clockTime}
                    </span>
                    <span
                      className={[
                        'rounded-full px-2 py-1 text-[10px] font-black uppercase tracking-[0.14em]',
                        event.teamSide === 'home'
                          ? 'bg-emerald-400/12 text-emerald-200'
                          : event.teamSide === 'away'
                            ? 'bg-red-400/12 text-red-200'
                            : 'bg-white/8 text-white/50',
                      ].join(' ')}
                    >
                      {event.teamName}
                    </span>
                    {event.isOptimistic && (
                      <span className="rounded-full bg-[#f5c849] px-2 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-black">
                        Pending
                      </span>
                    )}
                    </div>
                  <p className="mt-2 text-sm font-black uppercase tracking-[0.04em] text-white">{event.actorName}</p>
                  <p className="mt-1 text-[11px] font-black uppercase tracking-[0.16em] text-white/42">{event.detailLabel}</p>
                  <p className="mt-2 text-sm font-semibold leading-snug text-white/72">{event.description}</p>
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
