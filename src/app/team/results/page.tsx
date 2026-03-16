import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/db"
import { Badge } from "@/components/Badge"
import { ClipboardList, Trophy, Calendar, MapPin } from "lucide-react"

export const dynamic = 'force-dynamic'

export default async function TeamResultsPage() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) redirect('/login')

    const teamId = (session.user as any).teamId
    if (!teamId) {
      return (
        <div className="space-y-10 max-w-6xl mx-auto">
          <div className="animate-fade-in border-b border-white/[0.05] pb-8">
            <h1 className="text-4xl font-display font-black text-white tracking-tight">Resultados</h1>
          </div>
          <div className="bg-[#111] border border-white/5 rounded-3xl p-20 text-center">
            <Trophy className="w-16 h-16 text-slate-800 mx-auto mb-6" />
            <h3 className="text-xl font-bold text-white mb-2">Sem equipe vinculada</h3>
            <p className="text-slate-500 max-w-xs mx-auto">Sua conta ainda não está vinculada a uma equipe.</p>
          </div>
        </div>
      )
    }

    const games = await prisma.game.findMany({
      where: {
        OR: [{ homeTeamId: teamId }, { awayTeamId: teamId }],
        status: 'COMPLETED'
      },
      include: { homeTeam: true, awayTeam: true, championship: true, category: true },
      orderBy: { dateTime: 'desc' }
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
            <p className="text-slate-500 max-w-xs mx-auto">Os resultados aparecerão aqui assim que as partidas forem encerradas.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {games.map((game) => (
              <div key={game.id} className="bg-[#121212] border border-white/5 rounded-3xl overflow-hidden hover:border-[#FF6B00]/30 transition-all duration-300">
                <div className="p-5 pb-3 border-b border-white/5 flex justify-between items-center">
                  <Badge variant="outline" className="text-[8px] uppercase tracking-tighter opacity-70">{game.category.name}</Badge>
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest truncate ml-2">{game.championship.name}</span>
                </div>
                <div className="p-6">
                  <div className="flex items-center justify-between gap-4 mb-6">
                    <div className="flex-1 text-center">
                      <div className="text-[10px] font-black uppercase text-slate-500 mb-2">CASA</div>
                      <div className={`font-display font-black text-sm uppercase leading-none h-8 flex items-center justify-center ${(game.homeScore ?? 0) > (game.awayScore ?? 0) ? 'text-[#FF6B00]' : 'text-white'}`}>
                        {game.homeTeam.name}
                      </div>
                    </div>
                    <div className="text-3xl font-display font-black italic text-white flex gap-3">
                      <span className={(game.homeScore ?? 0) > (game.awayScore ?? 0) ? 'text-[#FF6B00]' : ''}>{game.homeScore ?? 0}</span>
                      <span className="text-slate-800">-</span>
                      <span className={(game.awayScore ?? 0) > (game.homeScore ?? 0) ? 'text-[#FF6B00]' : ''}>{game.awayScore ?? 0}</span>
                    </div>
                    <div className="flex-1 text-center">
                      <div className="text-[10px] font-black uppercase text-slate-500 mb-2">FORA</div>
                      <div className={`font-display font-black text-sm uppercase leading-none h-8 flex items-center justify-center ${(game.awayScore ?? 0) > (game.homeScore ?? 0) ? 'text-[#FF6B00]' : 'text-white'}`}>
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
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  } catch (error: any) {
    return (
      <div className="space-y-10 max-w-6xl mx-auto">
        <div className="animate-fade-in border-b border-white/[0.05] pb-8">
          <h1 className="text-4xl font-display font-black text-white tracking-tight">Resultados</h1>
        </div>
        <div className="bg-[#111] border border-white/5 rounded-3xl p-20 text-center">
          <ClipboardList className="w-16 h-16 text-slate-800 mx-auto mb-6" />
          <h3 className="text-xl font-bold text-white mb-2">Sem resultados disponíveis</h3>
          <p className="text-slate-500 max-w-xs mx-auto">Os resultados aparecerão aqui assim que os jogos forem finalizados.</p>
        </div>
      </div>
    )
  }
}
