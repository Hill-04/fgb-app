import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/db"
import { Section } from "@/components/Section"
import { Badge } from "@/components/Badge"
import { Calendar as CalendarIcon, MapPin, Clock, Trophy, ChevronRight } from "lucide-react"
import Link from "next/link"

export default async function TeamCalendarPage() {
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
      ]
    },
    include: {
      homeTeam: true,
      awayTeam: true,
      category: true,
      championship: true
    },
    orderBy: {
      dateTime: 'asc'
    }
  })

  // Group games by month
  const groupedGames = games.reduce((acc: any, game) => {
    const month = new Date(game.dateTime).toLocaleString('pt-BR', { month: 'long', year: 'numeric' })
    if (!acc[month]) acc[month] = []
    acc[month].push(game)
    return acc
  }, {})

  const upcomingGames = games.filter(g => new Date(g.dateTime) >= new Date())
  const pastGames = games.filter(g => new Date(g.dateTime) < new Date())

  return (
    <div className="space-y-10 max-w-5xl mx-auto">
      {/* Header */}
      <div className="animate-fade-in border-b border-white/[0.05] pb-8">
        <div className="flex items-center gap-3 mb-3">
           <div className="w-8 h-8 rounded-lg bg-[#FF6B00]/10 flex items-center justify-center">
              <CalendarIcon className="w-4 h-4 text-[#FF6B00]" />
           </div>
           <span className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Agenda de Jogos</span>
        </div>
        <h1 className="text-4xl font-display font-black text-white tracking-tight">Calendário da Temporada</h1>
        <p className="text-slate-400 mt-2 font-medium">Confira seus próximos confrontos, locais e horários confirmados.</p>
      </div>

      {games.length === 0 ? (
        <div className="bg-[#111] border border-white/5 rounded-3xl p-20 text-center animate-fade-up">
           <Trophy className="w-16 h-16 text-slate-800 mx-auto mb-6" />
           <h3 className="text-xl font-bold text-white mb-2">Nenhum jogo agendado</h3>
           <p className="text-slate-500 max-w-xs mx-auto mb-8">Sua equipe ainda não possui confrontos definidos em campeonatos ativos.</p>
           <Link href="/team/championships" className="px-8 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl font-bold transition-all border border-white/5">
             Ver Campeonatos
           </Link>
        </div>
      ) : (
        <div className="space-y-12">
          {Object.keys(groupedGames).map((month, idx) => (
            <div key={month} className="animate-fade-up" style={{ animationDelay: `${idx * 100}ms` }}>
              <h2 className="text-sm font-black text-slate-500 uppercase tracking-[0.3em] mb-6 flex items-center gap-4">
                {month}
                <div className="h-px flex-1 bg-white/5" />
              </h2>
              
              <div className="grid gap-4">
                {groupedGames[month].map((game: any) => {
                  const isHome = game.homeTeamId === teamId
                  const opponent = isHome ? game.awayTeam : game.homeTeam
                  const isPast = new Date(game.dateTime) < new Date()

                  return (
                    <div key={game.id} className={`group relative bg-[#111] border ${isPast ? 'border-white/[0.02] opacity-60' : 'border-white/5 hover:border-[#FF6B00]/30 shadow-lg'} rounded-3xl p-6 transition-all duration-300 overflow-hidden`}>
                      {/* Gradient Accent */}
                      {!isPast && (
                        <div className="absolute inset-0 bg-gradient-to-r from-[#FF6B00]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      )}
                      
                      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                        {/* Status & Date */}
                        <div className="flex items-center gap-6 min-w-[140px]">
                          <div className={`w-14 h-14 rounded-2xl ${isPast ? 'bg-white/5' : 'bg-[#FF6B00]/10 border border-[#FF6B00]/20'} flex flex-col items-center justify-center shrink-0`}>
                            <span className={`text-xs font-black uppercase ${isPast ? 'text-slate-500' : 'text-[#FF6B00]'}`}>
                              {new Date(game.dateTime).toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')}
                            </span>
                            <span className="text-2xl font-display font-black text-white leading-none">
                              {new Date(game.dateTime).getDate()}
                            </span>
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-white font-bold text-sm">
                              <Clock className="w-3.5 h-3.5 text-slate-500" />
                              {new Date(game.dateTime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                            </div>
                            <Badge variant={isPast ? "outline" : "orange"} size="sm" className="text-[9px] font-black tracking-widest uppercase">
                              {isPast ? "Finalizado" : "Confirmado"}
                            </Badge>
                          </div>
                        </div>

                        {/* Teams confrontation */}
                        <div className="flex-1 flex items-center justify-center gap-4 md:gap-12">
                           <div className="flex flex-col items-center gap-2 w-32">
                              <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-xs font-black overflow-hidden italic text-slate-500">
                                {game.homeTeam.logoUrl ? (
                                  <img src={game.homeTeam.logoUrl} alt={game.homeTeam.name} className="w-full h-full object-cover" />
                                ) : "LOGO"}
                              </div>
                              <span className="text-[10px] font-black text-white uppercase tracking-tight text-center line-clamp-1">{game.homeTeam.name}</span>
                              {game.homeTeamId === teamId && <Badge variant="outline" className="text-[8px] py-0 border-white/10 text-slate-500">CASA</Badge>}
                           </div>

                           <div className="flex flex-col items-center gap-1">
                              {isPast ? (
                                <div className="flex items-center gap-4">
                                  <span className="text-3xl font-display font-black text-white">{game.homeScore ?? 0}</span>
                                  <span className="text-slate-700 font-black">X</span>
                                  <span className="text-3xl font-display font-black text-white">{game.awayScore ?? 0}</span>
                                </div>
                              ) : (
                                <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-slate-600 font-display font-black text-xl italic tracking-tighter">VS</div>
                              )}
                              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.2em]">{game.category.name}</span>
                           </div>

                           <div className="flex flex-col items-center gap-2 w-32">
                              <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-xs font-black overflow-hidden italic text-slate-500">
                                {game.awayTeam.logoUrl ? (
                                  <img src={game.awayTeam.logoUrl} alt={game.awayTeam.name} className="w-full h-full object-cover" />
                                ) : "LOGO"}
                              </div>
                              <span className="text-[10px] font-black text-white uppercase tracking-tight text-center line-clamp-1">{game.awayTeam.name}</span>
                              {game.awayTeamId === teamId && <Badge variant="outline" className="text-[8px] py-0 border-white/10 text-slate-500">FORA</Badge>}
                           </div>
                        </div>

                        {/* Location & Action */}
                        <div className="lg:w-48 space-y-3">
                           <div className="flex items-start gap-2">
                              <MapPin className="w-4 h-4 text-[#FF6B00] shrink-0 mt-0.5" />
                              <div className="space-y-0.5">
                                <p className="text-[11px] font-black text-white uppercase leading-tight">{game.location}</p>
                                <p className="text-[10px] font-bold text-slate-500 uppercase">{game.city}, RS</p>
                              </div>
                           </div>
                           <Link 
                            href={`/team/games/${game.id}`}
                            className="w-full h-9 flex items-center justify-center gap-2 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 text-white text-[10px] font-black uppercase tracking-widest transition-all"
                           >
                              Ver Detalhes
                              <ChevronRight className="w-3 h-3 text-[#FF6B00]" />
                           </Link>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
