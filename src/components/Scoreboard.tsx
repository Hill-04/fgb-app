import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

type TeamSide = {
  name: string
  logoUrl?: string | null
}

type QuarterBreakdown = {
  home: Array<number | null>
  away: Array<number | null>
}

type ScoreboardProps =
  | {
      status: "LIVE"
      home: TeamSide
      away: TeamSide
      homeScore: number
      awayScore: number
      quarter: number
      clock: string
      breakdown?: QuarterBreakdown
      className?: string
    }
  | {
      status: "FINISHED"
      home: TeamSide
      away: TeamSide
      homeScore: number
      awayScore: number
      breakdown?: QuarterBreakdown
      className?: string
    }
  | {
      status: "SCHEDULED"
      home: TeamSide
      away: TeamSide
      dateTime: Date
      className?: string
    }

export function Scoreboard(props: ScoreboardProps) {
  return (
    <article
      className={cn("overflow-hidden", props.className)}
      style={{ background: "#fff", border: "1px solid var(--fgb-green-100)" }}
    >
      <ScoreboardHeader {...props} />

      <div
        className="grid items-center gap-4 px-6 py-8"
        style={{ gridTemplateColumns: "1fr auto 1fr" }}
      >
        <TeamBlock team={props.home} align="right" />
        <ScoreDisplay {...props} />
        <TeamBlock team={props.away} align="left" />
      </div>

      {(props.status === "LIVE" || props.status === "FINISHED") && props.breakdown && (
        <QuarterTable home={props.home.name} away={props.away.name} breakdown={props.breakdown} homeTotal={props.homeScore} awayTotal={props.awayScore} />
      )}
    </article>
  )
}

function ScoreboardHeader(props: ScoreboardProps) {
  if (props.status === "LIVE") {
    return (
      <div
        className="flex items-center justify-between px-4 py-2 fgb-label"
        style={{
          background: "var(--fgb-green-800)",
          color: "#fff",
          fontSize: 11,
          letterSpacing: "0.18em",
        }}
      >
        <span className="flex items-center gap-2">
          <span
            className="inline-block rounded-full animate-pulse"
            style={{ width: 8, height: 8, background: "var(--fgb-red-500)" }}
          />
          Ao Vivo · {props.quarter}º Q
        </span>
        <span style={{ fontFamily: "var(--font-mono)" }}>{props.clock}</span>
      </div>
    )
  }

  if (props.status === "FINISHED") {
    return (
      <div
        className="flex items-center justify-between px-4 py-2 fgb-label"
        style={{
          background: "var(--fgb-green-800)",
          color: "#fff",
          fontSize: 11,
          letterSpacing: "0.18em",
        }}
      >
        <span>Final</span>
      </div>
    )
  }

  return (
    <div
      className="flex items-center justify-between px-4 py-2 fgb-label"
      style={{
        background: "var(--fgb-green-800)",
        color: "rgba(255,255,255,0.85)",
        fontSize: 11,
        letterSpacing: "0.18em",
      }}
    >
      <span>Agendado</span>
      <span style={{ fontFamily: "var(--font-mono)" }}>
        {format(props.dateTime, "dd/MM 'às' HH:mm", { locale: ptBR })}
      </span>
    </div>
  )
}

function TeamBlock({ team, align }: { team: TeamSide; align: "left" | "right" }) {
  return (
    <div
      className={cn(
        "flex items-center gap-3",
        align === "right" ? "flex-row-reverse text-right justify-start" : "justify-start",
      )}
    >
      <div
        className="flex-shrink-0 overflow-hidden flex items-center justify-center"
        style={{
          width: 56,
          height: 56,
          background: "var(--fgb-green-50)",
          borderRadius: 8,
        }}
      >
        {team.logoUrl ? (
          <img src={team.logoUrl} alt={team.name} className="h-full w-full object-contain" />
        ) : (
          <span
            style={{
              fontFamily: "var(--font-anton)",
              fontSize: 22,
              color: "var(--fgb-green-700)",
            }}
          >
            {team.name[0]?.toUpperCase()}
          </span>
        )}
      </div>
      <div
        style={{
          fontFamily: "var(--font-anton)",
          fontSize: 18,
          lineHeight: 1.05,
          textTransform: "uppercase",
          letterSpacing: "0.02em",
          color: "var(--fgb-ink-900)",
        }}
      >
        {team.name}
      </div>
    </div>
  )
}

function ScoreDisplay(props: ScoreboardProps) {
  if (props.status === "SCHEDULED") {
    return (
      <div
        className="text-center"
        style={{
          fontFamily: "var(--font-anton)",
          fontSize: 36,
          color: "var(--fgb-ink-300)",
          lineHeight: 1,
        }}
      >
        VS
      </div>
    )
  }

  const winnerHome = props.homeScore > props.awayScore
  const winnerAway = props.awayScore > props.homeScore

  return (
    <div
      className="flex items-center gap-3 tabular-nums"
      style={{
        fontFamily: "var(--font-stencil)",
        fontWeight: 900,
        fontSize: 56,
        lineHeight: 1,
      }}
    >
      <span
        style={{
          color: winnerHome ? "var(--fgb-green-900)" : "var(--fgb-ink-400)",
          minWidth: 60,
          textAlign: "right",
        }}
      >
        {props.homeScore}
      </span>
      <span style={{ color: "var(--fgb-ink-300)", fontSize: 28 }}>—</span>
      <span
        style={{
          color: winnerAway ? "var(--fgb-green-900)" : "var(--fgb-ink-400)",
          minWidth: 60,
          textAlign: "left",
        }}
      >
        {props.awayScore}
      </span>
    </div>
  )
}

function QuarterTable({
  home,
  away,
  breakdown,
  homeTotal,
  awayTotal,
}: {
  home: string
  away: string
  breakdown: QuarterBreakdown
  homeTotal: number
  awayTotal: number
}) {
  const cols = Math.max(breakdown.home.length, breakdown.away.length)
  const headerCells = Array.from({ length: cols }, (_, i) => `Q${i + 1}`)

  return (
    <div
      style={{
        borderTop: "1px solid var(--fgb-green-100)",
        fontFamily: "var(--font-mono)",
        fontSize: 12,
      }}
    >
      <div
        className="grid items-center fgb-label"
        style={{
          gridTemplateColumns: `1fr repeat(${cols}, minmax(40px, 1fr)) 56px`,
          background: "var(--fgb-green-50)",
          color: "var(--fgb-ink-500)",
          fontSize: 10,
          letterSpacing: "0.18em",
          padding: "8px 16px",
        }}
      >
        <span>Time</span>
        {headerCells.map((q) => (
          <span key={q} className="text-center">{q}</span>
        ))}
        <span className="text-center" style={{ color: "var(--fgb-green-800)" }}>T</span>
      </div>

      {[
        { name: home, scores: breakdown.home, total: homeTotal },
        { name: away, scores: breakdown.away, total: awayTotal },
      ].map((row) => (
        <div
          key={row.name}
          className="grid items-center"
          style={{
            gridTemplateColumns: `1fr repeat(${cols}, minmax(40px, 1fr)) 56px`,
            padding: "10px 16px",
            borderTop: "1px solid var(--fgb-green-50)",
            color: "var(--fgb-ink-800)",
          }}
        >
          <span className="truncate fgb-label" style={{ fontSize: 11, color: "var(--fgb-ink-700)" }}>
            {row.name}
          </span>
          {Array.from({ length: cols }, (_, i) => (
            <span key={i} className="text-center tabular-nums">
              {row.scores[i] ?? "—"}
            </span>
          ))}
          <span
            className="text-center tabular-nums"
            style={{ fontFamily: "var(--font-anton)", fontSize: 16, color: "var(--fgb-green-900)" }}
          >
            {row.total}
          </span>
        </div>
      ))}
    </div>
  )
}
