import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/db"
import { StatCard } from "@/components/StatCard"
import { Section } from "@/components/Section"
import { Badge } from "@/components/Badge"
import Link from "next/link"
import { Trophy, Calendar, Users, Award, MapPin, Shield, CheckCircle2, ChevronRight, PartyPopper, Brackets as BracketsIcon } from "lucide-react"
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

    // Buscar campeonatos abertos
    const openChampionships = await (prisma.championship.findMany({
      where: {
        status: 'REGISTRATION_OPEN',
        isSimulation: false,
      } as any,
      include: {
        categories: true,
        _count: { select: { registrations: true } },
        registrations: {
          where: { teamId }
        }
      } as any,
      take: 6
    }) as any)

    // Fetch playoff bracket preview for team (first championship category with playoffs)
    const playoffCategory = await prisma.championshipCategory.findFirst({
      where: {
        championship: {
          registrations: { some: { teamId } },
          hasPlayoffs: true
        },
        games: { some: { phase: { gt: 1 } } }
      },
      include: {
        games: {
          where: { phase: { gt: 1 } },
          include: {
            homeTeam: { select: { name: true, logoUrl: true } },
            awayTeam: { select: { name: true, logoUrl: true } }
          },
          orderBy: { dateTime: 'asc' }
        }
      }
    })

    const nextGame = team.homeGames[0]
    const totalCategories = team.registrations.reduce((acc: number, reg: any) => acc + reg.categories.length, 0)
    // Mudança: Contar qualquer inscrição não rejeitada para o status principal
    const activeRegistrations = team.registrations.filter((r: any) => r.status !== 'REJECTED').length
    const confirmedRegistrations = team.registrations.filter((r: any) => r.status === 'CONFIRMED').length

    return (
      <div className="space-y-10 font-sans">
        {/* Header */}
        <div className="animate-fade-in flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-[var(--border)] pb-10">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
            <div className="w-24 h-24 rounded-3xl bg-white border border-[var(--border)] flex items-center justify-center overflow-hidden shrink-0 shadow-sm relative group">
              {team.logoUrl ? (
                <img src={team.logoUrl} alt={team.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
              ) : (
                <Shield className="w-10 h-10 text-[var(--gray)]" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/5 to-transparent border-t border-white/20" />
            </div>
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Badge variant="outline" className="bg-orange-50 text-orange-600 border-orange-200 font-black uppercase tracking-widest text-[10px]">
                  Equipe Oficial FGB
                </Badge>
                <div className="h-4 w-px bg-[var(--border)]" />
                <span className="text-[var(--gray)] font-bold uppercase tracking-widest text-[10px]">CONFERÊNCIA RS</span>
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-display font-black text-[var(--black)] tracking-tight leading-tight italic uppercase">
                {team.name}
              </h1>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 mt-2">
                <div className="flex items-center gap-1.5 text-[var(--gray)] font-bold uppercase tracking-widest text-[11px]">
                  <MapPin className="w-3.5 h-3.5 text-[var(--verde)]" />
                  {team.city}, {team.state || 'RS'}
                </div>
                <div className="w-1.5 h-1.5 rounded-full bg-[var(--border)]" />
                <div className="text-[var(--gray)] font-bold uppercase tracking-widest text-[11px]">
                  {team.sex === 'masculino' ? '♂ Masculino' : '♀ Feminino'}
                </div>
              </div>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
             <Link 
               href="/team/profile" 
               className="h-11 px-6 rounded-xl border border-[var(--border)] bg-white hover:bg-[var(--gray-l)] text-[var(--black)] font-bold text-xs flex items-center justify-center transition-all group shadow-sm"
             >
               Editar Perfil
               <ChevronRight className="w-3.5 h-3.5 ml-2 group-hover:translate-x-1 transition-transform" />
             </Link>
             <Link 
               href="/team/championships" 
               className="h-11 px-6 rounded-xl bg-[var(--amarelo)] hover:bg-[var(--orange-dark)] text-[var(--black)] font-black uppercase italic tracking-tighter text-xs flex items-center justify-center transition-all shadow-sm hover:scale-105 active:scale-95"
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
            icon={<Trophy className="w-5 h-5 text-orange-600" />}
          />

          <StatCard
            label="Calendário"
            value={nextGame ? new Date(nextGame.dateTime).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }) : "—"}
            sublabel={nextGame ? `vs ${nextGame.awayTeam.name}` : "Aguardando sorteio"}
            accent="blue"
            icon={<Calendar className="w-5 h-5 text-blue-600" />}
          />

          <StatCard
            label="Categorias"
            value={totalCategories}
            sublabel={`${confirmedRegistrations} confirmada(s)`}
            accent="green"
            icon={<Users className="w-5 h-5 text-green-600" />}
          />

          <StatCard
            label="Ginásio / Sede"
            value={team.gym?.canHost ? "Disponível" : "Indisponível"}
            sublabel={team.gym?.name ? team.gym.name.slice(0, 20) + '...' : "Deseja ser sede?"}
            accent="purple"
            icon={<Award className="w-5 h-5 text-purple-600" />}
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
                {openChampionships.map((championship: any) => {
                  const isRegistered = championship.registrations.length > 0
                  
                  return (
                    <Link
                      key={championship.id}
                      href={isRegistered ? `/team/dashboard` : `/team/championships/${championship.id}/register`}
                      className={cn(
                        "fgb-card bg-white p-6 rounded-[2rem] flex flex-col justify-between hover:shadow-lg transition-all duration-500 group relative overflow-hidden",
                        isRegistered ? "border-green-200" : "border-[var(--border)] hover:border-orange-300"
                      )}
                    >
                      {/* Premium Badge for Registered */}
                      {isRegistered && (
                        <div className="absolute top-0 right-0 bg-[var(--verde)] px-4 py-1.5 rounded-bl-2xl font-black italic uppercase text-[9px] tracking-widest flex items-center gap-1 shadow-sm z-20 text-white">
                           <CheckCircle2 className="w-3 h-3 text-white" />
                           Inscrito
                        </div>
                      )}

                      <div className="space-y-5 relative z-10">
                        <div className="flex flex-col gap-4">
                          <div className="flex items-start justify-between">
                             <Badge
                               variant="outline"
                               className={cn(
                                 "shadow-sm border font-black uppercase text-[9px] tracking-widest h-6 px-3",
                                 isRegistered ? "bg-green-50 text-green-700 border-green-200" : "bg-orange-50 text-orange-600 border-orange-200"
                               )}
                             >
                               {isRegistered ? "Vaga Garantida" : "Fase de Inscrição"}
                             </Badge>
                            <div className="w-10 h-10 rounded-2xl bg-[var(--gray-l)] border border-[var(--border)] flex items-center justify-center opacity-70 group-hover:opacity-100 group-hover:bg-gray-100 group-hover:scale-110 transition-all text-xl shadow-inner">
                              {championship.sex === 'masculino' ? '🏀' : '🎀'}
                            </div>
                          </div>
                          <div>
                            <h3 className="font-display font-black text-2xl text-[var(--black)] tracking-tight group-hover:text-orange-600 transition-colors leading-tight italic uppercase">
                              {championship.name}
                            </h3>
                            <p className="text-[10px] font-black text-[var(--gray)] uppercase tracking-[0.2em] mt-2">
                              {championship.sex === 'masculino' ? '♂ Categoria Masculina' : '♀ Categoria Feminina'}
                            </p>
                          </div>
                        </div>
  
                        <div className="space-y-3 bg-[var(--gray-l)] p-4 rounded-3xl border border-[var(--border)] group-hover:bg-gray-50 transition-all shadow-inner">
                          <div className="flex flex-wrap gap-2">
                            {championship.categories.slice(0, 4).map((cat: { id: string; name: string }) => (
                              <Badge key={cat.id} variant="outline" size="sm" className="bg-white border-[var(--border)] text-[var(--black)] font-bold group-hover:border-orange-200">
                                {cat.name}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
  
                      <div className="pt-6 mt-5 border-t border-[var(--border)] relative z-10">
                        {isRegistered ? (
                          <div className="w-full flex items-center justify-center gap-2 py-3 bg-green-50 rounded-2xl border border-green-200 text-green-700 font-black uppercase italic tracking-tighter text-sm shadow-sm">
                             <PartyPopper className="w-4 h-4" />
                             Equipe Validada
                          </div>
                        ) : (
                          <button className="w-full relative group/btn overflow-hidden rounded-2xl bg-[var(--amarelo)] hover:bg-[var(--orange-dark)] text-[var(--black)] font-black italic uppercase py-3.5 shadow-sm transition-all tracking-tighter">
                            <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/50 to-transparent -translate-x-full group-hover/btn:animate-[shimmer_1.5s_infinite]" />
                            Garantir Vaga →
                          </button>
                        )}
                        <div className="text-center text-[9px] font-black text-[var(--gray)] mt-3 tracking-[0.2em] uppercase">
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
                  <div key={registration.id} className="fgb-card bg-white border border-[var(--border)] shadow-sm p-6 rounded-[2.5rem] flex flex-col justify-between hover:border-orange-200 transition-all duration-300 group relative overflow-hidden">
                    <div className="absolute -top-10 -right-10 w-40 h-40 bg-orange-50 rounded-full blur-2xl group-hover:bg-orange-100 transition-all duration-700" />
                    
                    <div className="relative z-10">
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                           <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center border border-orange-100 shadow-inner">
                              <Trophy className="w-6 h-6 text-orange-600" />
                           </div>
                           <div>
                              <h3 className="font-display font-black text-xl text-[var(--black)] tracking-tight leading-tight italic uppercase">
                                {registration.championship.name}
                              </h3>
                              <p className="text-[10px] font-bold text-[var(--gray)] uppercase tracking-widest mt-0.5">ESTADUAL 2026</p>
                           </div>
                        </div>
                        <Badge
                          variant="outline"
                          className={cn(
                            "font-black uppercase italic tracking-widest text-[9px] h-7 px-4 shadow-sm border",
                            registration.status === 'CONFIRMED' ? "bg-green-50 border-green-200 text-green-700" : 
                            registration.status === 'PENDING' ? "bg-orange-50 text-orange-600 border border-orange-200" : 
                            "bg-red-50 text-red-700 border-red-200"
                          )}
                        >
                          {registration.status === 'CONFIRMED' ? 'APROVADO' :
                           registration.status === 'PENDING' ? 'PROCESSANDO' : 'REJEITADO'}
                        </Badge>
                      </div>

                      <div className="flex flex-wrap gap-2 mb-8">
                        {registration.categories.map((regCat) => (
                          <div key={regCat.id} className="px-4 py-2 rounded-xl bg-[var(--gray-l)] border border-[var(--border)] flex flex-col shadow-inner">
                             <span className="text-[8px] font-black text-[var(--gray)] uppercase tracking-widest">Categoria</span>
                             <span className="text-xs font-bold text-[var(--black)] uppercase italic">{regCat.category.name}</span>
                          </div>
                        ))}
                      </div>

                      <div className="flex items-center justify-between">
                         <div className="flex items-center gap-2">
                            <div className="flex -space-x-2">
                               {[1,2,3].map(i => (
                                 <div key={i} className="w-6 h-6 rounded-full border-2 border-white bg-gray-200 shadow-sm" />
                               ))}
                            </div>
                            <span className="text-[10px] font-bold text-[var(--gray)] uppercase tracking-widest">12 Equipes</span>
                         </div>
                         <Link
                          href={`/team/championships/${registration.championship.id}`}
                          className="px-6 py-2.5 rounded-xl bg-[var(--gray-l)] hover:bg-gray-100 text-[var(--black)] font-bold text-xs transition-all border border-[var(--border)] group-hover:border-orange-200 shadow-sm"
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
            <div className="fgb-card bg-white border border-[var(--border)] rounded-[3rem] overflow-hidden shadow-sm">
              <div className="bg-[var(--gray-l)] px-8 py-6 border-b border-[var(--border)] flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-2xl bg-orange-50 flex items-center justify-center border border-orange-100">
                    <BracketsIcon className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-[var(--black)] uppercase tracking-tighter italic">Key Chaveamento FGB</h3>
                    <p className="text-[10px] font-bold text-[var(--gray)] uppercase tracking-[0.2em] mt-0.5">Atualizado em tempo real</p>
                  </div>
                </div>
                <Badge variant="outline" className="font-black text-[10px] italic px-4 h-8 bg-orange-50 text-orange-600 border-orange-200">PLAYOFFS 2026</Badge>
              </div>
              {playoffCategory ? (
                <Brackets games={playoffCategory.games as any} />
              ) : (
                <div className="py-20 text-center opacity-40">
                  <p className="text-[var(--gray)] text-sm font-black uppercase tracking-widest">Aguardando definição dos playoffs</p>
                </div>
              )}
              <div className="px-8 py-6 bg-gray-50 border-t border-[var(--border)] text-center">
                 <p className="text-[10px] font-black text-[var(--gray)] uppercase tracking-[0.3em]">IA Engine optimized for tournament brackets</p>
              </div>
            </div>
          </Section>
        </div>
      </div>
    )
  } catch (error: any) {
    console.error(error)
    return (
      <div className="space-y-10 font-sans">
        <div className="animate-fade-in flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-[var(--border)] pb-10">
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 rounded-3xl bg-white border border-[var(--border)] flex items-center justify-center shadow-sm">
              <Shield className="w-10 h-10 text-[var(--gray)]" />
            </div>
            <div>
              <h1 className="text-5xl font-display font-black text-[var(--black)] tracking-tight leading-tight uppercase italic">Dashboard</h1>
            </div>
          </div>
        </div>
        <div className="fgb-card bg-white border border-red-200 rounded-3xl p-16 text-center shadow-sm">
          <h3 className="text-xl font-black text-red-600 mb-2 uppercase italic">Aguardando dados...</h3>
          <p className="text-[var(--gray)] text-sm max-w-sm mx-auto font-medium">Não conseguimos conectar com o motor de dados da FGB. Tente atualizar a página.</p>
        </div>
      </div>
    )
  }
}
