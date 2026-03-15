import { prisma } from '@/lib/db'
import Link from 'next/link'
import { StatCard } from '@/components/StatCard'
import { PipelineSteps } from '@/components/PipelineSteps'
import { Section } from '@/components/Section'
import { Badge } from '@/components/Badge'
import { Trophy, Users, FileCheck, Calendar } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function AdminDashboardPage() {
  try {
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
                className="text-sm font-bold text-[--blue-light] hover:text-white transition-colors bg-[--blue-admin]/10 hover:bg-[--blue-admin]/20 px-4 py-2 rounded-lg border border-[--blue-admin]/20"
              >
                Ver todas
              </Link>
            }
          >
            <div className="space-y-4">
              {recentRegistrations.map((registration) => (
                <div key={registration.id} className="glass-panel p-5 flex items-center justify-between hover:bg-white/5 transition-colors">
                  <div>
                    <h3 className="font-bold text-lg text-[--text-main]">
                      {registration.team.name}
                    </h3>
                    <p className="text-sm font-medium text-[--text-secondary] mt-1">
                      {registration.championship.name} • {registration.categories.length} categoria(s)
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
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
                    <span className="text-xs font-medium text-[--text-dim]">
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
                className="text-sm font-bold text-[--orange] hover:text-white transition-colors bg-[--orange]/10 hover:bg-[--orange]/20 px-4 py-2 rounded-lg border border-[--orange]/20"
              >
                Gerenciar
              </Link>
            }
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {championships.slice(0, 6).map((championship) => (
                <Link
                  key={championship.id}
                  href={`/admin/championships/${championship.id}`}
                  className="glass-panel p-6 flex flex-col justify-between hover:border-white/10 hover:shadow-[0_8px_30px_rgba(0,0,0,0.3)] hover:-translate-y-1 transition-all duration-300 group"
                >
                  <div className="space-y-4">
                    <div className="flex flex-col gap-3">
                      <div className="flex items-start justify-between">
                        <Badge
                          variant={
                            championship.status === 'REGISTRATION_OPEN' ? 'success' :
                            championship.status === 'DRAFT' ? 'default' : 'blue'
                          }
                          className="shadow-sm"
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

                    <div className="flex items-center gap-4 text-sm font-medium text-[--text-secondary] bg-white/5 p-3 rounded-xl border border-white/5">
                      <div className="flex-1 flex flex-col">
                        <span className="text-[10px] uppercase tracking-wider text-[--text-dim]">Categorias</span>
                        <span className="text-lg font-bold text-[--text-main]">{championship._count.categories}</span>
                      </div>
                      <div className="w-px h-8 bg-white/10"></div>
                      <div className="flex-1 flex flex-col">
                        <span className="text-[10px] uppercase tracking-wider text-[--text-dim]">Inscrições</span>
                        <span className="text-lg font-bold text-[--text-main]">{championship._count.registrations}</span>
                      </div>
                    </div>
                  </div>

                  {championship.regDeadline && (
                    <div className="text-xs font-semibold text-[--text-dim] mt-6 pt-4 border-t border-white/5 flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5" />
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
  } catch (error: any) {
    return (
      <div className="p-8 text-red-500 bg-red-500/10 border border-red-500/20 rounded-lg">
        <h2 className="text-xl font-bold mb-4">Erro de Servidor (Admin Dashboard)</h2>
        <pre className="whitespace-pre-wrap text-sm">{error.message}</pre>
        <pre className="whitespace-pre-wrap text-xs mt-4 opacity-70">{error.stack}</pre>
      </div>
    )
  }
}
