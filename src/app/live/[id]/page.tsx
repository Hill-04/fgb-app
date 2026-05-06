'use client'

import { useEffect, useRef, useState } from 'react'
import { useParams } from 'next/navigation'
import { Activity, BarChart2, BookOpen, CalendarDays, ChevronRight, MapPin, Target, Trophy, Users2 } from 'lucide-react'
import { ShotChart } from '@/components/ShotChart'

// ── Types ──────────────────────────────────────────────────────────────────────

type Snapshot = ReturnType<typeof emptySnapshot>

type PlayerLine = {
  athleteId: string
  name: string
  jerseyNumber: number | null
  teamId: string
  teamName: string
  isStarter: boolean
  points: number
  rebounds: number
  reboundsOffensive: number
  reboundsDefensive: number
  assists: number
  fouls: number
  steals: number
  blocks: number
  turnovers: number
  fgMade: number
  fgAttempted: number
  threeMade: number
  threeAttempted: number
  ftMade: number
  ftAttempted: number
  plusMinus: number | null
}

type PlayEvent = {
  id: string
  period: number
  clockTime: string
  eventType: string
  description: string | null
  teamName: string | null
  teamId: string | null
  athleteName: string | null
  pointsDelta: number
  occurredAt: string
}

type Shot = {
  x: number
  y: number
  made: boolean
  isThree: boolean
  teamId: string | null
  athleteName: string | null
  period: number
  clockTime: string
}

type Leader = { athleteName: string; teamName: string; value: number } | null

function emptySnapshot() {
  return {
    game: {
      id: '',
      status: 'SCHEDULED' as string,
      isLive: false,
      isFinished: false,
      scheduledAt: null as string | null,
      venue: null as string | null,
      currentPeriod: null as number | null,
      clockDisplay: null as string | null,
      homeTimeoutsUsed: 0,
      awayTimeoutsUsed: 0,
      homeTeamFoulsCurrentPeriod: 0,
      awayTeamFoulsCurrentPeriod: 0,
      championship: { name: null as string | null, year: null as number | null },
      category: null as string | null,
    },
    homeTeam: { id: '', name: '', shortName: '', logoUrl: null as string | null, score: 0 },
    awayTeam: { id: '', name: '', shortName: '', logoUrl: null as string | null, score: 0 },
    leaders: {
      points: null as Leader,
      assists: null as Leader,
      rebounds: null as Leader,
      steals: null as Leader,
      blocks: null as Leader,
    },
    recentEvents: [] as PlayEvent[],
    playByPlay: [] as PlayEvent[],
    shots: [] as Shot[],
    periodScores: [] as Array<{ period: number; home: number; away: number }>,
    teamSummary: {
      home: { teamId: '', teamName: '', points: 0, rebounds: 0, assists: 0, fouls: 0, turnovers: 0, steals: 0, blocks: 0 },
      away: { teamId: '', teamName: '', points: 0, rebounds: 0, assists: 0, fouls: 0, turnovers: 0, steals: 0, blocks: 0 },
    },
    boxScore: { homePlayers: [] as PlayerLine[], awayPlayers: [] as PlayerLine[] },
    summary: { totalEvents: 0, lastEventAt: null as string | null, currentPeriod: null as number | null },
  }
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function pct(made: number, attempted: number) {
  if (!attempted) return '—'
  return `${Math.round((made / attempted) * 100)}%`
}

function periodLabel(p: number) {
  if (p <= 4) return `P${p}`
  return `P${p - 4} (PE)`
}

const SCORE_EVENTS = new Set(['SHOT_MADE_2', 'SHOT_MADE_3', 'FREE_THROW_MADE'])

function eventBulletColor(eventType: string, teamId: string | null, homeTeamId: string) {
  if (teamId === homeTeamId) return 'bg-[var(--verde)]'
  if (teamId) return 'bg-[#3052a5]'
  return 'bg-[var(--gray)]'
}

// ── Tabs config ────────────────────────────────────────────────────────────────

type TabId = 'summary' | 'boxscore' | 'leaders' | 'playbyplay' | 'shotchart' | 'stats' | 'preview'

const TABS: Array<{ id: TabId; label: string; icon: React.ElementType }> = [
  { id: 'summary', label: 'Resumo', icon: Trophy },
  { id: 'boxscore', label: 'Box Score', icon: Users2 },
  { id: 'leaders', label: 'Líderes', icon: Activity },
  { id: 'playbyplay', label: 'Lance a Lance', icon: BookOpen },
  { id: 'shotchart', label: 'Mapa de Arremessos', icon: Target },
  { id: 'stats', label: 'Estatísticas', icon: BarChart2 },
  { id: 'preview', label: 'Prévia', icon: CalendarDays },
]

// ── Main component ─────────────────────────────────────────────────────────────

export default function MatchCentrePage() {
  const params = useParams<{ id: string }>()
  const gameId = Array.isArray(params?.id) ? params.id[0] : params?.id || ''

  const [data, setData] = useState<Snapshot>(emptySnapshot())
  const [connected, setConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<TabId>('summary')
  const esRef = useRef<EventSource | null>(null)

  useEffect(() => {
    if (!gameId) return

    const connect = () => {
      const es = new EventSource(`/api/live/${gameId}/stream`)
      esRef.current = es

      es.onopen = () => { setConnected(true); setError(null) }

      es.onmessage = (e) => {
        try {
          const payload = JSON.parse(e.data)
          if (payload?.error) { setError(payload.error); return }
          setData(payload as Snapshot)
          setConnected(true)
        } catch { /* ignore parse error */ }
      }

      es.onerror = () => {
        setConnected(false)
        es.close()
        // Reconnect after 5s
        setTimeout(connect, 5000)
      }
    }

    connect()
    return () => { esRef.current?.close() }
  }, [gameId])

  if (!gameId) {
    return <div className="p-8 text-sm text-[var(--red)]">ID de jogo inválido.</div>
  }

  const { game, homeTeam, awayTeam } = data

  return (
    <div className="min-h-screen bg-[var(--gray-l)]">
      {/* ── Scoreboard Header ── */}
      <div className="bg-[var(--black)] text-white">
        <div className="mx-auto max-w-6xl px-4 py-6 md:py-8">
          {/* Championship label */}
          {game.championship.name && (
            <p className="mb-3 text-center text-[10px] font-black uppercase tracking-[0.25em] text-white/50">
              {game.championship.name} {game.championship.year} {game.category ? `· ${game.category}` : ''}
            </p>
          )}

          {/* Score row */}
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4">
            {/* Home */}
            <div className="text-right">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50 mb-1">Casa</p>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-black uppercase leading-tight">{homeTeam.name}</h1>
            </div>

            {/* Score */}
            <div className="text-center min-w-[140px]">
              <div className="flex items-center justify-center gap-3">
                <span className="text-5xl sm:text-6xl md:text-7xl font-black text-[var(--verde)] tabular-nums">
                  {homeTeam.score}
                </span>
                <span className="text-3xl font-black text-white/30">×</span>
                <span className="text-5xl sm:text-6xl md:text-7xl font-black text-[var(--verde)] tabular-nums">
                  {awayTeam.score}
                </span>
              </div>

              {/* Status pill */}
              <div className="mt-2 flex items-center justify-center gap-2">
                {game.isLive && (
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--verde)] opacity-70" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--verde)]" />
                  </span>
                )}
                <span className="text-[10px] font-black uppercase tracking-[0.25em] text-[var(--yellow)]">
                  {game.isLive
                    ? `${game.currentPeriod ? `P${game.currentPeriod}` : 'AO VIVO'}${game.clockDisplay ? ` · ${game.clockDisplay}` : ''}`
                    : game.isFinished
                    ? 'Encerrado'
                    : 'Aguardando'}
                </span>
              </div>
            </div>

            {/* Away */}
            <div className="text-left">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50 mb-1">Visitante</p>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-black uppercase leading-tight">{awayTeam.name}</h2>
            </div>
          </div>

          {/* Quarter scores */}
          {data.periodScores.length > 0 && (
            <div className="mt-5 overflow-x-auto">
              <table className="mx-auto text-center text-[10px] font-black uppercase tracking-widest">
                <thead>
                  <tr className="text-white/40">
                    <th className="px-3 py-1 text-left">Time</th>
                    {data.periodScores.map((p) => (
                      <th key={p.period} className="px-3 py-1">{periodLabel(p.period)}</th>
                    ))}
                    <th className="px-3 py-1 text-[var(--yellow)]">Total</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="px-3 py-1 text-left text-white/70">{homeTeam.shortName}</td>
                    {data.periodScores.map((p) => (
                      <td key={p.period} className="px-3 py-1 text-white">{p.home}</td>
                    ))}
                    <td className="px-3 py-1 font-black text-[var(--verde)]">{homeTeam.score}</td>
                  </tr>
                  <tr>
                    <td className="px-3 py-1 text-left text-white/70">{awayTeam.shortName}</td>
                    {data.periodScores.map((p) => (
                      <td key={p.period} className="px-3 py-1 text-white">{p.away}</td>
                    ))}
                    <td className="px-3 py-1 font-black text-[var(--verde)]">{awayTeam.score}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ── Tabs ── */}
        <div className="border-t border-white/10 overflow-x-auto no-scrollbar">
          <div className="flex min-w-max mx-auto max-w-6xl px-4">
            {TABS.map((tab) => {
              const Icon = tab.icon
              const active = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 whitespace-nowrap border-b-2 px-4 py-3 text-[9px] font-black uppercase tracking-[0.18em] transition-all ${
                    active
                      ? 'border-[var(--yellow)] text-[var(--yellow)]'
                      : 'border-transparent text-white/50 hover:text-white/80'
                  }`}
                >
                  <Icon className="h-3 w-3" />
                  {tab.label}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── Tab Content ── */}
      <div className="mx-auto max-w-6xl px-4 py-6 space-y-5">
        {/* Connection indicator */}
        {!connected && !error && (
          <div className="fgb-card p-3 text-center text-[10px] font-black uppercase tracking-widest text-[var(--gray)]">
            Conectando ao live...
          </div>
        )}
        {error && (
          <div className="fgb-card p-3 text-center text-[10px] font-black uppercase tracking-widest text-[var(--red)]">
            {error}
          </div>
        )}

        {/* ── SUMMARY ── */}
        {activeTab === 'summary' && (
          <div className="space-y-5">
            {/* Live indicators */}
            {game.isLive && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: 'Período', value: game.currentPeriod ? `${game.currentPeriod}º` : '—' },
                  { label: 'Clock', value: game.clockDisplay || '—' },
                  { label: 'Faltas Casa', value: game.homeTeamFoulsCurrentPeriod },
                  { label: 'Faltas Visit.', value: game.awayTeamFoulsCurrentPeriod },
                ].map((item) => (
                  <div key={item.label} className="fgb-card p-3 text-center">
                    <p className="fgb-label text-[var(--gray)]" style={{ fontSize: 9 }}>{item.label}</p>
                    <p className="text-2xl font-black text-[var(--black)]">{item.value}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Leaders strip */}
            <div className="fgb-card p-5">
              <p className="fgb-label text-[var(--gray)] mb-3" style={{ fontSize: 9 }}>Destaques do Jogo</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                {(
                  [
                    ['PTS', data.leaders.points],
                    ['REB', data.leaders.rebounds],
                    ['AST', data.leaders.assists],
                    ['STL', data.leaders.steals],
                    ['BLK', data.leaders.blocks],
                  ] as [string, Leader][]
                ).map(([label, leader]) => (
                  <div key={label} className="rounded-2xl border border-[var(--border)] bg-[var(--gray-l)] p-3 text-center">
                    <p className="fgb-label text-[var(--verde)] mb-1" style={{ fontSize: 9 }}>{label}</p>
                    {leader ? (
                      <>
                        <p className="text-2xl font-black text-[var(--black)]">{leader.value}</p>
                        <p className="text-[10px] text-[var(--gray)] truncate">{leader.athleteName}</p>
                        <p className="text-[9px] text-[var(--gray)] truncate opacity-60">{leader.teamName}</p>
                      </>
                    ) : (
                      <p className="text-[var(--gray)] text-sm">—</p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Recent events */}
            <div className="fgb-card p-5">
              <p className="fgb-label text-[var(--gray)] mb-3" style={{ fontSize: 9 }}>Últimos Lances</p>
              {data.recentEvents.length === 0 ? (
                <p className="text-sm text-[var(--gray)] text-center py-4">Nenhum evento registrado ainda.</p>
              ) : (
                <div className="space-y-2">
                  {data.recentEvents.slice(0, 8).map((ev) => (
                    <div key={ev.id} className="flex items-center gap-3">
                      <span
                        className={`h-2 w-2 flex-shrink-0 rounded-full ${eventBulletColor(ev.eventType, ev.teamId, homeTeam.id)}`}
                      />
                      <span className="text-[10px] font-black text-[var(--gray)] w-16 flex-shrink-0">
                        P{ev.period} {ev.clockTime}
                      </span>
                      <span className="text-sm text-[var(--black)] flex-1">{ev.description || ev.eventType}</span>
                      {SCORE_EVENTS.has(ev.eventType) && ev.pointsDelta > 0 && (
                        <span className="text-[10px] font-black text-[var(--verde)] flex-shrink-0">+{ev.pointsDelta}</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── BOX SCORE ── */}
        {activeTab === 'boxscore' && (
          <div className="space-y-5">
            {[
              { team: homeTeam, players: data.boxScore.homePlayers },
              { team: awayTeam, players: data.boxScore.awayPlayers },
            ].map(({ team, players }) => (
              <div key={team.id} className="fgb-card overflow-hidden">
                <div className="px-5 py-3 border-b border-[var(--border)] bg-[var(--gray-l)]">
                  <p className="fgb-label text-[var(--black)]" style={{ fontSize: 10 }}>{team.name}</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-[11px]">
                    <thead>
                      <tr className="border-b border-[var(--border)] text-left text-[var(--gray)]">
                        <th className="px-4 py-2 font-black uppercase tracking-widest text-[9px] w-8">#</th>
                        <th className="px-4 py-2 font-black uppercase tracking-widest text-[9px]">Jogador</th>
                        <th className="px-3 py-2 font-black uppercase tracking-widest text-[9px] text-center">PTS</th>
                        <th className="px-3 py-2 font-black uppercase tracking-widest text-[9px] text-center">REB</th>
                        <th className="px-3 py-2 font-black uppercase tracking-widest text-[9px] text-center">AST</th>
                        <th className="px-3 py-2 font-black uppercase tracking-widest text-[9px] text-center">STL</th>
                        <th className="px-3 py-2 font-black uppercase tracking-widest text-[9px] text-center">BLK</th>
                        <th className="px-3 py-2 font-black uppercase tracking-widest text-[9px] text-center">TO</th>
                        <th className="px-3 py-2 font-black uppercase tracking-widest text-[9px] text-center">F</th>
                        <th className="px-3 py-2 font-black uppercase tracking-widest text-[9px] text-center">FG</th>
                        <th className="px-3 py-2 font-black uppercase tracking-widest text-[9px] text-center">3P</th>
                        <th className="px-3 py-2 font-black uppercase tracking-widest text-[9px] text-center">LL</th>
                        <th className="px-3 py-2 font-black uppercase tracking-widest text-[9px] text-center">+/-</th>
                      </tr>
                    </thead>
                    <tbody>
                      {players.length === 0 ? (
                        <tr>
                          <td colSpan={13} className="px-4 py-6 text-center text-[var(--gray)] text-xs">
                            Sem estatísticas disponíveis.
                          </td>
                        </tr>
                      ) : (
                        players.map((p) => (
                          <tr
                            key={p.athleteId}
                            className={`border-b border-[var(--border)] transition-colors hover:bg-[var(--gray-l)] ${p.isStarter ? '' : 'opacity-75'}`}
                          >
                            <td className="px-4 py-2 text-[var(--gray)] tabular-nums">{p.jerseyNumber ?? '—'}</td>
                            <td className="px-4 py-2 font-semibold text-[var(--black)] whitespace-nowrap">
                              {p.name}
                              {p.isStarter && (
                                <span className="ml-1 text-[8px] font-black text-[var(--verde)]">T</span>
                              )}
                            </td>
                            <td className="px-3 py-2 text-center font-black text-[var(--black)]">{p.points}</td>
                            <td className="px-3 py-2 text-center text-[var(--gray)]">{p.rebounds}</td>
                            <td className="px-3 py-2 text-center text-[var(--gray)]">{p.assists}</td>
                            <td className="px-3 py-2 text-center text-[var(--gray)]">{p.steals}</td>
                            <td className="px-3 py-2 text-center text-[var(--gray)]">{p.blocks}</td>
                            <td className="px-3 py-2 text-center text-[var(--gray)]">{p.turnovers}</td>
                            <td className="px-3 py-2 text-center text-[var(--gray)]">{p.fouls}</td>
                            <td className="px-3 py-2 text-center text-[var(--gray)] tabular-nums">
                              {p.fgMade}/{p.fgAttempted}
                              <span className="ml-1 text-[9px] opacity-60">{pct(p.fgMade, p.fgAttempted)}</span>
                            </td>
                            <td className="px-3 py-2 text-center text-[var(--gray)] tabular-nums">
                              {p.threeMade}/{p.threeAttempted}
                              <span className="ml-1 text-[9px] opacity-60">{pct(p.threeMade, p.threeAttempted)}</span>
                            </td>
                            <td className="px-3 py-2 text-center text-[var(--gray)] tabular-nums">
                              {p.ftMade}/{p.ftAttempted}
                              <span className="ml-1 text-[9px] opacity-60">{pct(p.ftMade, p.ftAttempted)}</span>
                            </td>
                            <td className={`px-3 py-2 text-center font-bold tabular-nums ${
                              p.plusMinus == null ? 'text-[var(--gray)]'
                              : p.plusMinus > 0 ? 'text-[var(--verde)]'
                              : p.plusMinus < 0 ? 'text-[var(--red)]'
                              : 'text-[var(--gray)]'
                            }`}>
                              {p.plusMinus != null ? (p.plusMinus > 0 ? `+${p.plusMinus}` : p.plusMinus) : '—'}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── LEADERS ── */}
        {activeTab === 'leaders' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {(
              [
                { stat: 'points' as const, label: 'Pontos', key: 'PTS' },
                { stat: 'rebounds' as const, label: 'Rebotes', key: 'REB' },
                { stat: 'assists' as const, label: 'Assistências', key: 'AST' },
                { stat: 'steals' as const, label: 'Roubos de Bola', key: 'STL' },
                { stat: 'blocks' as const, label: 'Bloqueios', key: 'BLK' },
              ]
            ).map(({ stat, label, key }) => {
              const allPlayers = [...data.boxScore.homePlayers, ...data.boxScore.awayPlayers]
              const sorted = [...allPlayers]
                .filter((p) => (p[stat] as number) > 0)
                .sort((a, b) => (b[stat] as number) - (a[stat] as number))
                .slice(0, 5)

              return (
                <div key={stat} className="fgb-card overflow-hidden">
                  <div className="px-5 py-3 border-b border-[var(--border)] bg-[var(--gray-l)] flex items-center justify-between">
                    <p className="fgb-label text-[var(--black)]" style={{ fontSize: 10 }}>{label}</p>
                    <span className="fgb-label text-[var(--verde)]" style={{ fontSize: 9 }}>{key}</span>
                  </div>
                  <div className="divide-y divide-[var(--border)]">
                    {sorted.length === 0 ? (
                      <div className="px-5 py-6 text-center text-sm text-[var(--gray)]">—</div>
                    ) : sorted.map((p, idx) => (
                      <div key={p.athleteId} className="flex items-center gap-3 px-5 py-3">
                        <span className={`text-lg font-black w-6 text-center ${idx === 0 ? 'text-[var(--yellow)]' : 'text-[var(--gray)]'}`}>
                          {idx + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-[var(--black)] truncate">{p.name}</p>
                          <p className="text-[9px] font-black uppercase tracking-widest text-[var(--gray)] truncate">{p.teamName}</p>
                        </div>
                        <span className={`text-2xl font-black ${idx === 0 ? 'text-[var(--verde)]' : 'text-[var(--black)]'}`}>
                          {p[stat] as number}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* ── PLAY BY PLAY ── */}
        {activeTab === 'playbyplay' && (
          <div className="fgb-card overflow-hidden">
            {data.playByPlay.length === 0 ? (
              <div className="p-12 text-center text-sm text-[var(--gray)]">Nenhum lance registrado.</div>
            ) : (
              <div>
                {(() => {
                  const periods = [...new Set(data.playByPlay.map((e) => e.period))].sort((a, b) => b - a)
                  return periods.map((period) => {
                    const periodEvents = data.playByPlay.filter((e) => e.period === period)
                    return (
                      <div key={period}>
                        <div className="sticky top-0 bg-[var(--gray-l)] border-b border-[var(--border)] px-5 py-2 z-10">
                          <p className="fgb-label text-[var(--gray)]" style={{ fontSize: 9 }}>
                            {period <= 4 ? `${period}º Período` : `Prorrogação ${period - 4}`}
                          </p>
                        </div>
                        <div className="divide-y divide-[var(--border)]">
                          {periodEvents.map((ev) => (
                            <div key={ev.id} className="flex items-center gap-3 px-5 py-3 hover:bg-[var(--gray-l)] transition-colors">
                              <span className="text-[10px] font-black text-[var(--gray)] w-14 flex-shrink-0 tabular-nums">
                                {ev.clockTime}
                              </span>
                              <span
                                className={`h-2 w-2 flex-shrink-0 rounded-full ${eventBulletColor(ev.eventType, ev.teamId, homeTeam.id)}`}
                              />
                              <span className="text-[10px] font-black uppercase tracking-widest text-[var(--gray)] w-24 flex-shrink-0 truncate">
                                {ev.teamName || ''}
                              </span>
                              <span className="text-sm text-[var(--black)] flex-1">{ev.description || ev.eventType}</span>
                              {SCORE_EVENTS.has(ev.eventType) && ev.pointsDelta > 0 && (
                                <ChevronRight className="h-3 w-3 text-[var(--verde)] flex-shrink-0" />
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })
                })()}
              </div>
            )}
          </div>
        )}

        {/* ── SHOT CHART ── */}
        {activeTab === 'shotchart' && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-3">
              <div className="fgb-card p-3 text-center">
                <p className="fgb-label text-[var(--verde)] mb-1" style={{ fontSize: 9 }}>{homeTeam.shortName}</p>
                <p className="text-lg font-black text-[var(--black)]">
                  {data.shots.filter((s) => s.teamId === homeTeam.id && s.made).length}
                  <span className="text-[var(--gray)] font-normal">/{data.shots.filter((s) => s.teamId === homeTeam.id).length}</span>
                </p>
              </div>
              <div className="fgb-card p-3 text-center">
                <p className="fgb-label text-[#3052a5] mb-1" style={{ fontSize: 9 }}>{awayTeam.shortName}</p>
                <p className="text-lg font-black text-[var(--black)]">
                  {data.shots.filter((s) => s.teamId === awayTeam.id && s.made).length}
                  <span className="text-[var(--gray)] font-normal">/{data.shots.filter((s) => s.teamId === awayTeam.id).length}</span>
                </p>
              </div>
            </div>

            <div className="fgb-card p-5">
              {data.shots.length === 0 ? (
                <p className="text-center text-sm text-[var(--gray)] py-8">
                  Nenhum arremesso com coordenadas registrado.
                  <br />
                  <span className="text-[10px] opacity-60">Disponível via integração FIBA LiveStats.</span>
                </p>
              ) : (
                <ShotChart
                  shots={data.shots}
                  homeTeamId={homeTeam.id}
                  awayTeamId={awayTeam.id}
                  homeColor="var(--verde)"
                  awayColor="#3052a5"
                />
              )}
            </div>
          </div>
        )}

        {/* ── STATISTICS ── */}
        {activeTab === 'stats' && (
          <div className="fgb-card overflow-hidden">
            <div className="px-5 py-3 border-b border-[var(--border)] bg-[var(--gray-l)]">
              <p className="fgb-label text-[var(--black)]" style={{ fontSize: 10 }}>Estatísticas de Equipe</p>
            </div>
            {(() => {
              const { home, away } = data.teamSummary
              const rows: Array<{ label: string; homeVal: number; awayVal: number; higherIsBetter?: boolean }> = [
                { label: 'Pontos', homeVal: home.points, awayVal: away.points },
                { label: 'Rebotes', homeVal: home.rebounds, awayVal: away.rebounds },
                { label: 'Assistências', homeVal: home.assists, awayVal: away.assists },
                { label: 'Roubos de Bola', homeVal: home.steals, awayVal: away.steals },
                { label: 'Bloqueios', homeVal: home.blocks, awayVal: away.blocks },
                { label: 'Perdas de Posse', homeVal: home.turnovers, awayVal: away.turnovers, higherIsBetter: false },
                { label: 'Faltas', homeVal: home.fouls, awayVal: away.fouls, higherIsBetter: false },
              ]
              return (
                <div className="divide-y divide-[var(--border)]">
                  {rows.map(({ label, homeVal, awayVal, higherIsBetter = true }) => {
                    const total = homeVal + awayVal || 1
                    const homeW = (homeVal / total) * 100
                    const awayW = (awayVal / total) * 100
                    const homeBetter = higherIsBetter ? homeVal > awayVal : homeVal < awayVal
                    const awayBetter = higherIsBetter ? awayVal > homeVal : awayVal < homeVal
                    return (
                      <div key={label} className="px-5 py-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className={`text-lg font-black ${homeBetter ? 'text-[var(--verde)]' : 'text-[var(--black)]'}`}>{homeVal}</span>
                          <span className="text-[10px] font-black uppercase tracking-widest text-[var(--gray)]">{label}</span>
                          <span className={`text-lg font-black ${awayBetter ? 'text-[#3052a5]' : 'text-[var(--black)]'}`}>{awayVal}</span>
                        </div>
                        <div className="flex h-2 overflow-hidden rounded-full bg-[var(--border)]">
                          <div className="h-full rounded-l-full bg-[var(--verde)] transition-all" style={{ width: `${homeW}%` }} />
                          <div className="h-full rounded-r-full bg-[#3052a5] transition-all" style={{ width: `${awayW}%` }} />
                        </div>
                        <div className="flex justify-between mt-1">
                          <span className="text-[9px] font-black uppercase tracking-widest text-[var(--gray)]">{homeTeam.shortName}</span>
                          <span className="text-[9px] font-black uppercase tracking-widest text-[var(--gray)]">{awayTeam.shortName}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )
            })()}
          </div>
        )}

        {/* ── PREVIEW ── */}
        {activeTab === 'preview' && (
          <div className="space-y-5">
            <div className="fgb-card p-5 space-y-4">
              {game.championship.name && (
                <div className="flex items-center gap-3">
                  <Trophy className="h-4 w-4 text-[var(--yellow-dark)] flex-shrink-0" />
                  <div>
                    <p className="fgb-label text-[var(--gray)]" style={{ fontSize: 9 }}>Campeonato</p>
                    <p className="text-sm font-semibold text-[var(--black)]">
                      {game.championship.name} {game.championship.year}
                      {game.category ? ` · ${game.category}` : ''}
                    </p>
                  </div>
                </div>
              )}

              {game.venue && (
                <div className="flex items-center gap-3">
                  <MapPin className="h-4 w-4 text-[var(--verde)] flex-shrink-0" />
                  <div>
                    <p className="fgb-label text-[var(--gray)]" style={{ fontSize: 9 }}>Local</p>
                    <p className="text-sm font-semibold text-[var(--black)]">{game.venue}</p>
                  </div>
                </div>
              )}

              {game.scheduledAt && (
                <div className="flex items-center gap-3">
                  <CalendarDays className="h-4 w-4 text-[var(--verde)] flex-shrink-0" />
                  <div>
                    <p className="fgb-label text-[var(--gray)]" style={{ fontSize: 9 }}>Data e Hora</p>
                    <p className="text-sm font-semibold text-[var(--black)]">
                      {new Date(game.scheduledAt).toLocaleString('pt-BR', {
                        weekday: 'long', day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-5">
              {[
                { team: homeTeam, label: 'Casa', color: 'text-[var(--verde)]' },
                { team: awayTeam, label: 'Visitante', color: 'text-[#3052a5]' },
              ].map(({ team, label, color }) => (
                <div key={team.id} className="fgb-card p-5">
                  <p className={`fgb-label ${color} mb-2`} style={{ fontSize: 9 }}>{label}</p>
                  <h3 className="fgb-display text-xl text-[var(--black)]">{team.name}</h3>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
