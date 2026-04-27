'use client'

import { useGameData, type PublicLeader } from './game-data-provider'

function LeaderCard({ title, leader }: { title: string; leader: PublicLeader }) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-white p-4">
      <p className="text-[10px] font-black uppercase tracking-widest text-[var(--gray)]">{title}</p>
      {leader ? (
        <div className="mt-2">
          <p className="text-2xl font-black text-[var(--black)]">{leader.value}</p>
          <p className="mt-0.5 text-sm font-semibold text-[var(--black)] leading-tight">
            {leader.athleteName}
          </p>
          <p className="text-xs text-[var(--gray)]">{leader.teamName}</p>
        </div>
      ) : (
        <p className="mt-2 text-sm text-[var(--gray)]">—</p>
      )}
    </div>
  )
}

function StatRow({ label, home, away }: { label: string; home: number; away: number }) {
  const total = home + away
  const homePct = total > 0 ? (home / total) * 100 : 50
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="w-8 text-right font-semibold text-[var(--black)]">{home}</span>
        <span className="flex-1 text-center text-[10px] font-black uppercase tracking-widest text-[var(--gray)]">
          {label}
        </span>
        <span className="w-8 text-left font-semibold text-[var(--black)]">{away}</span>
      </div>
      <div className="flex h-1.5 overflow-hidden rounded-full bg-[var(--gray-l)]">
        <div
          className="h-full rounded-full bg-[var(--verde)] transition-all duration-500"
          style={{ width: `${homePct}%` }}
        />
      </div>
    </div>
  )
}

export function GameOverviewContent() {
  const { data, isLoading, error, updatedAt } = useGameData()

  if (isLoading && !data) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-40 rounded-2xl bg-[var(--gray-l)]" />
        <div className="h-40 rounded-2xl bg-[var(--gray-l)]" />
      </div>
    )
  }

  if (error && !data) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        {error}
      </div>
    )
  }

  if (!data) return null

  const { leaders, recentEvents, teamSummary, game } = data

  const scheduledDate = game.scheduledAt
    ? new Date(game.scheduledAt).toLocaleDateString('pt-BR', {
        weekday: 'long',
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      })
    : null

  return (
    <div className="space-y-6">
      {/* Leaders */}
      <div className="fgb-card p-6">
        <h2 className="fgb-display text-2xl text-[var(--black)]">Líderes do jogo</h2>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <LeaderCard title="Pontos" leader={leaders.points} />
          <LeaderCard title="Assistências" leader={leaders.assists} />
          <LeaderCard title="Rebotes" leader={leaders.rebounds} />
          <LeaderCard title="Roubos" leader={leaders.steals} />
          <LeaderCard title="Tocos" leader={leaders.blocks} />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Stats comparison */}
        <div className="fgb-card p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="fgb-display text-2xl text-[var(--black)]">Estatísticas</h2>
          </div>
          <div className="mb-2 flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-[var(--gray)]">
            <span>{data.homeTeam.shortName || data.homeTeam.name}</span>
            <span>{data.awayTeam.shortName || data.awayTeam.name}</span>
          </div>
          <div className="space-y-3">
            <StatRow label="Pontos" home={teamSummary.home.points} away={teamSummary.away.points} />
            <StatRow label="Rebotes" home={teamSummary.home.rebounds} away={teamSummary.away.rebounds} />
            <StatRow label="Assistências" home={teamSummary.home.assists} away={teamSummary.away.assists} />
            <StatRow label="Roubos" home={teamSummary.home.steals} away={teamSummary.away.steals} />
            <StatRow label="Tocos" home={teamSummary.home.blocks} away={teamSummary.away.blocks} />
            <StatRow label="Turnovers" home={teamSummary.home.turnovers} away={teamSummary.away.turnovers} />
            <StatRow label="Faltas" home={teamSummary.home.fouls} away={teamSummary.away.fouls} />
          </div>
        </div>

        {/* Recent events */}
        <div className="fgb-card p-6">
          <h2 className="fgb-display text-2xl text-[var(--black)]">Últimos eventos</h2>
          <div className="mt-4 max-h-[400px] space-y-2 overflow-auto pr-1">
            {recentEvents.length === 0 ? (
              <div className="rounded-xl border border-dashed border-[var(--border)] p-4 text-sm text-[var(--gray)]">
                Nenhum evento publicado ainda.
              </div>
            ) : (
              recentEvents.map((event, i) => (
                <div
                  key={`${event.occurredAt}-${i}`}
                  className={`rounded-xl border border-[var(--border)] px-4 py-3 ${
                    event.pointsDelta > 0 ? 'bg-[var(--verde)]/5' : 'bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className={`text-sm ${event.pointsDelta > 0 ? 'font-semibold text-[var(--black)]' : 'text-[var(--black)]'}`}>
                      {event.description}
                    </p>
                    <span className="shrink-0 text-[10px] font-semibold text-[var(--gray)]">
                      {event.period ? `Q${event.period > 4 ? `OT${event.period - 4}` : event.period}` : '—'}
                      {event.clockTime ? ` ${event.clockTime}` : ''}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Game info strip */}
      {!game.isLive && scheduledDate && (
        <div className="fgb-card p-5">
          <p className="text-[10px] font-black uppercase tracking-widest text-[var(--gray)]">
            Informações da partida
          </p>
          <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-sm text-[var(--black)]">
            {scheduledDate && <span>{scheduledDate}</span>}
            {game.venue && <span>{game.venue}</span>}
          </div>
        </div>
      )}

      {updatedAt && (
        <p className="text-center text-[10px] text-[var(--gray)]">
          Atualizado às {new Date(updatedAt).toLocaleTimeString('pt-BR')}
        </p>
      )}
    </div>
  )
}
