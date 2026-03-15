import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/db"
import { StatCard } from "@/components/StatCard"
import { Section } from "@/components/Section"
import { Badge } from "@/components/Badge"
import Link from "next/link"
import { Trophy, Calendar, Users, Award } from "lucide-react"

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
        <div className="animate-fade-in">
          <h1 className="text-4xl font-display font-black text-slate-900 tracking-tight mb-2">
            Bem-vindo, {team.name}!
          </h1>
          <p className="text-slate-500 font-medium text-lg">
            {team.city}, RS • {team.sex === 'masculino' ? '♂ Masculino' : '♀ Feminino'}
          </p>
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
    return (
      <div className="p-8 text-red-700 bg-red-50 border border-red-200 rounded-2xl">
        <h2 className="text-xl font-bold mb-4 tracking-tight">Erro de Servidor (Team Dashboard)</h2>
        <pre className="whitespace-pre-wrap text-sm">{error.message}</pre>
        <pre className="whitespace-pre-wrap text-xs mt-4 opacity-70">{error.stack}</pre>
      </div>
    )
  }
}
