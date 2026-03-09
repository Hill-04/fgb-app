import prisma from '@/lib/prisma'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

const statusConfig = {
  DRAFT:              { label: 'Rascunho',         color: 'text-slate-400',  bg: 'bg-slate-500/10',  border: 'border-slate-500/20' },
  REGISTRATION_OPEN:  { label: 'Inscrições Abertas', color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20' },
  SCHEDULED:          { label: 'Agendado',          color: 'text-blue-400',   bg: 'bg-blue-500/10',   border: 'border-blue-500/20' },
  IN_PROGRESS:        { label: 'Em Andamento',      color: 'text-cyan-400',   bg: 'bg-cyan-500/10',   border: 'border-cyan-500/20' },
  FINISHED:           { label: 'Encerrado',         color: 'text-green-400',  bg: 'bg-green-500/10',  border: 'border-green-500/20' },
} as const

export default async function AdminDashboardPage() {
  const [teamCount, championships, registrationCount, recentTeams] = await Promise.all([
    prisma.team.count(),
    prisma.championship.findMany({
      include: { _count: { select: { categories: true } } }
    }),
    prisma.registration.count(),
    prisma.team.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: { id: true, name: true, city: true, contactName: true, createdAt: true }
    })
  ])

  const openChampionships = championships.filter(c => c.status === 'REGISTRATION_OPEN').length
  const totalChampionships = championships.length
  const pendingRegistrations = await prisma.registration.count({ where: { status: 'PENDING' } })

  const stats = [
    {
      label: 'Equipes Cadastradas',
      value: teamCount,
      sub: 'Total no sistema',
      accentColor: 'border-t-orange-500',
      valueColor: 'text-white',
    },
    {
      label: 'Campeonatos Ativos',
      value: openChampionships,
      sub: 'Com inscrições abertas',
      accentColor: 'border-t-orange-400',
      valueColor: 'text-orange-400',
    },
    {
      label: 'Inscrições Totais',
      value: registrationCount,
      sub: `${pendingRegistrations} pendente(s) de aprovação`,
      accentColor: 'border-t-cyan-500',
      valueColor: 'text-white',
    },
    {
      label: 'Total Campeonatos',
      value: totalChampionships,
      sub: 'Criados na plataforma',
      accentColor: 'border-t-slate-500',
      valueColor: 'text-white',
    },
  ]

  return (
    <div className="space-y-8 animate-fade-up">
      {/* Header */}
      <div>
        <p className="text-[10px] font-black text-orange-500 tracking-[0.25em] uppercase mb-2">
          Administração
        </p>
        <h1 className="font-display font-black text-4xl md:text-5xl uppercase tracking-tight text-white leading-none">
          Painel Geral
        </h1>
        <p className="text-slate-500 text-sm mt-2">Visão geral da Federação Gaúcha de Basquete.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className={`bg-[#0d1420] border border-white/[0.06] border-t-2 ${stat.accentColor} p-5 relative overflow-hidden`}
          >
            {/* Ghost number */}
            <div
              className="absolute bottom-0 right-2 font-display font-black text-[4.5rem] leading-none text-white/[0.025] pointer-events-none select-none"
              aria-hidden="true"
            >
              {stat.value}
            </div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-3">{stat.label}</p>
            <div className={`font-display font-black text-5xl ${stat.valueColor} leading-none`}>
              {stat.value}
            </div>
            <p className="text-[11px] text-slate-600 mt-2">{stat.sub}</p>
          </div>
        ))}
      </div>

      {/* Recent Teams */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display font-bold text-xl uppercase text-white tracking-tight">
            Equipes Recentes
          </h2>
          <Link
            href="/admin/teams"
            className="text-xs font-bold text-orange-500 hover:text-orange-400 transition-colors uppercase tracking-wider"
          >
            Ver todas →
          </Link>
        </div>

        <div className="border border-white/[0.06] bg-[#0d1420] overflow-hidden">
          {recentTeams.length === 0 ? (
            <div className="p-10 text-center">
              <p className="text-slate-600 text-sm">Nenhuma equipe cadastrada ainda.</p>
            </div>
          ) : (
            <div>
              {/* Table header */}
              <div className="grid grid-cols-4 gap-4 px-5 py-3 border-b border-white/[0.04] bg-white/[0.02]">
                {['Equipe', 'Cidade', 'Responsável', 'Cadastro'].map((col) => (
                  <span key={col} className="text-[9px] font-black text-slate-600 uppercase tracking-[0.2em]">
                    {col}
                  </span>
                ))}
              </div>
              {recentTeams.map((team, i) => (
                <div
                  key={team.id}
                  className="grid grid-cols-4 gap-4 px-5 py-3.5 items-center hover:bg-white/[0.03] transition-colors border-b border-white/[0.03] last:border-0"
                  style={{ animationDelay: `${i * 60}ms` }}
                >
                  <span className="font-semibold text-white text-sm truncate">{team.name}</span>
                  <span className="text-slate-500 text-sm truncate">{team.city}</span>
                  <span className="text-slate-500 text-sm truncate">{team.contactName}</span>
                  <span className="text-slate-600 text-xs">
                    {new Date(team.createdAt).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric'
                    })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Championships Overview */}
      {championships.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-bold text-xl uppercase text-white tracking-tight">
              Campeonatos
            </h2>
            <Link
              href="/admin/championships"
              className="text-xs font-bold text-orange-500 hover:text-orange-400 transition-colors uppercase tracking-wider"
            >
              Gerenciar →
            </Link>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {championships.map((c) => {
              const s = statusConfig[c.status as keyof typeof statusConfig] ?? statusConfig.DRAFT
              return (
                <div
                  key={c.id}
                  className="border border-white/[0.06] bg-[#0d1420] p-5 hover:bg-[#111a2e] transition-colors"
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <h3 className="font-display font-bold text-lg uppercase text-white tracking-tight leading-tight">
                      {c.name}
                    </h3>
                    <span className={`shrink-0 inline-flex items-center text-[9px] font-black px-2 py-1 border tracking-widest uppercase ${s.color} ${s.bg} ${s.border}`}>
                      {s.label}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600">
                    {c.year} &nbsp;·&nbsp; {c._count.categories} categoria(s)
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
