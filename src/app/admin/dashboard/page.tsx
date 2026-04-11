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

    const pendingRegistrations = await prisma.registration.count({
      where: {
        status: 'PENDING',
        championship: { status: { not: 'ARCHIVED' } },
      },
    })

    const closingSoon = await prisma.championship.findMany({
      where: {
        status: 'REGISTRATION_OPEN',
        regDeadline: { lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
      },
      select: { id: true, name: true, regDeadline: true },
      orderBy: { regDeadline: 'asc' },
      take: 3,
    })

    const gamesMissingVenue = await prisma.game.count({
      where: {
        status: 'SCHEDULED',
        championship: { status: { not: 'ARCHIVED' } },
        OR: [{ venue: null }, { venue: '' }],
      },
    })

    const finishedWithoutScore = await prisma.game.count({
      where: {
        status: 'FINISHED',
        championship: { status: { not: 'ARCHIVED' } },
        OR: [{ homeScore: null }, { awayScore: null }],
      },
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

        {/* Tricolor accent */}
        <div className="fgb-tricolor-banner rounded-full" />

        {/* Status sistema + jogos realizados */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Status Breakdown — higher volume FGB color blocks */}
          <div className="lg:col-span-2 bg-white border border-[var(--border)] rounded-[20px] p-8 shadow-sm">
             <div className="flex items-center gap-3 mb-8">
               <div className="w-1.5 h-6 bg-[var(--red)] rounded-full" />
               <h3 className="fgb-display text-sm text-[var(--black)]">Distribuição por Status</h3>
             </div>

             <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {[
                  { label: 'Rascunho',    status: 'DRAFT',             count: statusCounts['DRAFT'] || 0,             blockClass: 'fgb-stat-block-dark' },
                  { label: 'Inscrições',  status: 'REGISTRATION_OPEN', count: statusCounts['REGISTRATION_OPEN'] || 0, blockClass: 'fgb-stat-block-yellow' },
                  { label: 'Em Andamento',status: 'ONGOING',           count: statusCounts['ONGOING'] || 0,           blockClass: 'fgb-stat-block-verde' },
                  { label: 'Encerrados',  status: 'FINISHED',          count: statusCounts['FINISHED'] || 0,          blockClass: 'fgb-stat-block-red' },
                ].map((item) => (
                  <div key={item.status} className={`fgb-stat-block ${item.blockClass} group cursor-default h-32`}>
                    <span className="fgb-stat-block-num text-4xl mb-0 transition-transform group-hover:scale-110">{item.count}</span>
                    <span className="fgb-stat-block-label" style={{ letterSpacing: '0.2em' }}>{item.label}</span>
                  </div>
                ))}
             </div>
          </div>

          <div className="flex flex-col gap-6">
            <div 
              className="flex-1 rounded-[24px] p-8 flex flex-col items-center justify-center text-center relative overflow-hidden transition-all duration-500 hover:shadow-premium group" 
              style={{ background: 'linear-gradient(135deg, var(--verde) 0%, var(--verde-dark) 100%)' }}
            >
               <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.05)_0%,transparent_60%)] group-hover:opacity-60 transition-opacity" />
               <div className="bg-white/10 p-4 rounded-3xl mb-4 relative z-10 backdrop-blur-sm group-hover:rotate-12 transition-transform">
                  <ShieldCheck className="w-10 h-10 text-white" />
               </div>
               <h3 className="fgb-display text-sm text-white mb-2 relative z-10">FGB Digital</h3>
               <div className="flex items-center justify-center gap-2 relative z-10 bg-black/20 px-4 py-1.5 rounded-full border border-white/10">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-400"></span>
                  </span>
                  <span className="fgb-label text-white" style={{ fontSize: 9, letterSpacing: '0.1em' }}>SISTEMA ONLINE</span>
               </div>
            </div>
            
            <div className="rounded-[24px] p-8 flex flex-col items-center justify-center text-center relative overflow-hidden bg-white border border-[var(--border)] shadow-sm hover:shadow-md transition-all group">
               <div className="absolute top-0 left-0 w-full h-1 bg-[var(--yellow)]" />
               <p className="fgb-display text-5xl text-[var(--black)] leading-none mb-1 group-hover:scale-105 transition-transform">{finishedGames}</p>
               <p className="fgb-label text-[var(--gray)]" style={{ fontSize: 9, textTransform: 'none' }}>Súmulas Integradas</p>
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

        {/* Alertas Operacionais */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="fgb-badge fgb-badge-yellow">ALERTAS</span>
            <h3 className="fgb-display text-sm text-[var(--black)]">Acoes Prioritarias</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="fgb-card p-5">
              <p className="fgb-label text-[var(--gray)] mb-2">Inscricoes pendentes</p>
              <p className="fgb-display text-2xl text-[var(--black)]">{pendingRegistrations}</p>
              <Link href="/admin/championships?info=registrations" className="fgb-label text-[var(--verde)] mt-2 inline-flex">Revisar →</Link>
            </div>
            <div className="fgb-card p-5">
              <p className="fgb-label text-[var(--gray)] mb-2">Prazo encerrando</p>
              <p className="fgb-display text-2xl text-[var(--black)]">{closingSoon.length}</p>
              <div className="text-[11px] text-[var(--gray)]">
                {closingSoon.length === 0 ? 'Nenhum prazo na semana' : closingSoon.map((c) => (
                  <div key={c.id}>{c.name}</div>
                ))}
              </div>
            </div>
            <div className="fgb-card p-5">
              <p className="fgb-label text-[var(--gray)] mb-2">Jogos sem local</p>
              <p className="fgb-display text-2xl text-[var(--black)]">{gamesMissingVenue}</p>
              <Link href="/admin/championships" className="fgb-label text-[var(--red)] mt-2 inline-flex">Corrigir →</Link>
            </div>
            <div className="fgb-card p-5">
              <p className="fgb-label text-[var(--gray)] mb-2">Resultados incompletos</p>
              <p className="fgb-display text-2xl text-[var(--black)]">{finishedWithoutScore}</p>
              <Link href="/admin/championships" className="fgb-label text-[var(--orange)] mt-2 inline-flex">Atualizar →</Link>
            </div>
          </div>
        </div>
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
