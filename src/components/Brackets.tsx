"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/Badge"
import { Trophy, ChevronRight } from "lucide-react"

type MatchItemProps = {
  homeTeam: string
  awayTeam: string
  homeScore?: number
  awayScore?: number
  homeLogo?: string
  awayLogo?: string
  status: string
  isFinal?: boolean
}

function MatchItem({ homeTeam, awayTeam, homeScore, awayScore, homeLogo, awayLogo, status, isFinal }: MatchItemProps) {
  const isHomeWinner = homeScore !== undefined && awayScore !== undefined && homeScore > awayScore
  const isAwayWinner = homeScore !== undefined && awayScore !== undefined && awayScore > homeScore

  return (
    <div className="relative group">
      <div className="bg-[#111] border border-white/5 rounded-2xl overflow-hidden shadow-lg transition-all hover:border-[#FF6B00]/30 w-64">
        {/* Home Team */}
        <div className={`flex items-center justify-between p-3 border-b border-white/[0.03] ${isHomeWinner ? 'bg-[#FF6B00]/5' : ''}`}>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden shrink-0">
               {homeLogo ? <img src={homeLogo} alt={homeTeam} className="w-full h-full object-cover" /> : <div className="text-[8px] font-black opacity-30 italic">L</div>}
            </div>
            <span className={`text-[10px] font-black uppercase tracking-tight truncate w-32 ${isHomeWinner ? 'text-white' : 'text-slate-500'}`}>
              {homeTeam}
            </span>
          </div>
          {homeScore !== undefined && (
            <span className={`text-sm font-display font-black ${isHomeWinner ? 'text-[#FF6B00]' : 'text-slate-600'}`}>{homeScore}</span>
          )}
        </div>

        {/* Away Team */}
        <div className={`flex items-center justify-between p-3 ${isAwayWinner ? 'bg-[#FF6B00]/5' : ''}`}>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden shrink-0">
               {awayLogo ? <img src={awayLogo} alt={awayTeam} className="w-full h-full object-cover" /> : <div className="text-[8px] font-black opacity-30 italic">L</div>}
            </div>
            <span className={`text-[10px] font-black uppercase tracking-tight truncate w-32 ${isAwayWinner ? 'text-white' : 'text-slate-500'}`}>
              {awayTeam}
            </span>
          </div>
          {awayScore !== undefined && (
            <span className={`text-sm font-display font-black ${isAwayWinner ? 'text-[#FF6B00]' : 'text-slate-600'}`}>{awayScore}</span>
          )}
        </div>
      </div>
      
      {/* Connector lines (CSS approach) */}
      {!isFinal && (
        <>
          <div className="absolute top-1/2 -right-6 w-6 h-[1px] bg-white/10 group-hover:bg-[#FF6B00]/30 transition-colors" />
        </>
      )}
    </div>
  )
}

export function Brackets() {
  return (
    <div className="p-8 overflow-x-auto">
      <div className="flex items-center gap-12 min-w-max pb-10">
        {/* Semi Finals */}
        <div className="flex flex-col gap-12">
          <div className="space-y-4">
             <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest px-4">Semi-Final 1</span>
             <MatchItem 
              homeTeam="Grêmio Náutico" 
              homeLogo="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR_x_O3Y_q0qVvL7H_0U8zR0Z2_k_W3u0Z_jQ&s"
              awayTeam="Sogipa" 
              homeScore={84} 
              awayScore={79} 
              status="Final"
             />
          </div>
          <div className="space-y-4">
             <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest px-4">Semi-Final 2</span>
             <MatchItem 
              homeTeam="União Corinthians" 
              awayTeam="Caxias do Sul" 
              homeScore={72} 
              awayScore={86} 
              status="Final"
             />
          </div>
        </div>

        {/* Finals Connector */}
        <div className="flex flex-col items-center justify-center h-full relative">
           <div className="w-[1px] h-[calc(100%-80px)] bg-white/10 absolute top-1/2 -translate-y-1/2 -left-6" />
        </div>

        {/* Grand Final */}
        <div className="flex flex-col items-center justify-center">
          <div className="space-y-4">
             <div className="flex items-center justify-center gap-2 mb-2">
                <Trophy className="w-4 h-4 text-[#FF6B00]" />
                <span className="text-[9px] font-black text-[#FF6B00] uppercase tracking-widest">Grande Final</span>
             </div>
             <MatchItem 
              homeTeam="Grêmio Náutico" 
              awayTeam="Caxias do Sul" 
              status="Scheduled"
              isFinal
             />
          </div>
        </div>
      </div>
    </div>
  )
}
