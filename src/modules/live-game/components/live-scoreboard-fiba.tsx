import type { LiveGameTableModel } from './live-game-table-adapter'

type LiveScoreboardFibaProps = {
  table: LiveGameTableModel
  visualShotClock: number
  clockDisplay: string
  isSyncing: boolean
  onResetShotClock: (value: number) => void
  onTimeout: (side: 'home' | 'away') => void
  onControlEvent: (eventType: string) => void
}

function buildDisplayTimeouts(timeoutsUsed: number) {
  return Math.max(5 - (timeoutsUsed || 0), 0)
}

function FoulDots({ count }: { count: number }) {
  return (
    <div className="flex items-center justify-center gap-1">
      {Array.from({ length: 5 }).map((_, index) => (
        <span
          key={index}
          className={`h-2.5 w-2.5 rounded-full ${
            index < count
              ? count >= 5
                ? 'bg-[#ff5e5e]'
                : count >= 3
                  ? 'bg-[#f5c849]'
                  : 'bg-[#ff9640]'
              : 'bg-white/15'
          }`}
        />
      ))}
    </div>
  )
}

function TeamSide({
  side,
  tone,
}: {
  side: LiveGameTableModel['home']
  tone: 'home' | 'away'
}) {
  return (
    <div className="flex-1 text-center">
      <div
        className={`mx-auto flex h-12 w-12 items-center justify-center rounded-[12px] border-[3px] text-lg font-black ${
          tone === 'home'
            ? 'border-[#f5c849] bg-[#0e3f80] text-[#f5c849]'
            : 'border-white bg-[#9f2437] text-white'
        }`}
      >
        {side.shortName[0]}
      </div>
      <div className="mt-2 text-[22px] font-black uppercase tracking-[0.06em] text-white">
        {side.shortName}
      </div>
      <div className={`text-[10px] uppercase tracking-[0.24em] ${tone === 'home' ? 'text-[#8fbfff]' : 'text-[#ffb4c1]'}`}>
        {tone === 'home' ? 'Mandante' : 'Visitante'}
      </div>
      <div className="mt-2 text-[80px] font-black leading-none tracking-tight text-white">
        {side.score}
      </div>
      <div className="mt-2">
        <FoulDots count={side.fouls} />
      </div>
      <div className="mt-2 text-[10px] text-white/40">
        {side.fouls}/4 faltas • {buildDisplayTimeouts(side.timeoutsUsed)} TO
      </div>
    </div>
  )
}

export function LiveScoreboardFiba({
  table,
  visualShotClock,
  clockDisplay,
  isSyncing,
  onResetShotClock,
  onTimeout,
  onControlEvent,
}: LiveScoreboardFibaProps) {
  return (
    <div className="relative overflow-hidden rounded-[18px] border border-white/10 bg-[linear-gradient(135deg,#0b111d_0%,#11192d_48%,#17101b_100%)] p-4 shadow-[0_24px_60px_rgba(4,10,22,0.45)]">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{ backgroundImage: 'repeating-linear-gradient(90deg, #fff 0px, #fff 1px, transparent 1px, transparent 40px)' }}
      />

      <div className="relative">
        <div className="mb-3 text-center">
          <div className="text-[11px] font-black uppercase tracking-[0.34em] text-[#f5c849]">
            FGB · {table.championshipName}
          </div>
          <div className="mt-1 text-[11px] text-white/40">
            {table.categoryName} · {table.venueLabel}
          </div>
        </div>

        <div className="flex items-center justify-between gap-3">
          <TeamSide side={table.home} tone="home" />

          <div className="min-w-[190px] px-2 text-center">
            <div className="text-[12px] font-bold uppercase tracking-[0.18em] text-[#f5c849]">
              {table.currentPeriodLabel}
            </div>

            <div className="mt-2 text-[46px] font-black leading-none tracking-[0.08em] text-white">
              {clockDisplay}
            </div>

            <div className="mt-2 flex justify-center">
              <div className="rounded-[8px] border-2 border-[#f5c849] bg-[#f5c849]/10 px-3 py-2 text-center">
                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-[#f5c849]">24</div>
                <div className={`mt-1 text-[30px] font-black leading-none ${visualShotClock <= 5 ? 'text-[#ff6464]' : 'text-[#f5c849]'}`}>
                  {Math.max(visualShotClock, 0)}
                </div>
              </div>
            </div>

            {table.periodScores.length > 0 && (
              <div className="mt-3 flex flex-wrap justify-center gap-1.5">
                {table.periodScores.map((period) => (
                  <div key={period.period} className="text-center text-[10px] text-white/50">
                    <div className="text-[9px] text-white/30">{period.label}</div>
                    <div>
                      {period.homePoints}–{period.awayPoints}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-3 flex flex-wrap justify-center gap-2">
              <button
                onClick={() => onResetShotClock(24)}
                className="rounded-lg border border-[#f5c849]/30 bg-[#f5c849]/10 px-3 py-2 text-[11px] font-black uppercase tracking-[0.16em] text-[#f5c849]"
              >
                24s ↻
              </button>
              <button
                onClick={() => onResetShotClock(14)}
                className="rounded-lg border border-[#f5c849]/18 bg-[#f5c849]/5 px-3 py-2 text-[11px] font-black uppercase tracking-[0.16em] text-[#f5c849]/75"
              >
                14s
              </button>
            </div>

            <div className="mt-3 flex flex-wrap justify-center gap-2">
              {[
                ['Iniciar', 'GAME_START'],
                ['Periodo', 'PERIOD_START'],
                ['Fim P', 'PERIOD_END'],
                ['Fim J', 'GAME_END'],
              ].map(([label, eventType]) => (
                <button
                  key={eventType}
                  onClick={() => onControlEvent(eventType)}
                  className="rounded-lg border border-white/10 bg-white/8 px-3 py-2 text-[10px] font-black uppercase tracking-[0.14em] text-white"
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="mt-3 text-[10px] uppercase tracking-[0.22em] text-white/35">
              {isSyncing ? 'Sincronizando...' : 'Mesa estável'}
            </div>
          </div>

          <TeamSide side={table.away} tone="away" />
        </div>

        <div className="mt-4 flex flex-col justify-between gap-3 border-t border-white/6 pt-3 md:flex-row">
          <button
            onClick={() => onTimeout('home')}
            className="rounded-lg border border-[#0e3f80] bg-[#0e3f80]/30 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.12em] text-[#7fb3ff]"
          >
            ⏸ Timeout {table.home.shortName} ({buildDisplayTimeouts(table.home.timeoutsUsed)})
          </button>
          <button
            onClick={() => onTimeout('away')}
            className="rounded-lg border border-[#9f2437] bg-[#9f2437]/30 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.12em] text-[#ff9dac]"
          >
            ⏸ Timeout {table.away.shortName} ({buildDisplayTimeouts(table.away.timeoutsUsed)})
          </button>
        </div>
      </div>
    </div>
  )
}
