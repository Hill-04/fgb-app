'use client'

import { useRef, useState, useTransition } from 'react'
import Link from 'next/link'
import { CheckCircle2, ExternalLink, Save } from 'lucide-react'
import { saveSumulaData } from './actions'

const PERIODS = [
  { key: 'q1', label: 'Q1' },
  { key: 'q2', label: 'Q2' },
  { key: 'q3', label: 'Q3' },
  { key: 'q4', label: 'Q4' },
  { key: 'q5', label: 'OT1' },
  { key: 'q6', label: 'OT2' },
]

const OFFICIALS = [
  { key: 'mainReferee',  label: 'Árbitro Principal' },
  { key: 'auxReferee',   label: 'Árbitro Auxiliar' },
  { key: 'scorer',       label: 'Anotador' },
  { key: 'timekeeper',   label: 'Cronometrista' },
  { key: 'commissioner', label: 'Comissário' },
]

const OFFICIAL_TYPE_MAP: Record<string, string> = {
  mainReferee:  'MAIN_REFEREE',
  auxReferee:   'AUX_REFEREE',
  scorer:       'SCORER',
  timekeeper:   'TIMEKEEPER',
  commissioner: 'COMMISSIONER',
}

type PeriodRow = { home: number; away: number }

export type MesaGameData = {
  id: string
  homeTeamId: string
  awayTeamId: string
  homeTeam: { name: string }
  awayTeam: { name: string }
  homeScore: number | null
  awayScore: number | null
  attendance: number | null
  championship: { name: string; year: number | null } | null
  category: { name: string } | null
  dateTime: string
  venue: string | null
  periodScores: { period: number; homePoints: number; awayPoints: number }[]
  officials: { officialType: string; role: string; name: string }[]
  rosters: { teamId: string; coachName: string | null; assistantCoachName: string | null }[]
}

const inputCls =
  'h-9 w-full rounded-xl border border-[var(--border)] bg-white px-3 text-sm focus:outline-none focus:border-[var(--verde)]'
const numCls =
  'h-9 w-16 rounded-xl border border-[var(--border)] bg-white px-2 text-center text-sm font-black focus:outline-none focus:border-[var(--verde)]'

export default function MesaClient({ game }: { game: MesaGameData }) {
  const formRef = useRef<HTMLFormElement>(null)
  const [pending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)

  const initPeriods = (): Record<string, PeriodRow> => {
    const result: Record<string, PeriodRow> = {}
    for (let i = 1; i <= 6; i++) {
      const ps = game.periodScores.find(p => p.period === i)
      result[`q${i}`] = { home: ps?.homePoints ?? 0, away: ps?.awayPoints ?? 0 }
    }
    return result
  }

  const [periods, setPeriods] = useState<Record<string, PeriodRow>>(initPeriods)
  const [homeScore, setHomeScore] = useState(game.homeScore ?? 0)
  const [awayScore, setAwayScore] = useState(game.awayScore ?? 0)

  const homeTotal = Object.values(periods).reduce((s, p) => s + p.home, 0)
  const awayTotal = Object.values(periods).reduce((s, p) => s + p.away, 0)

  function getOfficialName(key: string) {
    const type = OFFICIAL_TYPE_MAP[key]
    return game.officials.find(o => o.officialType === type)?.name ?? ''
  }

  const homeRoster = game.rosters.find(r => r.teamId === game.homeTeamId)
  const awayRoster = game.rosters.find(r => r.teamId === game.awayTeamId)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const fd = new FormData(formRef.current!)
    fd.set('homeScore', String(homeScore))
    fd.set('awayScore', String(awayScore))
    for (let i = 1; i <= 6; i++) {
      fd.set(`q${i}Home`, String(periods[`q${i}`]?.home ?? 0))
      fd.set(`q${i}Away`, String(periods[`q${i}`]?.away ?? 0))
    }
    startTransition(async () => {
      await saveSumulaData(fd)
      setSaved(true)
      setTimeout(() => setSaved(false), 4000)
    })
  }

  const gameDate = new Date(game.dateTime)

  return (
    <div className="space-y-5 pb-12">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="fgb-label text-[var(--verde)]">
            {game.championship?.name}{game.championship?.year ? ` ${game.championship.year}` : ''}
            {game.category?.name ? ` · ${game.category.name}` : ''}
          </p>
          <h1 className="fgb-display mt-2 text-2xl text-[var(--black)]">
            {game.homeTeam.name} × {game.awayTeam.name}
          </h1>
          <p className="mt-1 text-sm text-[var(--gray)]">
            {gameDate.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
            {game.venue ? ` · ${game.venue}` : ''}
          </p>
        </div>
        <Link
          href={`/sumula/${game.id}`}
          target="_blank"
          className="inline-flex h-10 items-center gap-2 rounded-xl border border-[var(--verde)] px-4 text-[10px] font-black uppercase text-[var(--verde)] hover:bg-[var(--verde)] hover:text-white transition-colors"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          Ver Súmula
        </Link>
      </div>

      <form ref={formRef} onSubmit={handleSubmit} className="space-y-5">
        <input type="hidden" name="gameId" value={game.id} />
        <input type="hidden" name="homeTeamId" value={game.homeTeamId} />
        <input type="hidden" name="awayTeamId" value={game.awayTeamId} />

        {/* Period scores */}
        <div className="rounded-[24px] border border-[var(--border)] bg-white p-5 shadow-sm">
          <h2 className="fgb-display mb-4 text-lg text-[var(--black)]">Placar por Período</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="pb-2 pr-4 text-left text-[9px] font-black uppercase tracking-[0.18em] text-[var(--gray)]">Time</th>
                  {PERIODS.map(p => (
                    <th key={p.key} className="px-1 pb-2 text-center text-[9px] font-black uppercase tracking-[0.18em] text-[var(--gray)]">
                      {p.label}
                    </th>
                  ))}
                  <th className="px-2 pb-2 text-center text-[9px] font-black uppercase tracking-[0.18em] text-[var(--verde)]">Total</th>
                </tr>
              </thead>
              <tbody className="space-y-2">
                {(['home', 'away'] as const).map(side => {
                  const teamName = side === 'home' ? game.homeTeam.name : game.awayTeam.name
                  const total = side === 'home' ? homeTotal : awayTotal
                  return (
                    <tr key={side}>
                      <td className="whitespace-nowrap pr-4 py-1 text-[11px] font-black uppercase text-[var(--black)]">
                        {teamName}
                      </td>
                      {PERIODS.map(p => (
                        <td key={p.key} className="px-1 py-1">
                          <input
                            type="number" min={0} max={999}
                            value={periods[p.key]?.[side] ?? 0}
                            onChange={e =>
                              setPeriods(prev => ({
                                ...prev,
                                [p.key]: { ...prev[p.key], [side]: Math.max(0, Number(e.target.value) || 0) },
                              }))
                            }
                            className={numCls}
                          />
                        </td>
                      ))}
                      <td className="px-2 py-1 text-center text-xl font-black text-[var(--verde)]">{total}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Final scores */}
        <div className="rounded-[24px] border border-[var(--border)] bg-white p-5 shadow-sm">
          <h2 className="fgb-display mb-4 text-lg text-[var(--black)]">Placar Final Oficial</h2>
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm font-black uppercase text-[var(--black)]">{game.homeTeam.name}</span>
            <input
              type="number" min={0} max={999}
              value={homeScore}
              onChange={e => setHomeScore(Math.max(0, Number(e.target.value) || 0))}
              className="h-14 w-20 rounded-xl border-2 border-[var(--verde)] bg-white px-2 text-center text-3xl font-black focus:outline-none"
            />
            <span className="text-2xl font-black text-[var(--gray)]">×</span>
            <input
              type="number" min={0} max={999}
              value={awayScore}
              onChange={e => setAwayScore(Math.max(0, Number(e.target.value) || 0))}
              className="h-14 w-20 rounded-xl border-2 border-[var(--verde)] bg-white px-2 text-center text-3xl font-black focus:outline-none"
            />
            <span className="text-sm font-black uppercase text-[var(--black)]">{game.awayTeam.name}</span>
            <button
              type="button"
              onClick={() => { setHomeScore(homeTotal); setAwayScore(awayTotal) }}
              className="ml-2 h-9 rounded-xl border border-[var(--border)] bg-[var(--gray-l)] px-4 text-[10px] font-black uppercase text-[var(--gray)] hover:border-[var(--verde)] hover:text-[var(--verde)] transition-colors"
            >
              Usar soma dos períodos ({homeTotal}×{awayTotal})
            </button>
          </div>
          <div className="mt-4">
            <label className="mb-1 block text-[9px] font-black uppercase tracking-[0.18em] text-[var(--gray)]">
              Público (espectadores)
            </label>
            <input
              name="attendance" type="number" min={0}
              defaultValue={game.attendance ?? ''}
              placeholder="0"
              className="h-9 w-36 rounded-xl border border-[var(--border)] bg-white px-3 text-sm focus:outline-none focus:border-[var(--verde)]"
            />
          </div>
        </div>

        {/* Officials */}
        <div className="rounded-[24px] border border-[var(--border)] bg-white p-5 shadow-sm">
          <h2 className="fgb-display mb-4 text-lg text-[var(--black)]">Árbitros e Oficiais de Mesa</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {OFFICIALS.map(o => (
              <div key={o.key}>
                <label className="mb-1 block text-[9px] font-black uppercase tracking-[0.18em] text-[var(--gray)]">
                  {o.label}
                </label>
                <input
                  name={o.key} type="text"
                  defaultValue={getOfficialName(o.key)}
                  placeholder="Nome completo"
                  className={inputCls}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Coaches */}
        <div className="rounded-[24px] border border-[var(--border)] bg-white p-5 shadow-sm">
          <h2 className="fgb-display mb-4 text-lg text-[var(--black)]">Comissão Técnica</h2>
          <div className="grid gap-6 md:grid-cols-2">
            {(
              [
                { side: 'home', label: 'Mandante', name: game.homeTeam.name, roster: homeRoster, coachKey: 'homeCoach', asstKey: 'homeAsstCoach' },
                { side: 'away', label: 'Visitante', name: game.awayTeam.name, roster: awayRoster, coachKey: 'awayCoach', asstKey: 'awayAsstCoach' },
              ] as const
            ).map(({ side, label, name, roster, coachKey, asstKey }) => (
              <div key={side} className="space-y-3">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[var(--verde)]">
                  {name} <span className="text-[var(--gray)]">({label})</span>
                </p>
                <div>
                  <label className="mb-1 block text-[9px] font-black uppercase tracking-[0.15em] text-[var(--gray)]">Técnico</label>
                  <input name={coachKey} type="text" defaultValue={roster?.coachName ?? ''} placeholder="Nome do técnico" className={inputCls} />
                </div>
                <div>
                  <label className="mb-1 block text-[9px] font-black uppercase tracking-[0.15em] text-[var(--gray)]">Assistente técnico</label>
                  <input name={asstKey} type="text" defaultValue={roster?.assistantCoachName ?? ''} placeholder="Nome do assistente" className={inputCls} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3">
          {saved && (
            <span className="flex items-center gap-2 text-sm font-black text-[var(--verde)]">
              <CheckCircle2 className="h-4 w-4" />
              Dados salvos!
            </span>
          )}
          <Link
            href={`/sumula/${game.id}`}
            target="_blank"
            className="inline-flex h-11 items-center gap-2 rounded-xl border border-[var(--border)] bg-white px-5 text-[10px] font-black uppercase text-[var(--gray)] hover:border-[var(--verde)] hover:text-[var(--verde)] transition-colors"
          >
            <ExternalLink className="h-4 w-4" />
            Ver / Imprimir Súmula
          </Link>
          <button
            type="submit"
            disabled={pending}
            className="fgb-btn-primary inline-flex h-11 items-center gap-2 rounded-xl px-6 text-[10px] font-black uppercase disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {pending ? 'Salvando...' : 'Salvar Dados'}
          </button>
        </div>
      </form>
    </div>
  )
}
