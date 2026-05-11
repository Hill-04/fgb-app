import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

type GameCardProps = {
  category: string
  homeTeam: string
  awayTeam: string
  location: string
  city: string
  dateTime: Date
  homeScore?: number | null
  awayScore?: number | null
  status: string
  blockName?: string | null
  phase: number
  className?: string
}

export function GameCard({
  category,
  homeTeam,
  awayTeam,
  location,
  city,
  dateTime,
  homeScore,
  awayScore,
  status,
  blockName,
  phase,
  className,
}: GameCardProps) {
  const hasScore = homeScore !== null && homeScore !== undefined && awayScore !== null && awayScore !== undefined

  return (
    <div className={cn("fgb-card p-4 space-y-3", className)}>
      <div className="flex items-center justify-between">
        <span className="fgb-badge fgb-badge-yellow">{category}</span>
        <span className="fgb-label" style={{ color: "var(--fgb-ink-500)" }}>
          Fase {phase}
        </span>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <span className="font-semibold truncate" style={{ color: "var(--fgb-ink-900)" }}>
            {homeTeam}
          </span>
          {hasScore && (
            <span
              className="tabular-nums"
              style={{ fontFamily: "var(--font-anton)", fontSize: 28, lineHeight: 1, color: "var(--fgb-ink-900)" }}
            >
              {homeScore}
            </span>
          )}
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="font-semibold truncate" style={{ color: "var(--fgb-ink-900)" }}>
            {awayTeam}
          </span>
          {hasScore && (
            <span
              className="tabular-nums"
              style={{ fontFamily: "var(--font-anton)", fontSize: 28, lineHeight: 1, color: "var(--fgb-ink-900)" }}
            >
              {awayScore}
            </span>
          )}
        </div>
      </div>

      <div className="pt-3 space-y-1" style={{ borderTop: "1px solid var(--fgb-ink-200)" }}>
        <div className="flex items-center justify-between text-xs">
          <span style={{ color: "var(--fgb-ink-600)" }}>
            {format(dateTime, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
          </span>
          {blockName && <span className="fgb-badge fgb-badge-outline">{blockName}</span>}
        </div>
        <div className="text-xs" style={{ color: "var(--fgb-ink-500)" }}>
          {location} — {city}
        </div>
      </div>

      {!hasScore && <GameStatusBadge status={status} />}
    </div>
  )
}

function GameStatusBadge({ status }: { status: string }) {
  if (status === "ONGOING") {
    return (
      <div className="pt-1">
        <span
          className="fgb-label inline-flex items-center gap-1.5 px-2.5 py-1"
          style={{
            background: "var(--fgb-red-500)",
            color: "#fff",
            animation: "fgb-pulse 1.4s ease-in-out infinite",
          }}
        >
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#fff" }} />
          Ao Vivo
        </span>
      </div>
    )
  }

  if (status === "SCHEDULED") {
    return (
      <div className="pt-1">
        <span className="fgb-badge fgb-badge-outline">Agendado</span>
      </div>
    )
  }

  if (status === "FINISHED") {
    return (
      <div className="pt-1">
        <span className="fgb-badge fgb-badge-verde">Finalizado</span>
      </div>
    )
  }

  if (status === "CANCELLED") {
    return (
      <div className="pt-1">
        <span className="fgb-badge fgb-badge-red">Cancelado</span>
      </div>
    )
  }

  if (status === "POSTPONED") {
    return (
      <div className="pt-1">
        <span className="fgb-badge fgb-badge-yellow">Adiado</span>
      </div>
    )
  }

  return null
}
