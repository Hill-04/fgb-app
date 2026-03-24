import { prisma } from '@/lib/db'
import Link from 'next/link'
import { StatCard } from '@/components/StatCard'
import { Badge } from '@/components/Badge'
import { Trophy, Users, Calendar, BarChart3, ArrowRight, CheckCircle2, PlayCircle, Flag, Settings, Sparkles } from 'lucide-react'
import { Brackets } from '@/components/Brackets'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { formatChampionshipStatus } from '@/lib/utils'
import { AISchedulingButton } from './AISchedulingButton'

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
    const scheduledGames = await prisma.game.count({
      where: { championshipId: id, status: 'SCHEDULED' }
    })
    const hasGamesScheduled = scheduledGames > 0
    const minTeams = championship.minTeamsPerCat || 3
    const teamsNeeded = Math.max(0, (minTeams * categoryCount) - registrationCount)

    const firstCategory = championship.categories[0]
    
    // Novas métricas para o Pipeline Vertical (Fase 11)
    const activeChampionshipId = id
    const categoriesWithTeams = await prisma.championshipCategory.findMany({
      where: { championshipId: activeChampionshipId },
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
      orderBy: [
        { points: 'desc' },
        { wins: 'desc' }
      ],
      take: 3,
      include: { team: true }
    }) : []

    const pipelineChecklist: Record<number, { task: string; done: boolean }[]> = {
      1: [ // DRAFT
        { task: 'Nome e ano definidos', done: !!championship.name },
        { task: 'Categorias configuradas', done: categoryCount > 0 },
        { task: 'Data de início definida', done: !!championship.startDate },
      ],
      2: [ // REGISTRATION_OPEN
        { task: `Mínimo de times por categoria (${minTeams})`, done: teamsNeeded === 0 },
        { task: 'Prazo de inscrições definido', done: !!championship.regDeadline },
        { task: `Times inscritos: ${registrationCount}`, done: registrationCount > 0 },
      ],
      3: [ // REGISTRATION_CLOSED
        { task: 'Inscrições encerradas', done: true },
        { task: 'Times confirmados nas categorias', done: registrationCount >= (minTeams * categoryCount) },
      ],
      4: [ // ONGOING
        { task: 'Calendário de jogos gerado', done: hasGamesScheduled },
        { task: 'Chaveamento definido', done: hasGamesScheduled },
        { task: 'Resultados sendo registrados', done: completedGames > 0 },
      ],
      5: [ // FINISHED
        { task: 'Todos os jogos realizados', done: completedGames === totalGames && totalGames > 0 },
        { task: 'Classificação final registrada', done: topStandings.length > 0 },
      ],
    }

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

    const registrationsByCategory = await prisma.championshipCategory.findMany({
      where: { championshipId: id },
      include: {
        registrations: {
          include: {
            registration: {
              include: { team: { select: { id: true, name: true } } }
            }
          },
          where: { registration: { status: 'CONFIRMED' } }
        }
      }
    })

    const statusMap = {
      'DRAFT': 1,
      'REGISTRATION_OPEN': 2,
      'REGISTRATION_CLOSED': 3,
      'ONGOING': 4,
      'FINISHED': 5
    }
    const currentStep = statusMap[championship.status as keyof typeof statusMap] || 1

    return (
      <div className="space-y-8 pb-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Categorias"
            value={categoryCount}
            sublabel="categorias ativas"
            accent="blue"
            icon={<BarChart3 className="w-5 h-5" />}
          />
          <StatCard
            label="Equipes Escritas"
            value={confirmedTeams}
            sublabel="Times confirmados"
            accent="blue"
            icon={<Users className="w-5 h-5" />}
          />
          <StatCard
            label="Progresso de Jogos"
            value={`${completedGames}/${totalGames}`}
            sublabel="Jogos realizados"
            accent="purple"
            icon={<Calendar className="w-5 h-5" />}
          />
          <StatCard
            label="Próximo Jogo"
            value={nextGame ? format(nextGame.dateTime, "dd MMM", { locale: ptBR }) : "--"}
            sublabel={nextGame ? `${nextGame.homeTeam.name} vs ${nextGame.awayTeam.name}` : "Nenhum jogo agendado"}
            accent="green"
            icon={<PlayCircle className="w-5 h-5" />}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-8">
          {/* COLUNA ESQUERDA — Pipeline Vertical */}
          <div className="bg-[#0A0A0A] border border-white/5 rounded-[32px] p-6 h-fit sticky top-6">
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-600 mb-6 flex items-center gap-2">
              <div className="w-1 h-1 rounded-full bg-orange-500" /> Pipeline de Evolução
            </p>
            <div className="flex flex-col">
              {/* STEP 1 — Criação */}
              <div className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0 border border-green-500/10">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                  </div>
                  <div className="w-px flex-1 bg-white/[0.05] my-2 min-h-[24px]" />
                </div>
                <div className="pb-6 flex-1">
                  <p className="text-[10px] font-black uppercase text-white tracking-widest leading-none">Criação</p>
                  <p className="text-[9px] font-bold text-slate-600 mt-1 uppercase tracking-tight">Setup finalizado</p>
                </div>
              </div>

              {/* STEP 2 — Inscrições */}
              <div className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-500 ${
                    currentStep > 2 ? 'bg-green-500/20 border border-green-500/10' :
                    currentStep === 2 ? 'bg-[#FF6B00] shadow-[0_0_15px_rgba(255,107,0,0.3)]' : 'bg-white/[0.03] border border-white/5'
                  }`}>
                    {currentStep > 2
                      ? <CheckCircle2 className="w-4 h-4 text-green-500" />
                      : <span className="text-[10px] font-black text-white">2</span>
                    }
                  </div>
                  <div className="w-px flex-1 bg-white/[0.05] my-2 min-h-[24px]" />
                </div>
                <div className="pb-6 flex-1">
                  <p className={`text-[10px] font-black uppercase tracking-widest leading-none ${
                    currentStep >= 2 ? 'text-white' : 'text-slate-600'
                  }`}>Inscrições</p>
                  
                  {currentStep === 2 && (
                    <div className="mt-4 bg-white/[0.02] border border-white/5 rounded-2xl p-4 space-y-4">
                      {/* Progresso por categoria */}
                      {missingPerCategory.map((cat, i) => (
                        <div key={i}>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[8px] text-slate-500 uppercase font-black truncate max-w-[100px]">
                              {cat.name}
                            </span>
                            <span className={`text-[8px] font-black ${cat.missing === 0 ? 'text-green-400' : 'text-[#FF6B00]'}`}>
                              {cat.confirmed}/{minTeams}
                            </span>
                          </div>
                          <div className="h-1 bg-white/[0.04] rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-1000 ${cat.missing === 0 ? 'bg-green-500' : 'bg-[#FF6B00]'}`}
                              style={{ width: `${Math.min(100, Math.round((cat.confirmed / minTeams) * 100))}%` }}
                            />
                          </div>
                        </div>
                      ))}

                      <Link
                        href={`/admin/championships/${id}/registrations`}
                        className="flex items-center justify-center gap-1.5 h-8 bg-white/5 hover:bg-[#FF6B00]/10 text-[8px] font-black uppercase tracking-widest text-slate-400 hover:text-[#FF6B00] rounded-lg transition-all border border-white/5 hover:border-[#FF6B00]/20"
                      >
                        Gerenciar Inscrições <ArrowRight className="w-2.5 h-2.5" />
                      </Link>
                    </div>
                  )}
                </div>
              </div>

              {/* STEP 3 — Organização */}
              <div className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-500 ${
                    currentStep > 3 ? 'bg-green-500/20 border border-green-500/10' :
                    currentStep === 3 ? 'bg-[#FF6B00] shadow-[0_0_15px_rgba(255,107,0,0.3)]' : 'bg-white/[0.03] border border-white/5'
                  }`}>
                    {currentStep > 3
                      ? <CheckCircle2 className="w-4 h-4 text-green-500" />
                      : <span className="text-[10px] font-black text-white">3</span>
                    }
                  </div>
                  <div className="w-px flex-1 bg-white/[0.05] my-2 min-h-[24px]" />
                </div>
                <div className="pb-6 flex-1">
                  <p className={`text-[10px] font-black uppercase tracking-widest leading-none ${
                    currentStep >= 3 ? 'text-white' : 'text-slate-600'
                  }`}>Organização</p>
                  
                  {currentStep === 3 && (
                    <div className="mt-3">
                      <Link
                        href={`/admin/championships/${id}/organization`}
                        className="flex items-center gap-2 h-9 bg-[#FF6B00] hover:bg-[#E66000] text-white text-[9px] font-black uppercase tracking-widest px-4 rounded-xl transition-all shadow-lg shadow-orange-600/20"
                      >
                        <Sparkles className="w-3.5 h-3.5" /> Gerar Jogos IA
                      </Link>
                    </div>
                  )}
                  {currentStep < 3 && allCategoriesReady && (
                    <div className="mt-2 bg-green-500/5 border border-green-500/10 rounded-xl p-3">
                      <p className="text-[8px] text-green-400 uppercase font-black tracking-widest leading-none">
                        ✓ Inscrições Completas
                      </p>
                      <Link
                        href={`/admin/championships/${id}/organization`}
                        className="flex items-center gap-2 h-8 bg-white/5 hover:bg-white/10 text-white text-[8px] font-black uppercase tracking-widest px-3 rounded-lg mt-2 transition-all"
                      >
                        <Sparkles className="w-3 h-3 text-[#FF6B00]" /> Organizar Agora
                      </Link>
                    </div>
                  )}
                </div>
              </div>

              {/* STEP 4 — Em Andamento */}
              <div className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-500 ${
                    currentStep > 4 ? 'bg-green-500/20 border border-green-500/10' :
                    currentStep === 4 ? 'bg-[#FF6B00] shadow-[0_0_15px_rgba(255,107,0,0.3)]' : 'bg-white/[0.03] border border-white/5'
                  }`}>
                    {currentStep > 4
                      ? <CheckCircle2 className="w-4 h-4 text-green-500" />
                      : <span className="text-[10px] font-black text-white">4</span>
                    }
                  </div>
                  <div className="w-px flex-1 bg-white/[0.05] my-2 min-h-[24px]" />
                </div>
                <div className="pb-6 flex-1">
                  <p className={`text-[10px] font-black uppercase tracking-widest leading-none ${
                    currentStep >= 4 ? 'text-white' : 'text-slate-600'
                  }`}>Em Andamento</p>
                  
                  {currentStep === 4 && (
                    <div className="mt-3 flex gap-2">
                      <Link href={`/admin/championships/${id}/matches`}
                        className="text-[8px] font-black uppercase tracking-widest text-[#FF6B00] hover:underline bg-[#FF6B00]/5 px-3 py-1.5 rounded-lg border border-[#FF6B00]/10">
                        Resultados
                      </Link>
                      <Link href={`/admin/championships/${id}/standings`}
                        className="text-[8px] font-black uppercase tracking-widest text-slate-500 hover:text-white px-3 py-1.5 rounded-lg bg-white/5">
                        Tabela
                      </Link>
                    </div>
                  )}
                </div>
              </div>

              {/* STEP 5 — Encerramento */}
              <div className="flex gap-4">
                <div className="flex items-center justify-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-500 ${
                    currentStep === 5 ? 'bg-green-500 border border-green-500/20 shadow-[0_0_15px_rgba(34,197,94,0.3)]' : 'bg-white/[0.03] border border-white/5'
                  }`}>
                    {currentStep === 5
                      ? <CheckCircle2 className="w-4 h-4 text-white" />
                      : <span className={`text-[10px] font-black ${currentStep === 5 ? 'text-white' : 'text-slate-700'}`}>5</span>
                    }
                  </div>
                </div>
                <div className="flex-1">
                  <p className={`text-[10px] font-black uppercase tracking-widest leading-none ${
                    currentStep === 5 ? 'text-white' : 'text-slate-600'
                  }`}>Finalizado</p>
                </div>
              </div>
            </div>
          </div>

          {/* COLUNA DIREITA — Conteúdo principal */}
          <div className="space-y-6">
            {/* Alerta Inteligente */}
            {totalMissing > 0 && currentStep <= 2 && (
              <div className="bg-[#FF6B00]/5 border border-[#FF6B00]/10 rounded-[28px] p-6 flex items-center justify-between animate-in fade-in slide-in-from-top-4 duration-500 group overflow-hidden relative">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#FF6B00]/5 rounded-full -mr-16 -mt-16 blur-3xl" />
                <div className="flex items-center gap-6 relative z-10">
                  <div className="w-14 h-14 rounded-2xl bg-[#FF6B00]/10 flex items-center justify-center border border-[#FF6B00]/20 group-hover:scale-110 transition-transform">
                     <Users className="w-6 h-6 text-[#FF6B00]" />
                  </div>
                  <div>
                    <h4 className="text-xl font-black italic uppercase text-white tracking-tight">Faltam {totalMissing} Equipes</h4>
                    <p className="text-sm text-slate-500 mt-1 font-medium">
                      {missingPerCategory
                        .filter(c => c.missing > 0)
                        .map(c => `${c.name}: falta ${c.missing}`)
                        .join(' · ')
                      }
                    </p>
                  </div>
                </div>
                <Link
                  href={`/admin/championships/${id}/registrations`}
                  className="px-6 h-11 bg-white/5 hover:bg-[#FF6B00] text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center gap-2 relative z-10 hover:shadow-lg hover:shadow-orange-600/20"
                >
                  Adicionar Inscrição <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}

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

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3 bg-[#0A0A0A] border border-white/5 rounded-3xl overflow-hidden h-fit">
            <div className="px-6 py-5 border-b border-white/5 flex justify-between items-center">
              <h3 className="text-sm font-black text-white uppercase tracking-widest">
                Classificação — {firstCategory?.name || "Geral"}
              </h3>
              <Link href={`/admin/championships/${id}/standings`} className="text-[10px] font-black text-orange-500 uppercase hover:underline">Ver Completa →</Link>
            </div>
            <div className="divide-y divide-white/5">
              {topStandings.length > 0 ? topStandings.map((standing, idx) => (
                <div key={standing.id} className="px-6 py-4 flex items-center justify-between animate-fade-in group" style={{ animationDelay: `${idx * 50}ms` }}>
                  <div className="flex items-center gap-4">
                    <span className={`text-xl font-black ${
                      idx === 0 ? 'text-amber-500' : idx === 1 ? 'text-slate-400' : 'text-amber-700'
                    }`}>{idx + 1}°</span>
                    <span className="text-sm font-bold text-white group-hover:text-orange-500 transition-colors">{standing.team.name}</span>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <p className="text-[8px] font-black text-slate-500 uppercase mb-0.5">PTS</p>
                      <p className="text-sm font-black text-white leading-none">{standing.points}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[8px] font-black text-slate-500 uppercase mb-0.5">V</p>
                      <p className="text-sm font-black text-green-500 leading-none">{standing.wins}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[8px] font-black text-slate-500 uppercase mb-0.5">D</p>
                      <p className="text-sm font-black text-red-500 leading-none">{standing.losses}</p>
                    </div>
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
