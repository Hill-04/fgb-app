'use client'

import type { LiveGameTableModel } from '../live-game-table-adapter'

type LiveFibaBoxscoreProps = {
  tableModel: LiveGameTableModel
}

export function LiveFibaBoxscore({ tableModel }: LiveFibaBoxscoreProps) {
  return (
    <section className="overflow-hidden rounded-[24px] border border-white/10 bg-[#0b1019] text-white shadow-[0_22px_64px_rgba(0,0,0,0.28)]">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-[linear-gradient(90deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))] px-4 py-4">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#f5c849]">Boxscore</p>
          <h2 className="mt-1 text-2xl font-black uppercase tracking-[0.04em]">Leitura estatistica</h2>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-white/40">
            {tableModel.home.shortName} vs {tableModel.away.shortName}
          </p>
        </div>
        <div className="flex gap-2">
          {tableModel.periodScores.map((period) => (
            <div key={period.period} className="rounded-xl bg-white/8 px-3 py-2 text-center">
              <p className="text-[9px] font-black uppercase tracking-[0.16em] text-white/35">{period.label}</p>
              <p className="text-sm font-black text-white">
                {period.homePoints}-{period.awayPoints}
              </p>
            </div>
          ))}
        </div>
      </header>

      <div className="grid gap-3 border-b border-white/10 px-4 py-4 lg:grid-cols-2">
        {[tableModel.home, tableModel.away].map((team) => (
          <div
            key={team.id}
            className={[
              'rounded-2xl border p-4',
              team.side === 'home'
                ? 'border-emerald-300/20 bg-emerald-400/8'
                : 'border-red-300/20 bg-red-400/8',
            ].join(' ')}
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/35">
                  {team.side === 'home' ? 'Home team' : 'Away team'}
                </p>
                <h3 className="mt-1 text-lg font-black uppercase tracking-[0.04em]">{team.name}</h3>
              </div>
              <div className="rounded-xl bg-black/25 px-3 py-2 text-right">
                <p className="text-[9px] font-black uppercase tracking-[0.16em] text-white/35">Score</p>
                <p className="text-2xl font-black text-[#f5c849]">{team.score}</p>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2 md:grid-cols-6">
              {[
                ['REB', team.rebounds],
                ['AST', team.assists],
                ['STL', team.steals],
                ['BLK', team.blocks],
                ['TO', team.turnovers],
                ['FOUL', team.fouls],
              ].map(([label, value]) => (
                <div key={label} className="rounded-xl bg-white/8 px-3 py-2 text-center">
                  <p className="text-[9px] font-black uppercase tracking-[0.16em] text-white/35">{label}</p>
                  <p className="mt-1 text-lg font-black text-white">{value}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="max-h-[560px] overflow-auto">
        <table className="w-full min-w-[860px] text-left">
          <thead className="sticky top-0 z-10 bg-[#111827] text-[10px] font-black uppercase tracking-[0.16em] text-white/38">
            <tr>
              <th className="px-4 py-3">Player</th>
              <th className="px-3 py-3 text-center">Team</th>
              <th className="px-3 py-3 text-center">Pts</th>
              <th className="px-3 py-3 text-center">Reb</th>
              <th className="px-3 py-3 text-center">Ast</th>
              <th className="px-3 py-3 text-center">Stl</th>
              <th className="px-3 py-3 text-center">Blk</th>
              <th className="px-3 py-3 text-center">TO</th>
              <th className="px-3 py-3 text-center">Foul</th>
              <th className="px-3 py-3 text-center">+2</th>
              <th className="px-3 py-3 text-center">+3</th>
              <th className="px-3 py-3 text-center">+1</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/8">
            {tableModel.boxRows.map((row) => (
              <tr key={row.id} className="transition hover:bg-white/[0.05]">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={[
                        'grid h-9 w-9 place-items-center rounded-xl border text-xs font-black',
                        row.teamSide === 'home'
                          ? 'border-emerald-300/20 bg-emerald-400/10 text-emerald-100'
                          : 'border-red-300/20 bg-red-400/10 text-red-100',
                      ].join(' ')}
                    >
                      {row.jerseyNumber ?? '--'}
                    </div>
                    <div>
                      <p className="text-sm font-black uppercase tracking-[0.04em] text-white">{row.athleteName}</p>
                      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/35">
                        {row.isOnCourt ? 'On court' : 'Bench'}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-3 py-3 text-center text-xs font-black uppercase text-white/55">{row.teamName}</td>
                <td className="px-3 py-3 text-center text-sm font-black text-[#f5c849]">{row.points}</td>
                <td className="px-3 py-3 text-center text-sm font-bold text-white/70">{row.rebounds}</td>
                <td className="px-3 py-3 text-center text-sm font-bold text-white/70">{row.assists}</td>
                <td className="px-3 py-3 text-center text-sm font-bold text-white/70">{row.steals}</td>
                <td className="px-3 py-3 text-center text-sm font-bold text-white/70">{row.blocks}</td>
                <td className="px-3 py-3 text-center text-sm font-bold text-white/70">{row.turnovers}</td>
                <td className="px-3 py-3 text-center text-sm font-black text-red-200">{row.fouls}</td>
                <td className="px-3 py-3 text-center text-xs font-bold text-white/60">
                  {row.twoPtMade}/{row.twoPtAttempted}
                </td>
                <td className="px-3 py-3 text-center text-xs font-bold text-white/60">
                  {row.threePtMade}/{row.threePtAttempted}
                </td>
                <td className="px-3 py-3 text-center text-xs font-bold text-white/60">
                  {row.freeThrowsMade}/{row.freeThrowsAttempted}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
