import type { LiveGameTableModel } from './live-game-table-adapter'

// FGB Identity
const FGB = {
  verde:    '#1B7340',
  vermelho: '#CC1016',
  amarelo:  '#F5C200',
  homeAccent: '#F5C200',
  awayAccent: '#FFFFFF',
}

type LiveScoreboardFibaProps = {
  table: LiveGameTableModel
  visualShotClock: number
  clockDisplay: string
  isSyncing: boolean
  onResetShotClock: (value: number) => void
  onTimeout: (side: 'home' | 'away') => void
  onControlEvent: (eventType: string) => void
}

function FoulDots({ count }: { count: number }) {
  return (
    <div style={{ display: 'flex', gap: 4, alignItems: 'center', justifyContent: 'center' }}>
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} style={{
          width: 10, height: 10, borderRadius: '50%',
          background: i < count
            ? count >= 5 ? '#FF4444' : count >= 3 ? FGB.amarelo : '#FF8C00'
            : 'rgba(255,255,255,0.15)',
          transition: 'background .2s',
        }} />
      ))}
    </div>
  )
}

function TeamBlock({
  side, team, tone,
}: {
  side: 'home' | 'away'
  team: LiveGameTableModel['home']
  tone: 'home' | 'away'
}) {
  const bg = tone === 'home' ? FGB.verde : FGB.vermelho
  const accent = tone === 'home' ? FGB.amarelo : FGB.awayAccent
  const label = tone === 'home' ? 'MANDANTE' : 'VISITANTE'
  const shadow = tone === 'home' ? `0 0 40px rgba(27,115,64,.5)` : `0 0 40px rgba(204,16,22,.5)`

  return (
    <div style={{ flex: 1, textAlign: 'center' }}>
      <div style={{
        width: 48, height: 48, borderRadius: 12, background: bg,
        border: `3px solid ${accent}`, display: 'flex', alignItems: 'center',
        justifyContent: 'center', fontSize: 18, fontWeight: 900,
        color: accent, margin: '0 auto 6px',
        fontFamily: "'Barlow Condensed', 'Oswald', sans-serif",
      }}>
        {team.shortName[0]}
      </div>
      <div style={{ fontSize: 22, fontWeight: 900, letterSpacing: 1, color: '#FFF', fontFamily: "'Barlow Condensed', 'Oswald', sans-serif" }}>
        {team.shortName}
      </div>
      <div style={{ fontSize: 10, color: 'rgba(255,255,255,.4)', marginBottom: 8, letterSpacing: 2, textTransform: 'uppercase' }}>
        {label}
      </div>
      <div style={{
        fontSize: 80, fontWeight: 900, lineHeight: 1, color: '#FFF',
        textShadow: shadow, fontFamily: "'Barlow Condensed', 'Oswald', sans-serif",
      }}>
        {team.score}
      </div>
      <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
        <FoulDots count={team.fouls} />
        <div style={{ fontSize: 10, color: 'rgba(255,255,255,.4)' }}>
          {team.fouls}/4 faltas · {Math.max(5 - team.timeoutsUsed, 0)} TO
        </div>
      </div>
    </div>
  )
}

export function LiveScoreboardFiba({
  table, visualShotClock, clockDisplay, isSyncing,
  onResetShotClock, onTimeout, onControlEvent,
}: LiveScoreboardFibaProps) {
  const shotUrgent = visualShotClock <= 5

  return (
    <div style={{
      background: 'linear-gradient(135deg, #090E1A 0%, #0D1525 50%, #090E1A 100%)',
      borderRadius: 18, padding: '20px 16px',
      border: '1px solid rgba(255,255,255,.08)',
      position: 'relative', overflow: 'hidden',
      boxShadow: '0 24px 60px rgba(4,10,22,.5)',
    }}>
      {/* Grid overlay */}
      <div style={{
        position: 'absolute', inset: 0, opacity: .03, pointerEvents: 'none',
        backgroundImage: 'repeating-linear-gradient(90deg,#fff 0px,#fff 1px,transparent 1px,transparent 40px)',
      }} />

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 14 }}>
        <div style={{
          fontSize: 11, fontWeight: 700, color: FGB.amarelo,
          letterSpacing: 3, textTransform: 'uppercase',
          fontFamily: "'Barlow Condensed', 'Oswald', sans-serif",
        }}>
          ⚡ FGB · {table.championshipName}
        </div>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,.4)', marginTop: 2 }}>
          {table.categoryName} · {table.venueLabel}
        </div>
      </div>

      {/* Scoreboard */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
        <TeamBlock side="home" team={table.home} tone="home" />

        {/* Centro */}
        <div style={{ textAlign: 'center', padding: '0 12px', minWidth: 170 }}>
          <div style={{
            fontSize: 13, fontWeight: 700, color: FGB.amarelo, letterSpacing: 2,
            marginBottom: 6, textTransform: 'uppercase',
            fontFamily: "'Barlow Condensed', 'Oswald', sans-serif",
          }}>
            {table.currentPeriodLabel}
          </div>

          {/* Relógio de jogo */}
          <div style={{
            fontSize: 44, fontWeight: 900, letterSpacing: 2, color: '#FFF',
            fontFamily: "'Barlow Condensed', 'Oswald', sans-serif",
          }}>
            {clockDisplay}
          </div>

          {/* Relógio de 24s */}
          <div style={{ display: 'flex', justifyContent: 'center', margin: '8px 0' }}>
            <div style={{
              fontSize: 30, fontWeight: 900, padding: '2px 14px', borderRadius: 6,
              border: `2px solid ${shotUrgent ? '#FF4444' : FGB.amarelo}`,
              background: shotUrgent ? 'rgba(255,68,68,.12)' : 'rgba(245,194,0,.08)',
              color: shotUrgent ? '#FF4444' : FGB.amarelo,
              transition: 'color .2s, background .2s, border-color .2s',
              fontFamily: "'Barlow Condensed', 'Oswald', sans-serif",
              minWidth: 56, textAlign: 'center',
            }}>
              {Math.max(visualShotClock, 0)}
            </div>
          </div>

          {/* Parciais */}
          {table.periodScores.length > 0 && (
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 6 }}>
              {table.periodScores.map(p => (
                <div key={p.period} style={{ textAlign: 'center', fontSize: 10, color: 'rgba(255,255,255,.5)' }}>
                  <div style={{ fontSize: 9, color: 'rgba(255,255,255,.3)', marginBottom: 1 }}>{p.label}</div>
                  <div>{p.homePoints}–{p.awayPoints}</div>
                </div>
              ))}
            </div>
          )}

          {/* Controles */}
          <div style={{ display: 'flex', gap: 5, justifyContent: 'center', marginTop: 12, flexWrap: 'wrap' }}>
            {[
              { label: '▶ INICIAR', event: 'GAME_START', bg: FGB.verde },
              { label: 'P+ INÍCIO', event: 'PERIOD_START', bg: '#1A5A8A' },
              { label: 'FIM P', event: 'PERIOD_END', bg: '#6B3A1F' },
              { label: 'INTERVALO', event: 'HALFTIME_START', bg: '#4A3A00' },
              { label: 'RET.', event: 'HALFTIME_END', bg: '#2A4A2A' },
              { label: 'FIM JOGO', event: 'GAME_END', bg: FGB.vermelho },
            ].map(({ label, event, bg }) => (
              <button key={event} onClick={() => onControlEvent(event)} style={{
                padding: '5px 10px', borderRadius: 6, border: 'none',
                background: bg, color: '#FFF', fontWeight: 700, fontSize: 10,
                cursor: 'pointer', letterSpacing: .5,
                fontFamily: "'Barlow Condensed', 'Oswald', sans-serif",
              }}>
                {label}
              </button>
            ))}
          </div>

          {/* Reset shot clock */}
          <div style={{ display: 'flex', gap: 5, justifyContent: 'center', marginTop: 6 }}>
            <button onClick={() => onResetShotClock(24)} style={{
              padding: '5px 12px', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer',
              border: `1px solid rgba(245,194,0,.35)`, background: 'rgba(245,194,0,.08)',
              color: FGB.amarelo, fontFamily: "'Barlow Condensed', sans-serif",
            }}>24s ↺</button>
            <button onClick={() => onResetShotClock(14)} style={{
              padding: '5px 12px', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer',
              border: `1px solid rgba(245,194,0,.2)`, background: 'rgba(245,194,0,.04)',
              color: 'rgba(245,194,0,.55)', fontFamily: "'Barlow Condensed', sans-serif",
            }}>14s</button>
          </div>

          <div style={{ marginTop: 6, fontSize: 10, color: 'rgba(255,255,255,.25)', letterSpacing: 1 }}>
            {isSyncing ? '⟳ Sincronizando...' : '● Mesa estável'}
          </div>
        </div>

        <TeamBlock side="away" team={table.away} tone="away" />
      </div>

      {/* Timeout buttons */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', marginTop: 14,
        paddingTop: 12, borderTop: '1px solid rgba(255,255,255,.06)',
      }}>
        <button onClick={() => onTimeout('home')} style={{
          padding: '6px 16px', borderRadius: 6, cursor: 'pointer', fontWeight: 600, fontSize: 11,
          border: `1px solid ${FGB.verde}`, background: `rgba(27,115,64,.25)`,
          color: '#7FD4A0', fontFamily: "'Barlow Condensed', sans-serif",
        }}>
          ⏸ TIMEOUT {table.home.shortName} ({Math.max(5 - table.home.timeoutsUsed, 0)})
        </button>
        <button onClick={() => onTimeout('away')} style={{
          padding: '6px 16px', borderRadius: 6, cursor: 'pointer', fontWeight: 600, fontSize: 11,
          border: `1px solid ${FGB.vermelho}`, background: `rgba(204,16,22,.25)`,
          color: '#FF9999', fontFamily: "'Barlow Condensed', sans-serif",
        }}>
          ⏸ TIMEOUT {table.away.shortName} ({Math.max(5 - table.away.timeoutsUsed, 0)})
        </button>
      </div>
    </div>
  )
}
