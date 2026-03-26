"use client"

import { Trophy, Users, Award } from "lucide-react"
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
  const isFinished = game.status === 'FINISHED' || game.status === 'COMPLETED'
  const isHomeWinner = isFinished && homeScore > awayScore
  const isAwayWinner = isFinished && awayScore > homeScore
  const isScheduled = game.status === 'SCHEDULED'

  return (
    <div className="relative group perspective-1000">
      <div className={cn(
        "bg-[#111] border rounded-2xl overflow-hidden shadow-2xl transition-all duration-500 w-64 transform-gpu group-hover:-translate-y-1",
        isFinal 
          ? "border-orange-500/40 shadow-orange-500/20 ring-1 ring-orange-500/20" 
          : "border-white/5 hover:border-white/20"
      )}>
        {/* Home Team */}
        <div className={cn(
          "flex items-center justify-between p-3 border-b border-white/[0.03] transition-colors relative",
          isHomeWinner ? "bg-orange-500/10" : ""
        )}>
          {isHomeWinner && (
             <div className="absolute left-0 top-0 w-1 h-full bg-orange-500" />
          )}
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
               {game.homeTeam.logoUrl ? (
                 <img src={game.homeTeam.logoUrl} alt={game.homeTeam.name} className="w-full h-full object-cover p-0.5" />
               ) : (
                 <Users className="w-3.5 h-3.5 text-slate-700" />
               )}
            </div>
            <span className={cn(
              "text-[11px] font-black uppercase tracking-tight truncate",
              isHomeWinner ? "text-white" : isScheduled ? "text-slate-400" : "text-slate-500"
            )}>
              {game.homeTeam.name}
            </span>
          </div>
          {isFinished && (
            <span className={cn(
              "text-sm font-black tabular-nums font-mono px-2", 
              isHomeWinner ? "text-[#FF6B00]" : "text-slate-600"
            )}>
              {homeScore}
            </span>
          )}
        </div>

        {/* Away Team */}
        <div className={cn(
          "flex items-center justify-between p-3 transition-colors relative",
          isAwayWinner ? "bg-orange-500/10" : ""
        )}>
          {isAwayWinner && (
             <div className="absolute left-0 top-0 w-1 h-full bg-orange-500" />
          )}
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
               {game.awayTeam.logoUrl ? (
                 <img src={game.awayTeam.logoUrl} alt={game.awayTeam.name} className="w-full h-full object-cover p-0.5" />
               ) : (
                 <Users className="w-3.5 h-3.5 text-slate-700" />
               )}
            </div>
            <span className={cn(
              "text-[11px] font-black uppercase tracking-tight truncate",
              isAwayWinner ? "text-white" : isScheduled ? "text-slate-400" : "text-slate-500"
            )}>
              {game.awayTeam.name}
            </span>
          </div>
          {isFinished && (
            <span className={cn(
              "text-sm font-black tabular-nums font-mono px-2", 
              isAwayWinner ? "text-[#FF6B00]" : "text-slate-600"
            )}>
              {awayScore}
            </span>
          )}
        </div>

        {isScheduled && (
          <div className="bg-white/[0.02] py-1 text-center border-t border-white/[0.03]">
             <span className="text-[8px] font-black text-slate-600 uppercase tracking-[0.2em]">Live Tracking</span>
          </div>
        )}
      </div>
      
      {!isFinal && (
        <div className="absolute top-1/2 -right-12 w-12 flex items-center">
           <div className="h-px flex-1 bg-gradient-to-r from-white/20 to-transparent" />
        </div>
      )}
    </div>
  )
}

export function Brackets({ games, className }: Props) {
  if (!games || games.length === 0) return (
    <div className="flex flex-col items-center justify-center p-20 border-2 border-dashed border-white/5 rounded-[40px] bg-white/[0.01]">
       <Trophy className="w-12 h-12 text-slate-800 mb-4" />
       <p className="text-xs font-black uppercase tracking-widest text-slate-600">Aguardando definição da fase final</p>
    </div>
  )

  // Organizar jogos por fase (mata-mata costuma começar da fase 2 adiante)
  const phasesMap = new Map<number, Game[]>()
  games.forEach(g => {
    if (g.phase >= 2) {
      if (!phasesMap.has(g.phase)) phasesMap.set(g.phase, [])
      phasesMap.get(g.phase)!.push(g)
    }
  })

  const sortedPhases = Array.from(phasesMap.keys()).sort((a, b) => a - b)
  const lastPhase = sortedPhases[sortedPhases.length - 1]

  const getPhaseName = (phase: number, totalPhases: number) => {
    if (phase === lastPhase) return "Grande Final"
    if (phase === lastPhase - 1) return "Semi-Final"
    if (phase === lastPhase - 2) return "Quartas de Final"
    return `Fase ${phase}`
  }

  return (
    <div className={cn("relative p-4 overflow-x-auto custom-scrollbar", className)}>
      <div className="flex items-start gap-20 min-w-max pb-12 pt-8">
        {sortedPhases.map((phaseNum, phaseIdx) => (
          <div key={phaseNum} className="flex flex-col gap-16 relative">
             <div className="flex items-center gap-3 mb-4 px-4">
                <div className="w-1.5 h-1.5 rounded-full bg-[#FF6B00] shadow-[0_0_10px_rgba(255,107,0,0.5)]" />
                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/50 whitespace-nowrap">
                   {getPhaseName(phaseNum, sortedPhases.length)}
                </h3>
             </div>
             
             <div className={cn(
               "flex flex-col gap-12 justify-around flex-1",
               phaseIdx > 0 && "py-8"
             )}>
                {phasesMap.get(phaseNum)?.map((game) => (
                  <MatchItem 
                    key={game.id} 
                    game={game} 
                    isFinal={phaseNum === lastPhase} 
                  />
                ))}
             </div>

             {phaseIdx === sortedPhases.length - 1 && (
               <div className="absolute -top-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
                 <div className="bg-[#FF6B00]/10 border border-[#FF6B00]/30 p-4 rounded-full shadow-[0_0_30px_rgba(255,107,0,0.1)]">
                    <Trophy className="w-8 h-8 text-[#FF6B00] drop-shadow-[0_0_10px_rgba(255,107,0,0.5)]" />
                 </div>
               </div>
             )}
          </div>
        ))}
      </div>

      {/* Background Decorative Element */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-orange-500/5 blur-[120px] rounded-full pointer-events-none -z-10" />
    </div>
  )
}

