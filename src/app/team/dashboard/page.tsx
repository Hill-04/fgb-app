import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/db"
import { StatCard } from "@/components/StatCard"
import { Section } from "@/components/Section"
import { Badge } from "@/components/Badge"
import Link from "next/link"
import { Trophy, Calendar, Users, Award, MapPin, Shield, CheckCircle2, ChevronRight, PartyPopper } from "lucide-react"
import { Brackets } from "@/components/Brackets"
import { cn } from "@/lib/utils"

export default async function TeamDashboardPage() {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'TEAM') {
    redirect('/login')
  }

  try {
    const teamId = (session.user as any).teamId

    // Buscar dados da equipe
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: {
        gym: true,
        registrations: {
          include: {
            championship: true,
            categories: {
              include: {
                category: true
              }
            }
          }
        },
        homeGames: {
          where: {
            dateTime: {
              gte: new Date()
            }
          },
          orderBy: {
            dateTime: 'asc'
          },
          take: 1,
          include: {
            awayTeam: true,
            category: true,
            championship: true
          }
        }
      }
    })

    if (!team) {
      return <div>Equipe não encontrada</div>
    }

    // Buscar campeonatos abertos e check registrations
    const openChampionships = await prisma.championship.findMany({
      where: {
        status: 'REGISTRATION_OPEN',
        // sex: team.sex || undefined // Removendo filtro restritivo para aparecerem todos
      },
      include: {
        categories: true,
        _count: {
          select: {
            registrations: true
          }
        },
        registrations: {
          where: { teamId }
        }
      },
      take: 6
    })

    const nextGame = team.homeGames[0]
    const totalCategories = team.registrations.reduce((acc, reg) => acc + reg.categories.length, 0)
    // Mudança: Contar qualquer inscrição não rejeitada para o status principal
    const activeRegistrations = team.registrations.filter(r => r.status !== 'REJECTED').length
    const confirmedRegistrations = team.registrations.filter(r => r.status === 'CONFIRMED').length

    return (
      <div className="space-y-10">
        {/* Header */}
        <div className="animate-fade-in flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/[0.05] pb-10">
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 rounded-3xl bg-[#111] border border-white/10 flex items-center justify-center overflow-hidden shrink-0 shadow-2xl relative group">
              {team.logoUrl ? (
                <img src={team.logoUrl} alt={team.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
              ) : (
                <Shield className="w-10 h-10 text-slate-700" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
            </div>
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Badge variant="orange" className="bg-[#FF6B00]/10 text-[#FF6B00] border-[#FF6B00]/20 font-black uppercase tracking-widest text-[10px]">
                  Equipe Oficial FGB
                </Badge>
                <div className="h-4 w-px bg-white/10" />
                <span className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">CONFERÊNCIA RS</span>
              </div>
              <h1 className="text-5xl font-display font-black text-white tracking-tight leading-tight italic uppercase">
                {team.name}
              </h1>
              <div className="flex items-center gap-4 mt-2">
                <div className="flex items-center gap-1.5 text-slate-400 font-bold uppercase tracking-widest text-[11px]">
                  <MapPin className="w-3.5 h-3.5 text-[#FF6B00]" />
                  {team.city}, {team.state || 'RS'}
                </div>
                <div className="w-1.5 h-1.5 rounded-full bg-white/10" />
                <div className="text-slate-400 font-bold uppercase tracking-widest text-[11px]">
                  {team.sex === 'masculino' ? '♂ Masculino' : '♀ Feminino'}
                </div>
              </div>
            </div>
          </div>
          <div className="flex gap-3">
             <Link 
               href="/team/profile" 
               className="h-11 px-6 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 text-white font-bold text-xs flex items-center transition-all group"
             >
               Editar Perfil
               <ChevronRight className="w-3.5 h-3.5 ml-2 group-hover:translate-x-1 transition-transform" />
             </Link>
             <Link 
               href="/team/championships" 
               className="h-11 px-6 rounded-xl bg-[#FF6B00] hover:bg-[#E66000] text-white font-black uppercase italic tracking-tighter text-xs flex items-center transition-all shadow-[0_4px_15px_rgba(255,107,0,0.3)] hover:scale-105 active:scale-95"
             >
               Novas Inscrições
               <Trophy className="w-3.5 h-3.5 ml-2" />
             </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-fade-up" style={{ animationDelay: '100ms' }}>
          <StatCard
            label="Situação Geral"
            value={activeRegistrations > 0 ? "Ativa" : "Inativa"}
            sublabel={activeRegistrations > 0 ? `${activeRegistrations} Inscrição(ões)` : "Sem inscrições no momento"}
            accent="orange"
            icon={<Trophy className="w-5 h-5" />}
          />

          <StatCard
            label="Calendário"
            value={nextGame ? new Date(nextGame.dateTime).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }) : "—"}
            sublabel={nextGame ? `vs ${nextGame.awayTeam.name}` : "Aguardando sorteio"}
            accent="blue"
            icon={<Calendar className="w-5 h-5" />}
          />

          <StatCard
            label="Categorias"
            value={totalCategories}
            sublabel={`${confirmedRegistrations} confirmada(s)`}
            accent="green"
            icon={<Users className="w-5 h-5" />}
          />

          <StatCard
            label="Ginásio / Sede"
            value={team.gym?.canHost ? "Disponível" : "Indisponível"}
            sublabel={team.gym?.name ? team.gym.name.slice(0, 20) + '...' : "Deseja ser sede?"}
            accent="purple"
            icon={<Award className="w-5 h-5" />}
          />
        </div>

        {/* Campeonatos Abertos */}
        {openChampionships.length > 0 && (
          <div className="animate-fade-up" style={{ animationDelay: '200ms' }}>
            <Section
              title="Campeonatos FGB"
              subtitle="Inscrições abertas e oportunidades de jogo"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {openChampionships.map((championship) => {
                  const isRegistered = championship.registrations.length > 0
                  
                  return (
                    <Link
                      key={championship.id}
                      href={isRegistered ? `/team/dashboard` : `/team/championships/${championship.id}/register`}
                      className={cn(
                        "bg-[#111] border p-6 rounded-[2rem] flex flex-col justify-between hover:shadow-2xl transition-all duration-500 group relative overflow-hidden",
                        isRegistered ? "border-green-500/30" : "border-white/5 hover:border-[#FF6B00]/30"
                      )}
                    >
                      {/* Premium Badge for Registered */}
                      {isRegistered && (
                        <div className="absolute top-0 right-0 bg-green-500 px-4 py-1.5 rounded-bl-2xl font-black italic uppercase text-[9px] tracking-widest flex items-center gap-1 shadow-lg z-20">
                           <CheckCircle2 className="w-3 h-3 text-white" />
                           Inscrito
                        </div>
                      )}

                      <div className="space-y-5 relative z-10">
                        <div className="flex flex-col gap-4">
                          <div className="flex items-start justify-between">
                             <Badge
                               variant={isRegistered ? "success" : "orange"}
                               className={cn(
                                 "shadow-sm border-none font-black uppercase text-[9px] tracking-widest h-6 px-3",
                                 isRegistered ? "bg-green-500/10 text-green-500" : "bg-[#FF6B00]/10 text-[#FF6B00]"
                               )}
                             >
                               {isRegistered ? "Vaga Garantida" : "Fase de Inscrição"}
                             </Badge>
                            <div className="w-10 h-10 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center opacity-70 group-hover:opacity-100 group-hover:bg-white/10 group-hover:scale-110 transition-all text-xl">
                              {championship.sex === 'masculino' ? '🏀' : '🎀'}
                            </div>
                          </div>
                          <div>
                            <h3 className="font-display font-black text-2xl text-white tracking-tight group-hover:text-[#FF6B00] transition-colors leading-tight italic uppercase">
                              {championship.name}
                            </h3>
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mt-2">
                              {championship.sex === 'masculino' ? '♂ Categoria Masculina' : '♀ Categoria Feminina'}
                            </p>
                          </div>
                        </div>
  
                        <div className="space-y-3 bg-white/5 p-4 rounded-3xl border border-white/5 group-hover:bg-white/[0.08] transition-all">
                          <div className="flex flex-wrap gap-2">
                            {championship.categories.slice(0, 4).map((cat: { id: string; name: string }) => (
                              <Badge key={cat.id} variant="outline" size="sm" className="bg-transparent border-white/10 text-slate-400 font-bold group-hover:border-[#FF6B00]/20">
                                {cat.name}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
  
                      <div className="pt-6 mt-5 border-t border-white/5 relative z-10">
                        {isRegistered ? (
                          <div className="w-full flex items-center justify-center gap-2 py-3 bg-green-500/10 rounded-2xl border border-green-500/20 text-green-400 font-black uppercase italic tracking-tighter text-sm">
                             <PartyPopper className="w-4 h-4" />
                             Equipe Validada
                          </div>
                        ) : (
                          <button className="w-full relative group/btn overflow-hidden rounded-2xl bg-[#FF6B00] hover:bg-[#E66000] text-white font-black italic uppercase py-3.5 shadow-lg transition-all tracking-tighter italic">
                            <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/btn:animate-[shimmer_1.5s_infinite]" />
                            Garantir Vaga →
                          </button>
                        )}
                        <div className="text-center text-[9px] font-black text-slate-600 mt-3 tracking-[0.2em] uppercase">
                          {championship._count.registrations} EQUIPE(S) JÁ GARANTIDAS
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </Section>
          </div>
        )}

        {/* Minhas Inscrições (Visible Only if registered) */}
        {team.registrations.length > 0 && (
          <div className="animate-fade-up" style={{ animationDelay: '300ms' }}>
            <Section
              title="Meu Painel de Competição"
              subtitle={`Gerencie suas ${team.registrations.length} participações ativas`}
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {team.registrations.map((registration) => (
                  <div key={registration.id} className="bg-[#111] border border-white/5 shadow-2xl p-6 rounded-[2.5rem] flex flex-col justify-between hover:border-white/10 transition-all duration-300 group relative overflow-hidden">
                    <div className="absolute -top-10 -right-10 w-40 h-40 bg-[#FF6B00]/10 rounded-full blur-3xl group-hover:bg-[#FF6B00]/20 transition-all duration-700" />
                    
                    <div className="relative z-10">
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                           <div className="w-12 h-12 rounded-2xl bg-[#FF6B00]/10 flex items-center justify-center">
                              <Trophy className="w-6 h-6 text-[#FF6B00]" />
                           </div>
                           <div>
                              <h3 className="font-display font-black text-xl text-white tracking-tight leading-tight italic uppercase">
                                {registration.championship.name}
                              </h3>
                              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">ESTADUAL 2026</p>
                           </div>
                        </div>
                        <Badge
                          variant={
                            registration.status === 'CONFIRMED' ? 'success' :
                            registration.status === 'PENDING' ? 'warning' : 'error'
                          }
                          className={cn(
                            "font-black uppercase italic tracking-widest text-[9px] h-7 px-4 shadow-sm",
                            registration.status === 'CONFIRMED' ? "bg-green-500 text-white" : 
                            registration.status === 'PENDING' ? "bg-orange-500/20 text-orange-500 border border-orange-500/20" : 
                            "bg-red-500 text-white"
                          )}
                        >
                          {registration.status === 'CONFIRMED' ? 'APROVADO' :
                           registration.status === 'PENDING' ? 'PROCESSANDO' : 'REJEITADO'}
                        </Badge>
                      </div>

                      <div className="flex flex-wrap gap-2 mb-8">
                        {registration.categories.map((regCat) => (
                          <div key={regCat.id} className="px-4 py-2 rounded-xl bg-white/5 border border-white/5 flex flex-col">
                             <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest">Categoria</span>
                             <span className="text-xs font-bold text-white uppercase italic">{regCat.category.name}</span>
                          </div>
                        ))}
                      </div>

                      <div className="flex items-center justify-between">
                         <div className="flex items-center gap-2">
                            <div className="flex -space-x-2">
                               {[1,2,3].map(i => (
                                 <div key={i} className="w-6 h-6 rounded-full border-2 border-[#111] bg-slate-800" />
                               ))}
                            </div>
                            <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">12 Equipes</span>
                         </div>
                         <Link
                          href={`/team/championships/${registration.championship.id}`}
                          className="px-6 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold text-xs transition-all border border-white/5 group-hover:border-white/10"
                        >
                          Ver Tabela →
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Section>
          </div>
        )}

        {/* Playoffs / Chaveamento Section */}
        <div className="animate-fade-up" style={{ animationDelay: '250ms' }}>
          <Section
            title="Séries de Playoffs"
            subtitle="Caminho rumo às finais estaduais"
          >
            <div className="bg-[#111] border border-white/5 rounded-[3rem] overflow-hidden shadow-[0_30px_60px_rgba(0,0,0,0.5)]">
              <div className="bg-white/[0.02] px-8 py-6 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-2xl bg-[#FF6B00]/10 flex items-center justify-center">
                    <Brackets className="w-5 h-5 text-[#FF6B00]" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-white uppercase tracking-tighter italic">Key Chaveamento FGB</h3>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mt-0.5">Atualizado em tempo real</p>
                  </div>
                </div>
                <Badge variant="orange" className="font-black text-[10px] italic px-4 h-8 bg-[#FF6B00] text-white">PLAYOFFS 2026</Badge>
              </div>
              <Brackets />
              <div className="px-8 py-6 bg-white/[0.01] border-t border-white/5 text-center">
                 <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em]">IA Engine optimized for tournament brackets</p>
              </div>
            </div>
          </Section>
        </div>
      </div>
    )
  } catch (error: any) {
    console.error(error)
    return (
      <div className="space-y-10">
        <div className="animate-fade-in flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/[0.05] pb-10">
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 rounded-3xl bg-[#111] border border-white/10 flex items-center justify-center">
              <Shield className="w-10 h-10 text-slate-700" />
            </div>
            <div>
              <h1 className="text-5xl font-display font-black text-white tracking-tight leading-tight uppercase italic">Dashboard</h1>
            </div>
          </div>
        </div>
        <div className="bg-[#111] border border-[#FF6B00]/20 rounded-3xl p-16 text-center">
          <h3 className="text-xl font-black text-white mb-2 uppercase italic">Aguardando dados...</h3>
          <p className="text-slate-500 text-sm max-w-sm mx-auto font-medium">Não conseguimos conectar com o motor de dados da FGB. Tente atualizar a página.</p>
        </div>
      </div>
    )
  }
}
