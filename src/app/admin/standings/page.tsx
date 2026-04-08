import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/db"
import { BarChart3, Shield, Trophy, Medal } from "lucide-react"
import { Badge } from "@/components/Badge"
import { ExportStandingsButtons } from "./ExportStandingsButtons"
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
      where: { status: { not: 'ARCHIVED' } },
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
            <h1 className="fgb-display text-3xl text-[var(--black)] leading-none mb-2">Classificação Premium</h1>
            <p className="fgb-label text-[var(--gray)]" style={{ fontSize: 10 }}>Tabelas Oficiais da Federação</p>
          </div>

          <div className="flex items-center gap-3">
             <form action="/admin/standings" method="GET" className="flex items-center gap-2">
               <input type="hidden" name="categoryId" value={categoryId || ''} />
               <div className="relative group">
                 <select 
                   name="championshipId"
                   defaultValue={activeChampionshipId}
                   className="appearance-none bg-white border border-[var(--border)] text-[var(--black)] text-xs font-sans font-bold py-2.5 pl-4 pr-10 rounded-xl cursor-pointer hover:border-[var(--verde)] shadow-sm focus:outline-none focus:ring-1 focus:ring-[var(--verde)]"
                 >
                   {allChampionships.map(c => (
                     <option key={c.id} value={c.id}>{c.name}</option>
                   ))}
                 </select>
               </div>
               <button type="submit" className="fgb-btn-outline h-9 px-4 rounded-xl" style={{ fontSize: 10 }}>IR</button>
             </form>
          </div>
        </div>

        {/* Category Chips Filter */}
        {activeChampionshipId && categories.length > 0 && (
          <div className="flex flex-wrap gap-2 animate-fade-in">
            <Link
              href={`/admin/standings?championshipId=${activeChampionshipId}`}
              className={cn(
                "h-9 px-5 rounded-full flex items-center justify-center fgb-label uppercase transition-all border",
                !categoryId 
                  ? "bg-[var(--red)] border-[var(--red)] text-white shadow-lg" 
                  : "bg-white border-[var(--border)] text-[var(--gray)] hover:bg-[var(--gray-l)] hover:text-[var(--black)]"
              )}
              style={{ fontSize: 10, letterSpacing: 1 }}
            >
              Todas as Categorias
            </Link>
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/admin/standings?championshipId=${activeChampionshipId}&categoryId=${cat.id}`}
                className={cn(
                  "h-9 px-5 rounded-full flex items-center justify-center fgb-label uppercase transition-all border",
                  categoryId === cat.id
                    ? "bg-blue-600 border-blue-600 text-white shadow-lg"
                    : "bg-white border-[var(--border)] text-[var(--gray)] hover:bg-[var(--gray-l)] hover:text-[var(--black)]"
                )}
                style={{ fontSize: 10, letterSpacing: 1 }}
              >
                {cat.name}
              </Link>
            ))}
          </div>
        )}

        {/* Tables Section */}
        {!activeChampionshipId ? (
          <div className="fgb-card p-20 text-center bg-[var(--gray-l)]">
            <Trophy className="w-16 h-16 text-slate-300 mx-auto mb-6" />
            <h3 className="fgb-display text-xl text-[var(--black)] mb-2 underline-offset-4 decoration-[var(--verde)]">Nenhum Campeonato Ativo</h3>
            <p className="fgb-label text-[var(--gray)] max-w-xs mx-auto" style={{ textTransform: 'none', letterSpacing: 0 }}>Selecione um campeonato para visualizar a classificação.</p>
          </div>
        ) : (
          <div className="space-y-12">
            {categoriesWithData.map((catGroup) => (
              <div key={catGroup.id} className="fgb-card p-0 overflow-hidden animate-fade-up">
                {/* Section Header */}
                <div className="bg-[var(--gray-l)] px-8 py-6 border-b border-[var(--border)] flex justify-between items-center">
                   <div className="flex items-center gap-4">
                      <div className="w-1.5 h-8 bg-[var(--verde)] rounded-full" />
                      <div>
                        <h3 className="fgb-display text-xl text-[var(--black)] leading-none">{catGroup.name}</h3>
                        <p className="fgb-label text-[var(--gray)] mt-1.5" style={{ fontSize: 10 }}>Campeonato Estadual</p>
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
                    <p className="fgb-label text-[var(--gray)]" style={{ fontSize: 12 }}>Aguardando início das rodadas...</p>
                  </div>
                ) : (
                  <>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-[var(--border)] fgb-label text-[var(--gray)] bg-white">
                            <th className="px-8 py-5 text-center w-20">POS</th>
                            <th className="px-8 py-5">EQUIPE</th>
                            <th className="px-4 py-5 text-center">J</th>
                            <th className="px-4 py-5 text-center">V</th>
                            <th className="px-4 py-5 text-center">D</th>
                            <th className="px-4 py-5 text-center">PF</th>
                            <th className="px-4 py-5 text-center">PC</th>
                            <th className="px-4 py-5 text-center">SC</th>
                            <th className="px-10 py-5 text-center bg-[var(--gray-l)] text-[var(--black)]">PTS</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border)] bg-white">
                          {catGroup.standings.map((row: any, index: number) => {
                            const isTop3 = index < 3
                            const medalColors = [
                              "text-amber-500 bg-amber-50 border-amber-200", // Gold
                              "text-slate-500 bg-slate-50 border-slate-200", // Silver
                              "text-amber-800 bg-amber-100 border-amber-300"  // Bronze
                            ]
                            
                            return (
                              <tr key={row.id} className="hover:bg-[var(--gray-l)] transition-all group">
                                <td className="px-8 py-5 text-center">
                                  {isTop3 ? (
                                    <div className={cn("w-9 h-9 rounded-xl border flex items-center justify-center font-black text-sm mx-auto shadow-sm", medalColors[index])}>
                                      {index + 1}
                                    </div>
                                  ) : (
                                    <span className="font-black text-[var(--gray)] font-sans">{index + 1}</span>
                                  )}
                                </td>
                                <td className="px-8 py-5">
                                  <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-[var(--gray-l)] border border-[var(--border)] flex items-center justify-center overflow-hidden shadow-inner group-hover:border-[var(--verde)]/50 transition-all">
                                      {row.team.logoUrl ? (
                                        <img src={row.team.logoUrl} alt={row.team.name} className="w-full h-full object-cover" />
                                      ) : (
                                        <span className="text-sm font-black text-[var(--gray)]">{row.team.name.charAt(0)}</span>
                                      )}
                                    </div>
                                    <div>
                                      <p className="text-sm font-black text-[var(--black)] group-hover:text-[var(--verde)] transition-colors uppercase tracking-tight font-sans">{row.team.name}</p>
                                      <div className="flex items-center gap-1.5 mt-1">
                                        <div className="w-1 h-1 rounded-full bg-[var(--verde)]" />
                                        <span className="fgb-label text-[var(--gray)]" style={{ fontSize: 9 }}>Inscrito</span>
                                      </div>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-4 py-5 text-center text-xs font-black text-[var(--gray)] tabular-nums">{row.played}</td>
                                <td className="px-4 py-5 text-center text-xs font-black text-[var(--verde)] tabular-nums">{row.wins}</td>
                                <td className="px-4 py-5 text-center text-xs font-black text-[var(--red)] tabular-nums">{row.losses}</td>
                                <td className="px-4 py-5 text-center text-[11px] font-bold text-[var(--gray)] tabular-nums">{row.pointsFor}</td>
                                <td className="px-4 py-5 text-center text-[11px] font-bold text-[var(--gray)] tabular-nums">{row.pointsAg}</td>
                                <td className="px-4 py-5 text-center text-[11px] font-black italic tabular-nums">
                                  <span className={cn(
                                    row.pointsFor - row.pointsAg > 0 ? "text-blue-600" : row.pointsFor - row.pointsAg < 0 ? "text-[var(--red)]" : "text-[var(--gray)]"
                                  )}>
                                    {(row.pointsFor - row.pointsAg) > 0 ? `+${row.pointsFor - row.pointsAg}` : row.pointsFor - row.pointsAg}
                                  </span>
                                </td>
                                <td className="px-10 py-5 text-center bg-[var(--gray-l)]">
                                  <span className="fgb-display text-2xl text-[var(--black)] leading-none">{row.points}</span>
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Integrated Brackets */}
                    {catGroup.games.length > 0 && (
                      <div className="p-8 border-t border-[var(--border)] bg-gray-50/50">
                        <div className="mb-8 flex items-center gap-3">
                           <Medal className="w-5 h-5 text-[var(--verde)]" />
                           <div>
                             <h4 className="fgb-display text-sm text-[var(--black)]">Playoffs & Chaves</h4>
                             <p className="fgb-label text-[var(--gray)] mt-1" style={{ fontSize: 10 }}>Fase Eliminatória Direta</p>
                           </div>
                        </div>
                        <div className="transform scale-95 origin-left text-[var(--black)]">
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
    console.error('[STANDINGS PAGE ERROR]', error?.message, error?.stack)
    return (
      <div className="p-10 text-center">
        <h2 className="fgb-display text-xl text-[var(--black)] mb-2">Erro ao carregar Classificação</h2>
        <p className="fgb-label text-[var(--red)] font-mono text-xs" style={{ textTransform: 'none', letterSpacing: 0 }}>{error?.message || 'Erro desconhecido'}</p>
      </div>
    )
  }
}
