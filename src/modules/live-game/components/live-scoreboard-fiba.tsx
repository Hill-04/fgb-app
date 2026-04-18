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

function renderTeamDots(count: number) {
  return Array.from({ length: 5 }).map((_, index) => (
    <span
      key={index}
      className={`h-2.5 w-2.5 rounded-full ${
        index < count
          ? count >= 5
            ? 'bg-[#ff6b6b]'
            : count >= 3
              ? 'bg-[#ffd76c]'
              : 'bg-[#ff9747]'
          : 'bg-white/12'
      }`}
    />
  ))
}

function TeamSideCard({
  side,
  tone,
}: {
  side: LiveGameTableModel['home']
  tone: 'home' | 'away'
}) {
  return (
    <div className="rounded-[20px] border border-white/10 bg-white/6 p-4">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-[14px] border-2 border-white/20 bg-white/10 text-lg font-black text-white">
        {side.shortName.slice(0, 1)}
      </div>
      <p className="mt-3 text-center text-[24px] font-black uppercase tracking-[0.08em] text-white">
        {side.shortName}
      </p>
      <p className={`mt-1 text-center text-[10px] font-black uppercase tracking-[0.35em] ${tone === 'home' ? 'text-[#a9c6ff]' : 'text-[#ffbec9]'}`}>
        {tone === 'home' ? 'Mandante' : 'Visitante'}
      </p>
      <div className="mt-4 text-center text-[88px] font-black leading-none tracking-tight text-white">
        {side.score}
      </div>
      <div className="mt-4 flex justify-center gap-1.5">{renderTeamDots(side.fouls)}</div>
      <div className="mt-2 text-center text-[10px] uppercase tracking-[0.22em] text-white/45">
        {side.fouls}/4 faltas · {buildDisplayTimeouts(side.timeoutsUsed)} TO
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
    <div className="overflow-hidden rounded-[26px] border border-white/8 bg-[linear-gradient(135deg,#091224_0%,#0f1b36_45%,#150d1b_100%)] p-4 shadow-[0_24px_60px_rgba(4,10,22,0.45)]">
      <div className="text-center">
        <p className="text-[11px] font-black uppercase tracking-[0.38em] text-[#ffd76c]">
          FGB · {table.championshipName}
        </p>
        <p className="mt-2 text-[11px] uppercase tracking-[0.24em] text-white/45">
          {table.categoryName} · {table.venueLabel}
        </p>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_auto_1fr] lg:items-center">
        <TeamSideCard side={table.home} tone="home" />

        <div className="min-w-[250px] rounded-[22px] border border-white/10 bg-black/25 px-5 py-5 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
          <div className="inline-flex rounded-full border border-[#ffd76c]/35 bg-[#ffd76c]/12 px-4 py-2 text-[10px] font-black uppercase tracking-[0.38em] text-[#ffe28a]">
            {table.currentPeriodLabel}
          </div>

          <div className="mt-4 text-[64px] font-black leading-none tracking-[0.1em] text-white">
            {clockDisplay}
          </div>

          <div className="mt-4 flex justify-center">
            <div className="rounded-[16px] border border-[#ffd76c]/30 bg-[#ffd76c]/10 px-5 py-3 text-center">
              <p className="text-[10px] font-black uppercase tracking-[0.35em] text-[#ffe28a]">
                Shot Clock
              </p>
              <div className={`mt-2 text-[38px] font-black leading-none ${visualShotClock <= 5 ? 'text-[#ff8f8f]' : 'text-[#ffe28a]'}`}>
                {String(Math.max(visualShotClock, 0)).padStart(2, '0')}
              </div>
              <p className="mt-2 text-[10px] uppercase tracking-[0.18em] text-white/45">
                visual da mesa
              </p>
            </div>
          </div>

          {table.periodScores.length > 0 && (
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {table.periodScores.map((period) => (
                <div
                  key={period.period}
                  className="rounded-xl border border-white/8 bg-white/6 px-3 py-2 text-center"
                >
                  <div className="text-[10px] font-black uppercase tracking-[0.22em] text-white/35">
                    {period.label}
                  </div>
                  <div className="mt-1 text-xs font-semibold text-white/70">
                    {period.homePoints}–{period.awayPoints}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            <button
              onClick={() => onResetShotClock(24)}
              className="rounded-xl border border-[#ffd76c]/30 bg-[#ffd76c]/8 px-4 py-3 text-[10px] font-black uppercase tracking-[0.3em] text-[#ffe28a]"
            >
              24s reset
            </button>
            <button
              onClick={() => onResetShotClock(14)}
              className="rounded-xl border border-white/10 bg-white/8 px-4 py-3 text-[10px] font-black uppercase tracking-[0.3em] text-white/75"
            >
              14s reset
            </button>
          </div>
        </div>

        <div className="grid gap-3">
          <TeamSideCard side={table.away} tone="away" />
          <div className="rounded-[20px] border border-white/10 bg-white/6 p-4">
            <p className="text-[10px] font-black uppercase tracking-[0.35em] text-white/45">Status da mesa</p>
            <p className="mt-3 text-lg font-black uppercase text-white">{table.liveStatus}</p>
            <p className="mt-1 text-[11px] uppercase tracking-[0.2em] text-white/45">
              {isSyncing ? 'sincronizando eventos' : 'snapshot estavel'}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-3 xl:grid-cols-[1fr_1fr_1.2fr]">
        <button
          onClick={() => onTimeout('home')}
          className="rounded-xl border border-[#2d5dad] bg-[#103064] px-4 py-3 text-[11px] font-black uppercase tracking-[0.22em] text-[#a9c6ff]"
        >
          Timeout {table.home.shortName} ({buildDisplayTimeouts(table.home.timeoutsUsed)})
        </button>
        <button
          onClick={() => onTimeout('away')}
          className="rounded-xl border border-[#8c2c40] bg-[#52131f] px-4 py-3 text-[11px] font-black uppercase tracking-[0.22em] text-[#ffbec9]"
        >
          Timeout {table.away.shortName} ({buildDisplayTimeouts(table.away.timeoutsUsed)})
        </button>

        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {[
            ['Iniciar jogo', 'GAME_START'],
            ['Iniciar periodo', 'PERIOD_START'],
            ['Fim periodo', 'PERIOD_END'],
            ['Intervalo', 'HALFTIME_START'],
            ['Voltar', 'HALFTIME_END'],
            ['Encerrar', 'GAME_END'],
          ].map(([label, eventType]) => (
            <button
              key={eventType}
              onClick={() => onControlEvent(eventType)}
              className="rounded-xl border border-white/10 bg-white/8 px-3 py-3 text-[10px] font-black uppercase tracking-[0.24em] text-white"
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
