'use client'

import { useGameData } from './game-data-provider'

function TeamInitials({ name }: { name: string }) {
  const parts = name.trim().split(/\s+/)
  const initials =
    parts.length >= 2
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : name.slice(0, 2).toUpperCase()
  return (
    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/10 text-lg font-black text-white">
      {initials}
    </div>
  )
}

function TeamLogo({ url, name }: { url: string | null; name: string }) {
  if (url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={url} alt={name} className="h-14 w-14 object-contain drop-shadow-sm" />
    )
  }
  return <TeamInitials name={name} />
}

function StatusBadge({ isLive, isFinished }: { isLive: boolean; isFinished: boolean }) {
  if (isLive) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-red-600 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-white">
        <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
        Ao vivo
      </span>
    )
  }
  if (isFinished) {
    return (
      <span className="inline-flex items-center rounded-full bg-emerald-600 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-white">
        Encerrado
      </span>
    )
  }
  return (
    <span className="inline-flex items-center rounded-full bg-white/15 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-white/70">
      Agendado
    </span>
  )
}

function PeriodScoreTable({
  homeTeamName,
  awayTeamName,
  periodScores,
  homeScore,
  awayScore,
}: {
  homeTeamName: string
  awayTeamName: string
  periodScores: Array<{ period: number; label: string; homePoints: number; awayPoints: number }>
  homeScore: number
  awayScore: number
}) {
  if (periodScores.length === 0) return null

  const shortName = (name: string) => {
    const parts = name.trim().split(/\s+/)
    return parts.length >= 2 ? `${parts[0]} ${parts[1]}` : name
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-[320px] text-sm">
        <thead>
          <tr>
            <th className="w-28 py-1.5 pr-4 text-left text-[10px] font-black uppercase tracking-widest text-white/40" />
            {periodScores.map((p) => (
              <th
                key={p.period}
                className="px-3 py-1.5 text-center text-[10px] font-black uppercase tracking-widest text-white/50"
              >
                {p.label}
              </th>
            ))}
            <th className="px-3 py-1.5 text-center text-[10px] font-black uppercase tracking-widest text-white/80">
              T
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="py-1.5 pr-4 text-left text-xs text-white/60 truncate max-w-[7rem]">
              {shortName(homeTeamName)}
            </td>
            {periodScores.map((p) => (
              <td key={p.period} className="px-3 py-1.5 text-center text-sm font-semibold text-white/80">
                {p.homePoints}
              </td>
            ))}
            <td className="px-3 py-1.5 text-center text-sm font-black text-white">{homeScore}</td>
          </tr>
          <tr>
            <td className="py-1.5 pr-4 text-left text-xs text-white/60 truncate max-w-[7rem]">
              {shortName(awayTeamName)}
            </td>
            {periodScores.map((p) => (
              <td key={p.period} className="px-3 py-1.5 text-center text-sm font-semibold text-white/80">
                {p.awayPoints}
              </td>
            ))}
            <td className="px-3 py-1.5 text-center text-sm font-black text-white">{awayScore}</td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}

function HeroSkeleton() {
  return (
    <div className="rounded-[28px] overflow-hidden animate-pulse">
      <div className="bg-[#111] px-6 py-8 sm:px-10">
        <div className="h-3 w-48 rounded bg-white/10 mb-6" />
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-14 w-14 rounded-full bg-white/10" />
            <div className="h-5 w-32 rounded bg-white/10" />
          </div>
          <div className="h-14 w-32 rounded bg-white/10" />
          <div className="flex items-center gap-3">
            <div className="h-5 w-32 rounded bg-white/10" />
            <div className="h-14 w-14 rounded-full bg-white/10" />
          </div>
        </div>
        <div className="mt-6 h-3 w-24 rounded bg-white/10" />
      </div>
    </div>
  )
}

export function GameHeroClient() {
  const { data, isLoading, error } = useGameData()

  if (isLoading && !data) return <HeroSkeleton />

  if (error && !data) {
    return (
      <div className="rounded-[28px] border border-red-200 bg-red-50 px-6 py-5 text-sm text-red-700">
        {error}
      </div>
    )
  }

  if (!data) return null

  const { game, homeTeam, awayTeam, periodScores, summary } = data

  const currentPeriodLabel = summary.currentPeriod
    ? summary.currentPeriod <= 4
      ? `Q${summary.currentPeriod}`
      : `OT${summary.currentPeriod - 4}`
    : null

  return (
    <div className="rounded-[28px] overflow-hidden border border-white/5">
      {/* Dark scoreboard section */}
      <div className="bg-[#111111] px-6 pt-7 pb-5 sm:px-10">
        {/* Championship / category */}
        {(game.championship || game.category) && (
          <p className="mb-5 text-[10px] font-black uppercase tracking-widest text-white/40">
            {[game.championship, game.category].filter(Boolean).join(' · ')}
          </p>
        )}

        {/* Teams + Score */}
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 sm:gap-8">
          {/* Home */}
          <div className="flex items-center gap-3 min-w-0">
            <TeamLogo url={homeTeam.logoUrl} name={homeTeam.name} />
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-widest text-white/40">
                Mandante
              </p>
              <p className="truncate text-sm font-black text-white sm:text-base">
                {homeTeam.name}
              </p>
            </div>
          </div>

          {/* Score */}
          <div className="text-center shrink-0">
            <div className="flex items-baseline justify-center gap-3">
              <span
                className={`text-5xl font-black tabular-nums sm:text-6xl ${
                  game.isFinished && homeTeam.score > awayTeam.score
                    ? 'text-[#F5C200]'
                    : 'text-white'
                }`}
              >
                {homeTeam.score}
              </span>
              <span className="text-2xl font-black text-white/30">×</span>
              <span
                className={`text-5xl font-black tabular-nums sm:text-6xl ${
                  game.isFinished && awayTeam.score > homeTeam.score
                    ? 'text-[#F5C200]'
                    : 'text-white'
                }`}
              >
                {awayTeam.score}
              </span>
            </div>
            <div className="mt-2 flex items-center justify-center gap-2">
              <StatusBadge isLive={game.isLive} isFinished={game.isFinished} />
              {currentPeriodLabel && (
                <span className="text-xs font-semibold text-white/50">
                  {currentPeriodLabel}
                  {game.clockDisplay ? ` · ${game.clockDisplay}` : ''}
                </span>
              )}
            </div>
          </div>

          {/* Away */}
          <div className="flex items-center justify-end gap-3 min-w-0">
            <div className="min-w-0 text-right">
              <p className="text-[10px] font-black uppercase tracking-widest text-white/40">
                Visitante
              </p>
              <p className="truncate text-sm font-black text-white sm:text-base">
                {awayTeam.name}
              </p>
            </div>
            <TeamLogo url={awayTeam.logoUrl} name={awayTeam.name} />
          </div>
        </div>

        {/* Period scores */}
        {periodScores.length > 0 && (
          <div className="mt-6 border-t border-white/10 pt-4">
            <PeriodScoreTable
              homeTeamName={homeTeam.name}
              awayTeamName={awayTeam.name}
              periodScores={periodScores}
              homeScore={homeTeam.score}
              awayScore={awayTeam.score}
            />
          </div>
        )}
      </div>

      {/* Light info strip */}
      {game.venue && (
        <div className="border-t border-[var(--border)] bg-white px-6 py-3 sm:px-10">
          <p className="text-xs text-[var(--gray)]">
            <span className="font-semibold text-[var(--black)]">📍</span> {game.venue}
          </p>
        </div>
      )}
    </div>
  )
}
