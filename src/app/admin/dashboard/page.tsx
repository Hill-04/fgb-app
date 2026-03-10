import { prisma } from '@/lib/db'
import Link from 'next/link'
import { StatCard } from '@/components/StatCard'
import { PipelineSteps } from '@/components/PipelineSteps'
import { Section } from '@/components/Section'
import { Badge } from '@/components/Badge'
import { Trophy, Users, FileCheck, Calendar } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function AdminDashboardPage() {
  const [teamCount, championships, registrationCount, recentRegistrations] = await Promise.all([
    prisma.team.count(),
    prisma.championship.findMany({
      include: {
        _count: { select: { categories: true, registrations: true } }
      },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.registration.count(),
    prisma.registration.findMany({
      take: 5,
      orderBy: { registeredAt: 'desc' },
      include: {
        team: true,
        championship: true,
        categories: {
          include: {
            category: true
          }
        }
      }
    })
  ])

  const openChampionships = championships.filter(c => c.status === 'REGISTRATION_OPEN').length
  const totalCategories = 8 // Sub 12 ao Sub 19
  const totalGames = await prisma.game.count()

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-black text-[--text-main] mb-2">
          Dashboard Administrativo
        </h1>
        <p className="text-[--text-secondary]">
          Visão geral da Federação Gaúcha de Basquete
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          label="Campeonatos"
          value={championships.length}
          sublabel={`${openChampionships} com inscrições abertas`}
          accent="orange"
          icon={<Trophy className="w-6 h-6" />}
        />

        <StatCard
          label="Equipes"
          value={teamCount}
          sublabel="Cadastradas no sistema"
          accent="blue"
          icon={<Users className="w-6 h-6" />}
        />

        <StatCard
          label="Categorias"
          value={totalCategories}
          sublabel="Sub 12 ao Sub 19"
          accent="purple"
          icon={<FileCheck className="w-6 h-6" />}
        />

        <StatCard
          label="Jogos"
          value={totalGames}
          sublabel="Agendados total"
          accent="green"
          icon={<Calendar className="w-6 h-6" />}
        />
      </div>

      {/* Pipeline Visual */}
      <Section
        title="Pipeline de Organização"
        subtitle="Etapas do processo de criação de campeonatos"
      >
        <PipelineSteps currentStep={2} />
      </Section>

      {/* Inscrições Recentes */}
      {recentRegistrations.length > 0 && (
        <Section
          title="Inscrições Recentes"
          subtitle={`${registrationCount} inscrição(ões) total`}
          action={
            <Link
              href="/admin/championships"
              className="text-sm font-semibold text-[--orange] hover:text-[--orange-hover]"
            >
              Ver todas →
            </Link>
          }
        >
          <div className="space-y-3">
            {recentRegistrations.map((registration) => (
              <div key={registration.id} className="card-fgb p-4 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-[--text-main]">
                    {registration.team.name}
                  </h3>
                  <p className="text-sm text-[--text-secondary] mt-1">
                    {registration.championship.name} • {registration.categories.length} categoria(s)
                  </p>
                </div>
                <div className="flex items-center gap-3">
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
                  <span className="text-xs text-[--text-dim]">
                    {new Date(registration.registeredAt).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Campeonatos */}
      {championships.length > 0 && (
        <Section
          title="Campeonatos"
          subtitle={`${championships.length} campeonato(s) criado(s)`}
          action={
            <Link
              href="/admin/championships"
              className="text-sm font-semibold text-[--orange] hover:text-[--orange-hover]"
            >
              Gerenciar →
            </Link>
          }
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {championships.slice(0, 6).map((championship) => (
              <Link
                key={championship.id}
                href={`/admin/championships/${championship.id}`}
                className="card-fgb p-6 space-y-3 hover:border-[--border-hover] transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-lg text-[--text-main] mb-1">
                      {championship.name}
                    </h3>
                    <p className="text-sm text-[--text-secondary]">
                      {championship.sex === 'masculino' ? '♂ Masculino' : '♀ Feminino'}
                    </p>
                  </div>
                  <Badge
                    variant={
                      championship.status === 'REGISTRATION_OPEN' ? 'success' :
                      championship.status === 'DRAFT' ? 'default' : 'blue'
                    }
                  >
                    {championship.status === 'DRAFT' ? 'Rascunho' :
                     championship.status === 'REGISTRATION_OPEN' ? 'Aberto' :
                     championship.status === 'REGISTRATION_CLOSED' ? 'Fechado' :
                     championship.status === 'VALIDATING' ? 'Validando' :
                     championship.status === 'SCHEDULING' ? 'IA' :
                     championship.status === 'REVIEW' ? 'Revisão' :
                     championship.status === 'CONFIRMED' ? 'Confirmado' :
                     championship.status === 'ONGOING' ? 'Em andamento' : 'Concluído'}
                  </Badge>
                </div>

                <div className="flex items-center gap-4 text-sm text-[--text-secondary]">
                  <span>{championship._count.categories} categorias</span>
                  <span>•</span>
                  <span>{championship._count.registrations} inscrições</span>
                </div>

                {championship.regDeadline && (
                  <div className="text-xs text-[--text-dim]">
                    Prazo: {new Date(championship.regDeadline).toLocaleDateString('pt-BR')}
                  </div>
                )}
              </Link>
            ))}
          </div>
        </Section>
      )}
    </div>
  )
}
