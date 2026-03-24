import { prisma } from '@/lib/db'
import Link from 'next/link'
import { StatCard } from '@/components/StatCard'
import { Badge } from '@/components/Badge'
import { Trophy, Users, Calendar, BarChart3, CheckCircle2, PlayCircle, Flag, Sparkles } from 'lucide-react'
import { Brackets } from '@/components/Brackets'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { formatChampionshipStatus } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export default async function ChampionshipDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  try {
    const championship = await prisma.championship.findUnique({
      where: { id },
      include: {
        categories: {
          include: {
            _count: { select: { games: true } }
          }
        },
        _count: {
          select: {
            registrations: { where: { status: 'CONFIRMED' } },
            games: true
          }
        }
      }
    })

    if (!championship) return <div>Campeonato não encontrado</div>

    const confirmedTeams = championship._count.registrations
    const totalGames = championship._count.games
    const completedGames = await prisma.game.count({
      where: { championshipId: id, status: 'FINISHED' }
    })

    const registrationCount = await prisma.registration.count({
      where: { championshipId: id, status: 'CONFIRMED' }
    })
    const categoryCount = championship.categories.length
    const minTeams = championship.minTeamsPerCat || 3

    const firstCategory = championship.categories[0]

    // Métricas para o Pipeline
    const categoriesWithTeams = await prisma.championshipCategory.findMany({
      where: { championshipId: id },
      include: {
        _count: {
          select: {
            registrations: {
              where: { registration: { status: 'CONFIRMED' } }
            }
          }
        }
      }
    })

    const missingPerCategory = categoriesWithTeams.map(cat => ({
      name: cat.name,
      confirmed: cat._count.registrations,
      missing: Math.max(0, minTeams - cat._count.registrations)
    }))
    const totalMissing = missingPerCategory.reduce((acc, c) => acc + c.missing, 0)
    const allCategoriesReady = totalMissing === 0

    const topStandings = firstCategory ? await prisma.standing.findMany({
      where: { categoryId: firstCategory.id },
      orderBy: [{ points: 'desc' }, { wins: 'desc' }],
      take: 3,
      include: { team: true }
    }) : []

    const nextGame = await prisma.game.findFirst({
      where: {
        championshipId: id,
        status: 'SCHEDULED',
        dateTime: { gt: new Date() }
      },
      orderBy: { dateTime: 'asc' },
      include: { homeTeam: true, awayTeam: true, category: true }
    })

    const lastResults = await prisma.game.findMany({
      where: { championshipId: id, status: 'FINISHED' },
      orderBy: { dateTime: 'desc' },
      take: 5,
      include: { homeTeam: true, awayTeam: true, category: true }
    })

    const upcomingGames = await prisma.game.findMany({
      where: { championshipId: id, status: 'SCHEDULED' },
      orderBy: { dateTime: 'asc' },
      take: 5,
      include: { homeTeam: true, awayTeam: true, category: true }
    })

    const playoffCategory = championship.hasPlayoffs ? await prisma.championshipCategory.findFirst({
      where: {
        championshipId: id,
        games: { some: { phase: { gt: 1 } } }
      },
      include: {
        games: {
          where: { phase: { gt: 1 } },
          include: {
            homeTeam: { select: { name: true, logoUrl: true } },
            awayTeam: { select: { name: true, logoUrl: true } }
          },
          orderBy: { dateTime: 'asc' }
        }
      }
    }) : null

    const statusMap = {
      'DRAFT': 1,
      'REGISTRATION_OPEN': 2,
      'REGISTRATION_CLOSED': 3,
      'ONGOING': 4,
      'FINISHED': 5
    }
    const currentStep = statusMap[championship.status as keyof typeof statusMap] || 1

    const pipelineSteps = [
      { id: 1, label: 'Criação', icon: Trophy },
      { id: 2, label: 'Inscrições', icon: Users },
      { id: 3, label: 'Organização', icon: Sparkles },
      { id: 4, label: 'Em Andamento', icon: PlayCircle },
      { id: 5, label: 'Encerrar', icon: Flag },
    ]

    return (
      <div className="space-y-6 pb-10">

        {/* 1. PIPELINE — ELEMENTO PRINCIPAL, LARGURA TOTAL */}
        <div className="bg-[#141414] border border-white/[0.08] rounded-3xl p-6">
          <div className="flex items-center justify-between mb-5">
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-600 flex items-center gap-2">
              <span className="w-1 h-1 rounded-full bg-[#FF6B00] inline-block" /> Pipeline de Execução
            </p>
            <span className="text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-slate-500">
              {formatChampionshipStatus(championship.status)}
            </span>
          </div>

          {/* Steps horizontais */}
          <div className="grid grid-cols-5 gap-3">
            {pipelineSteps.map((step) => {
              const isPast = currentStep > step.id
              const isCurrent = currentStep === step.id

              return (
                <div key={step.id} className={`rounded-2xl p-4 border transition-all duration-300 ${
                  isCurrent
                    ? 'bg-[#FF6B00]/10 border-[#FF6B00]/30 shadow-[0_0_20px_rgba(255,107,0,0.05)]'
                    : isPast
                    ? 'bg-green-500/5 border-green-500/15'
                    : 'bg-white/[0.02] border-white/[0.06] opacity-60'
                }`}>
                  <div className="flex items-center gap-2 mb-3">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      isPast ? 'bg-green-500/20' :
                      isCurrent ? 'bg-[#FF6B00]' :
                      'bg-white/[0.05]'
                    }`}>
                      {isPast
                        ? <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                        : <step.icon className={`w-3.5 h-3.5 ${isCurrent ? 'text-white' : 'text-slate-600'}`} />
                      }
                    </div>
                    <div>
                      <p className={`text-[9px] font-black uppercase tracking-widest leading-none ${
                        isCurrent ? 'text-[#FF6B00]' : isPast ? 'text-green-400' : 'text-slate-600'
                      }`}>
                        {step.label}
                      </p>
                      <p className="text-[8px] text-slate-700 uppercase tracking-widest mt-0.5">
                        {isPast ? 'Concluído' : isCurrent ? 'Ativo' : 'Aguardando'}
                      </p>
                    </div>
                  </div>

                  {/* Info contextual para o step ativo */}
                  {isCurrent && step.id === 2 && (
                    <div className="space-y-1.5 mt-1">
                      {missingPerCategory.map((cat, i) => (
                        <div key={i}>
                          <div className="flex justify-between mb-0.5">
                            <span className="text-[8px] text-slate-600 truncate max-w-[80px]">{cat.name}</span>
                            <span className={`text-[8px] font-black ${cat.missing === 0 ? 'text-green-400' : 'text-[#FF6B00]'}`}>
                              {cat.confirmed}/{minTeams}
                            </span>
                          </div>
                          <div className="h-0.5 bg-white/[0.06] rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-700 ${cat.missing === 0 ? 'bg-green-500' : 'bg-[#FF6B00]'}`}
                              style={{ width: `${Math.min(100, Math.round((cat.confirmed / minTeams) * 100))}%` }}
                            />
                          </div>
                        </div>
                      ))}
                      <Link href={`/admin/championships/${id}/registrations`}
                        className="inline-block mt-1.5 text-[8px] font-black uppercase tracking-widest text-slate-500 hover:text-[#FF6B00] transition-colors">
                        Gerenciar →
                      </Link>
                    </div>
                  )}

                  {isCurrent && step.id === 3 && (
                    <Link href={`/admin/championships/${id}/organization`}
                      className="inline-flex items-center gap-1 mt-1 text-[8px] font-black uppercase tracking-widest text-[#FF6B00] hover:underline">
                      <Sparkles className="w-2.5 h-2.5" /> Organizar →
                    </Link>
                  )}

                  {isCurrent && step.id === 4 && (
                    <div className="flex flex-col gap-1 mt-1">
                      <Link href={`/admin/championships/${id}/matches`}
                        className="text-[8px] font-black uppercase tracking-widest text-[#FF6B00] hover:underline">
                        Jogos →
                      </Link>
                      <Link href={`/admin/championships/${id}/standings`}
                        className="text-[8px] font-black uppercase tracking-widest text-slate-500 hover:text-[#FF6B00] transition-colors">
                        Classificação →
                      </Link>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Alerta inteligente abaixo do pipeline */}
          {totalMissing > 0 && currentStep <= 2 && (
            <div className="mt-4 bg-yellow-500/5 border border-yellow-500/15 rounded-xl p-3 flex items-start justify-between gap-4">
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest text-yellow-400 mb-1">
                  Faltam {totalMissing} equipe(s) para liberar a organização
                </p>
                <p className="text-[9px] text-slate-500">
                  {missingPerCategory.filter(c => c.missing > 0).map(c => `${c.name}: falta ${c.missing}`).join(' · ')}
                </p>
              </div>
              <Link href={`/admin/championships/${id}/registrations`}
                className="flex-shrink-0 text-[9px] font-black uppercase tracking-widest text-white bg-[#FF6B00] px-3 py-1.5 rounded-lg hover:bg-[#E66000] transition-all">
                Adicionar →
              </Link>
            </div>
          )}

          {allCategoriesReady && currentStep <= 2 && (
            <div className="mt-4 bg-green-500/5 border border-green-500/15 rounded-xl p-3 flex items-center justify-between">
              <p className="text-[9px] font-black uppercase tracking-widest text-green-400">
                ✓ Inscrições completas — pronto para organizar
              </p>
              <Link href={`/admin/championships/${id}/organization`}
                className="flex-shrink-0 text-[9px] font-black uppercase tracking-widest text-white bg-[#FF6B00] px-3 py-1.5 rounded-lg hover:bg-[#E66000] transition-all inline-flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Organizar →
              </Link>
            </div>
          )}
        </div>

        {/* 2. STAT CARDS */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Categorias" value={categoryCount} sublabel="categorias ativas" accent="blue" icon={<BarChart3 className="w-5 h-5" />} />
          <StatCard label="Equipes Inscritas" value={confirmedTeams} sublabel="Times confirmados" accent="blue" icon={<Users className="w-5 h-5" />} />
          <StatCard label="Progresso de Jogos" value={`${completedGames}/${totalGames}`} sublabel="Jogos realizados" accent="purple" icon={<Calendar className="w-5 h-5" />} />
          <StatCard label="Próximo Jogo" value={nextGame ? format(nextGame.dateTime, "dd MMM", { locale: ptBR }) : "--"} sublabel={nextGame ? `${nextGame.homeTeam.name} vs ${nextGame.awayTeam.name}` : "Nenhum jogo"} accent="green" icon={<PlayCircle className="w-5 h-5" />} />
        </div>

        {/* 3. JOGOS + RESULTADOS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-[#0A0A0A] border border-white/5 rounded-3xl overflow-hidden">
            <div className="px-6 py-5 border-b border-white/5 flex justify-between items-center">
              <h3 className="text-sm font-black text-white uppercase tracking-widest">Próximos Jogos</h3>
              <Link href={`/admin/championships/${id}/matches`} className="text-[10px] font-black text-blue-500 uppercase hover:underline">Ver Todos →</Link>
            </div>
            <div className="divide-y divide-white/5">
              {upcomingGames.length > 0 ? upcomingGames.map((game) => (
                <div key={game.id} className="px-6 py-4 flex items-center justify-between hover:bg-white/[0.02] transition-all">
                  <div className="flex flex-col">
                    <span className="text-xs font-black text-white">{game.homeTeam.name} vs {game.awayTeam.name}</span>
                    <span className="text-[9px] font-bold text-slate-500">{format(game.dateTime, "dd MMM • HH:mm", { locale: ptBR })}</span>
                  </div>
                  <Badge variant="purple" size="sm">{game.category.name}</Badge>
                </div>
              )) : (
                <div className="p-10 text-center text-xs text-slate-600 font-medium italic">Nenhum jogo agendado.</div>
              )}
            </div>
          </div>

          <div className="bg-[#0A0A0A] border border-white/5 rounded-3xl overflow-hidden">
            <div className="px-6 py-5 border-b border-white/5 flex justify-between items-center">
              <h3 className="text-sm font-black text-white uppercase tracking-widest">Últimos Resultados</h3>
              <Link href={`/admin/championships/${id}/matches`} className="text-[10px] font-black text-green-500 uppercase hover:underline">Histórico →</Link>
            </div>
            <div className="divide-y divide-white/5">
              {lastResults.length > 0 ? lastResults.map((game) => (
                <div key={game.id} className="px-6 py-4 flex items-center justify-between hover:bg-white/[0.02] transition-all">
                  <div className="flex items-center gap-4">
                     <Badge variant="purple" size="sm" className="hidden sm:inline-flex">{game.category.name}</Badge>
                     <div className="flex items-center gap-3">
                       <span className="text-xs font-bold text-white leading-none">{game.homeTeam.name}</span>
                       <span className="text-lg font-black text-orange-500 tabular-nums">{game.homeScore}-{game.awayScore}</span>
                       <span className="text-xs font-bold text-white leading-none">{game.awayTeam.name}</span>
                     </div>
                  </div>
                  <Badge variant="success" size="sm">ENCERRADO</Badge>
                </div>
              )) : (
                <div className="p-10 text-center text-xs text-slate-600 font-medium italic">Sem resultados recentes.</div>
              )}
            </div>
          </div>
        </div>

        {/* 4. CLASSIFICAÇÃO + BRACKETS */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3 bg-[#0A0A0A] border border-white/5 rounded-3xl overflow-hidden h-fit">
            <div className="px-6 py-5 border-b border-white/5 flex justify-between items-center">
              <h3 className="text-sm font-black text-white uppercase tracking-widest">Classificação — {firstCategory?.name || "Geral"}</h3>
              <Link href={`/admin/championships/${id}/standings`} className="text-[10px] font-black text-orange-500 uppercase hover:underline">Ver Completa →</Link>
            </div>
            <div className="divide-y divide-white/5">
              {topStandings.length > 0 ? topStandings.map((standing, idx) => (
                <div key={standing.id} className="px-6 py-4 flex items-center justify-between hover:bg-white/[0.01] transition-all group">
                  <div className="flex items-center gap-4">
                    <span className={`text-xl font-black ${idx === 0 ? 'text-amber-500' : idx === 1 ? 'text-slate-400' : 'text-amber-700'}`}>{idx + 1}°</span>
                    <span className="text-sm font-bold text-white group-hover:text-orange-500 transition-colors">{standing.team.name}</span>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-center"><p className="text-[8px] font-black text-slate-500 uppercase mb-0.5">PTS</p><p className="text-sm font-black text-white leading-none">{standing.points}</p></div>
                    <div className="text-center"><p className="text-[8px] font-black text-slate-500 uppercase mb-0.5">V</p><p className="text-sm font-black text-green-500 leading-none">{standing.wins}</p></div>
                    <div className="text-center"><p className="text-[8px] font-black text-slate-500 uppercase mb-0.5">D</p><p className="text-sm font-black text-red-500 leading-none">{standing.losses}</p></div>
                  </div>
                </div>
              )) : (
                <div className="p-10 text-center text-xs text-slate-600 font-medium italic">Aguardando início dos jogos.</div>
              )}
            </div>
          </div>

          <div className="lg:col-span-2 bg-[#0A0A0A] border border-white/5 rounded-3xl p-6 h-fit">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-sm font-black text-white uppercase tracking-widest">Bracket Preview</h3>
              <Badge variant="purple" size="sm">Playoffs</Badge>
            </div>
            {playoffCategory ? (
              <div className="transform scale-90 origin-top">
                <Brackets games={playoffCategory.games as any} />
              </div>
            ) : (
              <div className="h-40 border border-dashed border-white/5 rounded-2xl flex flex-col items-center justify-center text-center p-6 bg-white/[0.01]">
                <BarChart3 className="w-8 h-8 text-slate-700 mb-3" />
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Indisponível em fase regular</p>
              </div>
            )}
          </div>
        </div>

      </div>
    )
  } catch (error: any) {
    console.error("Dashboard Error:", error)
    return (
      <div className="bg-[#0A0A0A] border border-red-500/20 rounded-3xl p-20 text-center">
        <h2 className="text-2xl font-black text-white mb-2">Erro ao carregar Dashboard</h2>
        <p className="text-slate-500 mb-6 font-mono text-xs">{error.message}</p>
      </div>
    )
  }
}
