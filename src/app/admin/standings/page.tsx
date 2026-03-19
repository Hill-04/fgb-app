import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/db"
import { BarChart3, Shield, Trophy } from "lucide-react"
import { Badge } from "@/components/Badge"
import { ExportStandingsButtons } from "./ExportStandingsButtons"
import { Brackets } from "@/components/Brackets"

export const dynamic = 'force-dynamic'

export default async function AdminStandingsPage({
  searchParams,
}: {
  searchParams: Promise<{ championshipId?: string; categoryId?: string }>
}) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !(session.user as any).isAdmin) redirect('/login')

    const params = await searchParams
    const { championshipId, categoryId } = params

    const championships = await (prisma.championship.findMany({
      include: { categories: true } as any,
      orderBy: { createdAt: 'desc' }
    }) as any)

    let categoriesWithStandings: any[] = []

    if (championshipId) {
      const selectedChampionship = championships.find((c: any) => c.id === championshipId)
      
      if (selectedChampionship) {
        // If categoryId is provided, only show that one. Otherwise, show all.
        const targetCategories = categoryId 
          ? selectedChampionship.categories.filter((cat: any) => cat.id === categoryId)
          : selectedChampionship.categories

        categoriesWithStandings = await Promise.all(targetCategories.map(async (cat: any) => {
          const [standings, games] = await Promise.all([
            prisma.standing.findMany({
              where: { categoryId: cat.id },
              include: {
                team: { select: { id: true, name: true, logoUrl: true } }
              },
              orderBy: [
                { points: 'desc' },
                { pointsFor: 'desc' }
              ]
            }),
            prisma.game.findMany({
              where: { 
                categoryId: cat.id,
                phase: { gt: 1 }
              },
              include: {
                homeTeam: { select: { name: true, logoUrl: true } },
                awayTeam: { select: { name: true, logoUrl: true } }
              },
              orderBy: { dateTime: 'asc' }
            })
          ])
          
          // Tiebreaker Sort (Balance)
          standings.sort((a, b) => {
            if (b.points !== a.points) return 0
            return (b.pointsFor - b.pointsAg) - (a.pointsFor - a.pointsAg)
          })

          return {
            ...cat,
            standings,
            games,
            championship: selectedChampionship
          }
        }))
      }
    }

    return (
      <div className="space-y-10 max-w-[1400px] mx-auto pb-20">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-4xl font-display font-black text-white uppercase tracking-tight mb-2">Classificação Premium</h1>
            <p className="text-slate-500 font-medium uppercase tracking-widest text-[10px]">Tabelas Oficiais e Índices de Aproveitamento</p>
          </div>
        </div>

        {/* Global Filter */}
        <div className="bg-[#111] p-8 rounded-[32px] border border-white/5 shadow-2xl">
          <form className="flex flex-wrap gap-6 w-full" action="/admin/standings">
            <div className="space-y-1.5 flex-1 min-w-[250px]">
              <label className="text-[10px] uppercase font-black text-slate-500 tracking-[0.2em] ml-1">Campeonato</label>
              <select
                name="championshipId"
                className="w-full bg-white/[0.03] border-white/10 border h-14 rounded-2xl px-4 text-sm text-white focus:outline-none focus:border-[#FF6B00]/50 transition-all font-bold"
                defaultValue={championshipId ?? ''}
              >
                <option value="" className="bg-[#0A0A0A]">Todos os Campeonatos</option>
                {championships.map((championship: any) => <option key={championship.id} value={championship.id} className="bg-[#0A0A0A]">{championship.name}</option>)}
              </select>
            </div>
            <div className="space-y-1.5 flex-1 min-w-[250px]">
              <label className="text-[10px] uppercase font-black text-slate-500 tracking-[0.2em] ml-1">Filtro de Categoria (opcional)</label>
              <select
                name="categoryId"
                className="w-full bg-white/[0.03] border-white/10 border h-14 rounded-2xl px-4 text-sm text-white focus:outline-none focus:border-[#FF6B00]/50 transition-all font-bold disabled:opacity-30"
                defaultValue={categoryId ?? ''}
                disabled={!championshipId}
              >
                <option value="" className="bg-[#0A0A0A]">Ver Todas as Categorias</option>
                {championshipId && championships.find((c: any) => c.id === championshipId)?.categories.map((cat: any) => (
                  <option key={cat.id} value={cat.id} className="bg-[#0A0A0A]">{cat.name}</option>
                ))}
              </select>
            </div>
            <button type="submit" className="bg-[#FF6B00] hover:bg-[#E66000] text-white font-black uppercase tracking-widest px-12 h-14 rounded-2xl transition-all shadow-lg shadow-[#FF6B00]/20 self-end">
              Atualizar
            </button>
          </form>
        </div>

        {/* Categories List */}
        {!championshipId ? (
          <div className="bg-[#111] border border-white/5 rounded-[40px] p-24 text-center">
            <Trophy className="w-16 h-16 text-slate-800 mx-auto mb-6" />
            <h3 className="text-2xl font-display font-black text-white mb-3 uppercase tracking-tight">Selecione um Campeonato</h3>
            <p className="text-slate-500 text-sm font-medium max-w-sm mx-auto">Escolha um torneio acima para visualizar as tabelas de classificação de todas as suas categorias.</p>
          </div>
        ) : categoriesWithStandings.length === 0 ? (
          <div className="bg-[#111] border border-white/5 rounded-[40px] p-24 text-center">
            <Shield className="w-16 h-16 text-slate-800 mx-auto mb-6" />
            <h3 className="text-2xl font-display font-black text-white mb-3 uppercase tracking-tight">Nenhuma Categoria Encontrada</h3>
          </div>
        ) : (
          <div className="space-y-12">
            {categoriesWithStandings.map((catGroup: any) => (
              <div key={catGroup.id} className="bg-[#111] border border-white/5 rounded-[40px] overflow-hidden shadow-2xl relative animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="absolute top-0 right-0 w-80 h-80 bg-[#FF6B00]/5 rounded-full blur-[140px] -mr-40 -mt-40" />
                
                <div className="bg-white/5 px-10 py-8 border-b border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                   <div className="flex items-center gap-5">
                      <div className="w-2.5 h-10 bg-[#FF6B00] rounded-full shadow-[0_0_15px_rgba(255,107,0,0.5)]" />
                      <div>
                        <h3 className="text-xl font-display font-black text-white uppercase tracking-wider">{catGroup.name}</h3>
                        <p className="text-[10px] font-black text-[#FF6B00] uppercase tracking-widest">{catGroup.championship.name}</p>
                      </div>
                   </div>
                   
                   <div className="flex items-center gap-4">
                      <ExportStandingsButtons 
                        standings={catGroup.standings} 
                        categoryName={catGroup.name} 
                        championshipName={catGroup.championship.name} 
                      />
                      {catGroup.championship.isSimulation && (
                        <Badge className="px-3 py-1 text-[9px] font-black tracking-widest uppercase border bg-purple-500/10 text-purple-400 border-purple-500/20 h-10">
                          Simulação
                        </Badge>
                      )}
                   </div>
                </div>

                {catGroup.standings.length === 0 ? (
                  <div className="p-20 text-center opacity-40">
                    <p className="text-slate-500 text-sm font-black uppercase tracking-widest">Sem dados de pontuação para esta categoria.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto relative z-10">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-white/5 font-display text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] bg-white/[0.01]">
                          <th className="px-8 py-6 text-center w-24">Pos</th>
                          <th className="px-8 py-6 text-left">Equipe</th>
                          <th className="px-6 py-6 text-center">PJ</th>
                          <th className="px-6 py-6 text-center text-green-500">V</th>
                          <th className="px-6 py-6 text-center text-red-500">D</th>
                          <th className="px-6 py-6 text-center">PF</th>
                          <th className="px-6 py-6 text-center">PC</th>
                          <th className="px-6 py-6 text-center">SC</th>
                          <th className="px-12 py-6 text-center text-xs text-white bg-white/5 w-40 border-l border-white/5">Pontos</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/[0.03]">
                        {catGroup.standings.map((row: any, index: number) => (
                          <tr key={row.id} className="hover:bg-white/[0.02] transition-all group">
                            <td className="px-8 py-8 text-center">
                              {index < 4 ? (
                                <div className="w-10 h-10 rounded-2xl bg-[#FF6B00]/10 border border-[#FF6B00]/20 flex items-center justify-center font-display font-black text-[#FF6B00] mx-auto text-base shadow-inner">
                                  {index + 1}
                                </div>
                              ) : (
                                <span className="text-base font-display font-black text-slate-700">{index + 1}</span>
                              )}
                            </td>
                            <td className="px-8 py-8">
                              <div className="flex items-center gap-6">
                                <div className="w-14 h-14 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden shrink-0 transition-all group-hover:border-[#FF6B00]/40 group-hover:scale-105 shadow-2xl shadow-black/50">
                                  {row.team.logoUrl ? (
                                    <img src={row.team.logoUrl} alt={row.team.name} className="w-full h-full object-cover" />
                                  ) : (
                                    <div className="text-[#FF6B00] font-display font-black text-xl">{row.team.name.charAt(0)}</div>
                                  )}
                                </div>
                                <div className="flex flex-col gap-1">
                                  <span className="text-base font-display font-black text-white uppercase tracking-tight">{row.team.name}</span>
                                  <div className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Equipe Ativa</span>
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-8 text-center text-base font-black text-slate-400">{row.played}</td>
                            <td className="px-6 py-8 text-center text-base font-black text-green-500">{row.wins}</td>
                            <td className="px-6 py-8 text-center text-base font-black text-red-500">{row.losses}</td>
                            <td className="px-6 py-8 text-center text-sm font-bold text-slate-500">{row.pointsFor}</td>
                            <td className="px-6 py-8 text-center text-sm font-bold text-slate-500">{row.pointsAg}</td>
                            <td className="px-6 py-8 text-center font-display font-black italic">
                              <span className={row.pointsFor - row.pointsAg >= 0 ? 'text-slate-400' : 'text-orange-500/50'}>
                                {row.pointsFor - row.pointsAg > 0 ? `+${row.pointsFor - row.pointsAg}` : row.pointsFor - row.pointsAg}
                              </span>
                            </td>
                            <td className="px-12 py-8 text-center bg-white/[0.04] border-l border-white/5">
                               <div className="flex flex-col items-center">
                                  <span className="text-3xl font-display font-black text-white leading-none tracking-tighter shadow-orange-600/20">{row.points}</span>
                                  <span className="text-[9px] font-black text-[#FF6B00] uppercase tracking-widest mt-2">Pts</span>
                               </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {catGroup.championship.hasPlayoffs && catGroup.games.length > 0 && (
                      <div className="border-t border-white/5 mt-10 pt-10 px-10">
                        <div className="mb-8">
                          <h3 className="text-xl font-display font-black text-white uppercase tracking-wider italic">Fase de Playoffs</h3>
                          <p className="text-[10px] font-black text-[#FF6B00] uppercase tracking-widest mt-1">Duelos de Eliminação Direta</p>
                        </div>
                        <Brackets games={catGroup.games} className="p-0" />
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    )
  } catch (error: any) {
    console.error('Standings error:', error)
    return (
      <div className="space-y-8 max-w-[1200px] mx-auto pb-20">
        <h1 className="text-4xl font-display font-black text-white uppercase tracking-tight">Classificação</h1>
        <div className="bg-[#111] border border-white/5 rounded-[40px] p-24 text-center">
          <BarChart3 className="w-16 h-16 text-slate-800 mx-auto mb-6" />
          <h3 className="text-2xl font-display font-black text-white mb-2 uppercase tracking-tight">Erro ao carregar dados</h3>
          <p className="text-slate-500 text-sm">Ocorreu um problema ao processar as tabelas. Tente novamente.</p>
        </div>
      </div>
    )
  }
}
