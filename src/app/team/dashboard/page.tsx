import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/db"
import { StatCard } from "@/components/StatCard"
import { Section } from "@/components/Section"
import { Badge } from "@/components/Badge"
import Link from "next/link"
import { Trophy, Calendar, Users, Award, MapPin, Shield } from "lucide-react"
import { Brackets } from "@/components/Brackets"

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
    const openChampionships = await prisma.championship.findMany({
      where: {
        status: 'REGISTRATION_OPEN',
        sex: team.sex || undefined
      },
      include: {
        categories: true,
        _count: {
          select: {
            registrations: true
          }
        }
      },
      take: 3
    })

    const nextGame = team.homeGames[0]
    const totalCategories = team.registrations.reduce((acc, reg) => acc + reg.categories.length, 0)
    const confirmedRegistrations = team.registrations.filter(r => r.status === 'CONFIRMED').length

    return (
      <div className="space-y-10">
        {/* Header */}
        <div className="animate-fade-in flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/[0.05] pb-10">
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 rounded-3xl bg-[#111] border border-white/10 flex items-center justify-center overflow-hidden shrink-0 shadow-2xl">
              {team.logoUrl ? (
                <img src={team.logoUrl} alt={team.name} className="w-full h-full object-cover" />
              ) : (
                <Shield className="w-10 h-10 text-slate-700" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Badge variant="orange" className="bg-[#FF6B00]/10 text-[#FF6B00] border-[#FF6B00]/20 font-black uppercase tracking-widest text-[10px]">
                  Equipe Oficial
                </Badge>
                <div className="h-4 w-px bg-white/10" />
                <span className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">ID: {team.id.slice(0, 8)}</span>
              </div>
              <h1 className="text-5xl font-display font-black text-white tracking-tight leading-tight">
                {team.name}
              </h1>
              <div className="flex items-center gap-4 mt-2">
                <div className="flex items-center gap-1.5 text-slate-400 font-bold uppercase tracking-widest text-[11px]">
                  <MapPin className="w-3.5 h-3.5 text-[#FF6B00]" />
                  {team.city}, {team.state || 'RS'}
                </div>
                <div className="w-1.5 h-1.5 rounded-full bg-white/10" />
                <div className="text-slate-400 font-bold uppercase tracking-widest text-[11px]">
                  {team.sex === 'masculino' ? '♂ Categoria Masculina' : '♀ Categoria Feminina'}
                </div>
              </div>
            </div>
          </div>
          <div className="flex gap-3">
             <Link 
               href="/team/profile" 
               className="h-11 px-6 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 text-white font-bold text-xs flex items-center transition-all"
             >
               Editar Perfil
             </Link>
             <Link 
               href="/team/registration" 
               className="h-11 px-6 rounded-xl bg-[#FF6B00] hover:bg-[#E66000] text-white font-bold text-xs flex items-center transition-all shadow-[0_4px_15px_rgba(255,107,0,0.2)]"
             >
               Novas Inscrições
             </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-fade-up" style={{ animationDelay: '100ms' }}>
          <StatCard
            label="Status"
            value={confirmedRegistrations > 0 ? "Inscrito" : "Sem inscrições"}
            sublabel={confirmedRegistrations > 0 ? `${confirmedRegistrations} campeonato(s)` : "Inscreva-se em um campeonato"}
            accent="orange"
            icon={<Trophy className="w-5 h-5" />}
          />

          <StatCard
            label="Próximo Jogo"
            value={nextGame ? new Date(nextGame.dateTime).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }) : "—"}
            sublabel={nextGame ? `vs ${nextGame.awayTeam.name}` : "Nenhum jogo agendado"}
            accent="blue"
            icon={<Calendar className="w-5 h-5" />}
          />

          <StatCard
            label="Categorias Ativas"
            value={totalCategories}
            sublabel={`em ${team.registrations.length} campeonato(s)`}
            accent="green"
            icon={<Users className="w-5 h-5" />}
          />

          <StatCard
            label="Ginásio"
            value={team.gym?.canHost ? "Disponível" : "Indisponível"}
            sublabel={team.gym?.name || "Sem ginásio"}
            accent="purple"
            icon={<Award className="w-5 h-5" />}
          />
        </div>

        {/* Campeonatos Abertos */}
        {openChampionships.length > 0 && (
          <div className="animate-fade-up" style={{ animationDelay: '200ms' }}>
            <Section
              title="Inscrições Abertas"
              subtitle={`${openChampionships.length} campeonato(s) disponível(is)`}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {openChampionships.map((championship) => (
                  <Link
                    key={championship.id}
                    href={`/team/championships/${championship.id}/register`}
                    className="bg-white border border-slate-200 p-6 rounded-3xl flex flex-col justify-between hover:border-slate-300 hover:shadow-md hover:-translate-y-1 transition-all duration-300 group relative overflow-hidden"
                  >
                    <div className="space-y-5 relative z-10">
                      <div className="flex flex-col gap-4">
                        <div className="flex items-start justify-between">
                           <Badge
                             variant="success"
                             className="shadow-sm border-green-200"
                           >
                             Inscrições Abertas
                           </Badge>
                          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center opacity-70 group-hover:opacity-100 group-hover:bg-slate-200 group-hover:scale-110 transition-all text-xl">
                            {championship.sex === 'masculino' ? '🏀' : '🎀'}
                          </div>
                        </div>
                        <div>
                          <h3 className="font-display font-black text-xl text-slate-900 tracking-tight group-hover:text-green-600 transition-colors leading-tight drop-shadow-sm">
                            {championship.name}
                          </h3>
                          <p className="text-sm font-bold text-slate-500 mt-1.5">
                            {championship.sex === 'masculino' ? 'Masculino' : 'Feminino'}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                        <div className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">
                          Categorias ({championship.categories.length})
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {championship.categories.slice(0, 4).map((cat: { id: string; name: string }) => (
                            <Badge key={cat.id} variant="default" size="sm" className="bg-white border-slate-200 text-slate-600">
                              {cat.name}
                            </Badge>
                          ))}
                          {championship.categories.length > 4 && (
                            <Badge variant="default" size="sm" className="bg-white border-slate-200 text-slate-600">
                              +{championship.categories.length - 4}
                            </Badge>
                          )}
                        </div>
                      </div>

                      {championship.regDeadline && (
                        <div className="text-xs font-semibold text-slate-500 flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-slate-400" />
                          Prazo: <span className="text-slate-800">{new Date(championship.regDeadline).toLocaleDateString('pt-BR')}</span>
                        </div>
                      )}
                    </div>

                    <div className="pt-6 mt-5 border-t border-slate-100 relative z-10">
                      <button className="w-full relative group/btn overflow-hidden rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold py-3.5 shadow-sm hover:shadow-md transition-all">
                        <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/btn:animate-[shimmer_1.5s_infinite]" />
                        Inscrever-se Agora
                      </button>
                      <div className="text-center text-[11px] font-semibold text-slate-500 mt-3 tracking-wide">
                        {championship._count.registrations} EQUIPE(S) INSCRITA(S)
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </Section>
          </div>
        )}

        {/* Playoffs / Chaveamento Section */}
        <div className="animate-fade-up" style={{ animationDelay: '250ms' }}>
          <Section
            title="Playoffs & Chaveamento"
            subtitle="Acompanhe a árvore de jogos e confrontos finais"
          >
            <div className="bg-[#111] border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
              <div className="bg-white/[0.02] px-6 py-4 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Trophy className="w-4 h-4 text-[#FF6B00]" />
                  <h3 className="text-sm font-black text-white uppercase tracking-wider">Mata-Mata em Tempo Real</h3>
                </div>
                <Badge variant="orange" className="font-black text-[9px]">FASE FINAL</Badge>
              </div>
              <Brackets />
              <div className="px-8 py-6 bg-white/[0.01] border-t border-white/5 text-center">
                 <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">O motor de chaveamento organiza automaticamente os confrontos baseados no Ranking Estadual</p>
              </div>
            </div>
          </Section>
        </div>

        {/* Minhas Inscrições */}
        {team.registrations.length > 0 && (
          <div className="animate-fade-up" style={{ animationDelay: '300ms' }}>
            <Section
              title="Minhas Inscrições"
              subtitle={`Você está inscrito em ${team.registrations.length} campeonato(s)`}
            >
              <div className="space-y-4">
                {team.registrations.map((registration) => (
                  <div key={registration.id} className="bg-white border border-slate-200 shadow-sm p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-slate-300 hover:shadow hover:-translate-y-0.5 transition-all duration-300 relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-r from-orange-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    
                    <div className="flex-1 relative z-10">
                      <div className="flex flex-col md:flex-row md:items-center gap-4 mb-4">
                        <div className="flex-1">
                          <h3 className="font-display font-black text-xl text-slate-900 tracking-tight leading-tight">
                            {registration.championship.name}
                          </h3>
                          <p className="text-sm font-medium text-slate-500 mt-1">
                            {registration.categories.length} categoria(s) selecionada(s)
                          </p>
                        </div>
                        <Badge
                          variant={
                            registration.status === 'CONFIRMED' ? 'success' :
                            registration.status === 'PENDING' ? 'warning' : 'error'
                          }
                          withDot
                          className="w-fit"
                        >
                          {registration.status === 'CONFIRMED' ? 'Confirmado' :
                           registration.status === 'PENDING' ? 'Pendente' : 'Rejeitado'}
                        </Badge>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {registration.categories.map((regCat) => (
                          <Badge key={regCat.id} variant="orange" size="sm">
                            {regCat.category.name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    
                    <div className="md:border-l border-slate-100 md:pl-6 relative z-10">
                      <Link
                        href={`/team/championships/${registration.championship.id}`}
                        className="inline-flex items-center justify-center w-full md:w-auto px-6 py-2.5 rounded-xl bg-orange-50 hover:bg-orange-100 text-orange-700 font-bold transition-all border border-orange-200"
                      >
                        Detalhes
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </Section>
          </div>
        )}
      </div>
    )
  } catch (error: any) {
    // Show clean empty state instead of crash
    return (
      <div className="space-y-10">
        <div className="animate-fade-in flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/[0.05] pb-10">
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 rounded-3xl bg-[#111] border border-white/10 flex items-center justify-center">
              <Shield className="w-10 h-10 text-slate-700" />
            </div>
            <div>
              <h1 className="text-5xl font-display font-black text-white tracking-tight leading-tight">Minha Equipe</h1>
              <p className="text-slate-500 font-bold uppercase tracking-widest text-[11px] mt-2">Configure sua equipe para ver os detalhes aqui</p>
            </div>
          </div>
        </div>
        <div className="bg-[#111] border border-[#FF6B00]/20 rounded-3xl p-16 text-center">
          <div className="w-16 h-16 rounded-full bg-[#FF6B00]/10 flex items-center justify-center mx-auto mb-4">
            <Trophy className="w-8 h-8 text-[#FF6B00]" />
          </div>
          <h3 className="text-xl font-black text-white mb-2">Aguardando ativação</h3>
          <p className="text-slate-500 text-sm max-w-sm mx-auto">Sua conta está sendo configurada. Entre em contato com a Federação para confirmar seu acesso.</p>
        </div>
      </div>
    )
  }
}
