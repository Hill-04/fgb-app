'use client'

import { useMemo } from 'react'

import type { LiveGameTableModel, LiveTableBoxRow, LiveTableSide } from '../live-game-table-adapter'

type LiveFibaBoxscoreProps = {
  tableModel: LiveGameTableModel
}

function sortRows(rows: LiveTableBoxRow[]) {
  return [...rows].sort((left, right) => {
    if (right.points !== left.points) return right.points - left.points
    if (right.rebounds !== left.rebounds) return right.rebounds - left.rebounds
    if (right.assists !== left.assists) return right.assists - left.assists
    return left.athleteName.localeCompare(right.athleteName)
  })
}

function BoxRows({
  rows,
  side,
}: {
  rows: LiveTableBoxRow[]
  side: LiveTableSide
}) {
  return (
    <div
      className={[
        'rounded-[22px] border p-3',
        side === 'home' ? 'border-[#145530]/35 bg-[#145530]/12' : 'border-[#CC1016]/35 bg-[#CC1016]/12',
      ].join(' ')}
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-white/45">
          {side === 'home' ? 'Home box' : 'Away box'}
        </p>
        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-white/42">{rows[0]?.teamName || 'Equipe'}</p>
      </div>

      <div className="space-y-1.5">
        {rows.slice(0, 5).map((row) => (
          <div key={row.id} className="grid grid-cols-[minmax(0,1fr)_34px_34px_34px_34px] items-center gap-2 rounded-2xl bg-black/20 px-3 py-2">
            <div className="min-w-0">
              <p className="truncate text-[11px] font-black uppercase tracking-[0.04em] text-white">
                {row.jerseyNumber ?? '--'} / {row.athleteName}
              </p>
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/40">
                {row.isOnCourt ? 'On court' : 'Bench'}
              </p>
            </div>
            <div className="text-center">
              <p className="text-[9px] font-black uppercase tracking-[0.14em] text-white/35">PTS</p>
              <p className="text-sm font-black text-[#F5C200]">{row.points}</p>
            </div>
            <div className="text-center">
              <p className="text-[9px] font-black uppercase tracking-[0.14em] text-white/35">REB</p>
              <p className="text-sm font-black text-white">{row.rebounds}</p>
            </div>
            <div className="text-center">
              <p className="text-[9px] font-black uppercase tracking-[0.14em] text-white/35">AST</p>
              <p className="text-sm font-black text-white">{row.assists}</p>
            </div>
            <div className="text-center">
              <p className="text-[9px] font-black uppercase tracking-[0.14em] text-white/35">FL</p>
              <p className="text-sm font-black text-[#FFB4B7]">{row.fouls}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function LiveFibaBoxscore({ tableModel }: LiveFibaBoxscoreProps) {
  const homeRows = useMemo(() => sortRows(tableModel.boxRows.filter((row) => row.teamSide === 'home')), [tableModel.boxRows])
  const awayRows = useMemo(() => sortRows(tableModel.boxRows.filter((row) => row.teamSide === 'away')), [tableModel.boxRows])

  return (
    <section className="overflow-hidden rounded-[28px] border border-white/10 bg-[#0a0e14] text-white shadow-[0_24px_72px_rgba(0,0,0,0.34)]">
      <header className="border-b border-white/10 bg-[linear-gradient(90deg,rgba(255,255,255,0.07),rgba(255,255,255,0.02))] px-4 py-3">
        <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#F5C200]">Boxscore</p>
        <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.14em] text-white/42">Leitura rapida dos principais impact players</p>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <div className="rounded-2xl border border-white/10 bg-black/20 px-3 py-2">
            <p className="text-[9px] font-black uppercase tracking-[0.16em] text-white/35">{tableModel.home.shortName}</p>
            <p className="mt-1 text-sm font-black text-white">
              REB {tableModel.home.rebounds} / AST {tableModel.home.assists} / TO {tableModel.home.turnovers}
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/20 px-3 py-2">
            <p className="text-[9px] font-black uppercase tracking-[0.16em] text-white/35">{tableModel.away.shortName}</p>
            <p className="mt-1 text-sm font-black text-white">
              REB {tableModel.away.rebounds} / AST {tableModel.away.assists} / TO {tableModel.away.turnovers}
            </p>
          </div>
        </div>
      </header>

      <div className="grid gap-3 p-3 xl:grid-cols-2">
        <BoxRows rows={homeRows} side="home" />
        <BoxRows rows={awayRows} side="away" />
      </div>
    </section>
  )
}
