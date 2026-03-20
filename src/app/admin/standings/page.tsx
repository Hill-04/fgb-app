import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/db"
import { BarChart3, Shield, Trophy, Medal } from "lucide-react"
import { Badge } from "@/components/Badge"
import { ExportStandingsButtons } from "./ExportStandingsWrapper"
import { Brackets } from "@/components/Brackets"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { RecalculateStandingsButton } from "./RecalculateStandingsButton"

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

    // 1. Fetch available championships for the selector
    const allChampionships = await prisma.championship.findMany({
      orderBy: { createdAt: 'desc' },
      select: { id: true, name: true }
    })

    const activeChampionshipId = championshipId || allChampionships[0]?.id

    // 2. Fetch championship categories for the chips
    const categories = activeChampionshipId ? await prisma.championshipCategory.findMany({
      where: { championshipId: activeChampionshipId },
      orderBy: { name: 'asc' }
    }) : []

    // 3. Fetch standings and playoff games for all or selected category
    let categoriesWithData: any[] = []

    if (activeChampionshipId) {
      const targetCategories = categoryId 
        ? categories.filter(c => c.id === categoryId)
        : categories

      categoriesWithData = await Promise.all(targetCategories.map(async (cat) => {
        const [standings, games] = await Promise.all([
          prisma.standing.findMany({
            where: { categoryId: cat.id },
            include: {
              team: { select: { id: true, name: true, logoUrl: true } }
            },
            orderBy: [
              { points: 'desc' },
              { wins: 'desc' },
              { pointsFor: 'desc' }
            ]
          }),
          prisma.game.findMany({
            where: { 
              categoryId: cat.id,
              phase: { gt: 1 } // Only playoff games
            },
            include: {
              homeTeam: { select: { name: true, logoUrl: true } },
              awayTeam: { select: { name: true, logoUrl: true } }
            },
            orderBy: { dateTime: 'asc' }
          })
        ])

        return {
          ...cat,
          standings,
          games
        }
      }))
    }

    return (
      <div className="space-y-8 pb-20">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight">Classificação Premium</h1>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">Tabelas Oficiais da Federacão</p>
          </div>

          <div className="flex items-center gap-3">
             <form action="/admin/standings" method="GET">
               <input type="hidden" name="categoryId" value={categoryId || ''} />
               <div className="relative group">
                 <select 
                   name="championshipId"
                   defaultValue={activeChampionshipId}
                   onChange={(e) => e.target.form?.submit()}
                   className="appearance-none bg-[#111] border border-white/10 text-white text-xs font-bold py-2.5 pl-4 pr-10 rounded-xl cursor-pointer hover:border-orange-500"
                 >
                   {allChampionships.map(c => (
                     <option key={c.id} value={c.id}>{c.name}</option>
                   ))}
                 </select>
               </div>
             </form>
          </div>
        </div>

        {/* Category Chips Filter */}
        {activeChampionshipId && categories.length > 0 && (
          <div className="flex flex-wrap gap-2 animate-fade-in">
            <Link
              href={`/admin/standings?championshipId=${activeChampionshipId}`}
              className={cn(
                "h-9 px-5 rounded-full flex items-center justify-center text-[10px] font-black uppercase tracking-widest transition-all border",
                !categoryId 
                  ? "bg-orange-500 border-orange-500 text-white shadow-lg shadow-orange-500/20" 
                  : "bg-white/5 border-white/5 text-slate-500 hover:bg-white/10 hover:border-white/10"
              )}
            >
              Todas as Categorias
            </Link>
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/admin/standings?championshipId=${activeChampionshipId}&categoryId=${cat.id}`}
                className={cn(
                  "h-9 px-5 rounded-full flex items-center justify-center text-[10px] font-black uppercase tracking-widest transition-all border",
                  categoryId === cat.id
                    ? "bg-blue-500 border-blue-500 text-white shadow-lg shadow-blue-500/20"
                    : "bg-white/5 border-white/5 text-slate-500 hover:bg-white/10 hover:border-white/10"
                )}
              >
                {cat.name}
              </Link>
            ))}
          </div>
        )}

        {/* Tables Section */}
        {!activeChampionshipId ? (
          <div className="bg-[#0A0A0A] border border-white/5 rounded-[32px] p-20 text-center">
            <Trophy className="w-16 h-16 text-slate-800 mx-auto mb-6" />
            <h3 className="text-xl font-black text-white mb-2 underline-offset-4 decoration-orange-500">Nenhum Campeonato Ativo</h3>
            <p className="text-slate-500 text-sm max-w-xs mx-auto font-medium tracking-tight">Selecione um campeonato para visualizar a classificação.</p>
          </div>
        ) : (
          <div className="space-y-12">
            {categoriesWithData.map((catGroup) => (
              <div key={catGroup.id} className="bg-[#0A0A0A] border border-white/5 rounded-[32px] overflow-hidden animate-fade-up">
                {/* Section Header */}
                <div className="bg-white/[0.02] px-8 py-6 border-b border-white/5 flex justify-between items-center">
                   <div className="flex items-center gap-4">
                      <div className="w-1.5 h-8 bg-orange-500 rounded-full" />
                      <div>
                        <h3 className="text-xl font-black text-white uppercase tracking-tight leading-none">{catGroup.name}</h3>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1.5">Campeonato Estadual</p>
                      </div>
                   </div>
                   <div className="flex gap-2">
                     <RecalculateStandingsButton categoryId={catGroup.id} />
                     <ExportStandingsButtons 
                        standings={catGroup.standings} 
                        categoryName={catGroup.name} 
                        championshipName={catGroup.championship?.name || "Campeonato"} 
                      />
                   </div>
                </div>

                {catGroup.standings.length === 0 ? (
                  <div className="p-20 text-center">
                    <p className="text-xs font-black text-slate-700 uppercase tracking-widest">Aguardando início das rodadas...</p>
                  </div>
                ) : (
                  <>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-white/5 text-[10px] font-black text-slate-500 uppercase tracking-widest bg-white/[0.01]">
                            <th className="px-8 py-5 text-center w-20">POS</th>
                            <th className="px-8 py-5">EQUIPE</th>
                            <th className="px-4 py-5 text-center">J</th>
                            <th className="px-4 py-5 text-center">V</th>
                            <th className="px-4 py-5 text-center">D</th>
                            <th className="px-4 py-5 text-center">PF</th>
                            <th className="px-4 py-5 text-center">PC</th>
                            <th className="px-4 py-5 text-center">SC</th>
                            <th className="px-10 py-5 text-center bg-white/[0.03] text-white">PTS</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.02]">
                          {catGroup.standings.map((row: any, index: number) => {
                            const isTop3 = index < 3
                            const medalColors = [
                              "text-amber-400 bg-amber-400/10 border-amber-400/20", // Gold
                              "text-slate-400 bg-slate-400/10 border-slate-400/20", // Silver
                              "text-amber-700 bg-amber-700/10 border-amber-700/20"  // Bronze
                            ]
                            
                            return (
                              <tr key={row.id} className="hover:bg-white/[0.02] transition-all group">
                                <td className="px-8 py-5 text-center">
                                  {isTop3 ? (
                                    <div className={cn("w-9 h-9 rounded-xl border flex items-center justify-center font-black text-sm mx-auto shadow-sm", medalColors[index])}>
                                      {index + 1}
                                    </div>
                                  ) : (
                                    <span className="text-xs font-black text-slate-700">{index + 1}</span>
                                  )}
                                </td>
                                <td className="px-8 py-5">
                                  <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden shadow-inner group-hover:border-orange-500/50 transition-all">
                                      {row.team.logoUrl ? (
                                        <img src={row.team.logoUrl} alt={row.team.name} className="w-full h-full object-cover" />
                                      ) : (
                                        <span className="text-sm font-black text-white">{row.team.name.charAt(0)}</span>
                                      )}
                                    </div>
                                    <div>
                                      <p className="text-sm font-black text-white group-hover:text-orange-500 transition-colors uppercase tracking-tight">{row.team.name}</p>
                                      <div className="flex items-center gap-1.5 mt-1">
                                        <div className="w-1 h-1 rounded-full bg-green-500" />
                                        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Inscrito</span>
                                      </div>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-4 py-5 text-center text-xs font-black text-slate-400 tabular-nums">{row.played}</td>
                                <td className="px-4 py-5 text-center text-xs font-black text-green-500 tabular-nums">{row.wins}</td>
                                <td className="px-4 py-5 text-center text-xs font-black text-red-500 tabular-nums">{row.losses}</td>
                                <td className="px-4 py-5 text-center text-[11px] font-bold text-slate-600 tabular-nums">{row.pointsFor}</td>
                                <td className="px-4 py-5 text-center text-[11px] font-bold text-slate-600 tabular-nums">{row.pointsAg}</td>
                                <td className="px-4 py-5 text-center text-[11px] font-black italic tabular-nums">
                                  <span className={cn(
                                    row.pointsFor - row.pointsAg > 0 ? "text-blue-500" : row.pointsFor - row.pointsAg < 0 ? "text-orange-500/50" : "text-slate-600"
                                  )}>
                                    {(row.pointsFor - row.pointsAg) > 0 ? `+${row.pointsFor - row.pointsAg}` : row.pointsFor - row.pointsAg}
                                  </span>
                                </td>
                                <td className="px-10 py-5 text-center bg-white/[0.03]">
                                  <span className="text-2xl font-black text-white leading-none tracking-tighter">{row.points}</span>
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Integrated Brackets */}
                    {catGroup.games.length > 0 && (
                      <div className="p-8 border-t border-white/5 bg-white/[0.01]">
                        <div className="mb-8 flex items-center gap-3">
                           <Medal className="w-5 h-5 text-orange-500" />
                           <div>
                             <h4 className="text-sm font-black text-white uppercase tracking-wider">Playoffs & Chaves</h4>
                             <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Fase Eliminatória Direta</p>
                           </div>
                        </div>
                        <div className="transform scale-95 origin-left">
                          <Brackets games={catGroup.games} className="p-0" />
                        </div>
                      </div>
                    )}
                  </>
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
      <div className="space-y-4 p-10 text-center">
        <Trophy className="w-12 h-12 text-slate-800 mx-auto" />
        <h2 className="text-xl font-black text-white">Erro ao carregar classificacão</h2>
        <p className="text-slate-500 text-xs font-mono">{error.message}</p>
      </div>
    )
  }
}
