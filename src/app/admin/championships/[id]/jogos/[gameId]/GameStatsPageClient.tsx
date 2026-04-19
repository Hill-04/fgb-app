"use client"

import Link from "next/link"
import { useCallback, useEffect, useMemo, useState } from "react"
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  History,
  Save,
  ShieldAlert,
  TimerReset,
  Users,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { buildChampionshipGamePath } from "@/lib/admin-game-routing"
import type { Athlete, GameStat } from "@/types/database"

type ExtendedStat = Partial<GameStat> & {
  athlete_id: string
  team_id: string
  athlete_name: string
  jersey?: number | null
  dnp: boolean
  is_starter?: boolean
}

type TeamMeta = {
  id: string
  name: string
  short_name?: string | null
}

type GamePayload = {
  id: string
  status: string
  venue?: string | null
  home_score: number | null
  away_score: number | null
  home_team_id: string
  away_team_id: string
  homeTeam?: TeamMeta | null
  awayTeam?: TeamMeta | null
}

type TeamSummary = {
  points: number
  rebounds: number
  assists: number
  fouls: number
  activePlayers: number
  starters: number
}

type QuickAction =
  | "make2"
  | "make3"
  | "makeFt"
  | "miss2"
  | "miss3"
  | "missFt"
  | "rebO"
  | "rebD"
  | "ast"
  | "stl"
  | "blk"
  | "tov"
  | "foul"

const DEFAULT_STAT_VALUES = {
  minutes_played: 0,
  points: 0,
  rebounds_offensive: 0,
  rebounds_defensive: 0,
  assists: 0,
  steals: 0,
  blocks: 0,
  turnovers: 0,
  fouls: 0,
  fg_made: 0,
  fg_attempted: 0,
  three_made: 0,
  three_attempted: 0,
  ft_made: 0,
  ft_attempted: 0,
  dunks: 0,
} satisfies Partial<GameStat>

function toSafeInt(value: unknown) {
  const parsed = Number.parseInt(String(value ?? 0), 10)
  return Number.isFinite(parsed) ? Math.max(parsed, 0) : 0
}

function sanitizeStat(stat: ExtendedStat): ExtendedStat {
  const fgMade = toSafeInt(stat.fg_made)
  const fgAttempted = Math.max(toSafeInt(stat.fg_attempted), fgMade)
  const threeMade = Math.min(toSafeInt(stat.three_made), fgMade)
  const threeAttempted = Math.max(toSafeInt(stat.three_attempted), threeMade)
  const ftMade = toSafeInt(stat.ft_made)
  const ftAttempted = Math.max(toSafeInt(stat.ft_attempted), ftMade)
  const offensiveRebounds = toSafeInt(stat.rebounds_offensive)
  const defensiveRebounds = toSafeInt(stat.rebounds_defensive)

  return {
    ...stat,
    minutes_played: toSafeInt(stat.minutes_played),
    rebounds_offensive: offensiveRebounds,
    rebounds_defensive: defensiveRebounds,
    assists: toSafeInt(stat.assists),
    steals: toSafeInt(stat.steals),
    blocks: toSafeInt(stat.blocks),
    turnovers: toSafeInt(stat.turnovers),
    fouls: toSafeInt(stat.fouls),
    fg_made: fgMade,
    fg_attempted: fgAttempted,
    three_made: threeMade,
    three_attempted: threeAttempted,
    ft_made: ftMade,
    ft_attempted: ftAttempted,
    dunks: toSafeInt(stat.dunks),
    points: derivePoints({
      ...stat,
      fg_made: fgMade,
      three_made: threeMade,
      ft_made: ftMade,
    }),
  }
}

function derivePoints(stat: Partial<GameStat>) {
  const fgMade = toSafeInt(stat.fg_made)
  const threeMade = Math.min(toSafeInt(stat.three_made), fgMade)
  const ftMade = toSafeInt(stat.ft_made)
  return (fgMade - threeMade) * 2 + threeMade * 3 + ftMade
}

function deriveRebounds(stat: Partial<GameStat>) {
  return toSafeInt(stat.rebounds_offensive) + toSafeInt(stat.rebounds_defensive)
}

function createEmptyStat(base: Pick<ExtendedStat, "athlete_id" | "team_id" | "athlete_name" | "jersey" | "dnp">) {
  return sanitizeStat({
    ...base,
    ...DEFAULT_STAT_VALUES,
  })
}

function summarizeTeam(stats: ExtendedStat[]): TeamSummary {
  return stats.reduce<TeamSummary>(
    (acc, rawStat) => {
      const stat = sanitizeStat(rawStat)
      if (stat.dnp) return acc

      acc.points += derivePoints(stat)
      acc.rebounds += deriveRebounds(stat)
      acc.assists += toSafeInt(stat.assists)
      acc.fouls += toSafeInt(stat.fouls)
      acc.activePlayers += 1

      if ((stat as { is_starter?: boolean }).is_starter) {
        acc.starters += 1
      }

      return acc
    },
    {
      points: 0,
      rebounds: 0,
      assists: 0,
      fouls: 0,
      activePlayers: 0,
      starters: 0,
    }
  )
}

function actionLabel(action: QuickAction) {
  switch (action) {
    case "make2":
      return "+2"
    case "make3":
      return "+3"
    case "makeFt":
      return "+1"
    case "miss2":
      return "2 errado"
    case "miss3":
      return "3 errado"
    case "missFt":
      return "LL errado"
    case "rebO":
      return "REB O"
    case "rebD":
      return "REB D"
    case "ast":
      return "AST"
    case "stl":
      return "STL"
    case "blk":
      return "BLK"
    case "tov":
      return "TOV"
    case "foul":
      return "F"
    default:
      return action
  }
}

function stepStat(stat: ExtendedStat, action: QuickAction): ExtendedStat {
  const next = sanitizeStat({ ...stat })

  switch (action) {
    case "make2":
      next.fg_made = toSafeInt(next.fg_made) + 1
      next.fg_attempted = toSafeInt(next.fg_attempted) + 1
      break
    case "make3":
      next.fg_made = toSafeInt(next.fg_made) + 1
      next.fg_attempted = toSafeInt(next.fg_attempted) + 1
      next.three_made = toSafeInt(next.three_made) + 1
      next.three_attempted = toSafeInt(next.three_attempted) + 1
      break
    case "makeFt":
      next.ft_made = toSafeInt(next.ft_made) + 1
      next.ft_attempted = toSafeInt(next.ft_attempted) + 1
      break
    case "miss2":
      next.fg_attempted = toSafeInt(next.fg_attempted) + 1
      break
    case "miss3":
      next.fg_attempted = toSafeInt(next.fg_attempted) + 1
      next.three_attempted = toSafeInt(next.three_attempted) + 1
      break
    case "missFt":
      next.ft_attempted = toSafeInt(next.ft_attempted) + 1
      break
    case "rebO":
      next.rebounds_offensive = toSafeInt(next.rebounds_offensive) + 1
      break
    case "rebD":
      next.rebounds_defensive = toSafeInt(next.rebounds_defensive) + 1
      break
    case "ast":
      next.assists = toSafeInt(next.assists) + 1
      break
    case "stl":
      next.steals = toSafeInt(next.steals) + 1
      break
    case "blk":
      next.blocks = toSafeInt(next.blocks) + 1
      break
    case "tov":
      next.turnovers = toSafeInt(next.turnovers) + 1
      break
    case "foul":
      next.fouls = toSafeInt(next.fouls) + 1
      break
  }

  return sanitizeStat(next)
}

function StatMiniField({
  label,
  value,
  onChange,
  disabled = false,
  className = "",
}: {
  label: string
  value: number
  onChange: (value: number) => void
  disabled?: boolean
  className?: string
}) {
  return (
    <label className={`rounded-2xl border border-[var(--border)] bg-white/80 p-2 ${className}`}>
      <span className="fgb-label text-[8px] text-[var(--gray)]">{label}</span>
      <Input
        type="number"
        min={0}
        disabled={disabled}
        value={value}
        onChange={(event) => onChange(toSafeInt(event.target.value))}
        className="mt-1 h-9 rounded-xl border-none bg-[var(--gray-l)] text-center text-sm font-black text-[var(--black)] shadow-none"
      />
    </label>
  )
}

function QuickButton({
  label,
  onClick,
  tone = "neutral",
  disabled = false,
}: {
  label: string
  onClick: () => void
  tone?: "score" | "warning" | "neutral"
  disabled?: boolean
}) {
  const toneClass =
    tone === "score"
      ? "border-[var(--yellow)]/40 bg-[var(--yellow-light)] text-[var(--black)] hover:border-[var(--yellow)] hover:bg-[var(--yellow)]"
      : tone === "warning"
        ? "border-[var(--red)]/20 bg-[var(--red-light)] text-[var(--red)] hover:border-[var(--red)] hover:bg-white"
        : "border-[var(--border)] bg-white text-[var(--gray-d)] hover:border-[var(--verde)] hover:text-[var(--verde)]"

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`rounded-full border px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.12em] transition ${toneClass} disabled:cursor-not-allowed disabled:opacity-40`}
    >
      {label}
    </button>
  )
}

function PlayerCard({
  stat,
  teamTone,
  onToggleDnp,
  onQuickAction,
  onFieldChange,
}: {
  stat: ExtendedStat
  teamTone: string
  onToggleDnp: (value: boolean) => void
  onQuickAction: (action: QuickAction) => void
  onFieldChange: (field: keyof ExtendedStat, value: number) => void
}) {
  const normalized = sanitizeStat(stat)
  const points = derivePoints(normalized)
  const rebounds = deriveRebounds(normalized)

  return (
    <article
      className={`rounded-[26px] border p-4 shadow-sm transition ${
        normalized.dnp
          ? "border-[var(--border)] bg-white/55 opacity-70"
          : "border-white/70 bg-white/92"
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div
            className="flex h-12 w-12 items-center justify-center rounded-2xl text-lg font-black text-white shadow-sm"
            style={{ background: teamTone }}
          >
            #{normalized.jersey ?? "--"}
          </div>
          <div className="min-w-0">
            <p className="truncate text-base font-black text-[var(--black)]">{normalized.athlete_name}</p>
            <div className="mt-1 flex flex-wrap gap-2">
              <span className="rounded-full bg-[var(--gray-l)] px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-[var(--gray)]">
                {points} pts
              </span>
              {normalized.is_starter && (
                <span className="rounded-full bg-[var(--black)] px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-white">
                  Starter
                </span>
              )}
              <span className="rounded-full bg-[var(--verde-light)] px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-[var(--verde-dark)]">
                {rebounds} reb
              </span>
              <span className="rounded-full bg-[var(--yellow-light)] px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-[var(--black)]">
                {toSafeInt(normalized.assists)} ast
              </span>
              <span className="rounded-full bg-[var(--red-light)] px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-[var(--red)]">
                {toSafeInt(normalized.fouls)} faltas
              </span>
            </div>
          </div>
        </div>

        <label className="flex items-center gap-2 rounded-full border border-[var(--border)] bg-white px-3 py-2 text-[10px] font-black uppercase tracking-[0.12em] text-[var(--gray-d)]">
          <input
            type="checkbox"
            className="h-4 w-4 accent-[var(--verde)]"
            checked={normalized.dnp}
            onChange={(event) => onToggleDnp(event.target.checked)}
          />
          Marcar DNP
        </label>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <QuickButton label="+2" tone="score" disabled={normalized.dnp} onClick={() => onQuickAction("make2")} />
        <QuickButton label="+3" tone="score" disabled={normalized.dnp} onClick={() => onQuickAction("make3")} />
        <QuickButton label="+1" tone="score" disabled={normalized.dnp} onClick={() => onQuickAction("makeFt")} />
        <QuickButton label="2 errado" disabled={normalized.dnp} onClick={() => onQuickAction("miss2")} />
        <QuickButton label="3 errado" disabled={normalized.dnp} onClick={() => onQuickAction("miss3")} />
        <QuickButton label="LL errado" disabled={normalized.dnp} onClick={() => onQuickAction("missFt")} />
        <QuickButton label="REB O" disabled={normalized.dnp} onClick={() => onQuickAction("rebO")} />
        <QuickButton label="REB D" disabled={normalized.dnp} onClick={() => onQuickAction("rebD")} />
        <QuickButton label="AST" disabled={normalized.dnp} onClick={() => onQuickAction("ast")} />
        <QuickButton label="STL" disabled={normalized.dnp} onClick={() => onQuickAction("stl")} />
        <QuickButton label="BLK" disabled={normalized.dnp} onClick={() => onQuickAction("blk")} />
        <QuickButton label="TOV" tone="warning" disabled={normalized.dnp} onClick={() => onQuickAction("tov")} />
        <QuickButton label="F" tone="warning" disabled={normalized.dnp} onClick={() => onQuickAction("foul")} />
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        <StatMiniField
          label="MIN"
          value={toSafeInt(normalized.minutes_played)}
          disabled={normalized.dnp}
          onChange={(value) => onFieldChange("minutes_played", value)}
        />
        <StatMiniField
          label="FGM"
          value={toSafeInt(normalized.fg_made)}
          disabled={normalized.dnp}
          onChange={(value) => onFieldChange("fg_made", value)}
        />
        <StatMiniField
          label="FGA"
          value={toSafeInt(normalized.fg_attempted)}
          disabled={normalized.dnp}
          onChange={(value) => onFieldChange("fg_attempted", value)}
        />
        <StatMiniField
          label="3PM"
          value={toSafeInt(normalized.three_made)}
          disabled={normalized.dnp}
          onChange={(value) => onFieldChange("three_made", value)}
        />
        <StatMiniField
          label="3PA"
          value={toSafeInt(normalized.three_attempted)}
          disabled={normalized.dnp}
          onChange={(value) => onFieldChange("three_attempted", value)}
        />
        <StatMiniField
          label="FTM"
          value={toSafeInt(normalized.ft_made)}
          disabled={normalized.dnp}
          onChange={(value) => onFieldChange("ft_made", value)}
        />
        <StatMiniField
          label="FTA"
          value={toSafeInt(normalized.ft_attempted)}
          disabled={normalized.dnp}
          onChange={(value) => onFieldChange("ft_attempted", value)}
        />
        <StatMiniField
          label="REB O"
          value={toSafeInt(normalized.rebounds_offensive)}
          disabled={normalized.dnp}
          onChange={(value) => onFieldChange("rebounds_offensive", value)}
        />
        <StatMiniField
          label="REB D"
          value={toSafeInt(normalized.rebounds_defensive)}
          disabled={normalized.dnp}
          onChange={(value) => onFieldChange("rebounds_defensive", value)}
        />
        <StatMiniField
          label="AST"
          value={toSafeInt(normalized.assists)}
          disabled={normalized.dnp}
          onChange={(value) => onFieldChange("assists", value)}
        />
        <StatMiniField
          label="STL"
          value={toSafeInt(normalized.steals)}
          disabled={normalized.dnp}
          onChange={(value) => onFieldChange("steals", value)}
        />
        <StatMiniField
          label="BLK"
          value={toSafeInt(normalized.blocks)}
          disabled={normalized.dnp}
          onChange={(value) => onFieldChange("blocks", value)}
        />
        <StatMiniField
          label="TOV"
          value={toSafeInt(normalized.turnovers)}
          disabled={normalized.dnp}
          onChange={(value) => onFieldChange("turnovers", value)}
        />
        <StatMiniField
          label="PF"
          value={toSafeInt(normalized.fouls)}
          disabled={normalized.dnp}
          onChange={(value) => onFieldChange("fouls", value)}
        />
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--black)] p-3 text-white">
          <p className="fgb-label text-[8px] text-white/50">Conferencia</p>
          <div className="mt-2 grid grid-cols-2 gap-2 text-sm font-black">
            <span>{points} pts</span>
            <span>{rebounds} reb</span>
            <span>{toSafeInt(normalized.assists)} ast</span>
            <span>{toSafeInt(normalized.fouls)} pf</span>
          </div>
        </div>
      </div>
    </article>
  )
}

export default function GameStatsPageClient({
  gameId,
  championshipId,
}: {
  gameId: string
  championshipId: string
}) {
  const [game, setGame] = useState<GamePayload | null>(null)
  const [rosterLocked, setRosterLocked] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [recentActions, setRecentActions] = useState<string[]>([])
  const [homeStats, setHomeStats] = useState<ExtendedStat[]>([])
  const [awayStats, setAwayStats] = useState<ExtendedStat[]>([])

  const pushRecentAction = useCallback((message: string) => {
    const timestamp = new Date().toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    })

    setRecentActions((current) => [`${timestamp} - ${message}`, ...current].slice(0, 12))
  }, [])

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/admin/jogos/${gameId}/stats`)
      if (!response.ok) throw new Error("Falha ao carregar dados do jogo.")

      const data = await response.json()
      setGame(data.game as GamePayload)

      const isLocked = data.rosters?.every((roster: { is_locked?: boolean }) => roster.is_locked) ?? false
      setRosterLocked(isLocked)

      const rosterPlayers = data.rosters?.flatMap((roster: { players?: unknown[] }) => roster.players ?? []) ?? []
      if (rosterPlayers.length === 0) {
        throw new Error("Roster oficial nao definido para este jogo. Gerencie o roster antes de lancar stats.")
      }

      const mapStats = (teamId: string) => {
        const teamRoster = data.rosters?.find((roster: { team_id: string }) => roster.team_id === teamId)
        const teamRosterPlayers = teamRoster?.players ?? []

        return teamRosterPlayers.map(
          (rosterPlayer: {
            athlete_id: string
            jersey_number?: number | null
            is_available?: boolean
            is_starter?: boolean
          }) => {
            const athlete = data.athletes.find((item: Athlete) => item.id === rosterPlayer.athlete_id)
            const existing = data.stats.find((item: GameStat) => item.athlete_id === rosterPlayer.athlete_id)

            return sanitizeStat({
              athlete_id: rosterPlayer.athlete_id,
              team_id: teamId,
              athlete_name: athlete?.name || "Atleta sem cadastro",
              jersey: rosterPlayer.jersey_number ?? athlete?.jersey_number ?? null,
              dnp: !(rosterPlayer.is_available ?? true),
              is_starter: rosterPlayer.is_starter ?? false,
              ...DEFAULT_STAT_VALUES,
              ...existing,
            })
          }
        )
      }

      setHomeStats(mapStats(data.game.home_team_id))
      setAwayStats(mapStats(data.game.away_team_id))
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Erro desconhecido ao carregar dados.")
    } finally {
      setLoading(false)
    }
  }, [gameId])

  useEffect(() => {
    void fetchStats()
  }, [fetchStats])

  const homeSummary = useMemo(() => summarizeTeam(homeStats), [homeStats])
  const awaySummary = useMemo(() => summarizeTeam(awayStats), [awayStats])

  const homeTeamName = game?.homeTeam?.name || "Mandante"
  const awayTeamName = game?.awayTeam?.name || "Visitante"
  const manualHomeScore = game?.home_score ?? 0
  const manualAwayScore = game?.away_score ?? 0

  const hasManualDiscrepancy =
    (game?.home_score !== null && manualHomeScore !== homeSummary.points) ||
    (game?.away_score !== null && manualAwayScore !== awaySummary.points)

  const updateTeamStats = useCallback(
    (
      team: "home" | "away",
      athleteId: string,
      updater: (current: ExtendedStat) => ExtendedStat
    ) => {
      const updateState = team === "home" ? setHomeStats : setAwayStats

      updateState((current) =>
        current.map((stat) => {
          if (stat.athlete_id !== athleteId) return stat
          return sanitizeStat(updater(stat))
        })
      )

      setSuccess(false)
    },
    []
  )

  const handleFieldChange = useCallback(
    (team: "home" | "away", athleteId: string, field: keyof ExtendedStat, value: number) => {
      updateTeamStats(team, athleteId, (current) => ({
        ...current,
        [field]: value,
      }))
    },
    [updateTeamStats]
  )

  const handleToggleDnp = useCallback(
    (team: "home" | "away", athleteId: string, value: boolean) => {
      updateTeamStats(team, athleteId, (current) => {
        if (!value) {
          return {
            ...current,
            dnp: false,
          }
        }

        return createEmptyStat({
          athlete_id: current.athlete_id,
          team_id: current.team_id,
          athlete_name: current.athlete_name,
          jersey: current.jersey,
          dnp: true,
        })
      })

      const currentList = team === "home" ? homeStats : awayStats
      const athleteName = currentList.find((item) => item.athlete_id === athleteId)?.athlete_name || athleteId
      pushRecentAction(`${value ? "DNP ativado para" : "DNP removido de"} ${athleteName}`)
    },
    [awayStats, homeStats, pushRecentAction, updateTeamStats]
  )

  const handleQuickAction = useCallback(
    (team: "home" | "away", stat: ExtendedStat, action: QuickAction) => {
      updateTeamStats(team, stat.athlete_id, (current) => stepStat(current, action))
      pushRecentAction(`${stat.athlete_name} - ${actionLabel(action)} (${team === "home" ? homeTeamName : awayTeamName})`)
    },
    [homeTeamName, awayTeamName, pushRecentAction, updateTeamStats]
  )

  const handleResetDraft = useCallback(() => {
    void fetchStats()
    setRecentActions([])
    setSuccess(false)
  }, [fetchStats])

  const handleSave = useCallback(async () => {
    try {
      setSaving(true)
      setError(null)

      const payload = [...homeStats, ...awayStats]
        .map((stat) => sanitizeStat(stat))
        .filter((stat) => !stat.dnp)
        .map((stat) => ({
          athlete_id: stat.athlete_id,
          team_id: stat.team_id,
          minutes_played: toSafeInt(stat.minutes_played),
          dnp: false,
          points: derivePoints(stat),
          rebounds_offensive: toSafeInt(stat.rebounds_offensive),
          rebounds_defensive: toSafeInt(stat.rebounds_defensive),
          assists: toSafeInt(stat.assists),
          steals: toSafeInt(stat.steals),
          blocks: toSafeInt(stat.blocks),
          turnovers: toSafeInt(stat.turnovers),
          fouls: toSafeInt(stat.fouls),
          fg_made: toSafeInt(stat.fg_made),
          fg_attempted: Math.max(toSafeInt(stat.fg_attempted), toSafeInt(stat.fg_made)),
          three_made: Math.min(toSafeInt(stat.three_made), toSafeInt(stat.fg_made)),
          three_attempted: Math.max(toSafeInt(stat.three_attempted), toSafeInt(stat.three_made)),
          ft_made: toSafeInt(stat.ft_made),
          ft_attempted: Math.max(toSafeInt(stat.ft_attempted), toSafeInt(stat.ft_made)),
          dunks: toSafeInt(stat.dunks),
        }))

      const response = await fetch(`/api/admin/jogos/${gameId}/stats`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stats: payload }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.error || "Erro ao salvar estatisticas.")
      }

      setSuccess(true)
      pushRecentAction("Estatisticas salvas com sucesso")
      setTimeout(() => setSuccess(false), 3000)
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Erro ao salvar estatisticas.")
    } finally {
      setSaving(false)
    }
  }, [awayStats, gameId, homeStats, pushRecentAction])

  if (loading) {
    return (
      <div className="flex min-h-[420px] items-center justify-center">
        <div className="rounded-full border border-[var(--border)] bg-white px-5 py-3">
          <span className="fgb-label text-[var(--gray)]">Carregando central de jogo</span>
        </div>
      </div>
    )
  }

  const TeamSection = ({
    title,
    team,
    stats,
    summary,
    teamTone,
  }: {
    title: string
    team: "home" | "away"
    stats: ExtendedStat[]
    summary: TeamSummary
    teamTone: string
  }) => (
    <section className="rounded-[30px] border border-[var(--border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.97),rgba(248,249,250,0.97))] p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="fgb-label text-[var(--gray)]">{title}</p>
          <h2 className="mt-2 text-3xl font-black uppercase tracking-tight text-[var(--black)]">
            {team === "home" ? homeTeamName : awayTeamName}
          </h2>
        </div>
        <div
          className="min-w-[120px] rounded-[24px] px-4 py-3 text-right text-white shadow-md"
          style={{ background: teamTone }}
        >
          <p className="fgb-label text-white/70">Total</p>
          <p className="text-4xl font-black">{summary.points}</p>
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-4">
        <div className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3">
          <p className="fgb-label text-[var(--gray)]">Ativos</p>
          <p className="mt-1 text-2xl font-black text-[var(--black)]">{summary.activePlayers}</p>
        </div>
        <div className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3">
          <p className="fgb-label text-[var(--gray)]">Titulares</p>
          <p className="mt-1 text-2xl font-black text-[var(--black)]">{summary.starters}</p>
        </div>
        <div className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3">
          <p className="fgb-label text-[var(--gray)]">Rebotes</p>
          <p className="mt-1 text-2xl font-black text-[var(--black)]">{summary.rebounds}</p>
        </div>
        <div className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3">
          <p className="fgb-label text-[var(--gray)]">Assistencias</p>
          <p className="mt-1 text-2xl font-black text-[var(--black)]">{summary.assists}</p>
        </div>
      </div>

      <div className="mt-5 space-y-4">
        {stats.map((stat) => (
          <PlayerCard
            key={stat.athlete_id}
            stat={stat}
            teamTone={teamTone}
            onToggleDnp={(value) => handleToggleDnp(team, stat.athlete_id, value)}
            onQuickAction={(action) => handleQuickAction(team, stat, action)}
            onFieldChange={(field, value) => handleFieldChange(team, stat.athlete_id, field, value)}
          />
        ))}
      </div>
    </section>
  )

  return (
    <div className="mx-auto max-w-[1680px] space-y-6 pb-40">
      <div className="sticky top-0 z-40 -mx-4 border-b border-[var(--border)] bg-[rgba(248,249,250,0.92)] px-4 py-4 backdrop-blur-md">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex items-start gap-3">
            <Link href={buildChampionshipGamePath(championshipId, gameId, "")}>
              <Button variant="ghost" size="icon" className="rounded-full border border-[var(--border)] bg-white">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <p className="fgb-label text-[var(--verde)]">Central de jogo</p>
              <h1 className="mt-1 text-3xl font-black uppercase tracking-tight text-[var(--black)]">
                Operacao de stats inspirada na sumula
              </h1>
              <p className="mt-1 text-sm text-[var(--gray)]">
                Fluxo pratico para fechar o box score do jogo com a identidade da FGB.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {success && (
              <div className="flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-black uppercase tracking-[0.12em] text-emerald-700">
                <CheckCircle2 className="h-4 w-4" />
                Salvo
              </div>
            )}

            <Button
              type="button"
              variant="outline"
              className="rounded-full border-[var(--border)] bg-white"
              onClick={handleResetDraft}
              disabled={saving}
            >
              <TimerReset className="mr-2 h-4 w-4" />
              Recarregar
            </Button>

            <Button className="fgb-btn-primary h-11 px-8" onClick={handleSave} disabled={saving}>
              <Save className="mr-2 h-4 w-4" />
              {saving ? "Salvando..." : "Salvar estatisticas"}
            </Button>
          </div>
        </div>
      </div>

      <section className="overflow-hidden rounded-[34px] border border-[var(--border)] bg-[linear-gradient(135deg,var(--verde),var(--verde-dark))] text-white shadow-[0_24px_70px_-30px_rgba(20,85,48,0.75)]">
        <div className="fgb-tricolor" />
        <div className="grid gap-0 lg:grid-cols-[1fr_auto_1fr]">
          <div className="border-b border-white/10 p-6 lg:border-b-0 lg:border-r">
            <p className="fgb-label text-white/60">Mandante</p>
            <h2 className="mt-2 text-4xl font-black uppercase leading-none">{homeTeamName}</h2>
            <p className="mt-6 text-7xl font-black leading-none text-[var(--yellow)]">{homeSummary.points}</p>
          </div>
          <div className="flex flex-col items-center justify-center gap-3 border-b border-white/10 px-8 py-6 lg:border-b-0">
            <span className="rounded-full border border-white/15 bg-white/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-white/80">
              {game?.status || "SCHEDULED"}
            </span>
            <div className="text-center">
              <p className="fgb-label text-white/50">Conferencia manual</p>
              <p className="mt-2 text-2xl font-black">
                {manualHomeScore} x {manualAwayScore}
              </p>
            </div>
            <p className="text-center text-xs text-white/70">{game?.venue || "Local a confirmar"}</p>
          </div>
          <div className="p-6 lg:border-l lg:border-white/10">
            <p className="fgb-label text-white/60">Visitante</p>
            <h2 className="mt-2 text-4xl font-black uppercase leading-none">{awayTeamName}</h2>
            <p className="mt-6 text-7xl font-black leading-none text-[var(--yellow)]">{awaySummary.points}</p>
          </div>
        </div>
      </section>

      {error && (
        <div className="flex items-start gap-3 rounded-[24px] border border-[var(--red)]/15 bg-[var(--red-light)] px-5 py-4 text-[var(--red)]">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <p className="fgb-label text-[var(--red)]">Atencao</p>
            <p className="mt-1 text-sm font-medium">{error}</p>
          </div>
        </div>
      )}

      {!rosterLocked && (
        <div className="flex items-start gap-3 rounded-[24px] border border-[var(--yellow)]/40 bg-[var(--yellow-light)] px-5 py-4 text-[var(--black)]">
          <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-[var(--orange-dark)]" />
          <div>
            <p className="fgb-label text-[var(--orange-dark)]">Roster ainda aberto</p>
            <p className="mt-1 text-sm font-medium">
              Esta tela ja funciona, mas o ideal e travar o roster antes de consolidar a estatistica oficial.
            </p>
          </div>
        </div>
      )}

      {hasManualDiscrepancy && (
        <div className="flex items-start gap-3 rounded-[24px] border border-amber-300 bg-amber-50 px-5 py-4 text-amber-900">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <p className="fgb-label text-amber-700">Divergencia de placar</p>
            <p className="mt-1 text-sm font-medium">
              A soma dos lancamentos esta em <strong>{homeSummary.points} x {awaySummary.points}</strong>, mas o placar do jogo esta em{" "}
              <strong>{manualHomeScore} x {manualAwayScore}</strong>. Isso e util para conferencia antes do fechamento.
            </p>
          </div>
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <TeamSection
            title="Painel mandante"
            team="home"
            stats={homeStats}
            summary={homeSummary}
            teamTone="linear-gradient(135deg, var(--verde) 0%, var(--verde-dark) 100%)"
          />
          <TeamSection
            title="Painel visitante"
            team="away"
            stats={awayStats}
            summary={awaySummary}
            teamTone="linear-gradient(135deg, var(--red) 0%, var(--red-dark) 100%)"
          />
        </div>

        <aside className="space-y-6">
          <section className="rounded-[30px] border border-[var(--border)] bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-[var(--verde)]" />
              <p className="fgb-label text-[var(--verde)]">Resumo rapido</p>
            </div>
            <div className="mt-4 space-y-3">
              <div className="rounded-2xl bg-[var(--gray-l)] p-4">
                <p className="fgb-label text-[var(--gray)]">{homeTeamName}</p>
                <div className="mt-2 grid grid-cols-2 gap-3 text-sm font-bold text-[var(--black)]">
                  <span>{homeSummary.points} pts</span>
                  <span>{homeSummary.rebounds} reb</span>
                  <span>{homeSummary.assists} ast</span>
                  <span>{homeSummary.fouls} pf</span>
                </div>
              </div>
              <div className="rounded-2xl bg-[var(--gray-l)] p-4">
                <p className="fgb-label text-[var(--gray)]">{awayTeamName}</p>
                <div className="mt-2 grid grid-cols-2 gap-3 text-sm font-bold text-[var(--black)]">
                  <span>{awaySummary.points} pts</span>
                  <span>{awaySummary.rebounds} reb</span>
                  <span>{awaySummary.assists} ast</span>
                  <span>{awaySummary.fouls} pf</span>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-[30px] border border-[var(--border)] bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2">
              <History className="h-4 w-4 text-[var(--yellow-dark)]" />
              <p className="fgb-label text-[var(--yellow-dark)]">Historico local</p>
            </div>
            <div className="mt-4 space-y-2">
              {recentActions.length === 0 ? (
                <p className="rounded-2xl bg-[var(--gray-l)] px-4 py-5 text-sm text-[var(--gray)]">
                  Os ultimos lancamentos rapidos vao aparecer aqui para facilitar a conferencia durante a operacao.
                </p>
              ) : (
                recentActions.map((item) => (
                  <div
                    key={item}
                    className="rounded-2xl border border-[var(--border)] bg-[var(--gray-l)] px-4 py-3 text-sm font-medium text-[var(--gray-d)]"
                  >
                    {item}
                  </div>
                ))
              )}
            </div>
          </section>

          <section className="rounded-[30px] border border-[var(--border)] bg-white p-5 shadow-sm">
            <p className="fgb-label text-[var(--gray)]">Glossario</p>
            <div className="mt-4 grid gap-2 text-sm text-[var(--gray-d)]">
              <span>
                <strong>FG:</strong> arremessos de quadra convertidos e tentados
              </span>
              <span>
                <strong>3P:</strong> bolas de 3 convertidas e tentadas
              </span>
              <span>
                <strong>FT:</strong> lances livres convertidos e tentados
              </span>
              <span>
                <strong>REB O/D:</strong> rebotes ofensivos e defensivos
              </span>
              <span>
                <strong>DNP:</strong> atleta no roster que nao atuou
              </span>
            </div>
          </section>
        </aside>
      </div>
    </div>
  )
}
