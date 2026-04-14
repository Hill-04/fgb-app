'use client'

import { useState, useMemo } from 'react'
import { BarChart3, Calendar, Shield, Users, Trophy, MapPin } from 'lucide-react'
import { Brackets } from '@/components/Brackets'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

// ── Types ────────────────────────────────────────────────────────────────────

type TeamBase = {
  name: string
  city: string | null
  logoUrl: string | null
}

type StandingRow = {
  id: string
  played: number
  wins: number
  losses: number
  points: number
  pointsFor: number
  pointsAgainst: number
  diff: number
  team: TeamBase
}

type GameItem = {
  id: string
  phase: number
  round: number | null
  dateTime: string
  location: string
  city: string
  status: string
  homeScore: number | null
  awayScore: number | null
  homeTeam: { name: string; logoUrl: string | null }
  awayTeam: { name: string; logoUrl: string | null }
  mainReferee: string | null
  categoryName: string
}

type CategoryData = {
  id: string
  name: string
  standings: StandingRow[]
  games: GameItem[]
}

export type ChampionshipData = {
  name: string
  year: number
  status: string
  sex: string
  format: string
  startDate: string | null
  endDate: string | null
  hasPlayoffs: boolean
  description: string | null
  categories: CategoryData[]
  registrations: Array<{ team: TeamBase }>
  totalGames: number
  totalTeams: number
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatDateShort(iso: string) {
  try {
    return format(new Date(iso), "dd MMM · HH'h'mm", { locale: ptBR })
  } catch {
    return '—'
  }
}

function formatDateFull(iso: string) {
  try {
    return format(new Date(iso), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
  } catch {
    return '—'
  }
}

function getRoundLabel(phase: number, round: number | null): string {
  if (phase === 1) return round != null ? `Rodada ${round}` : 'Fase de Grupos'
  const map: Record<number, string> = { 1: 'Quartas de Final', 2: 'Semifinais', 3: 'Final' }
  return map[round ?? 0] ?? `Playoff — Fase ${phase}`
}

const FORMAT_LABELS: Record<string, string> = {
  todos_contra_todos: 'Todos Contra Todos',
  copa: 'Copa',
  misto: 'Misto',
}

// ── Sub-components ────────────────────────────────────────────────────────────

function TeamAvatar({ name, logoUrl, size = 7 }: { name: string; logoUrl?: string | null; size?: number }) {
  const cls = `w-${size} h-${size} rounded-lg bg-[var(--gray-l)] border border-[var(--border)] flex items-center justify-center overflow-hidden flex-shrink-0`
  return (
    <div className={cls}>
      {logoUrl ? (
        <img src={logoUrl} alt={name} className="w-full h-full object-contain p-0.5" />
      ) : (
        <Users className="w-3.5 h-3.5 text-[var(--gray)]" />
      )}
    </div>
  )
}

function CategoryPills({
  categories,
  activeCatId,
  onChange,
}: {
  categories: CategoryData[]
  activeCatId: string
  onChange: (id: string) => void
}) {
  if (categories.length <= 1) return null
  return (
    <div className="flex gap-2 mb-6 flex-wrap">
      {categories.map((cat) => (
        <button
          key={cat.id}
          onClick={() => onChange(cat.id)}
          className={`fgb-badge cursor-pointer transition-colors ${
            activeCatId === cat.id ? 'fgb-badge-verde' : 'fgb-badge-outline hover:border-[var(--verde)] hover:text-[var(--verde)]'
          }`}
        >
          {cat.name}
        </button>
      ))}
    </div>
  )
}

function StandingsTable({ standings }: { standings: StandingRow[] }) {
  if (standings.length === 0) {
    return (
      <p className="text-[var(--gray)] text-sm py-8 text-center fgb-label" style={{ textTransform: 'none', letterSpacing: 0 }}>
        Classificação ainda não disponível.
      </p>
    )
  }
  return (
    <div className="bg-white border border-[var(--border)] rounded overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-[var(--gray-l)] border-b border-[var(--border)]">
              <th className="px-4 py-3 fgb-label text-[10px] text-[var(--gray)]">Pos</th>
              <th className="px-4 py-3 fgb-label text-[10px] text-[var(--gray)]">Equipe</th>
              <th className="px-3 py-3 fgb-label text-[10px] text-[var(--gray)] text-center hidden sm:table-cell">J</th>
              <th className="px-3 py-3 fgb-label text-[10px] text-[var(--verde)] text-center">V</th>
              <th className="px-3 py-3 fgb-label text-[10px] text-[var(--red)] text-center">D</th>
              <th className="px-3 py-3 fgb-label text-[10px] text-[var(--gray)] text-center hidden md:table-cell">PF</th>
              <th className="px-3 py-3 fgb-label text-[10px] text-[var(--gray)] text-center hidden md:table-cell">PC</th>
              <th className="px-3 py-3 fgb-label text-[10px] text-[var(--gray)] text-center hidden sm:table-cell">SD</th>
              <th className="px-3 py-3 fgb-label text-[10px] text-[var(--black)] text-center">Pts</th>
            </tr>
          </thead>
          <tbody>
            {standings.map((s, i) => (
              <tr
                key={s.id}
                className={`border-b border-[var(--border)] last:border-0 hover:bg-[var(--verde-light)] transition-colors ${
                  i === 0 ? 'bg-[var(--yellow-light)]' : ''
                }`}
              >
                <td className={`px-4 py-3 fgb-display text-[14px] ${i === 0 ? 'text-[var(--orange)]' : 'text-[var(--gray)]'}`}>
                  {i + 1}º
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <TeamAvatar name={s.team.name} logoUrl={s.team.logoUrl} size={6} />
                    <div>
                      <p className="fgb-display text-[13px] text-[var(--black)]">{s.team.name}</p>
                      {s.team.city && (
                        <p className="fgb-label text-[10px] text-[var(--gray)]" style={{ textTransform: 'none', letterSpacing: 0 }}>
                          {s.team.city}
                        </p>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-3 py-3 text-center fgb-display text-[13px] text-[var(--gray)] hidden sm:table-cell">{s.played}</td>
                <td className="px-3 py-3 text-center fgb-display text-[13px] text-[var(--verde)]">{s.wins}</td>
                <td className="px-3 py-3 text-center fgb-display text-[13px] text-[var(--red)]">{s.losses}</td>
                <td className="px-3 py-3 text-center fgb-display text-[13px] text-[var(--gray)] hidden md:table-cell">{s.pointsFor}</td>
                <td className="px-3 py-3 text-center fgb-display text-[13px] text-[var(--gray)] hidden md:table-cell">{s.pointsAgainst}</td>
                <td className={`px-3 py-3 text-center fgb-display text-[13px] hidden sm:table-cell ${s.diff >= 0 ? 'text-[var(--verde)]' : 'text-[var(--red)]'}`}>
                  {s.diff > 0 ? `+${s.diff}` : s.diff}
                </td>
                <td className="px-3 py-3 text-center fgb-display text-[16px] font-black text-[var(--black)]">{s.points}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Legend */}
      <div className="px-4 py-2 bg-[var(--gray-l)] border-t border-[var(--border)] flex gap-4 flex-wrap">
        {[
          { label: 'J', desc: 'Jogos' },
          { label: 'V', desc: 'Vitórias' },
          { label: 'D', desc: 'Derrotas' },
          { label: 'PF', desc: 'Pontos Feitos' },
          { label: 'PC', desc: 'Pontos Cedidos' },
          { label: 'SD', desc: 'Saldo' },
          { label: 'Pts', desc: 'Pontos na Tabela' },
        ].map(({ label, desc }) => (
          <span key={label} className="fgb-label text-[9px] text-[var(--gray)]">
            <strong className="text-[var(--black)]">{label}</strong> = {desc}
          </span>
        ))}
      </div>
    </div>
  )
}

function GameRow({ game, last }: { game: GameItem; last: boolean }) {
  const isFinished = game.status === 'FINISHED'
  const isLive = game.status === 'ONGOING'
  const homeWin = isFinished && (game.homeScore ?? 0) > (game.awayScore ?? 0)
  const awayWin = isFinished && (game.awayScore ?? 0) > (game.homeScore ?? 0)

  return (
    <div className={`px-4 py-3 flex items-center gap-3 ${!last ? 'border-b border-[var(--border)]' : ''} hover:bg-[var(--gray-l)] transition-colors`}>
      {/* Date column */}
      <div className="w-20 flex-shrink-0 text-right hidden sm:block">
        <p className="fgb-label text-[10px] text-[var(--verde)]" style={{ textTransform: 'none', letterSpacing: 0 }}>
          {formatDateShort(game.dateTime)}
        </p>
        {game.city && (
          <p className="fgb-label text-[9px] text-[var(--gray)] mt-0.5 flex items-center justify-end gap-0.5" style={{ textTransform: 'none', letterSpacing: 0 }}>
            <MapPin className="w-2.5 h-2.5" />
            {game.city}
          </p>
        )}
      </div>

      {/* Teams + Score */}
      <div className="flex-1 min-w-0 flex items-center gap-2 justify-center">
        <span className={`fgb-display text-[13px] flex-1 text-right truncate ${homeWin ? 'text-[var(--black)]' : 'text-[var(--gray)]'}`}>
          {game.homeTeam.name}
        </span>

        {isFinished || isLive ? (
          <div
            className={`flex items-center gap-1.5 flex-shrink-0 px-3 py-1 rounded ${
              isLive ? 'bg-[var(--red)] text-white' : 'bg-[var(--black2)] text-white'
            }`}
          >
            <span className={`fgb-display text-[15px] font-black ${homeWin ? 'text-white' : 'text-[rgba(255,255,255,0.5)]'}`}>
              {game.homeScore ?? 0}
            </span>
            <span className="fgb-label text-[9px] text-[rgba(255,255,255,0.25)]">–</span>
            <span className={`fgb-display text-[15px] font-black ${awayWin ? 'text-white' : 'text-[rgba(255,255,255,0.5)]'}`}>
              {game.awayScore ?? 0}
            </span>
          </div>
        ) : (
          <div className="flex-shrink-0 px-3">
            <span className="fgb-label text-[10px] text-[var(--gray)]">VS</span>
          </div>
        )}

        <span className={`fgb-display text-[13px] flex-1 truncate ${awayWin ? 'text-[var(--black)]' : 'text-[var(--gray)]'}`}>
          {game.awayTeam.name}
        </span>
      </div>

      {/* Status + Referee */}
      <div className="flex-shrink-0 text-right min-w-[60px] hidden sm:block">
        {isLive ? (
          <span className="fgb-badge fgb-badge-red fgb-badge-live text-[9px]">Ao Vivo</span>
        ) : isFinished ? (
          <span className="fgb-badge fgb-badge-outline text-[9px] bg-[var(--gray-l)]">Enc.</span>
        ) : (
          <span className="fgb-badge fgb-badge-outline text-[9px]">Agendado</span>
        )}
        {game.mainReferee && (
          <p className="fgb-label text-[9px] text-[var(--gray)] mt-1" style={{ textTransform: 'none', letterSpacing: 0 }}>
            {game.mainReferee}
          </p>
        )}
      </div>
    </div>
  )
}

function GamesByRound({ games }: { games: GameItem[] }) {
  const grouped = useMemo(() => {
    const map = new Map<string, GameItem[]>()
    for (const g of games) {
      const key = `${g.phase}-${g.round ?? 0}`
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(g)
    }
    return Array.from(map.entries())
      .sort(([a], [b]) => {
        const [ap, ar] = a.split('-').map(Number)
        const [bp, br] = b.split('-').map(Number)
        return ap !== bp ? ap - bp : ar - br
      })
      .map(([key, items]) => {
        const [phase, round] = key.split('-').map(Number)
        return { label: getRoundLabel(phase, round), games: items }
      })
  }, [games])

  if (grouped.length === 0) {
    return (
      <p className="text-[var(--gray)] text-sm py-8 text-center fgb-label" style={{ textTransform: 'none', letterSpacing: 0 }}>
        Nenhum jogo registrado ainda.
      </p>
    )
  }

  return (
    <div className="space-y-8">
      {grouped.map(({ label, games }) => (
        <div key={label}>
          <div className="flex items-center gap-3 mb-3">
            <div className="fgb-accent fgb-accent-verde" style={{ marginBottom: 0 }} />
            <h3 className="fgb-display text-[14px] font-black uppercase tracking-wide text-[var(--black)]">
              {label}
            </h3>
            <span className="fgb-label text-[10px] text-[var(--gray)]">
              {games.length} jogo{games.length !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="bg-white border border-[var(--border)] rounded overflow-hidden shadow-sm">
            {games.map((game, idx) => (
              <GameRow key={game.id} game={game} last={idx === games.length - 1} />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Tab Content Components ────────────────────────────────────────────────────

function TabOverview({ championship }: { championship: ChampionshipData }) {
  const allGames = championship.categories.flatMap((c) => c.games)
  const upcoming = allGames
    .filter((g) => g.status === 'SCHEDULED')
    .sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime())
    .slice(0, 6)
  const recent = allGames
    .filter((g) => g.status === 'FINISHED')
    .sort((a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime())
    .slice(0, 6)

  return (
    <div className="space-y-14">
      {/* Championship info cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Modalidade', value: FORMAT_LABELS[championship.format] ?? championship.format },
          { label: 'Início', value: championship.startDate ? formatDateFull(championship.startDate) : '—' },
          { label: 'Término', value: championship.endDate ? formatDateFull(championship.endDate) : '—' },
          { label: 'Playoffs', value: championship.hasPlayoffs ? 'Sim' : 'Não' },
        ].map((item) => (
          <div key={item.label} className="bg-white border border-[var(--border)] rounded p-4 shadow-sm">
            <p className="fgb-label text-[9px] text-[var(--gray)] mb-1">{item.label}</p>
            <p className="fgb-display text-[14px] text-[var(--black)] font-black">{item.value}</p>
          </div>
        ))}
      </div>

      {championship.description && (
        <p className="text-[var(--gray)] text-sm leading-relaxed" style={{ fontFamily: 'var(--font-body)' }}>
          {championship.description}
        </p>
      )}

      {/* Compact standings for first category */}
      {championship.categories[0]?.standings.length > 0 && (
        <section>
          <div className="fgb-section-header">
            <div>
              <div className="fgb-accent fgb-accent-verde" />
              <h2 className="fgb-section-title">
                Liderança — <span className="verde">{championship.categories[0].name}</span>
              </h2>
            </div>
          </div>
          <div className="bg-white border border-[var(--border)] rounded overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-[var(--gray-l)] border-b border-[var(--border)]">
                    <th className="px-4 py-3 fgb-label text-[10px] text-[var(--gray)]">Pos</th>
                    <th className="px-4 py-3 fgb-label text-[10px] text-[var(--gray)]">Equipe</th>
                    <th className="px-3 py-3 fgb-label text-[10px] text-[var(--verde)] text-center">V</th>
                    <th className="px-3 py-3 fgb-label text-[10px] text-[var(--red)] text-center">D</th>
                    <th className="px-3 py-3 fgb-label text-[10px] text-[var(--black)] text-center">Pts</th>
                  </tr>
                </thead>
                <tbody>
                  {championship.categories[0].standings.slice(0, 5).map((s, i) => (
                    <tr key={s.id} className={`border-b border-[var(--border)] last:border-0 ${i === 0 ? 'bg-[var(--yellow-light)]' : 'hover:bg-[var(--verde-light)] transition-colors'}`}>
                      <td className={`px-4 py-3 fgb-display text-[14px] ${i === 0 ? 'text-[var(--orange)]' : 'text-[var(--gray)]'}`}>{i + 1}º</td>
                      <td className="px-4 py-3 fgb-display text-[13px] text-[var(--black)]">{s.team.name}</td>
                      <td className="px-3 py-3 text-center fgb-display text-[13px] text-[var(--verde)]">{s.wins}</td>
                      <td className="px-3 py-3 text-center fgb-display text-[13px] text-[var(--red)]">{s.losses}</td>
                      <td className="px-3 py-3 text-center fgb-display text-[16px] font-black text-[var(--black)]">{s.points}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {/* Recent results */}
      {recent.length > 0 && (
        <section>
          <div className="fgb-section-header">
            <div>
              <div className="fgb-accent fgb-accent-red" />
              <h2 className="fgb-section-title">Últimos <span className="red">Resultados</span></h2>
            </div>
          </div>
          <div className="bg-white border border-[var(--border)] rounded overflow-hidden shadow-sm">
            {recent.map((game, idx) => (
              <GameRow key={game.id} game={game} last={idx === recent.length - 1} />
            ))}
          </div>
        </section>
      )}

      {/* Upcoming games */}
      {upcoming.length > 0 && (
        <section>
          <div className="fgb-section-header">
            <div>
              <div className="fgb-accent fgb-accent-yellow" />
              <h2 className="fgb-section-title">Próximos <span className="yellow">Jogos</span></h2>
            </div>
          </div>
          <div className="bg-white border border-[var(--border)] rounded overflow-hidden shadow-sm">
            {upcoming.map((game, idx) => (
              <GameRow key={game.id} game={game} last={idx === upcoming.length - 1} />
            ))}
          </div>
        </section>
      )}

      {upcoming.length === 0 && recent.length === 0 && (
        <div className="text-center py-16 border border-dashed border-[var(--border)] rounded">
          <Trophy className="w-10 h-10 text-[var(--gray)] mx-auto mb-3 opacity-40" />
          <p className="fgb-label text-[11px] text-[var(--gray)]">Nenhum jogo registrado ainda.</p>
        </div>
      )}
    </div>
  )
}

function TabStandings({ categories }: { categories: CategoryData[] }) {
  const [activeCatId, setActiveCatId] = useState(categories[0]?.id ?? '')
  const active = categories.find((c) => c.id === activeCatId) ?? categories[0]

  return (
    <div>
      <CategoryPills categories={categories} activeCatId={activeCatId} onChange={setActiveCatId} />
      {active && <StandingsTable standings={active.standings} />}
    </div>
  )
}

function TabGames({ categories }: { categories: CategoryData[] }) {
  const [activeCatId, setActiveCatId] = useState(categories[0]?.id ?? '')
  const active = categories.find((c) => c.id === activeCatId) ?? categories[0]

  // Only regular phase (phase === 1)
  const regularGames = useMemo(
    () => (active?.games ?? []).filter((g) => g.phase === 1),
    [active]
  )

  return (
    <div>
      <CategoryPills categories={categories} activeCatId={activeCatId} onChange={setActiveCatId} />
      <GamesByRound games={regularGames} />
    </div>
  )
}

function TabTeams({
  registrations,
  categories,
}: {
  registrations: Array<{ team: TeamBase }>
  categories: CategoryData[]
}) {
  // Aggregate standings across all categories per team name
  const statsMap = useMemo(() => {
    const map = new Map<string, { played: number; wins: number; losses: number; pointsFor: number; pointsAgainst: number }>()
    for (const cat of (categories ?? [])) {
      for (const s of cat.standings) {
        const key = s.team.name
        const prev = map.get(key) ?? { played: 0, wins: 0, losses: 0, pointsFor: 0, pointsAgainst: 0 }
        map.set(key, {
          played:        prev.played        + s.played,
          wins:          prev.wins          + s.wins,
          losses:        prev.losses        + s.losses,
          pointsFor:     prev.pointsFor     + s.pointsFor,
          pointsAgainst: prev.pointsAgainst + s.pointsAgainst,
        })
      }
    }
    return map
  }, [categories])

  if (registrations.length === 0) {
    return (
      <div className="text-center py-16 border border-dashed border-[var(--border)] rounded">
        <Users className="w-10 h-10 text-[var(--gray)] mx-auto mb-3 opacity-40" />
        <p className="fgb-label text-[11px] text-[var(--gray)]">Nenhuma equipe confirmada ainda.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
      {registrations.map((reg, i) => {
        const stats = statsMap.get(reg.team.name)
        const ppg = stats && stats.played > 0 ? (stats.pointsFor / stats.played).toFixed(1) : null
        const pcg = stats && stats.played > 0 ? (stats.pointsAgainst / stats.played).toFixed(1) : null
        const winPct = stats && stats.played > 0
          ? Math.round((stats.wins / stats.played) * 100)
          : null

        return (
          <div
            key={i}
            className="bg-white border border-[var(--border)] rounded p-4 shadow-sm flex flex-col items-center text-center gap-3 hover:shadow-md transition-shadow"
          >
            <TeamAvatar name={reg.team.name} logoUrl={reg.team.logoUrl} size={12} />
            <div className="w-full">
              <p className="fgb-display text-[13px] text-[var(--black)] font-black leading-tight">
                {reg.team.name}
              </p>
              {reg.team.city && (
                <p className="fgb-label text-[10px] text-[var(--gray)] mt-0.5 flex items-center justify-center gap-1" style={{ textTransform: 'none', letterSpacing: 0 }}>
                  <MapPin className="w-2.5 h-2.5" />
                  {reg.team.city}
                </p>
              )}
            </div>

            {stats && stats.played > 0 && (
              <div className="w-full border-t border-[var(--border)] pt-3 grid grid-cols-3 gap-1">
                <div className="flex flex-col items-center">
                  <span className="fgb-display text-[15px] font-black text-[var(--verde)]">{winPct}%</span>
                  <span className="fgb-label text-[8px] text-[var(--gray)]" style={{ letterSpacing: 1 }}>V%</span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="fgb-display text-[15px] font-black text-[var(--black)]">{ppg}</span>
                  <span className="fgb-label text-[8px] text-[var(--gray)]" style={{ letterSpacing: 1 }}>PPJ</span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="fgb-display text-[15px] font-black text-[var(--gray)]">{pcg}</span>
                  <span className="fgb-label text-[8px] text-[var(--gray)]" style={{ letterSpacing: 1 }}>PCJ</span>
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

function TabPlayoffs({ categories }: { categories: CategoryData[] }) {
  const playoffGames = useMemo(
    () => categories.flatMap((c) => c.games.filter((g) => g.phase > 1)),
    [categories]
  )
  return (
    <div>
      <Brackets games={playoffGames as any} />
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────

const TABS = [
  { id: 'overview',  label: 'Visão Geral',   icon: Trophy },
  { id: 'standings', label: 'Classificação', icon: BarChart3 },
  { id: 'games',     label: 'Jogos',         icon: Calendar },
  { id: 'teams',     label: 'Times',         icon: Users },
]

export function CampeonatoTabs({ championship }: { championship: ChampionshipData }) {
  const [activeTab, setActiveTab] = useState('overview')

  const hasPlayoffs = useMemo(
    () => championship.hasPlayoffs && championship.categories.some((c) => c.games.some((g) => g.phase > 1)),
    [championship]
  )

  const tabs = hasPlayoffs
    ? [...TABS, { id: 'playoffs', label: 'Playoffs', icon: Shield }]
    : TABS

  return (
    <div>
      {/* ── Tab Bar ─────────────────────────────────────────────── */}
      <div
        className="sticky top-0 z-10 bg-white border-b border-[var(--border)] shadow-sm mb-10 -mx-4 sm:-mx-6 px-4 sm:px-6"
        style={{ top: '0' }}
      >
        <div className="flex gap-1 overflow-x-auto no-scrollbar" style={{ scrollbarWidth: 'none' }}>
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-1.5 px-4 py-3.5 border-b-2 transition-all whitespace-nowrap fgb-label text-[11px] flex-shrink-0 ${
                activeTab === id
                  ? 'border-[var(--verde)] text-[var(--verde)]'
                  : 'border-transparent text-[var(--gray)] hover:text-[var(--black)]'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Tab Content ─────────────────────────────────────────── */}
      {activeTab === 'overview'  && <TabOverview championship={championship} />}
      {activeTab === 'standings' && <TabStandings categories={championship.categories} />}
      {activeTab === 'games'     && <TabGames categories={championship.categories} />}
      {activeTab === 'teams'     && <TabTeams registrations={championship.registrations} categories={championship.categories} />}
      {activeTab === 'playoffs'  && hasPlayoffs && <TabPlayoffs categories={championship.categories} />}
    </div>
  )
}
