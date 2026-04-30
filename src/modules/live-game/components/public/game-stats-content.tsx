'use client'

import { useGameData, type TeamStatPair } from './game-data-provider'

const EMPTY_MARK = '\u2014'

type StatComparisonRowProps = {
  label: string
  home: number
  away: number
  lowerIsBetter?: boolean
  format?: 'int' | 'pct'
  homeDetail?: string
  awayDetail?: string
}

function formatValue(value: number, format: 'int' | 'pct' = 'int') {
  if (format === 'pct') {
    return value >= 0 ? `${value}%` : EMPTY_MARK
  }
  return String(value)
}

function getWinnerState({
  home,
  away,
  lowerIsBetter,
}: {
  home: number
  away: number
  lowerIsBetter?: boolean
}) {
  const homeBetter = lowerIsBetter ? home < away : home > away
  const awayBetter = lowerIsBetter ? away < home : away > home

  return {
    homeBetter,
    awayBetter,
  }
}

function getBarWidth(home: number, away: number) {
  const safeHome = Math.max(home, 0)
  const safeAway = Math.max(away, 0)
  const total = safeHome + safeAway
  return total > 0 ? (safeHome / total) * 100 : 50
}

function StatComparisonRow({
  label,
  home,
  away,
  lowerIsBetter = false,
  format = 'int',
  homeDetail,
  awayDetail,
}: StatComparisonRowProps) {
  const { homeBetter, awayBetter } = getWinnerState({ home, away, lowerIsBetter })
  const homeClass = homeBetter ? 'text-[var(--verde)]' : awayBetter ? 'text-[var(--gray)]' : 'text-[var(--black)]'
  const awayClass = awayBetter ? 'text-[#CC1016]' : homeBetter ? 'text-[var(--gray)]' : 'text-[var(--black)]'
  const homeWidth = getBarWidth(home, away)

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3">
      <div className="flex items-center gap-3">
        <div className="w-[86px] text-right">
          <p className={`text-lg font-black tabular-nums ${homeClass}`}>{formatValue(home, format)}</p>
          {homeDetail ? <p className="text-[10px] text-[var(--gray)]">{homeDetail}</p> : null}
        </div>
        <div className="flex-1">
          <div className="mb-1 flex items-center justify-center">
            <span className="text-[10px] font-black uppercase tracking-[0.24em] text-[var(--gray)]">
              {label}
            </span>
          </div>
          <div className="flex h-2 overflow-hidden rounded-full bg-[var(--gray-l)]">
            <div className="h-full rounded-full bg-[var(--verde)] transition-all duration-500" style={{ width: `${homeWidth}%` }} />
          </div>
        </div>
        <div className="w-[86px] text-left">
          <p className={`text-lg font-black tabular-nums ${awayClass}`}>{formatValue(away, format)}</p>
          {awayDetail ? <p className="text-[10px] text-[var(--gray)]">{awayDetail}</p> : null}
        </div>
      </div>
    </div>
  )
}

function Section({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle: string
  children: React.ReactNode
}) {
  return (
    <section className="fgb-card p-6">
      <div className="mb-4 flex items-end justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[var(--gray)]">
            Estatisticas
          </p>
          <h2 className="fgb-display text-2xl text-[var(--black)]">{title}</h2>
        </div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--gray)]">
          {subtitle}
        </p>
      </div>
      <div className="space-y-3">{children}</div>
    </section>
  )
}

function toDetail(made: number, attempted: number, pct: number) {
  return `${made}/${attempted} ${pct >= 0 ? `${pct}%` : EMPTY_MARK}`
}

function addPair(left: TeamStatPair, right: TeamStatPair): TeamStatPair {
  return {
    home: left.home + right.home,
    away: left.away + right.away,
  }
}

function toPctPair(made: TeamStatPair, attempted: TeamStatPair): TeamStatPair {
  return {
    home: attempted.home > 0 ? Math.round((made.home / attempted.home) * 100) : -1,
    away: attempted.away > 0 ? Math.round((made.away / attempted.away) * 100) : -1,
  }
}

export function GameStatsContent() {
  const { data, isLoading, error, updatedAt } = useGameData()

  if (isLoading && !data) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-48 rounded-[28px] bg-[var(--gray-l)]" />
        <div className="h-48 rounded-[28px] bg-[var(--gray-l)]" />
        <div className="h-48 rounded-[28px] bg-[var(--gray-l)]" />
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

  const { analytics } = data
  const teamComparison = analytics.teamComparison
  const totalFieldGoalsMade = addPair(teamComparison.twoPointMade, teamComparison.threePointMade)
  const totalFieldGoalsAttempted = addPair(teamComparison.twoPointAttempted, teamComparison.threePointAttempted)
  const totalFieldGoalsPct = toPctPair(totalFieldGoalsMade, totalFieldGoalsAttempted)

  return (
    <div className="space-y-6">
      <Section title="Resumo do jogo" subtitle="Produção coletiva">
        <StatComparisonRow label="Pontos" home={teamComparison.points.home} away={teamComparison.points.away} />
        <StatComparisonRow label="Rebotes" home={teamComparison.rebounds.home} away={teamComparison.rebounds.away} />
        <StatComparisonRow label="Assistencias" home={teamComparison.assists.home} away={teamComparison.assists.away} />
        <StatComparisonRow label="Roubadas" home={teamComparison.steals.home} away={teamComparison.steals.away} />
        <StatComparisonRow label="Tocos" home={teamComparison.blocks.home} away={teamComparison.blocks.away} />
        <StatComparisonRow
          label="Turnovers"
          home={teamComparison.turnovers.home}
          away={teamComparison.turnovers.away}
          lowerIsBetter={true}
        />
        <StatComparisonRow
          label="Faltas"
          home={teamComparison.fouls.home}
          away={teamComparison.fouls.away}
          lowerIsBetter={true}
        />
      </Section>

      <div className="grid gap-6 xl:grid-cols-2">
        <Section title="Arremessos" subtitle="Aproveitamento e volume">
          <StatComparisonRow
            label="2PT"
            home={teamComparison.twoPointPct.home}
            away={teamComparison.twoPointPct.away}
            format="pct"
            homeDetail={toDetail(
              teamComparison.twoPointMade.home,
              teamComparison.twoPointAttempted.home,
              teamComparison.twoPointPct.home
            )}
            awayDetail={toDetail(
              teamComparison.twoPointMade.away,
              teamComparison.twoPointAttempted.away,
              teamComparison.twoPointPct.away
            )}
          />
          <StatComparisonRow
            label="3PT"
            home={teamComparison.threePointPct.home}
            away={teamComparison.threePointPct.away}
            format="pct"
            homeDetail={toDetail(
              teamComparison.threePointMade.home,
              teamComparison.threePointAttempted.home,
              teamComparison.threePointPct.home
            )}
            awayDetail={toDetail(
              teamComparison.threePointMade.away,
              teamComparison.threePointAttempted.away,
              teamComparison.threePointPct.away
            )}
          />
          <StatComparisonRow
            label="LL"
            home={teamComparison.freeThrowPct.home}
            away={teamComparison.freeThrowPct.away}
            format="pct"
            homeDetail={toDetail(
              teamComparison.freeThrowMade.home,
              teamComparison.freeThrowAttempted.home,
              teamComparison.freeThrowPct.home
            )}
            awayDetail={toDetail(
              teamComparison.freeThrowMade.away,
              teamComparison.freeThrowAttempted.away,
              teamComparison.freeThrowPct.away
            )}
          />
          <StatComparisonRow
            label="FG Total"
            home={totalFieldGoalsPct.home}
            away={totalFieldGoalsPct.away}
            format="pct"
            homeDetail={toDetail(totalFieldGoalsMade.home, totalFieldGoalsAttempted.home, totalFieldGoalsPct.home)}
            awayDetail={toDetail(totalFieldGoalsMade.away, totalFieldGoalsAttempted.away, totalFieldGoalsPct.away)}
          />
        </Section>

        <Section title="Rebotes" subtitle="Controle de posse">
          <StatComparisonRow
            label="Ofensivos"
            home={teamComparison.reboundsOffensive.home}
            away={teamComparison.reboundsOffensive.away}
          />
          <StatComparisonRow
            label="Defensivos"
            home={teamComparison.reboundsDefensive.home}
            away={teamComparison.reboundsDefensive.away}
          />
          <StatComparisonRow label="Totais" home={teamComparison.rebounds.home} away={teamComparison.rebounds.away} />
        </Section>
      </div>

      <Section title="Profundidade" subtitle="Impacto de quinteto e rotação">
        <StatComparisonRow
          label="Pontos dos titulares"
          home={teamComparison.starterPoints.home}
          away={teamComparison.starterPoints.away}
        />
        <StatComparisonRow
          label="Pontos do banco"
          home={teamComparison.benchPoints.home}
          away={teamComparison.benchPoints.away}
        />
        <StatComparisonRow label="EFF total" home={teamComparison.efficiency.home} away={teamComparison.efficiency.away} />
        <StatComparisonRow
          label="Posses estimadas"
          home={teamComparison.possessionsEst.home}
          away={teamComparison.possessionsEst.away}
        />
      </Section>

      {updatedAt ? (
        <p className="text-center text-[10px] text-[var(--gray)]">
          Atualizado as {new Date(updatedAt).toLocaleTimeString('pt-BR')}
        </p>
      ) : null}
    </div>
  )
}
