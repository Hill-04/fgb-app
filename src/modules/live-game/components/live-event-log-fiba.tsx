import { Clock3 } from 'lucide-react'
import type { LiveTableEvent } from './live-game-table-adapter'

const ICON_MAP: Record<string, string> = {
  '2PTS': '🏀',
  '3PTS': '🎯',
  FT: '⭕',
  F: '✋',
  REB: '📌',
  AST: '🤝',
  STL: '🦅',
  BLK: '🛡️',
  TOV: '💨',
  SUB: '🔄',
  TO: '⏸️',
  'P+': '▶️',
  'P-': '🔔',
  INI: '▶️',
  HT: '🏁',
  RET: '↩️',
  FIM: '🏆',
  EV: '•',
}

export function LiveEventLogFiba({ events }: { events: LiveTableEvent[] }) {
  return (
    <div className="rounded-b-[14px] border border-t-0 border-white/8 bg-white/[0.04] p-3">
      <div className="mb-3 text-[11px] uppercase tracking-[0.1em] text-white/45">
        LOG DA PARTIDA ({events.length} eventos)
      </div>

      <div className="h-[320px] space-y-1 overflow-y-auto pr-1">
        {events.length === 0 && (
          <div className="mt-10 text-center text-[13px] text-white/30">
            Nenhum evento ainda.
            <br />
            Inicie o jogo para registrar.
          </div>
        )}

        {events.map((event, index) => (
          <div
            key={event.id}
            className={`flex items-center gap-2 rounded-[6px] px-3 py-2 text-[12px] ${
              index === 0 ? 'border-l-2 border-[#f5c849] bg-[#f5c849]/12 text-[#ffe57a]' : 'bg-white/[0.04] text-white/75'
            }`}
          >
            <span className="flex-shrink-0 text-[14px]">{ICON_MAP[event.icon] || '•'}</span>
            <span className="min-w-[38px] flex-shrink-0 text-[11px] text-white/35">{event.clockTime}</span>
            <span className="min-w-0 flex-1 truncate">
              {event.teamSide === 'home' ? '🔵 ' : event.teamSide === 'away' ? '🔴 ' : ''}
              {event.description}
            </span>
            {event.isOptimistic && (
              <span className="inline-flex flex-shrink-0 items-center gap-1 rounded-full bg-yellow-100 px-2 py-1 text-[9px] font-black uppercase tracking-widest text-yellow-700">
                <Clock3 className="h-3 w-3" />
                Sync
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
