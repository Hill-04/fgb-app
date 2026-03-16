import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/db"
import { Badge } from "@/components/Badge"
import { ClipboardList, Trophy, Calendar, MapPin, Search } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

export default async function TeamResultsPage() {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'TEAM') {
    redirect('/login')
  }

  const teamId = (session.user as any).teamId

  const games = await prisma.game.findMany({
    where: {
      OR: [
        { homeTeamId: teamId },
        { awayTeamId: teamId }
      ],
      status: 'COMPLETED'
    },
    include: {
      homeTeam: true,
      awayTeam: true,
      championship: true,
      category: true
    },
    orderBy: {
      dateTime: 'desc'
    }
  })

  return (
    <div className="space-y-10 max-w-6xl mx-auto">
      <div className="animate-fade-in border-b border-white/[0.05] pb-8">
        <div className="flex items-center gap-3 mb-3">
           <div className="w-8 h-8 rounded-lg bg-[#FF6B00]/10 flex items-center justify-center">
              <ClipboardList className="w-4 h-4 text-[#FF6B00]" />
           </div>
           <span className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Histórico de Confrontos</span>
        </div>
        <h1 className="text-4xl font-display font-black text-white tracking-tight">Resultados Recentes</h1>
        <p className="text-slate-400 mt-2 font-medium">Confira o placar oficial de todos os seus jogos finalizados.</p>
      </div>

      {games.length === 0 ? (
        <div className="bg-[#111] border border-white/5 rounded-3xl p-20 text-center animate-fade-up">
           <Trophy className="w-16 h-16 text-slate-800 mx-auto mb-6" />
           <h3 className="text-xl font-bold text-white mb-2">Sem resultados registrados</h3>
           <p className="text-slate-500 max-w-xs mx-auto">Os resultados aparecerão aqui assim que as partidas forem encerradas pela organização.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {games.map((game) => (
            <Card key={game.id} className="bg-[#121212] border-white/5 rounded-3xl overflow-hidden group hover:border-[#FF6B00]/30 transition-all duration-300">
               <CardHeader className="p-6 pb-2 border-b border-white/5">
                  <div className="flex justify-between items-center">
                    <Badge variant="outline" className="text-[8px] uppercase tracking-tighter opacity-70">{game.category.name}</Badge>
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{game.championship.name}</span>
                  </div>
               </CardHeader>
               <CardContent className="p-6">
                  <div className="flex items-center justify-between gap-4 mb-6">
                     <div className="flex-1 text-center">
                        <div className="text-[10px] font-black uppercase text-slate-500 mb-2 truncate">CASA</div>
                        <div className={`font-display font-black text-sm uppercase leading-none h-8 flex items-center justify-center ${game.homeScore! > game.awayScore! ? 'text-[#FF6B00]' : 'text-white'}`}>
                          {game.homeTeam.name}
                        </div>
                     </div>
                     <div className="text-3xl font-display font-black italic text-white flex gap-3">
                        <span className={game.homeScore! > game.awayScore! ? 'text-[#FF6B00]' : ''}>{game.homeScore}</span>
                        <span className="text-slate-800">-</span>
                        <span className={game.awayScore! > game.homeScore! ? 'text-[#FF6B00]' : ''}>{game.awayScore}</span>
                     </div>
                     <div className="flex-1 text-center">
                        <div className="text-[10px] font-black uppercase text-slate-500 mb-2 truncate">FORA</div>
                        <div className={`font-display font-black text-sm uppercase leading-none h-8 flex items-center justify-center ${game.awayScore! > game.homeScore! ? 'text-[#FF6B00]' : 'text-white'}`}>
                          {game.awayTeam.name}
                        </div>
                     </div>
                  </div>
                  
                  <div className="space-y-2 pt-4 border-t border-white/5">
                     <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        <Calendar className="w-3.5 h-3.5 text-[#FF6B00]" />
                        {new Date(game.dateTime).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                     </div>
                     <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        <MapPin className="w-3.5 h-3.5 text-[#FF6B00]" />
                        <span className="truncate">{game.location}</span>
                     </div>
                  </div>
               </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
