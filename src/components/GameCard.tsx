import { Badge } from "./Badge"
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
  className
}: GameCardProps) {
  const hasScore = homeScore !== null && homeScore !== undefined && awayScore !== null && awayScore !== undefined

  return (
    <div className={cn("card-fgb p-4 space-y-3", className)}>
      <div className="flex items-center justify-between">
        <Badge variant="orange" size="sm">{category}</Badge>
        <span className="text-xs text-[--text-dim]">Fase {phase}</span>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-[--text-main]">{homeTeam}</span>
          {hasScore && <span className="text-2xl font-bold text-[--text-main]">{homeScore}</span>}
        </div>
        <div className="flex items-center justify-between">
          <span className="font-semibold text-[--text-main]">{awayTeam}</span>
          {hasScore && <span className="text-2xl font-bold text-[--text-main]">{awayScore}</span>}
        </div>
      </div>

      <div className="pt-3 border-t border-[--border-color] space-y-1">
        <div className="flex items-center justify-between text-xs">
          <span className="text-[--text-secondary]">
            {format(dateTime, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
          </span>
          {blockName && (
            <Badge variant="default" size="sm">{blockName}</Badge>
          )}
        </div>
        <div className="text-xs text-[--text-dim]">
          {location} - {city}
        </div>
      </div>

      {status !== "SCHEDULED" && !hasScore && (
        <Badge
          variant={status === "CANCELLED" ? "error" : "warning"}
          size="sm"
          className="mt-2"
        >
          {status === "CANCELLED" ? "Cancelado" : status === "POSTPONED" ? "Adiado" : status}
        </Badge>
      )}
    </div>
  )
}
