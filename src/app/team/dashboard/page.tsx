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
                className="card-fgb p-6 space-y-4 hover:border-[--border-hover] transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-lg text-[--text-main] mb-1">
                      {championship.name}
                    </h3>
                    <p className="text-sm text-[--text-secondary]">
                      Prazo: {new Date(championship.regDeadline).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <Badge variant={championship.sex === 'masculino' ? 'blue' : 'pink'}>
                    {championship.sex === 'masculino' ? '♂' : '♀'}
                  </Badge>
                </div>

                <div className="space-y-2">
                  <div className="text-xs text-[--text-dim] label-uppercase">
                    Categorias
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {championship.categories.slice(0, 4).map((cat: { id: string; name: string }) => (
                      <Badge key={cat.id} variant="default" size="sm">
                        {cat.name}
                      </Badge>
                    ))}
                    {championship.categories.length > 4 && (
                      <Badge variant="default" size="sm">
                        +{championship.categories.length - 4}
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="pt-4 border-t border-[--border-color]">
                  <div className="text-sm text-[--text-secondary]">
                    {championship._count.registrations} equipe(s) inscrita(s)
                  </div>
                </div>

                <div className="pt-2">
                  <button className="w-full gradient-orange text-white font-bold py-2 px-4 rounded-lg">
                    Inscrever-se
                  </button>
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
              <div key={registration.id} className="card-fgb p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-bold text-lg text-[--text-main]">
                      {registration.championship.name}
                    </h3>
                    <p className="text-sm text-[--text-secondary] mt-1">
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

                <div className="flex flex-wrap gap-2">
                  {registration.categories.map((regCat) => (
                    <Badge key={regCat.id} variant="orange" size="sm">
                      {regCat.category.name}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}
    </div>
  )
}
