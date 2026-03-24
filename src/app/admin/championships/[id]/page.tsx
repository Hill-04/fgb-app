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
    const activeChampionshipId = id

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
      take: 5,
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

    return (
      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6 pb-10">

        {/* ─── COLUNA ESQUERDA — Pipeline Vertical ─── */}
        <div className="lg:sticky lg:top-6 h-fit bg-[#141414] border border-white/[0.08] rounded-3xl p-5">
          <div className="flex items-center justify-between mb-5">
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-600">Pipeline</p>
            <span className="text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-slate-500">
              {formatChampionshipStatus(championship.status)}
            </span>
          </div>

          <div className="flex flex-col">

            {/* STEP 1 — Criação */}
            <div className="flex gap-3">
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                </div>
                <div className="w-px flex-1 bg-white/[0.06] my-1 min-h-[16px]" />
              </div>
              <div className="pb-4 flex-1 min-w-0">
                <p className="text-xs font-black uppercase text-white tracking-tight">Criação</p>
                <p className="text-[10px] text-slate-500 mt-0.5">Campeonato configurado</p>
              </div>
            </div>

            {/* STEP 2 — Inscrições */}
            <div className="flex gap-3">
              <div className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-black ${
                  currentStep > 2 ? 'bg-green-500/20 text-green-500' :
                  currentStep === 2 ? 'bg-[#FF6B00] text-white' :
                  'bg-white/[0.05] border border-white/[0.08] text-slate-600'
                }`}>
                  {currentStep > 2 ? <CheckCircle2 className="w-4 h-4" /> : '2'}
                </div>
                <div className="w-px flex-1 bg-white/[0.06] my-1 min-h-[16px]" />
              </div>
              <div className="pb-4 flex-1 min-w-0">
                <p className={`text-xs font-black uppercase tracking-tight ${currentStep >= 2 ? 'text-white' : 'text-slate-600'}`}>
                  Inscrições
                </p>
                {championship.regDeadline && (
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    Prazo: {new Date(championship.regDeadline).toLocaleDateString('pt-BR')}
                  </p>
                )}
                {currentStep === 2 && (
                  <div className="mt-2 bg-black/30 border border-white/[0.06] rounded-xl p-3 space-y-2">
                    {/* Checklist */}
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full flex-shrink-0 ${championship.regDeadline ? 'bg-green-500/40' : 'bg-white/[0.08]'}`} />
                      <span className={`text-[9px] font-bold uppercase tracking-widest ${championship.regDeadline ? 'line-through text-slate-600' : 'text-slate-400'}`}>
                        Prazo definido
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full flex-shrink-0 ${allCategoriesReady ? 'bg-green-500/40' : 'bg-white/[0.08]'}`} />
                      <span className={`text-[9px] font-bold uppercase tracking-widest ${allCategoriesReady ? 'line-through text-slate-600' : 'text-slate-400'}`}>
                        Mínimo de times ({minTeams}/cat)
                      </span>
                    </div>

                    {/* Progresso por categoria */}
                    <div className="pt-1 space-y-2">
                      {missingPerCategory.map((cat, i) => (
                        <div key={i}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[9px] text-slate-500 truncate max-w-[140px]">{cat.name}</span>
                            <span className={`text-[9px] font-black flex-shrink-0 ml-1 ${cat.missing === 0 ? 'text-green-400' : 'text-[#FF6B00]'}`}>
                              {cat.confirmed}/{minTeams}
                            </span>
                          </div>
                          <div className="h-1 bg-white/[0.05] rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-700 ${cat.missing === 0 ? 'bg-green-500' : 'bg-[#FF6B00]'}`}
                              style={{ width: `${Math.min(100, Math.round((cat.confirmed / minTeams) * 100))}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>

                    <Link
                      href={`/admin/championships/${activeChampionshipId}/registrations`}
                      className="inline-block pt-1 text-[9px] font-black uppercase tracking-widest text-slate-500 hover:text-[#FF6B00] transition-colors"
                    >
                      Gerenciar inscrições →
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {/* STEP 3 — Organização */}
            <div className="flex gap-3">
              <div className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-black ${
                  currentStep > 3 ? 'bg-green-500/20 text-green-500' :
                  currentStep === 3 ? 'bg-[#FF6B00] text-white' :
                  allCategoriesReady ? 'bg-[#FF6B00]/20 border border-[#FF6B00]/30 text-[#FF6B00]' :
                  'bg-white/[0.05] border border-white/[0.08] text-slate-600'
                }`}>
                  {currentStep > 3 ? <CheckCircle2 className="w-4 h-4" /> : '3'}
                </div>
                <div className="w-px flex-1 bg-white/[0.06] my-1 min-h-[16px]" />
              </div>
              <div className="pb-4 flex-1 min-w-0">
                <p className={`text-xs font-black uppercase tracking-tight ${currentStep >= 3 || allCategoriesReady ? 'text-white' : 'text-slate-600'}`}>
                  Organização
                </p>
                {currentStep < 3 && !allCategoriesReady && (
                  <p className="text-[10px] text-slate-600 mt-0.5">Aguardando inscrições</p>
                )}
                {(currentStep === 3 || allCategoriesReady) && (
                  <Link
                    href={`/admin/championships/${activeChampionshipId}/organization`}
                    className="inline-flex items-center gap-1.5 mt-2 text-[9px] font-black uppercase tracking-widest text-white bg-[#FF6B00] px-3 py-1.5 rounded-lg hover:bg-[#E66000] transition-all"
                  >
                    <Sparkles className="w-3 h-3" />
                    {currentStep === 3 ? 'Organizar com IA →' : 'Pronto — Organizar →'}
                  </Link>
                )}
              </div>
            </div>

            {/* STEP 4 — Em Andamento */}
            <div className="flex gap-3">
              <div className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-black ${
                  currentStep > 4 ? 'bg-green-500/20 text-green-500' :
                  currentStep === 4 ? 'bg-[#FF6B00] text-white' :
                  'bg-white/[0.05] border border-white/[0.08] text-slate-600'
                }`}>
                  {currentStep > 4 ? <CheckCircle2 className="w-4 h-4" /> : '4'}
                </div>
                <div className="w-px flex-1 bg-white/[0.06] my-1 min-h-[16px]" />
              </div>
              <div className="pb-4 flex-1 min-w-0">
                <p className={`text-xs font-black uppercase tracking-tight ${currentStep >= 4 ? 'text-white' : 'text-slate-600'}`}>
                  Em andamento
                </p>
                <p className="text-[10px] text-slate-500 mt-0.5">Jogos + classificação em tempo real</p>
                {currentStep === 4 && (
                  <div className="flex gap-3 mt-2">
                    <Link href={`/admin/championships/${activeChampionshipId}/matches`}
                      className="text-[9px] font-black uppercase tracking-widest text-[#FF6B00] hover:underline">
                      Jogos →
                    </Link>
                    <Link href={`/admin/championships/${activeChampionshipId}/standings`}
                      className="text-[9px] font-black uppercase tracking-widest text-slate-500 hover:text-[#FF6B00] transition-colors">
                      Classificação →
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {/* STEP 5 — Encerramento */}
            <div className="flex gap-3">
              <div className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-black ${
                  currentStep === 5 ? 'bg-green-500/20 text-green-500' :
                  'bg-white/[0.05] border border-white/[0.08] text-slate-600'
                }`}>
                  {currentStep === 5 ? <CheckCircle2 className="w-4 h-4" /> : '5'}
                </div>
              </div>
              <div className="flex-1 min-w-0 flex items-center">
                <div>
                  <p className={`text-xs font-black uppercase tracking-tight ${currentStep === 5 ? 'text-white' : 'text-slate-600'}`}>
                    Encerramento
                  </p>
                  <p className="text-[10px] text-slate-600 mt-0.5">Todos os jogos finalizados</p>
                </div>
              </div>
            </div>

          </div>

          {/* Alerta abaixo dos steps */}
          {totalMissing > 0 && currentStep <= 2 && (
            <div className="mt-5 bg-yellow-500/5 border border-yellow-500/15 rounded-xl p-3">
              <p className="text-[9px] font-black uppercase tracking-widest text-yellow-400 mb-1">
                Faltam {totalMissing} equipe(s)
              </p>
              <p className="text-[9px] text-slate-500 leading-relaxed">
                {missingPerCategory.filter(c => c.missing > 0).map(c => `${c.name}: falta ${c.missing}`).join(' · ')}
              </p>
              <Link
                href={`/admin/championships/${activeChampionshipId}/registrations`}
                className="inline-block mt-2 text-[9px] font-black uppercase tracking-widest text-[#FF6B00] hover:underline"
              >
                Adicionar inscrição →
              </Link>
            </div>
          )}

          {allCategoriesReady && currentStep <= 2 && (
            <div className="mt-5 bg-green-500/5 border border-green-500/15 rounded-xl p-3">
              <p className="text-[9px] font-black uppercase tracking-widest text-green-400 mb-2">
                ✓ Inscrições completas
              </p>
              <Link
                href={`/admin/championships/${activeChampionshipId}/organization`}
                className="inline-flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-white bg-[#FF6B00] px-3 py-1.5 rounded-lg hover:bg-[#E66000] transition-all"
              >
                <Sparkles className="w-3 h-3" /> Organizar agora →
              </Link>
            </div>
          )}
        </div>

        {/* ─── COLUNA DIREITA — Stats + Jogos + Resultados ─── */}
        <div className="space-y-5">

          {/* Stat Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Categorias" value={categoryCount} sublabel="categorias ativas" accent="blue" icon={<BarChart3 className="w-5 h-5" />} />
            <StatCard label="Equipes Inscritas" value={confirmedTeams} sublabel="Times confirmados" accent="blue" icon={<Users className="w-5 h-5" />} />
            <StatCard label="Progresso de Jogos" value={`${completedGames}/${totalGames}`} sublabel="Jogos realizados" accent="purple" icon={<Calendar className="w-5 h-5" />} />
            <StatCard label="Próximo Jogo" value={nextGame ? format(nextGame.dateTime, "dd MMM", { locale: ptBR }) : "--"} sublabel={nextGame ? `${nextGame.homeTeam.name} vs ${nextGame.awayTeam.name}` : "Nenhum jogo"} accent="green" icon={<PlayCircle className="w-5 h-5" />} />
          </div>

          {/* Próximos Jogos + Últimos Resultados */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
            <div className="bg-[#0A0A0A] border border-white/5 rounded-3xl overflow-hidden">
              <div className="px-6 py-4 border-b border-white/5 flex justify-between items-center">
                <h3 className="text-xs font-black text-white uppercase tracking-widest">Próximos Jogos</h3>
                <Link href={`/admin/championships/${id}/matches`} className="text-[10px] font-black text-blue-500 uppercase hover:underline">Ver Todos →</Link>
              </div>
              <div className="divide-y divide-white/[0.03]">
                {upcomingGames.length > 0 ? upcomingGames.map((game) => (
                  <div key={game.id} className="px-6 py-3.5 flex items-center justify-between hover:bg-white/[0.02] transition-all">
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-black text-white truncate">{game.homeTeam.name} vs {game.awayTeam.name}</span>
                      <span className="text-[9px] font-bold text-slate-500 mt-0.5">{format(game.dateTime, "dd MMM • HH:mm", { locale: ptBR })}</span>
                    </div>
                    <Badge variant="purple" size="sm" className="ml-3 flex-shrink-0">{game.category.name}</Badge>
                  </div>
                )) : (
                  <div className="p-10 text-center text-xs text-slate-600 italic">Nenhum jogo agendado.</div>
                )}
              </div>
            </div>

            <div className="bg-[#0A0A0A] border border-white/5 rounded-3xl overflow-hidden">
              <div className="px-6 py-4 border-b border-white/5 flex justify-between items-center">
                <h3 className="text-xs font-black text-white uppercase tracking-widest">Últimos Resultados</h3>
                <Link href={`/admin/championships/${id}/matches`} className="text-[10px] font-black text-green-500 uppercase hover:underline">Histórico →</Link>
              </div>
              <div className="divide-y divide-white/[0.03]">
                {lastResults.length > 0 ? lastResults.map((game) => (
                  <div key={game.id} className="px-6 py-3.5 flex items-center justify-between hover:bg-white/[0.02] transition-all">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-xs font-bold text-white truncate max-w-[80px] hidden sm:block">{game.homeTeam.name}</span>
                      <span className="text-base font-black text-orange-500 tabular-nums flex-shrink-0">{game.homeScore}-{game.awayScore}</span>
                      <span className="text-xs font-bold text-white truncate max-w-[80px] hidden sm:block">{game.awayTeam.name}</span>
                    </div>
                    <Badge variant="success" size="sm" className="flex-shrink-0">FIM</Badge>
                  </div>
                )) : (
                  <div className="p-10 text-center text-xs text-slate-600 italic">Sem resultados recentes.</div>
                )}
              </div>
            </div>
          </div>

          {/* Classificação + Bracket */}
          <div className="grid grid-cols-1 xl:grid-cols-5 gap-5">
            <div className="xl:col-span-3 bg-[#0A0A0A] border border-white/5 rounded-3xl overflow-hidden">
              <div className="px-6 py-4 border-b border-white/5 flex justify-between items-center">
                <h3 className="text-xs font-black text-white uppercase tracking-widest">
                  Classificação — {firstCategory?.name || "Geral"}
                </h3>
                <Link href={`/admin/championships/${id}/standings`} className="text-[10px] font-black text-orange-500 uppercase hover:underline">Ver Completa →</Link>
              </div>
              <div className="divide-y divide-white/[0.03]">
                {topStandings.length > 0 ? topStandings.map((standing, idx) => (
                  <div key={standing.id} className="px-6 py-3.5 flex items-center justify-between hover:bg-white/[0.01] group transition-all">
                    <div className="flex items-center gap-4">
                      <span className={`text-lg font-black ${idx === 0 ? 'text-amber-500' : idx === 1 ? 'text-slate-400' : 'text-amber-700'}`}>{idx + 1}°</span>
                      <span className="text-sm font-bold text-white group-hover:text-orange-500 transition-colors">{standing.team.name}</span>
                    </div>
                    <div className="flex items-center gap-5">
                      <div className="text-center">
                        <p className="text-[8px] font-black text-slate-600 uppercase mb-0.5">PTS</p>
                        <p className="text-sm font-black text-white leading-none">{standing.points}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-[8px] font-black text-slate-600 uppercase mb-0.5">V</p>
                        <p className="text-sm font-black text-green-500 leading-none">{standing.wins}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-[8px] font-black text-slate-600 uppercase mb-0.5">D</p>
                        <p className="text-sm font-black text-red-500 leading-none">{standing.losses}</p>
                      </div>
                    </div>
                  </div>
                )) : (
                  <div className="p-10 text-center text-xs text-slate-600 italic">Aguardando início dos jogos.</div>
                )}
              </div>
            </div>

            <div className="xl:col-span-2 bg-[#0A0A0A] border border-white/5 rounded-3xl p-6">
              <div className="flex justify-between items-center mb-5">
                <h3 className="text-xs font-black text-white uppercase tracking-widest">Bracket Preview</h3>
                <Badge variant="purple" size="sm">Playoffs</Badge>
              </div>
              {playoffCategory ? (
                <div className="transform scale-90 origin-top">
                  <Brackets games={playoffCategory.games as any} />
                </div>
              ) : (
                <div className="h-36 border border-dashed border-white/5 rounded-2xl flex flex-col items-center justify-center text-center p-6 bg-white/[0.01]">
                  <BarChart3 className="w-7 h-7 text-slate-800 mb-3" />
                  <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Indisponível em fase regular</p>
                </div>
              )}
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
