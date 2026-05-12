'use client'

import { useMemo } from 'react'
import { fourFactorsFromEvents } from '@/lib/live-game/four-factors'

type Props = {
  events: { eventType: string; teamId: string; payloadJson?: string | null }[]
  homeTeamId: string
  awayTeamId: string
  homeTeamName: string
  awayTeamName: string
}

export function FourFactorsLive({ events, homeTeamId, awayTeamId, homeTeamName, awayTeamName }: Props) {
  const homeFF = useMemo(
    () => fourFactorsFromEvents(events, homeTeamId, awayTeamId),
    [events, homeTeamId, awayTeamId]
  )
  const awayFF = useMemo(
    () => fourFactorsFromEvents(events, awayTeamId, homeTeamId),
    [events, awayTeamId, homeTeamId]
  )

  const factors = [
    { key: 'eFGPercent', label: 'eFG%', weight: '40%', desc: 'Eficiência arremesso', invert: false },
    { key: 'tovPercent', label: 'TOV%', weight: '25%', desc: 'Perdas de bola', invert: true },
    { key: 'orbPercent', label: 'ORB%', weight: '20%', desc: 'Rebotes ofensivos', invert: false },
    { key: 'ftRate', label: 'FTR', weight: '15%', desc: 'Idas à linha', invert: false },
  ] as const

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-700">Four Factors</h3>
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-slate-200 text-slate-500">
            <th className="py-1 text-left">Métrica</th>
            <th className="text-right">{homeTeamName.slice(0, 8)}</th>
            <th className="text-right">{awayTeamName.slice(0, 8)}</th>
          </tr>
        </thead>
        <tbody>
          {factors.map(f => {
            const home = (homeFF as Record<string, number>)[f.key]
            const away = (awayFF as Record<string, number>)[f.key]
            const homeWins = f.invert ? home < away : home > away
            const awayWins = f.invert ? away < home : away > home
            return (
              <tr key={f.key} className="border-b border-slate-100">
                <td className="py-1.5">
                  <div className="font-semibold text-slate-800">{f.label}</div>
                  <div className="text-[10px] text-slate-400">{f.desc} · peso {f.weight}</div>
                </td>
                <td className={`text-right font-mono ${homeWins ? 'font-bold text-fgb-green-700' : 'text-slate-600'}`}>
                  {home.toFixed(1)}
                </td>
                <td className={`text-right font-mono ${awayWins ? 'font-bold text-fgb-green-700' : 'text-slate-600'}`}>
                  {away.toFixed(1)}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
