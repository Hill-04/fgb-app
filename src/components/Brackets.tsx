"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/Badge"
import { Trophy, ChevronRight, Users } from "lucide-react"
import { cn } from "@/lib/utils"

type Game = {
  id: string
  homeTeam: { name: string, logoUrl?: string | null }
  awayTeam: { name: string, logoUrl?: string | null }
  homeScore: number | null
  awayScore: number | null
  status: string
  phase: number
}

type Props = {
  games: Game[]
  className?: string
}

function MatchItem({ game, isFinal }: { game: Game, isFinal?: boolean }) {
  const homeScore = game.homeScore ?? 0
  const awayScore = game.awayScore ?? 0
  const isHomeWinner = game.status === 'COMPLETED' && homeScore > awayScore
  const isAwayWinner = game.status === 'COMPLETED' && awayScore > homeScore
  const isScheduled = game.status === 'SCHEDULED'

  return (
    <div className="relative group">
      <div className={cn(
        "bg-[#111] border rounded-2xl overflow-hidden shadow-lg transition-all duration-500 w-64",
        isFinal ? "border-orange-500/40 shadow-orange-500/10" : "border-white/5 hover:border-white/20"
      )}>
        {/* Home Team */}
        <div className={cn(
          "flex items-center justify-between p-3 border-b border-white/[0.03] transition-colors",
          isHomeWinner ? "bg-orange-500/10" : ""
        )}>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden shrink-0">
               {game.homeTeam.logoUrl ? <img src={game.homeTeam.logoUrl} alt={game.homeTeam.name} className="w-full h-full object-cover" /> : <Users className="w-3 h-3 text-slate-700" />}
            </div>
            <span className={cn(
              "text-[10px] font-black uppercase tracking-tight truncate w-32",
              isHomeWinner ? "text-white" : isScheduled ? "text-slate-400" : "text-slate-600"
            )}>
              {game.homeTeam.name}
            </span>
          </div>
          {game.status === 'COMPLETED' && (
            <span className={cn("text-sm font-display font-black", isHomeWinner ? "text-[#FF6B00]" : "text-slate-600")}>{homeScore}</span>
          )}
        </div>

        {/* Away Team */}
        <div className={cn(
          "flex items-center justify-between p-3 transition-colors",
          isAwayWinner ? "bg-orange-500/10" : ""
        )}>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden shrink-0">
               {game.awayTeam.logoUrl ? <img src={game.awayTeam.logoUrl} alt={game.awayTeam.name} className="w-full h-full object-cover" /> : <Users className="w-3 h-3 text-slate-700" />}
            </div>
            <span className={cn(
              "text-[10px] font-black uppercase tracking-tight truncate w-32",
              isAwayWinner ? "text-white" : isScheduled ? "text-slate-400" : "text-slate-600"
            )}>
              {game.awayTeam.name}
            </span>
          </div>
          {game.status === 'COMPLETED' && (
            <span className={cn("text-sm font-display font-black", isAwayWinner ? "text-[#FF6B00]" : "text-slate-600")}>{awayScore}</span>
          )}
        </div>

        {isScheduled && (
          <div className="bg-white/[0.02] py-1 text-center border-t border-white/[0.03]">
             <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest">Aguardando Jogo</span>
          </div>
        )}
      </div>
      
      {!isFinal && (
        <div className="absolute top-1/2 -right-6 w-6 h-px bg-white/10" />
      )}
    </div>
  )
}

export function Brackets({ games, className }: Props) {
  const semiFinals = games.filter(g => g.phase === 2).slice(0, 2)
  const final = games.find(g => g.phase === 3)

  if (games.length === 0) return null

  return (
    <div className={cn("p-8 overflow-x-auto custom-scrollbar", className)}>
      <div className="flex items-center gap-12 min-w-max pb-10">
        {/* Semi Finals */}
        <div className="flex flex-col gap-12">
          {semiFinals.length > 0 ? semiFinals.map((game, i) => (
            <div key={game.id} className="space-y-4">
              <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest px-4">Semi-Final {i + 1}</span>
              <MatchItem game={game as any} />
            </div>
          )) : (
            <div className="w-64 h-24 border border-dashed border-white/10 rounded-2xl flex items-center justify-center text-[10px] font-black text-slate-700 uppercase">
              Semis a definir
            </div>
          )}
        </div>

        {/* Finals Connector */}
        <div className="flex flex-col items-center justify-center h-full relative">
           <div className="w-px h-full bg-white/10 absolute top-0 -left-6" />
        </div>

        {/* Grand Final */}
        <div className="flex flex-col items-center justify-center">
          <div className="space-y-4">
             <div className="flex items-center justify-center gap-2 mb-2">
                <Trophy className="w-5 h-5 text-[#FF6B00] animate-bounce" />
                <span className="text-sm font-display font-black text-[#FF6B00] uppercase tracking-tighter italic">Grande Final</span>
             </div>
             {final ? (
               <MatchItem game={final as any} isFinal />
             ) : (
               <div className="w-64 h-24 border border-dashed border-orange-500/20 rounded-2xl flex items-center justify-center text-[10px] font-black text-orange-500/30 uppercase">
                 Final a definir
               </div>
             )}
          </div>
        </div>
      </div>
    </div>
  )
}
