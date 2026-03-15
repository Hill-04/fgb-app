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
      <div className="space-y-10">
        {/* Header */}
        <div className="animate-fade-in">
          <h1 className="text-4xl font-display font-black text-white tracking-tight mb-2">
            Dashboard Administrativo
          </h1>
          <p className="text-slate-400 font-medium text-lg">
            Visão geral da Federação Gaúcha de Basquete
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-fade-up" style={{ animationDelay: '100ms' }}>
          <StatCard
            label="Campeonatos"
            value={championships.length}
            sublabel={`${openChampionships} com inscrições abertas`}
            accent="orange"
            icon={<Trophy className="w-5 h-5" />}
          />

          <StatCard
            label="Equipes"
            value={teamCount}
            sublabel="Cadastradas no sistema"
            accent="blue"
            icon={<Users className="w-5 h-5" />}
          />

          <StatCard
            label="Categorias"
            value={totalCategories}
            sublabel="Sub 12 ao Sub 19"
            accent="purple"
            icon={<FileCheck className="w-5 h-5" />}
          />

          <StatCard
            label="Jogos"
            value={totalGames}
            sublabel="Agendados total"
            accent="green"
            icon={<Calendar className="w-5 h-5" />}
          />
        </div>

        {/* Pipeline Visual */}
        <div className="animate-fade-up" style={{ animationDelay: '200ms' }}>
          <Section
            title="Pipeline de Organização"
            subtitle="Etapas do processo de criação de campeonatos"
          >
            <PipelineSteps currentStep={2} />
          </Section>
        </div>

        {/* Inscrições Recentes */}
        {recentRegistrations.length > 0 && (
          <div className="animate-fade-up" style={{ animationDelay: '300ms' }}>
            <Section
              title="Inscrições Recentes"
              subtitle={`${registrationCount} inscrição(ões) total`}
              action={
                <Link
                  href="/admin/championships"
                  className="text-sm font-bold text-blue-400 hover:text-white transition-all bg-blue-500/10 hover:bg-blue-500/20 px-5 py-2.5 rounded-xl border border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.1)] hover:shadow-[0_0_20px_rgba(59,130,246,0.2)]"
                >
                  Ver todas
                </Link>
              }
            >
              <div className="space-y-4">
                {recentRegistrations.map((registration) => (
                  <div key={registration.id} className="bg-white/[0.02] border border-white/[0.05] backdrop-blur-md p-5 rounded-2xl flex items-center justify-between hover:bg-white/[0.04] hover:-translate-y-0.5 transition-all duration-300">
                    <div>
                      <h3 className="font-bold text-lg text-white tracking-tight">
                        {registration.team.name}
                      </h3>
                      <p className="text-sm font-medium text-slate-400 mt-1">
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
                      <span className="text-xs font-medium text-slate-500">
                        {new Date(registration.registeredAt).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </Section>
          </div>
        )}

        {/* Campeonatos */}
        {championships.length > 0 && (
          <div className="animate-fade-up" style={{ animationDelay: '400ms' }}>
            <Section
              title="Campeonatos"
              subtitle={`${championships.length} campeonato(s) criado(s)`}
              action={
                <Link
                  href="/admin/championships"
                  className="text-sm font-bold text-orange-400 hover:text-white transition-all bg-orange-500/10 hover:bg-orange-500/20 px-5 py-2.5 rounded-xl border border-orange-500/20 shadow-[0_0_15px_rgba(249,115,22,0.1)] hover:shadow-[0_0_20px_rgba(249,115,22,0.2)]"
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
                    className="bg-white/[0.02] border border-white/[0.05] backdrop-blur-xl p-6 rounded-3xl flex flex-col justify-between hover:bg-white/[0.04] hover:border-white/10 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.5)] hover:-translate-y-1 transition-all duration-300 group relative overflow-hidden"
                  >
                    <div className="absolute inset-0 rounded-3xl ring-1 ring-inset ring-white/5 pointer-events-none" />
                    
                    <div className="space-y-5 relative z-10">
                      <div className="flex flex-col gap-4">
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
                          <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center opacity-70 group-hover:opacity-100 group-hover:bg-white/10 group-hover:scale-110 transition-all">
                            <span className="text-xl">
                              {championship.sex === 'masculino' ? '🏀' : '🎀'}
                            </span>
                          </div>
                        </div>
                        <div>
                          <h3 className="font-display font-black text-xl text-white tracking-tight group-hover:text-orange-400 transition-colors leading-tight drop-shadow-sm">
                            {championship.name}
                          </h3>
                          <p className="text-sm font-medium text-slate-400 mt-1.5">
                            {championship.sex === 'masculino' ? 'Masculino' : 'Feminino'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-sm font-medium text-slate-400 bg-white/[0.03] p-4 rounded-2xl border border-white/[0.05]">
                        <div className="flex-1 flex flex-col">
                          <span className="text-[10px] uppercase tracking-widest text-slate-500 mb-1">Categorias</span>
                          <span className="text-lg font-bold text-white">{championship._count.categories}</span>
                        </div>
                        <div className="w-px h-10 bg-white/10"></div>
                        <div className="flex-1 flex flex-col">
                          <span className="text-[10px] uppercase tracking-widest text-slate-500 mb-1">Inscrições</span>
                          <span className="text-lg font-bold text-white">{championship._count.registrations}</span>
                        </div>
                      </div>
                    </div>

                    {championship.regDeadline && (
                      <div className="text-xs font-semibold text-slate-500 mt-6 pt-5 border-t border-white/[0.05] flex items-center gap-2 relative z-10">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        Prazo: <span className="text-slate-300">{new Date(championship.regDeadline).toLocaleDateString('pt-BR')}</span>
                      </div>
                    )}
                  </Link>
                ))}
              </div>
            </Section>
          </div>
        )}
      </div>
    )
  } catch (error: any) {
    return (
      <div className="p-8 text-red-500 bg-red-500/10 border border-red-500/20 rounded-2xl backdrop-blur-md">
        <h2 className="text-xl font-bold mb-4 tracking-tight">Erro de Servidor (Admin Dashboard)</h2>
        <pre className="whitespace-pre-wrap text-sm">{error.message}</pre>
        <pre className="whitespace-pre-wrap text-xs mt-4 opacity-70">{error.stack}</pre>
      </div>
    )
  }
}
