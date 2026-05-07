'use client'

import { useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle2, ExternalLink, Save, BarChart2, ClipboardList, Loader2, FlagTriangleRight } from 'lucide-react'
import { saveSumulaData, savePlayerStats, finalizeGame } from './actions'

// ──────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────

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

type StatLine = {
  athleteId: string
  teamId: string
  minutesPlayed: number
  twoPtMade: number
  twoPtAttempted: number
  threePtMade: number
  threePtAttempted: number
  freeThrowsMade: number
  freeThrowsAttempted: number
  reboundsOffensive: number
  reboundsDefensive: number
  assists: number
  turnovers: number
  fouls: number
  steals: number
  blocks: number
}

type RosterPlayer = {
  jerseyNumber: number | null
  athlete: { id: string; name: string; jerseyNumber: number | null; position: string | null }
}

export type MesaGameData = {
  id: string
  championshipId: string
  status: string
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
  rosters: { teamId: string; coachName: string | null; assistantCoachName: string | null; players: RosterPlayer[] }[]
  playerStatLines: StatLine[]
}

// ──────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────

const inputCls =
  'h-9 w-full rounded-xl border border-[var(--border)] bg-white px-3 text-sm focus:outline-none focus:border-[var(--verde)]'
const numCls =
  'h-9 w-16 rounded-xl border border-[var(--border)] bg-white px-2 text-center text-sm font-black focus:outline-none focus:border-[var(--verde)]'
const statNumCls =
  'h-8 w-12 rounded-lg border border-[var(--border)] bg-white px-1 text-center text-xs font-black focus:outline-none focus:border-[var(--verde)]'

function n(v: number) { return isNaN(v) ? 0 : Math.max(0, Math.floor(v)) }

function calcPts(s: StatLine) {
  return s.twoPtMade * 2 + s.threePtMade * 3 + s.freeThrowsMade
}

function initStats(teamId: string, players: RosterPlayer[], existing: StatLine[]): StatLine[] {
  return players.map(p => {
    const ex = existing.find(s => s.athleteId === p.athlete.id)
    return {
      athleteId: p.athlete.id,
      teamId,
      minutesPlayed: ex?.minutesPlayed ?? 0,
      twoPtMade: ex?.twoPtMade ?? 0,
      twoPtAttempted: ex?.twoPtAttempted ?? 0,
      threePtMade: ex?.threePtMade ?? 0,
      threePtAttempted: ex?.threePtAttempted ?? 0,
      freeThrowsMade: ex?.freeThrowsMade ?? 0,
      freeThrowsAttempted: ex?.freeThrowsAttempted ?? 0,
      reboundsOffensive: ex?.reboundsOffensive ?? 0,
      reboundsDefensive: ex?.reboundsDefensive ?? 0,
      assists: ex?.assists ?? 0,
      turnovers: ex?.turnovers ?? 0,
      fouls: ex?.fouls ?? 0,
      steals: ex?.steals ?? 0,
      blocks: ex?.blocks ?? 0,
    }
  })
}

// ──────────────────────────────────────────────────────────────
// Stats editor sub-component
// ──────────────────────────────────────────────────────────────

const STAT_COLS: Array<{ key: keyof StatLine; label: string; title: string }> = [
  { key: 'minutesPlayed',    label: 'MIN',  title: 'Minutos jogados' },
  { key: 'twoPtMade',        label: '2PM',  title: 'Bolas de 2 convertidas' },
  { key: 'twoPtAttempted',   label: '2PA',  title: 'Bolas de 2 tentadas' },
  { key: 'threePtMade',      label: '3PM',  title: 'Bolas de 3 convertidas' },
  { key: 'threePtAttempted', label: '3PA',  title: 'Bolas de 3 tentadas' },
  { key: 'freeThrowsMade',   label: 'LLM',  title: 'Lances livres convertidos' },
  { key: 'freeThrowsAttempted', label: 'LLA', title: 'Lances livres tentados' },
  { key: 'reboundsOffensive', label: 'RBO', title: 'Rebotes ofensivos' },
  { key: 'reboundsDefensive', label: 'RBD', title: 'Rebotes defensivos' },
  { key: 'assists',   label: 'AST', title: 'Assistências' },
  { key: 'steals',    label: 'STL', title: 'Roubos de bola' },
  { key: 'blocks',    label: 'BLK', title: 'Bloqueios' },
  { key: 'turnovers', label: 'TO',  title: 'Perdas de bola' },
  { key: 'fouls',     label: 'PF',  title: 'Faltas pessoais' },
]

function StatsTable({
  teamName,
  players,
  stats,
  onUpdate,
}: {
  teamName: string
  players: RosterPlayer[]
  stats: StatLine[]
  onUpdate: (athleteId: string, field: keyof StatLine, value: number) => void
}) {
  if (players.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-[var(--border)] p-6 text-center text-sm text-[var(--gray)]">
        Nenhum jogador no roster de <strong>{teamName}</strong>. Configure o roster antes de lançar estatísticas.
      </div>
    )
  }

  const totals = stats.reduce(
    (acc, s) => ({
      pts: acc.pts + calcPts(s),
      twoPtMade: acc.twoPtMade + s.twoPtMade,
      twoPtAttempted: acc.twoPtAttempted + s.twoPtAttempted,
      threePtMade: acc.threePtMade + s.threePtMade,
      threePtAttempted: acc.threePtAttempted + s.threePtAttempted,
      freeThrowsMade: acc.freeThrowsMade + s.freeThrowsMade,
      freeThrowsAttempted: acc.freeThrowsAttempted + s.freeThrowsAttempted,
      reboundsOffensive: acc.reboundsOffensive + s.reboundsOffensive,
      reboundsDefensive: acc.reboundsDefensive + s.reboundsDefensive,
      assists: acc.assists + s.assists,
      steals: acc.steals + s.steals,
      blocks: acc.blocks + s.blocks,
      turnovers: acc.turnovers + s.turnovers,
      fouls: acc.fouls + s.fouls,
    }),
    { pts: 0, twoPtMade: 0, twoPtAttempted: 0, threePtMade: 0, threePtAttempted: 0, freeThrowsMade: 0, freeThrowsAttempted: 0, reboundsOffensive: 0, reboundsDefensive: 0, assists: 0, steals: 0, blocks: 0, turnovers: 0, fouls: 0 }
  )

  const totalsArr = [
    '-', totals.twoPtMade, totals.twoPtAttempted,
    totals.threePtMade, totals.threePtAttempted,
    totals.freeThrowsMade, totals.freeThrowsAttempted,
    totals.reboundsOffensive, totals.reboundsDefensive,
    totals.assists, totals.steals, totals.blocks,
    totals.turnovers, totals.fouls,
  ]

  return (
    <div className="overflow-x-auto rounded-2xl border border-[var(--border)]">
      <table className="w-full text-xs" style={{ borderCollapse: 'collapse', minWidth: 700 }}>
        <thead>
          <tr style={{ background: '#145530', color: 'white' }}>
            <th className="px-3 py-2 text-left font-black uppercase tracking-wide text-[9px] sticky left-0" style={{ background: '#145530', minWidth: 40 }}>#</th>
            <th className="px-3 py-2 text-left font-black uppercase tracking-wide text-[9px] sticky left-10" style={{ background: '#145530', minWidth: 140 }}>Atleta</th>
            <th className="px-2 py-2 text-center font-black text-[9px]" style={{ background: '#0f3d22' }}>PTS</th>
            {STAT_COLS.map(c => (
              <th key={c.key} title={c.title} className="px-1 py-2 text-center font-black uppercase text-[9px]">{c.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {players.map((p, i) => {
            const s = stats.find(st => st.athleteId === p.athlete.id)
            if (!s) return null
            const pts = calcPts(s)
            return (
              <tr key={p.athlete.id} style={i % 2 === 1 ? { background: '#f9fafb' } : {}}>
                <td className="px-3 py-1 text-center font-black text-[var(--verde)]">
                  {p.jerseyNumber ?? p.athlete.jerseyNumber ?? '–'}
                </td>
                <td className="px-3 py-1 font-bold text-[var(--black)] whitespace-nowrap">
                  {p.athlete.name}
                  {p.athlete.position && (
                    <span className="ml-1 text-[9px] text-[var(--gray)] font-normal">{p.athlete.position}</span>
                  )}
                </td>
                <td className="px-2 py-1 text-center font-black text-[var(--verde)] text-sm">{pts}</td>
                {STAT_COLS.map(c => (
                  <td key={c.key} className="px-1 py-1 text-center">
                    <input
                      type="number" min={0} max={999}
                      value={(s[c.key] as number) ?? 0}
                      onChange={e => onUpdate(p.athlete.id, c.key, n(Number(e.target.value)))}
                      className={statNumCls}
                    />
                  </td>
                ))}
              </tr>
            )
          })}
        </tbody>
        <tfoot>
          <tr style={{ background: '#e8f4ed', fontWeight: 700 }}>
            <td className="px-3 py-2 text-center text-[9px] font-black text-[var(--gray)]">—</td>
            <td className="px-3 py-2 text-[11px] font-black text-[var(--verde)] uppercase">TOTAIS</td>
            <td className="px-2 py-2 text-center font-black text-[var(--verde)]">{totals.pts}</td>
            {totalsArr.map((v, i) => (
              <td key={i} className="px-1 py-2 text-center font-bold text-[var(--black)]">{v}</td>
            ))}
          </tr>
        </tfoot>
      </table>
    </div>
  )
}

// ──────────────────────────────────────────────────────────────
// Main component
// ──────────────────────────────────────────────────────────────

export default function MesaClient({ game }: { game: MesaGameData }) {
  const router = useRouter()
  const formRef = useRef<HTMLFormElement>(null)
  const [pendingInfo, startInfoTransition] = useTransition()
  const [pendingStats, startStatsTransition] = useTransition()
  const [pendingFinalize, startFinalizeTransition] = useTransition()
  const [savedInfo, setSavedInfo] = useState(false)
  const [savedStats, setSavedStats] = useState(false)
  const [isFinished, setIsFinished] = useState(game.status === 'FINISHED')
  const [tab, setTab] = useState<'info' | 'stats'>('info')

  const hubUrl = `/admin/championships/${game.championshipId}/jogos/${game.id}`

  // ── Game info state ──────────────────────────────────────────
  const initPeriods = (): Record<string, PeriodRow> => {
    const r: Record<string, PeriodRow> = {}
    for (let i = 1; i <= 6; i++) {
      const ps = game.periodScores.find(p => p.period === i)
      r[`q${i}`] = { home: ps?.homePoints ?? 0, away: ps?.awayPoints ?? 0 }
    }
    return r
  }
  const [periods, setPeriods] = useState(initPeriods)
  const [homeScore, setHomeScore] = useState(game.homeScore ?? 0)
  const [awayScore, setAwayScore] = useState(game.awayScore ?? 0)

  const homeTotal = Object.values(periods).reduce((s, p) => s + p.home, 0)
  const awayTotal = Object.values(periods).reduce((s, p) => s + p.away, 0)

  // ── Stats state ──────────────────────────────────────────────
  const homeRoster = game.rosters.find(r => r.teamId === game.homeTeamId)
  const awayRoster = game.rosters.find(r => r.teamId === game.awayTeamId)

  const [homeStats, setHomeStats] = useState<StatLine[]>(() =>
    initStats(game.homeTeamId, homeRoster?.players ?? [], game.playerStatLines)
  )
  const [awayStats, setAwayStats] = useState<StatLine[]>(() =>
    initStats(game.awayTeamId, awayRoster?.players ?? [], game.playerStatLines)
  )

  function updateStat(side: 'home' | 'away', athleteId: string, field: keyof StatLine, value: number) {
    const setter = side === 'home' ? setHomeStats : setAwayStats
    setter(prev => prev.map(s => s.athleteId === athleteId ? { ...s, [field]: value } : s))
  }

  // ── Helpers ──────────────────────────────────────────────────
  function getOfficialName(key: string) {
    const type = OFFICIAL_TYPE_MAP[key]
    return game.officials.find(o => o.officialType === type)?.name ?? ''
  }

  // ── Submit handlers ──────────────────────────────────────────
  function handleInfoSubmit(e: React.FormEvent) {
    e.preventDefault()
    const fd = new FormData(formRef.current!)
    fd.set('homeScore', String(homeScore))
    fd.set('awayScore', String(awayScore))
    for (let i = 1; i <= 6; i++) {
      fd.set(`q${i}Home`, String(periods[`q${i}`]?.home ?? 0))
      fd.set(`q${i}Away`, String(periods[`q${i}`]?.away ?? 0))
    }
    startInfoTransition(async () => {
      await saveSumulaData(fd)
      setSavedInfo(true)
      setTimeout(() => setSavedInfo(false), 4000)
    })
  }

  function handleStatsSave() {
    const all = [...homeStats, ...awayStats]
    startStatsTransition(async () => {
      await savePlayerStats(game.id, all)
      setSavedStats(true)
      setTimeout(() => setSavedStats(false), 4000)
    })
  }

  function handleFinalize() {
    if (!confirm('Encerrar o jogo? O status será marcado como Finalizado e a classificação será atualizada.')) return
    startFinalizeTransition(async () => {
      await finalizeGame(game.id)
      setIsFinished(true)
      router.push(hubUrl)
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
            {gameDate.toLocaleDateString('pt-BR', {
              weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
            })}
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

      {/* Tabs */}
      <div className="flex gap-2 border-b border-[var(--border)] pb-0">
        {(
          [
            { id: 'info',  label: 'Dados do Jogo',  icon: ClipboardList },
            { id: 'stats', label: 'Estatísticas',   icon: BarChart2 },
          ] as const
        ).map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-[10px] font-black uppercase tracking-widest transition-colors border-b-2 -mb-px"
            style={
              tab === id
                ? { borderColor: 'var(--verde)', color: 'var(--verde)' }
                : { borderColor: 'transparent', color: 'var(--gray)' }
            }
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* ── TAB: DADOS DO JOGO ── */}
      {tab === 'info' && (
        <form ref={formRef} onSubmit={handleInfoSubmit} className="space-y-5">
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
                <tbody>
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
                                  [p.key]: { ...prev[p.key], [side]: n(Number(e.target.value)) },
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
                onChange={e => setHomeScore(n(Number(e.target.value)))}
                className="h-14 w-20 rounded-xl border-2 border-[var(--verde)] bg-white px-2 text-center text-3xl font-black focus:outline-none"
              />
              <span className="text-2xl font-black text-[var(--gray)]">×</span>
              <input
                type="number" min={0} max={999}
                value={awayScore}
                onChange={e => setAwayScore(n(Number(e.target.value)))}
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
                  { side: 'home', name: game.homeTeam.name, roster: homeRoster, coachKey: 'homeCoach', asstKey: 'homeAsstCoach' },
                  { side: 'away', name: game.awayTeam.name, roster: awayRoster, coachKey: 'awayCoach', asstKey: 'awayAsstCoach' },
                ] as const
              ).map(({ side, name, roster, coachKey, asstKey }) => (
                <div key={side} className="space-y-3">
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[var(--verde)]">
                    {name} <span className="text-[var(--gray)]">({side === 'home' ? 'Mandante' : 'Visitante'})</span>
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

          {/* Save info */}
          <div className="flex items-center justify-end gap-3">
            {savedInfo && (
              <span className="flex items-center gap-2 text-sm font-black text-[var(--verde)]">
                <CheckCircle2 className="h-4 w-4" /> Dados salvos!
              </span>
            )}
            <Link
              href={`/sumula/${game.id}`} target="_blank"
              className="inline-flex h-11 items-center gap-2 rounded-xl border border-[var(--border)] bg-white px-5 text-[10px] font-black uppercase text-[var(--gray)] hover:border-[var(--verde)] hover:text-[var(--verde)] transition-colors"
            >
              <ExternalLink className="h-4 w-4" />
              Ver / Imprimir Súmula
            </Link>
            <button
              type="submit" disabled={pendingInfo}
              className="fgb-btn-primary inline-flex h-11 items-center gap-2 rounded-xl px-6 text-[10px] font-black uppercase disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              {pendingInfo ? 'Salvando...' : 'Salvar Dados'}
            </button>
          </div>
        </form>
      )}

      {/* ── Status banner if already finished ── */}
      {isFinished && (
        <div className="rounded-[20px] bg-[var(--verde)]/8 border border-[var(--verde)]/30 px-5 py-3 flex flex-wrap items-center gap-3">
          <CheckCircle2 className="h-4 w-4 text-[var(--verde)] shrink-0" />
          <span className="text-sm font-black text-[var(--verde)]">Jogo Finalizado</span>
          <span className="text-[11px] text-[var(--gray)]">Você ainda pode editar os dados e salvar novamente.</span>
        </div>
      )}

      {/* ── TAB: ESTATÍSTICAS ── */}
      {tab === 'stats' && (
        <div className="space-y-6">
          <div className="rounded-[20px] border border-[var(--yellow)]/40 bg-[var(--yellow)]/8 px-5 py-3 text-sm text-[var(--black)]">
            Insira os pontos por arremesso (2PM/A, 3PM/A, LLM/A) — o total de pontos é calculado automaticamente. Se o jogo já passou pela tela de Stats, os valores estão pré-carregados.
          </div>

          {/* Home team stats */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="h-3 w-3 rounded-full bg-[var(--verde)]" />
              <h2 className="fgb-display text-xl text-[var(--black)]">{game.homeTeam.name}</h2>
              <span className="text-[10px] font-black uppercase text-[var(--gray)]">Mandante</span>
            </div>
            <StatsTable
              teamName={game.homeTeam.name}
              players={homeRoster?.players ?? []}
              stats={homeStats}
              onUpdate={(id, field, val) => updateStat('home', id, field, val)}
            />
          </div>

          {/* Away team stats */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="h-3 w-3 rounded-full bg-[var(--red)]" />
              <h2 className="fgb-display text-xl text-[var(--black)]">{game.awayTeam.name}</h2>
              <span className="text-[10px] font-black uppercase text-[var(--gray)]">Visitante</span>
            </div>
            <StatsTable
              teamName={game.awayTeam.name}
              players={awayRoster?.players ?? []}
              stats={awayStats}
              onUpdate={(id, field, val) => updateStat('away', id, field, val)}
            />
          </div>

          {/* Save stats */}
          <div className="flex items-center justify-end gap-3">
            {savedStats && (
              <span className="flex items-center gap-2 text-sm font-black text-[var(--verde)]">
                <CheckCircle2 className="h-4 w-4" /> Estatísticas salvas!
              </span>
            )}
            <Link
              href={`/sumula/${game.id}`} target="_blank"
              className="inline-flex h-11 items-center gap-2 rounded-xl border border-[var(--border)] bg-white px-5 text-[10px] font-black uppercase text-[var(--gray)] hover:border-[var(--verde)] hover:text-[var(--verde)] transition-colors"
            >
              <ExternalLink className="h-4 w-4" />
              Ver Súmula
            </Link>
            <button
              type="button"
              onClick={handleStatsSave}
              disabled={pendingStats}
              className="fgb-btn-primary inline-flex h-11 items-center gap-2 rounded-xl px-6 text-[10px] font-black uppercase disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              {pendingStats ? 'Salvando...' : 'Salvar Estatísticas'}
            </button>
          </div>
        </div>
      )}

      {/* ── Encerrar Jogo ── */}
      {isFinished ? (
        <div className="rounded-[24px] border border-[var(--verde)]/40 bg-[var(--verde)]/6 p-5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-[var(--verde)] shrink-0" />
            <div>
              <p className="text-sm font-black text-[var(--verde)]">Jogo Encerrado</p>
              <p className="text-[11px] text-[var(--gray)] mt-0.5">Súmula disponível para compartilhamento.</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Link
              href={hubUrl}
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-[var(--border)] px-4 text-[10px] font-black uppercase text-[var(--gray)] hover:border-[var(--verde)] hover:text-[var(--verde)] transition-colors"
            >
              ← Voltar
            </Link>
            <Link
              href={`/sumula/${game.id}`}
              target="_blank"
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-[var(--verde)] px-4 text-[10px] font-black uppercase text-white hover:opacity-90 transition-opacity"
            >
              <ExternalLink className="h-3.5 w-3.5" /> Ver Súmula
            </Link>
          </div>
        </div>
      ) : (
        <div className="rounded-[24px] border border-[var(--border)] bg-white p-5 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-black text-[var(--black)]">Encerrar Jogo</p>
            <p className="text-[11px] text-[var(--gray)] mt-0.5">
              Após confirmar todos os dados e estatísticas, finalize o jogo para atualizar a classificação.
            </p>
          </div>
          <button
            type="button"
            onClick={handleFinalize}
            disabled={pendingFinalize}
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-[var(--black)] px-5 text-[10px] font-black uppercase text-white hover:opacity-80 transition-opacity disabled:opacity-50"
          >
            {pendingFinalize
              ? <><Loader2 className="h-4 w-4 animate-spin" /> Encerrando...</>
              : <><FlagTriangleRight className="h-4 w-4" /> Encerrar Jogo</>
            }
          </button>
        </div>
      )}
    </div>
  )
}
