import { prisma } from '@/lib/db'
import Link from 'next/link'
import { StatCard } from '@/components/StatCard'
import { Badge } from '@/components/Badge'
import { Trophy, Users, Calendar, BarChart3, ArrowRight, CheckCircle2, PlayCircle, Flag, Settings, Sparkles } from 'lucide-react'
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
    const scheduledGames = await prisma.game.count({
      where: { championshipId: id, status: 'SCHEDULED' }
    })
    const hasGamesScheduled = scheduledGames > 0
    const minTeams = championship.minTeamsPerCat || 4
    const teamsNeeded = Math.max(0, (minTeams * categoryCount) - registrationCount)

    const firstCategory = championship.categories[0]
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

        <div className="bg-[#0A0A0A] border border-white/5 rounded-3xl p-6">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em]">Pipeline de Execução</h3>
            <Badge variant="purple" size="sm" className="bg-purple-500/10 text-purple-500 border-purple-500/20">ESTÁVEL</Badge>
          </div>
          
          <div className="flex flex-wrap md:flex-nowrap gap-2">
            {[
              { id: 1, label: "Criar", icon: Trophy },
              { id: 2, label: "Inscrições", icon: Users },
              { id: 3, label: "Organizar IA", icon: Sparkles },
              { id: 4, label: "Em Andamento", icon: PlayCircle },
              { id: 5, label: "Encerrar", icon: Flag }
            ].map((step, idx, arr) => {
              const isPast = currentStep > step.id
              const isCurrent = currentStep === step.id
              
              return (
                <div key={step.id} className="flex-1 min-w-[120px] flex items-center">
                  <div className={`flex-1 p-5 rounded-[24px] border transition-all ${
                    isCurrent ? 'bg-[#FF6B00]/10 border-[#FF6B00]/30 ring-1 ring-[#FF6B00]/20' : 
                    isPast ? 'bg-green-500/5 border-green-500/10' : 'bg-white/[0.02] border-white/5 opacity-50'
                  }`}>
                    <div className="flex items-center gap-4 mb-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-transform ${isCurrent ? 'scale-110' : ''} ${
                        isCurrent ? 'bg-[#FF6B00] text-white shadow-lg shadow-orange-600/20' :
                        isPast ? 'bg-green-500/20 text-green-500' : 'bg-white/5 text-slate-500'
                      }`}>
                        {isPast ? <CheckCircle2 className="w-5 h-5" /> : <step.icon className="w-5 h-5" />}
                      </div>
                      <div>
                        <p className={`text-[10px] font-black uppercase tracking-widest ${
                          isCurrent ? 'text-[#FF6B00]' : isPast ? 'text-green-500' : 'text-slate-500'
                        }`}>{step.id}. {step.label}</p>
                        <p className="text-[9px] text-slate-600 font-bold tracking-tight">{isPast ? 'CONCLUÍDO' : isCurrent ? 'EM FOCO' : 'AGUARDANDO'}</p>
                      </div>
                    </div>

                    {isCurrent && pipelineChecklist[step.id] && (
                      <div className="space-y-4 border-t border-white/5 pt-4">
                        <div className="space-y-2">
                          {pipelineChecklist[step.id].map((item, i) => (
                            <div key={i} className="flex items-center gap-2">
                              <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center flex-shrink-0 ${
                                item.done ? 'bg-green-500' : 'bg-white/10'
                              }`}>
                                {item.done && <CheckCircle2 className="w-2.5 h-2.5 text-white" />}
                              </div>
                              <span className={`text-[9px] font-bold uppercase tracking-widest ${
                                item.done ? 'text-green-400 line-through opacity-60' : 'text-slate-400'
                              }`}>
                                {item.task}
                              </span>
                            </div>
                          ))}
                        </div>

                        {/* Equipes por Categoria (Apenas no Step 2) */}
                        {isCurrent && currentStep === 2 && registrationsByCategory.length > 0 && (
                          <div className="mt-4 space-y-3 pt-4 border-t border-white/5">
                            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">
                              Equipes por Categoria
                            </p>
                            {registrationsByCategory.map(cat => (
                              <div key={cat.id} className="bg-white/[0.03] rounded-xl p-3 border border-white/5">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-[9px] font-black uppercase tracking-widest text-[#FF6B00]">
                                    {cat.name}
                                  </span>
                                  <span className="text-[9px] font-black text-slate-500">
                                    {cat.registrations.length}/{minTeams}
                                  </span>
                                </div>
                                <div className="flex flex-wrap gap-1">
                                  {cat.registrations.length > 0 ? (
                                    cat.registrations.map(r => (
                                      <span key={r.registration.id} className="text-[8px] font-bold uppercase bg-white/[0.05] border border-white/[0.08] px-2 py-0.5 rounded-lg text-slate-300">
                                        {r.registration.team.name}
                                      </span>
                                    ))
                                  ) : (
                                    <span className="text-[8px] text-slate-600 italic font-medium">Nenhuma equipe ainda</span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* CTA Automático */}
                        {(() => {
                          const currentChecklist = pipelineChecklist[currentStep] || []
                          const allDone = currentChecklist.every(item => item.done)
                          
                          if (!allDone) {
                             if (teamsNeeded > 0 && currentStep === 2) {
                               return (
                                 <p className="text-[9px] font-black text-yellow-500 uppercase tracking-widest mt-1 flex items-center gap-1.5 bg-yellow-500/5 p-2 rounded-lg border border-yellow-500/10">
                                   <span className="animate-pulse">⚠️</span> Faltam {teamsNeeded} time(s)
                                 </p>
                               )
                             }
                             return null
                          }

                          return (
                            <div className="mt-4 p-3 bg-green-500/10 border border-green-500/20 rounded-xl animate-in fade-in slide-in-from-top-2 duration-500">
                              <p className="text-[9px] font-black uppercase tracking-widest text-green-400 mb-2 flex items-center gap-1.5">
                                <CheckCircle2 className="w-3 h-3" /> Etapa Concluída!
                              </p>
                              {currentStep === 1 && (
                                <Link
                                  href={`/admin/championships/${id}/settings`}
                                  className="w-full text-[9px] font-black uppercase tracking-widest text-white bg-[#FF6B00] px-3 py-2 rounded-lg hover:bg-[#E66000] transition-all flex items-center justify-center gap-2 shadow-lg shadow-orange-600/20"
                                >
                                  Abrir Inscrições →
                                </Link>
                              )}
                              {currentStep === 2 && (
                                <Link
                                  href={`/admin/championships/${id}/matches`}
                                  className="w-full text-[9px] font-black uppercase tracking-widest text-white bg-[#FF6B00] px-3 py-2 rounded-lg hover:bg-[#E66000] transition-all flex items-center justify-center gap-2 shadow-lg shadow-orange-600/20"
                                >
                                  Organizar Jogos →
                                </Link>
                              )}
                              {currentStep === 4 && (
                                <Link
                                  href={`/admin/championships/${id}/standings`}
                                  className="w-full text-[9px] font-black uppercase tracking-widest text-white bg-[#FF6B00] px-3 py-2 rounded-lg hover:bg-[#E66000] transition-all flex items-center justify-center gap-2 shadow-lg shadow-orange-600/20"
                                >
                                  Ver Classificação Final →
                                </Link>
                              )}
                            </div>
                          )
                        })()}
                      </div>
                    )}
                  </div>
                  {idx < arr.length - 1 && (
                    <ArrowRight className="w-4 h-4 text-slate-800 mx-1 hidden lg:block" />
                  )}
                </div>
              )
            })}
          </div>

          <div className="mt-8 p-4 rounded-2xl bg-orange-500/5 border border-orange-500/10 flex items-center gap-4">
             <div className="text-2xl">🏀</div>
             <div className="flex-1">
               <p className="text-sm font-black text-white">Status: {formatChampionshipStatus(championship.status)}</p>
               <p className="text-xs text-slate-500 font-medium">
                 {currentStep === 1 && "Complete as informações básicas para abrir as inscrições."}
                 {currentStep === 2 && "Acompanhe as inscrições dos times e valide os documentos."}
                 {currentStep === 3 && "Use nossa IA para gerar o calendário e organizar categorias."}
                 {currentStep === 4 && "Registre os resultados dos jogos realizados para atualizar a classificação."}
                 {currentStep === 5 && "O campeonato foi finalizado. Veja o relatório final."}
               </p>
             </div>
             <Link 
              href={currentStep === 4 ? `/admin/championships/${id}/matches` : `/admin/championships/${id}/settings`}
              className="h-10 px-6 bg-white/5 hover:bg-white/10 text-white rounded-xl text-xs font-black uppercase tracking-widest flex items-center transition-all"
             >
               {currentStep === 4 ? "Registrar Resultados →" : "Gerenciar →"}
             </Link>
          </div>
        </div>

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
