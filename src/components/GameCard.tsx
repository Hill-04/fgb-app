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
        <span className="text-xs text-[var(--gray)]">Fase {phase}</span>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-[var(--black)]">{homeTeam}</span>
          {hasScore && <span className="text-2xl font-bold text-[var(--black)]">{homeScore}</span>}
        </div>
        <div className="flex items-center justify-between">
          <span className="font-semibold text-[var(--black)]">{awayTeam}</span>
          {hasScore && <span className="text-2xl font-bold text-[var(--black)]">{awayScore}</span>}
        </div>
      </div>

      <div className="pt-3 border-t border-[var(--border)] space-y-1">
        <div className="flex items-center justify-between text-xs">
          <span className="text-[var(--gray-d)]">
            {format(dateTime, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
          </span>
          {blockName && (
            <Badge variant="default" size="sm">{blockName}</Badge>
          )}
        </div>
        <div className="text-xs text-[var(--gray)]">
          {location} - {city}
        </div>
      </div>

      {/* Custom Status Display */}
      {!hasScore && (
        <div className="pt-1">
          {status === "ONGOING" && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] uppercase font-bold status-live">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--amarelo)]"></span>
              Em Andamento
            </span>
          )}
          {status === "SCHEDULED" && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] uppercase font-bold status-scheduled">
              Agendado
            </span>
          )}
          {status === "FINISHED" && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] uppercase font-bold status-finished">
              Finalizado
            </span>
          )}
          {(status === "CANCELLED" || status === "POSTPONED") && (
            <Badge variant={status === "CANCELLED" ? "error" : "warning"} size="sm">
              {status === "CANCELLED" ? "Cancelado" : "Adiado"}
            </Badge>
          )}
        </div>
      )}
    </div>
  )
}
