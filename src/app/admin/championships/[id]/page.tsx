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
      <div className="space-y-8 pb-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Status Atual"
            value={formatChampionshipStatus(championship.status)}
            sublabel="Situação do campeonato"
            accent="orange"
            icon={<Settings className="w-5 h-5" />}
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
                  <div className={`flex-1 p-4 rounded-2xl border transition-all ${
                    isCurrent ? 'bg-orange-500/10 border-orange-500/30' : 
                    isPast ? 'bg-green-500/5 border-green-500/20' : 'bg-white/[0.05] border-white/5'
                  }`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        isCurrent ? 'bg-orange-500 text-white' :
                        isPast ? 'bg-green-500/20 text-green-500' : 'bg-white/5 text-slate-500'
                      }`}>
                        {isPast ? <CheckCircle2 className="w-5 h-5" /> : <step.icon className="w-5 h-5" />}
                      </div>
                      <div>
                        <p className={`text-[10px] font-black uppercase tracking-widest ${
                          isCurrent ? 'text-orange-500' : isPast ? 'text-green-500' : 'text-slate-500'
                        }`}>{step.id}. {step.label}</p>
                        <p className="text-[9px] text-slate-600 font-bold">{isPast ? 'CONCLUÍDO' : isCurrent ? 'ATIVO' : 'AGUARDANDO'}</p>
                      </div>
                    </div>
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
               <p className="text-sm font-black text-white">Status: {championship.status}</p>
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
