import { prisma } from '@/lib/db'
import Link from 'next/link'
import { StatCard } from '@/components/StatCard'
import { Badge } from '@/components/Badge'
import { Trophy, Users, Calendar, Flag, Activity, ShieldCheck, Plus } from 'lucide-react'
import { formatChampionshipStatus } from '@/lib/utils'
import { ChampionshipCard } from '@/components/ChampionshipCard'

export const dynamic = 'force-dynamic'

export default async function FederationDashboardPage() {
  try {
    // 1. Fetch ALL non-archived championships for global metrics
    const activeChampionships = await prisma.championship.findMany({
      where: { status: { not: 'ARCHIVED' } },
      include: {
        _count: {
          select: {
            registrations: { where: { status: 'CONFIRMED' } },
            games: true
          }
        }
      }
    })

    const totalActive = activeChampionships.length
    const totalTeams = activeChampionships.reduce((acc, curr) => acc + curr._count.registrations, 0)
    const totalGames = activeChampionships.reduce((acc, curr) => acc + curr._count.games, 0)

    // Calculate finished games across ALL active championships
    const finishedGames = await prisma.game.count({
      where: {
        championship: { status: { not: 'ARCHIVED' } },
        status: 'FINISHED'
      }
    })

    const statusCounts = activeChampionships.reduce((acc, curr) => {
      acc[curr.status] = (acc[curr.status] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const featuredChampionships = await prisma.championship.findMany({
      where: { status: { in: ['ONGOING', 'REGISTRATION_OPEN', 'REGISTRATION_CLOSED'] } },
      orderBy: { createdAt: 'desc' },
      take: 3,
      include: {
        categories: { select: { id: true, name: true } },
        _count: {
          select: {
            registrations: { where: { status: 'CONFIRMED' } },
            games: true,
          }
        }
      }
    })

    return (
      <div className="space-y-8 pb-10">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="fgb-label text-[var(--red)]" style={{ fontSize: 10 }}>Visão Global</span>
                <span className="fgb-badge fgb-badge-red">EXECUTIVA</span>
              </div>
              <h1 className="fgb-display text-3xl text-[var(--black)]">Painel da Federação</h1>
              <p className="fgb-label text-[var(--gray)] mt-1" style={{ textTransform: 'none', letterSpacing: 0 }}>Métricas de todos os campeonatos ativos</p>
            </div>
            <Link href="/admin/championships" className="fgb-btn-outline">
              Acessar Campeonatos →
            </Link>
          </div>
        </div>

        {/* Global KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Campeonatos Ativos"
            value={totalActive}
            sublabel="Em fase de planejamento ou execução"
            accent="verde"
            icon={<Trophy className="w-5 h-5" />}
          />
          <StatCard
            label="Equipes Envolvidas"
            value={totalTeams}
            sublabel="Total de Inscrições Confirmadas"
            accent="yellow"
            icon={<Users className="w-5 h-5" />}
          />
          <StatCard
            label="Volume de Jogos"
            value={totalGames}
            sublabel="Jogos previstos no calendário geral"
            accent="red"
            icon={<Calendar className="w-5 h-5" />}
          />
          <StatCard
            label="Jogos Realizados"
            value={finishedGames}
            sublabel="Súmulas já cadastradas no sistema"
            accent="orange"
            icon={<Flag className="w-5 h-5" />}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Status Breakdown */}
          <div className="lg:col-span-2 fgb-card p-8">
             <div className="flex items-center gap-3 mb-8">
               <Activity className="w-5 h-5 text-[var(--red)]" />
               <h3 className="fgb-display text-sm text-[var(--black)]">Distribuição por Fase</h3>
             </div>
             
             <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Rascunho', status: 'DRAFT', count: statusCounts['DRAFT'] || 0, badge: 'fgb-badge-outline' },
                  { label: 'Inscrições', status: 'REGISTRATION_OPEN', count: statusCounts['REGISTRATION_OPEN'] || 0, badge: 'fgb-badge-yellow' },
                  { label: 'Em Andamento', status: 'ONGOING', count: statusCounts['ONGOING'] || 0, badge: 'fgb-badge-verde' },
                  { label: 'Encerrados', status: 'FINISHED', count: statusCounts['FINISHED'] || 0, badge: 'fgb-badge-red' },
                ].map((item) => (
                  <div key={item.status} className="bg-[var(--gray-l)] border border-[var(--border)] rounded-lg p-5 flex flex-col items-center justify-center text-center">
                    <span className="fgb-display text-3xl text-[var(--black)] mb-2 leading-none">{item.count}</span>
                    <span className={`fgb-badge ${item.badge}`}>{item.label}</span>
                  </div>
                ))}
             </div>
          </div>

          <div className="fgb-card admin-card-verde p-8 flex flex-col items-center justify-center text-center relative overflow-hidden">
             <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-[0.03] rounded-full blur-3xl -mr-16 -mt-16" />
             <ShieldCheck className="w-12 h-12 text-[var(--verde)] mb-4" />
             <h3 className="fgb-display text-sm text-[var(--black)] mb-2">Sistema Operacional</h3>
             <p className="fgb-label text-[var(--gray)] mt-1" style={{ textTransform: 'none', letterSpacing: 0 }}>Todos os serviços online.</p>
             <div className="mt-6 flex items-center justify-center gap-2">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ backgroundColor: 'var(--verde)' }}></span>
                  <span className="relative inline-flex rounded-full h-3 w-3" style={{ backgroundColor: 'var(--verde)' }}></span>
                </span>
                <span className="fgb-label text-[var(--verde)]" style={{ fontSize: 10 }}>Status: ON</span>
             </div>
          </div>
        </div>

        {/* Featured Championships */}
        {featuredChampionships.length > 0 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="fgb-display text-sm text-[var(--black)]">Campeonatos em Destaque</h3>
                <p className="fgb-label text-[var(--gray)] mt-1" style={{ textTransform: 'none', letterSpacing: 0 }}>Ações rápidas para as competições principais</p>
              </div>
              <Link href="/admin/championships" className="fgb-badge fgb-badge-red hover:opacity-80 cursor-pointer">
                Ver Todos →
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredChampionships.map((c) => (
                <ChampionshipCard
                  key={c.id}
                  id={c.id}
                  name={c.name}
                  year={c.year}
                  status={c.status}
                  categories={c.categories}
                  teamCount={c._count.registrations}
                  gameCount={c._count.games}
                  href={`/admin/championships/${c.id}`}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    )
  } catch (error: any) {
    console.error("Dashboard Global Error:", error)
    return (
      <div className="fgb-card admin-card-red p-20 text-center">
        <h2 className="fgb-display text-2xl text-[var(--black)] mb-2">Erro ao carregar Dashboard Executivo</h2>
        <p className="fgb-label text-[var(--gray)] mb-6 font-mono" style={{ textTransform: 'none', letterSpacing: 0 }}>{error.message}</p>
      </div>
    )
  }
}

