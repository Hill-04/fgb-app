import type { LiveTableEvent } from './live-game-table-adapter'

const FGB_AMARELO = '#F5C200'

const ICON_MAP: Record<string, string> = {
  '2PTS': '🏀', '3PTS': '🎯', FT: '⭕', F: '✋', REB: '📌',
  AST: '🤝', STL: '🦅', BLK: '🛡️', TOV: '💨', SUB: '🔄',
  TO: '⏸️', 'P+': '▶️', 'P-': '🔔', INI: '▶️', HT: '🏁',
  RET: '↩️', FIM: '🏆', EV: '•',
}

export function LiveEventLogFiba({ events }: { events: LiveTableEvent[] }) {
  return (
    <div style={{
      borderRadius: '0 0 14px 14px',
      border: '1px solid rgba(255,255,255,.08)', borderTop: 'none',
      background: 'rgba(255,255,255,.04)', padding: 12,
    }}>
      <div style={{
        fontSize: 11, color: 'rgba(255,255,255,.4)', marginBottom: 10,
        fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: 1, textTransform: 'uppercase',
      }}>
        Log da partida ({events.length} eventos)
      </div>

      <div style={{
        height: 320, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 3,
        scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,.2) transparent',
      }}>
        {events.length === 0 && (
          <div style={{ color: 'rgba(255,255,255,.3)', textAlign: 'center', marginTop: 40, fontSize: 13 }}>
            Nenhum evento ainda.<br />Inicie o jogo para registrar.
          </div>
        )}

        {events.map((event, i) => (
          <div key={event.id} style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '5px 10px',
            borderRadius: 6,
            background: i === 0 ? `rgba(245,194,0,.12)` : 'rgba(255,255,255,.04)',
            borderLeft: i === 0 ? `2px solid ${FGB_AMARELO}` : '2px solid transparent',
            fontSize: 12,
            color: i === 0 ? '#FFE57A' : 'rgba(255,255,255,.75)',
            transition: 'all .2s',
          }}>
            <span style={{ flexShrink: 0, fontSize: 14 }}>{ICON_MAP[event.icon] || '•'}</span>
            <span style={{
              fontFamily: "'Barlow Condensed', sans-serif", fontSize: 11,
              color: 'rgba(255,255,255,.35)', minWidth: 38, flexShrink: 0,
            }}>
              {event.clockTime}
            </span>
            <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {event.teamSide === 'home' ? '🔵 ' : event.teamSide === 'away' ? '🔴 ' : ''}
              {event.description}
            </span>
            {event.isOptimistic && (
              <span style={{
                fontSize: 9, color: '#F5C200', background: 'rgba(245,194,0,.15)',
                borderRadius: 10, padding: '1px 6px', flexShrink: 0, fontWeight: 700,
              }}>⟳</span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
