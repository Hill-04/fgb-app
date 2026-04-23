'use client'

import type { LiveGameTableModel, LiveTableTeam } from '../live-game-table-adapter'

type LiveFibaScoreboardProps = {
  tableModel: LiveGameTableModel
  isSyncing?: boolean
  pendingCount?: number
}

function TeamScoreBlock({ team, side }: { team: LiveTableTeam; side: 'home' | 'away' }) {
  const isHome = side === 'home'

  return (
    <section
      className={[
        'relative overflow-hidden rounded-[22px] border p-4 text-white shadow-[0_18px_50px_rgba(0,0,0,0.32)]',
        isHome
          ? 'border-emerald-300/20 bg-[linear-gradient(135deg,#09351f,#146238_58%,#092416)]'
          : 'border-red-300/20 bg-[linear-gradient(135deg,#3b0508,#9d1118_58%,#240306)]',
      ].join(' ')}
    >
      <div className="absolute inset-0 opacity-[0.09] [background-image:linear-gradient(90deg,#fff_1px,transparent_1px),linear-gradient(#fff_1px,transparent_1px)] [background-size:28px_28px]" />
      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-white/50">
            {isHome ? 'HOME' : 'AWAY'}
          </p>
          <h2 className="mt-1 truncate text-2xl font-black uppercase tracking-[0.03em] text-white md:text-3xl">
            {team.shortName}
          </h2>
          <p className="mt-1 truncate text-xs font-semibold uppercase tracking-[0.12em] text-white/45">
            {team.name}
          </p>
        </div>
        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-white/20 bg-white/12 text-lg font-black text-white">
          {team.shortName.slice(0, 2)}
        </div>
      </div>

      <div className="relative mt-5 flex items-end justify-between gap-3">
        <div className="text-[82px] font-black leading-none tracking-[-0.06em] text-white md:text-[104px]">
          {team.score}
        </div>
        <div className="mb-2 grid gap-2 text-right">
          <div>
            <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-white/35">Fouls</p>
            <p className="text-2xl font-black text-[#f5c849]">{team.fouls}</p>
          </div>
          <div>
            <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-white/35">Timeouts</p>
            <p className="text-2xl font-black text-white">{team.timeoutsUsed}</p>
          </div>
        </div>
      </div>
    </section>
  )
}

export function LiveFibaScoreboard({ tableModel, isSyncing = false, pendingCount = 0 }: LiveFibaScoreboardProps) {
  return (
    <div className="rounded-[28px] border border-white/10 bg-[#070b12] p-3 text-white shadow-[0_28px_80px_rgba(0,0,0,0.42)]">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3 px-2 pt-1">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.28em] text-[#f5c849]">FGB live table</p>
          <h1 className="mt-1 text-lg font-black uppercase tracking-[0.04em] text-white md:text-2xl">
            {tableModel.championshipName}
          </h1>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/40">
            {tableModel.categoryName} / {tableModel.venueLabel}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="rounded-full border border-white/10 bg-white/8 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-white/55">
            {tableModel.liveStatus}
          </span>
          <span
            className={[
              'rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em]',
              isSyncing ? 'bg-[#f5c849] text-black' : 'bg-emerald-400/15 text-emerald-200',
            ].join(' ')}
          >
            {isSyncing ? `Sync ${pendingCount}` : 'Stable'}
          </span>
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-[1fr_240px_1fr]">
        <TeamScoreBlock team={tableModel.home} side="home" />

        <section className="grid place-items-center rounded-[22px] border border-white/10 bg-[radial-gradient(circle_at_top,#172033,#090d15_68%)] p-4 text-center">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-white/35">
              {tableModel.currentPeriodLabel}
            </p>
            <div className="mt-3 rounded-2xl border border-[#f5c849]/35 bg-black/45 px-5 py-3 text-[52px] font-black leading-none tracking-[-0.04em] text-[#f5c849] shadow-[0_0_36px_rgba(245,200,73,0.16)]">
              {tableModel.clockDisplay}
            </div>
            <p className="mt-3 text-[10px] font-bold uppercase tracking-[0.2em] text-white/35">
              Period {tableModel.currentPeriod}
            </p>
          </div>
        </section>

        <TeamScoreBlock team={tableModel.away} side="away" />
      </div>
    </div>
  )
}
