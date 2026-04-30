'use client'

import { useGameData, type PublicLeader, type PublicLeadTrackerSegment, type PublicKeyMomentValue } from './game-data-provider'

function teamAccent(team: PublicKeyMomentValue['team']): string {
  if (team === 'home') return 'text-[var(--verde)]'
  if (team === 'away') return 'text-[#CC1016]'
  return 'text-[var(--gray)]'
}

function LeaderCard({ title, leader }: { title: string; leader: PublicLeader }) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-white p-4">
      <p className="text-[10px] font-black uppercase tracking-widest text-[var(--gray)]">{title}</p>
      {leader ? (
        <div className="mt-2">
          <p className="text-2xl font-black text-[var(--black)]">{leader.value}</p>
          <p className="mt-0.5 text-sm font-semibold leading-tight text-[var(--black)]">
            {leader.athleteName}
          </p>
          <p className="text-xs text-[var(--gray)]">{leader.teamName}</p>
        </div>
      ) : (
        <p className="mt-2 text-sm text-[var(--gray)]">--</p>
      )}
    </div>
  )
}

function KeyMomentCard({
  title,
  value,
  subtitle,
  accent = 'text-[var(--black)]',
  isEmpty = false,
}: {
  title: string
  value: string
  subtitle: string
  accent?: string
  isEmpty?: boolean
}) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-white p-4">
      <p className="text-[10px] font-black uppercase tracking-widest text-[var(--gray)]">{title}</p>
      <p className={`mt-2 text-3xl font-black ${isEmpty ? 'text-[var(--gray)]' : accent}`}>
        {isEmpty ? '—' : value}
      </p>
      <p className="mt-1 text-xs text-[var(--gray)]">{subtitle}</p>
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

function segmentTone(team: PublicLeadTrackerSegment['team']) {
  if (team === 'home') return 'bg-[var(--verde)]'
  if (team === 'away') return 'bg-[#CC1016]'
  return 'bg-[var(--gray)]/35'
}

function LeadTracker({
  segments,
  homeLabel,
  awayLabel,
}: {
  segments: PublicLeadTrackerSegment[]
  homeLabel: string
  awayLabel: string
}) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-white p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-[var(--gray)]">
            Lead tracker
          </p>
          <h3 className="mt-1 text-lg font-black text-[var(--black)]">Controle da lideranca</h3>
        </div>
        <div className="flex flex-wrap items-center gap-4 text-[10px] font-black uppercase tracking-widest text-[var(--gray)]">
          <span className="inline-flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-[var(--verde)]" />
            {homeLabel}
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-[#CC1016]" />
            {awayLabel}
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-[var(--gray)]/35" />
            Empate
          </span>
        </div>
      </div>

      {segments.length === 1 && segments[0].team === 'tie' ? (
        <div className="mt-4 rounded-xl border border-dashed border-[var(--border)] px-4 py-3 text-center text-xs text-[var(--gray)]">
          Jogo sem lideranca definida ainda
        </div>
      ) : (
        <div className="mt-4 overflow-hidden rounded-full border border-[var(--border)] bg-[var(--gray-l)]">
          <div className="flex h-5 w-full">
            {segments.map((segment, index) => (
              <div
                key={`${segment.team}-${index}`}
                className={`${segmentTone(segment.team)} h-full`}
                style={{ width: `${segment.widthPct}%`, minWidth: segment.widthPct > 0 ? '2px' : undefined }}
                title={`${segment.team === 'home' ? homeLabel : segment.team === 'away' ? awayLabel : 'Empate'} ${segment.widthPct.toFixed(1)}%`}
              />
            ))}
          </div>
        </div>
      )}
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

  const { leaders, recentEvents, teamSummary, game, analytics } = data
  const { keyMoments, leadTracker } = analytics

  const scheduledDate = game.scheduledAt
    ? new Date(game.scheduledAt).toLocaleDateString('pt-BR', {
        weekday: 'long',
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      })
    : null

  const homeLabel = data.homeTeam.shortName || data.homeTeam.name
  const awayLabel = data.awayTeam.shortName || data.awayTeam.name

  return (
    <div className="space-y-6">
      <div className="fgb-card p-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-[var(--gray)]">
              Visao geral
            </p>
            <h2 className="fgb-display text-2xl text-[var(--black)]">Momentos-chave</h2>
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <KeyMomentCard
            title="Maior vantagem"
            value={String(keyMoments.largestLead.value)}
            subtitle={keyMoments.largestLead.label}
            accent={teamAccent(keyMoments.largestLead.team)}
            isEmpty={keyMoments.largestLead.value === 0}
          />
          <KeyMomentCard
            title="Maior sequencia"
            value={String(keyMoments.largestRun.value)}
            subtitle={keyMoments.largestRun.label}
            accent={teamAccent(keyMoments.largestRun.team)}
            isEmpty={keyMoments.largestRun.value === 0}
          />
          <KeyMomentCard
            title="Viradas"
            value={String(keyMoments.leadChanges)}
            subtitle="Trocas reais de lideranca"
            accent="text-[#CC1016]"
            isEmpty={false}
          />
          <KeyMomentCard
            title="Empates"
            value={String(keyMoments.ties)}
            subtitle="Momentos com o placar igualado"
            isEmpty={false}
          />
        </div>

        <div className="mt-5">
          <LeadTracker segments={leadTracker} homeLabel={homeLabel} awayLabel={awayLabel} />
        </div>
      </div>

      <div className="fgb-card p-6">
        <h2 className="fgb-display text-2xl text-[var(--black)]">Lideres do jogo</h2>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <LeaderCard title="Pontos" leader={leaders.points} />
          <LeaderCard title="Assistencias" leader={leaders.assists} />
          <LeaderCard title="Rebotes" leader={leaders.rebounds} />
          <LeaderCard title="Roubos" leader={leaders.steals} />
          <LeaderCard title="Tocos" leader={leaders.blocks} />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="fgb-card p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="fgb-display text-2xl text-[var(--black)]">Estatisticas</h2>
          </div>
          <div className="mb-2 flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-[var(--gray)]">
            <span>{homeLabel}</span>
            <span>{awayLabel}</span>
          </div>
          <div className="space-y-3">
            <StatRow label="Pontos" home={teamSummary.home.points} away={teamSummary.away.points} />
            <StatRow label="Rebotes" home={teamSummary.home.rebounds} away={teamSummary.away.rebounds} />
            <StatRow label="Assistencias" home={teamSummary.home.assists} away={teamSummary.away.assists} />
            <StatRow label="Roubos" home={teamSummary.home.steals} away={teamSummary.away.steals} />
            <StatRow label="Tocos" home={teamSummary.home.blocks} away={teamSummary.away.blocks} />
            <StatRow label="Turnovers" home={teamSummary.home.turnovers} away={teamSummary.away.turnovers} />
            <StatRow label="Faltas" home={teamSummary.home.fouls} away={teamSummary.away.fouls} />
          </div>
        </div>

        <div className="fgb-card p-6">
          <h2 className="fgb-display text-2xl text-[var(--black)]">Ultimos eventos</h2>
          <div className="mt-4 max-h-[400px] space-y-2 overflow-auto pr-1">
            {recentEvents.length === 0 ? (
              <div className="rounded-xl border border-dashed border-[var(--border)] p-4 text-sm text-[var(--gray)]">
                Nenhum evento publicado ainda.
              </div>
            ) : (
              recentEvents.map((event, index) => (
                <div
                  key={`${event.occurredAt}-${index}`}
                  className={`rounded-xl border border-[var(--border)] px-4 py-3 ${
                    event.pointsDelta > 0 ? 'bg-[#F5C200]/10' : 'bg-white'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p
                        className={`text-sm leading-snug ${
                          event.pointsDelta > 0 ? 'font-semibold text-[var(--black)]' : 'text-[var(--black)]'
                        }`}
                      >
                        {event.description}
                      </p>
                      {event.teamName ? (
                        <p className="mt-1 text-[10px] text-[var(--gray)]">{event.teamName}</p>
                      ) : null}
                    </div>
                    <span className="shrink-0 text-[10px] font-semibold text-[var(--gray)]">
                      {event.period ? `Q${event.period > 4 ? `OT${event.period - 4}` : event.period}` : '--'}
                      {event.clockTime ? ` ${event.clockTime}` : ''}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {!game.isLive && scheduledDate ? (
        <div className="fgb-card p-5">
          <p className="text-[10px] font-black uppercase tracking-widest text-[var(--gray)]">
            Informacoes da partida
          </p>
          <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-sm text-[var(--black)]">
            <span>{scheduledDate}</span>
            {game.venue ? <span>{game.venue}</span> : null}
          </div>
        </div>
      ) : null}

      {updatedAt ? (
        <p className="text-center text-[10px] text-[var(--gray)]">
          Atualizado as {new Date(updatedAt).toLocaleTimeString('pt-BR')}
        </p>
      ) : null}
    </div>
  )
}
