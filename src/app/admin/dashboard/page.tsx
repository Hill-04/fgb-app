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
                <span className="text-[10px] font-black text-orange-500 uppercase tracking-[0.2em]">Visão Global</span>
                <Badge variant="blue" size="sm" className="bg-orange-500/10 text-orange-500 border-orange-500/20">EXECUTIVA</Badge>
              </div>
              <h1 className="text-3xl font-black text-white tracking-tight">Painel da Federação</h1>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">Métricas de todos os campeonatos ativos</p>
            </div>
            <Link href="/admin/championships" className="h-10 px-6 bg-white/5 hover:bg-white/10 text-white rounded-xl text-xs font-black uppercase tracking-widest flex items-center transition-all border border-white/10">
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
            accent="orange"
            icon={<Trophy className="w-5 h-5" />}
          />
          <StatCard
            label="Equipes Envolvidas"
            value={totalTeams}
            sublabel="Total de Inscrições Confirmadas"
            accent="blue"
            icon={<Users className="w-5 h-5" />}
          />
          <StatCard
            label="Volume de Jogos"
            value={totalGames}
            sublabel="Jogos previstos no calendário geral"
            accent="purple"
            icon={<Calendar className="w-5 h-5" />}
          />
          <StatCard
            label="Jogos Realizados"
            value={finishedGames}
            sublabel="Súmulas já cadastradas no sistema"
            accent="green"
            icon={<Flag className="w-5 h-5" />}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Status Breakdown */}
          <div className="lg:col-span-2 bg-[#0A0A0A] border border-white/5 rounded-3xl p-8">
             <div className="flex items-center gap-3 mb-8">
               <Activity className="w-5 h-5 text-orange-500" />
               <h3 className="text-sm font-black text-white uppercase tracking-widest">Distribuição por Fase</h3>
             </div>
             
             <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Rascunho', status: 'DRAFT', count: statusCounts['DRAFT'] || 0, color: 'text-slate-400', bg: 'bg-slate-500/10' },
                  { label: 'Inscrições', status: 'REGISTRATION_OPEN', count: statusCounts['REGISTRATION_OPEN'] || 0, color: 'text-blue-400', bg: 'bg-blue-500/10' },
                  { label: 'Em Andamento', status: 'ONGOING', count: statusCounts['ONGOING'] || 0, color: 'text-green-400', bg: 'bg-green-500/10' },
                  { label: 'Encerrados', status: 'FINISHED', count: statusCounts['FINISHED'] || 0, color: 'text-purple-400', bg: 'bg-purple-500/10' },
                ].map((item) => (
                  <div key={item.status} className={`${item.bg} border border-white/5 rounded-2xl p-5 flex flex-col items-center justify-center text-center`}>
                    <span className={`text-3xl font-black ${item.color} leading-none mb-2`}>{item.count}</span>
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">{item.label}</span>
                  </div>
                ))}
             </div>
          </div>

          <div className="bg-[#0A0A0A] border border-white/5 rounded-3xl p-8 flex flex-col items-center justify-center text-center relative overflow-hidden">
             <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 rounded-full blur-3xl -mr-16 -mt-16" />
             <ShieldCheck className="w-12 h-12 text-slate-800 mb-4" />
             <h3 className="text-sm font-black text-white uppercase tracking-widest mb-2">Sistema Operacional</h3>
             <p className="text-xs font-bold text-slate-500 mt-1">Todos os serviços online.</p>
             <div className="mt-6 flex items-center justify-center gap-2">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                </span>
                <span className="text-[10px] font-black text-green-500 uppercase tracking-widest">Status: ON</span>
             </div>
          </div>
        </div>

        {/* Featured Championships */}
        {featuredChampionships.length > 0 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-white uppercase tracking-widest">Campeonatos em Destaque</h3>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Ações rápidas para as competições principais</p>
              </div>
              <Link href="/admin/championships"
                className="text-[10px] font-black uppercase tracking-widest text-[#FF6B00] hover:text-[#E66000] px-4 py-2 bg-[#FF6B00]/5 rounded-lg border border-[#FF6B00]/10 transition-all">
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
      <div className="bg-[#0A0A0A] border border-red-500/20 rounded-3xl p-20 text-center">
        <h2 className="text-2xl font-black text-white mb-2">Erro ao carregar Dashboard Executivo</h2>
        <p className="text-slate-500 mb-6 font-mono text-xs">{error.message}</p>
      </div>
    )
  }
}
