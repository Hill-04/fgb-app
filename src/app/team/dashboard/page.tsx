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
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-black text-[--text-main] mb-2">
            Bem-vindo, {team.name}!
          </h1>
          <p className="text-[--text-secondary]">
            {team.city}, RS • {team.sex === 'masculino' ? '♂ Masculino' : '♀ Feminino'}
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            label="Status"
            value={confirmedRegistrations > 0 ? "Inscrito" : "Sem inscrições"}
            sublabel={confirmedRegistrations > 0 ? `${confirmedRegistrations} campeonato(s)` : "Inscreva-se em um campeonato"}
            accent="orange"
            icon={<Trophy className="w-6 h-6" />}
          />

          <StatCard
            label="Próximo Jogo"
            value={nextGame ? new Date(nextGame.dateTime).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }) : "—"}
            sublabel={nextGame ? `vs ${nextGame.awayTeam.name}` : "Nenhum jogo agendado"}
            accent="blue"
            icon={<Calendar className="w-6 h-6" />}
          />

          <StatCard
            label="Categorias Ativas"
            value={totalCategories}
            sublabel={`em ${team.registrations.length} campeonato(s)`}
            accent="green"
            icon={<Users className="w-6 h-6" />}
          />

          <StatCard
            label="Ginásio"
            value={team.gym?.canHost ? "Disponível" : "Indisponível"}
            sublabel={team.gym?.name || "Sem ginásio"}
            accent="purple"
            icon={<Award className="w-6 h-6" />}
          />
        </div>

        {/* Campeonatos Abertos */}
        {openChampionships.length > 0 && (
          <Section
            title="Inscrições Abertas"
            subtitle={`${openChampionships.length} campeonato(s) disponível(is)`}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {openChampionships.map((championship) => (
                <Link
                  key={championship.id}
                  href={`/team/championships/${championship.id}/register`}
                  className="glass-panel p-6 flex flex-col justify-between hover:border-white/10 hover:shadow-[0_8px_30px_rgba(0,0,0,0.3)] hover:-translate-y-1 transition-all duration-300 group"
                >
                  <div className="space-y-4">
                    <div className="flex flex-col gap-3">
                      <div className="flex items-start justify-between">
                         <Badge
                           variant="success"
                           className="shadow-sm"
                         >
                           Inscrições Abertas
                         </Badge>
                        <span className="text-xl opacity-50 group-hover:opacity-100 transition-opacity">
                          {championship.sex === 'masculino' ? '🏀' : '🎀'}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-black text-xl text-[--text-main] tracking-tight group-hover:text-[--orange] transition-colors leading-tight">
                          {championship.name}
                        </h3>
                        <p className="text-sm font-medium text-[--text-secondary] mt-1">
                          {championship.sex === 'masculino' ? 'Masculino' : 'Feminino'}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-3 bg-white/5 p-4 rounded-xl border border-white/5">
                      <div className="text-[10px] text-[--text-dim] uppercase tracking-wider font-bold">
                        Categorias ({championship.categories.length})
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {championship.categories.slice(0, 4).map((cat: { id: string; name: string }) => (
                          <Badge key={cat.id} variant="default" size="sm" className="bg-black/20">
                            {cat.name}
                          </Badge>
                        ))}
                        {championship.categories.length > 4 && (
                          <Badge variant="default" size="sm" className="bg-black/20">
                            +{championship.categories.length - 4}
                          </Badge>
                        )}
                      </div>
                    </div>

                    {championship.regDeadline && (
                      <div className="text-xs font-semibold text-[--text-dim] flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5" />
                        Prazo: {new Date(championship.regDeadline).toLocaleDateString('pt-BR')}
                      </div>
                    )}
                  </div>

                  <div className="pt-6 mt-4 border-t border-white/5">
                    <button className="w-full relative group/btn overflow-hidden rounded-xl bg-[--orange] text-white font-bold py-3 shadow-[0_0_20px_rgba(249,115,22,0.3)] hover:shadow-[0_0_25px_rgba(249,115,22,0.5)] transition-all">
                      <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/btn:animate-[shimmer_1.5s_infinite]" />
                      Inscrever-se
                    </button>
                    <div className="text-center text-xs font-medium text-[--text-secondary] mt-3">
                      {championship._count.registrations} equipe(s) inscrita(s)
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </Section>
        )}

        {/* Minhas Inscrições */}
        {team.registrations.length > 0 && (
          <Section
            title="Minhas Inscrições"
            subtitle={`Você está inscrito em ${team.registrations.length} campeonato(s)`}
          >
            <div className="space-y-4">
              {team.registrations.map((registration) => (
                <div key={registration.id} className="glass-panel p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:bg-white/5 transition-colors">
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-black text-xl text-[--text-main] tracking-tight">
                          {registration.championship.name}
                        </h3>
                        <p className="text-sm font-medium text-[--text-secondary] mt-1">
                          {registration.categories.length} categoria(s) selecionada(s)
                        </p>
                      </div>
                      <Badge
                        variant={
                          registration.status === 'CONFIRMED' ? 'success' :
                          registration.status === 'PENDING' ? 'warning' : 'error'
                        }
                        withDot
                      >
                        {registration.status === 'CONFIRMED' ? 'Confirmado' :
                         registration.status === 'PENDING' ? 'Pendente' : 'Rejeitado'}
                      </Badge>
                    </div>

                    <div className="flex flex-wrap gap-2 mt-4">
                      {registration.categories.map((regCat) => (
                        <Badge key={regCat.id} variant="orange" size="sm" className="bg-[--orange]/10">
                          {regCat.category.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div className="md:border-l border-white/10 md:pl-6">
                    <Link
                      href={`/team/championships/${registration.championship.id}`}
                      className="inline-flex items-center justify-center w-full md:w-auto px-6 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-[--text-main] font-semibold transition-colors border border-white/10"
                    >
                      Detalhes
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </Section>
        )}
      </div>
    )
  } catch (error: any) {
    return (
      <div className="p-8 text-red-500 bg-red-500/10 border border-red-500/20 rounded-lg">
        <h2 className="text-xl font-bold mb-4">Erro de Servidor (Team Dashboard)</h2>
        <pre className="whitespace-pre-wrap text-sm">{error.message}</pre>
        <pre className="whitespace-pre-wrap text-xs mt-4 opacity-70">{error.stack}</pre>
      </div>
    )
  }
}
