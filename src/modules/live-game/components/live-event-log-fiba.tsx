import { Clock3 } from 'lucide-react'
import type { LiveTableEvent } from './live-game-table-adapter'

const SIDE_STYLES: Record<LiveTableEvent['teamSide'], string> = {
  home: 'border-l-[#7fb3ff] bg-[#0f2348]',
  away: 'border-l-[#ff9dac] bg-[#431722]',
  neutral: 'border-l-[#ffd76c] bg-white/[0.05]',
}

export function LiveEventLogFiba({ events }: { events: LiveTableEvent[] }) {
  return (
    <div className="rounded-[18px] border border-white/8 bg-white/[0.04] p-4 shadow-[0_18px_40px_rgba(0,0,0,0.18)]">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-[10px] font-black uppercase tracking-[0.35em] text-white/45">
            Log da mesa
          </div>
          <h3 className="mt-2 text-[24px] font-black uppercase tracking-[0.08em] text-white">
            Ultimos eventos
          </h3>
        </div>
        <span className="rounded-full bg-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.28em] text-white/65">
          {events.length} itens
        </span>
      </div>

      <div className="mt-4 space-y-2">
        {events.length === 0 && (
          <div className="rounded-[14px] border border-dashed border-white/10 bg-white/[0.03] px-4 py-6 text-sm text-white/40">
            Nenhum evento registrado ainda.
          </div>
        )}

        {events.map((event, index) => (
          <div
            key={event.id}
            className={`rounded-[14px] border border-white/8 border-l-4 px-4 py-3 ${SIDE_STYLES[event.teamSide]} ${index === 0 ? 'shadow-[0_12px_28px_rgba(0,0,0,0.18)]' : ''}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="rounded-md bg-white/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-[#ffe28a]">
                    {event.icon}
                  </span>
                  <span className="truncate text-sm font-semibold text-white">
                    {event.description}
                  </span>
                </div>
                <p className="mt-2 text-[10px] uppercase tracking-[0.24em] text-white/40">
                  {event.periodLabel} · {event.clockTime} · {event.teamName}
                </p>
              </div>

              {event.isOptimistic ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-2 py-1 text-[9px] font-black uppercase tracking-widest text-yellow-700">
                  <Clock3 className="h-3 w-3" />
                  Sync
                </span>
              ) : (
                <span className="rounded-full bg-white/10 px-2 py-1 text-[9px] font-black uppercase tracking-widest text-white/55">
                  OK
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
