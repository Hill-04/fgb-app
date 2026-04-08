import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/db"
import { BarChart3, Shield, Trophy, Medal } from "lucide-react"
import { Badge } from "@/components/Badge"
import { ExportStandingsButtons } from "@/app/admin/standings/ExportStandingsButtons"
import { Brackets } from "@/components/Brackets"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { RecalculateStandingsButton } from "@/app/admin/standings/RecalculateStandingsButton"

export const dynamic = 'force-dynamic'

export default async function AdminStandingsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ categoryId?: string }>
}) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !(session.user as any).isAdmin) redirect('/login')

    const { id } = await params
    const { categoryId } = await searchParams

    const activeChampionshipId = id

    // 2. Fetch championship categories for the chips
    const categories = await prisma.championshipCategory.findMany({
      where: { championshipId: activeChampionshipId },
      orderBy: { name: 'asc' }
    })

    // 3. Fetch standings and playoff games for all or selected category
    let categoriesWithData: any[] = []

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

    return (
      <div className="space-y-8 pb-20 font-sans">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="fgb-display text-3xl text-[var(--black)] leading-none">Classificação Premium</h1>
            <p className="fgb-label text-[var(--gray)] mt-1" style={{ fontSize: 10, letterSpacing: 2 }}>Tabelas Oficiais da Federacão</p>
          </div>
        </div>

        {/* Category Chips Filter */}
        {categories.length > 0 && (
          <div className="flex flex-wrap gap-2 animate-fade-in">
            <Link
              href={`/admin/championships/${id}/standings`}
              className={cn(
                "h-9 px-5 rounded-full flex items-center justify-center text-[10px] font-black uppercase tracking-widest transition-all border",
                !categoryId 
                  ? "bg-orange-50 border-orange-200 text-orange-600 shadow-sm" 
                  : "bg-white border-[var(--border)] text-[var(--gray)] hover:bg-[var(--gray-l)] hover:text-[var(--black)] shadow-sm"
              )}
            >
              Todas as Categorias
            </Link>
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/admin/championships/${id}/standings?categoryId=${cat.id}`}
                className={cn(
                  "h-9 px-5 rounded-full flex items-center justify-center text-[10px] font-black uppercase tracking-widest transition-all border",
                  categoryId === cat.id
                    ? "bg-blue-50 border-blue-200 text-blue-600 shadow-sm"
                    : "bg-white border-[var(--border)] text-[var(--gray)] hover:bg-[var(--gray-l)] hover:text-[var(--black)] shadow-sm"
                )}
              >
                {cat.name}
              </Link>
            ))}
          </div>
        )}

        {/* Tables Section */}
        <div className="space-y-12">
          {categoriesWithData.map((catGroup) => (
            <div key={catGroup.id} className="fgb-card bg-white overflow-hidden animate-fade-up shadow-sm">
              {/* Section Header */}
              <div className="bg-[var(--gray-l)] px-8 py-6 border-b border-[var(--border)] flex justify-between items-center">
                 <div className="flex items-center gap-4">
                    <div className="w-1.5 h-8 bg-orange-600 rounded-full" />
                    <div>
                      <h3 className="fgb-display text-xl text-[var(--black)] leading-none">{catGroup.name}</h3>
                      <p className="fgb-label text-[var(--gray)] mt-1.5" style={{ fontSize: 10, letterSpacing: 2 }}>Campeonato Estadual</p>
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
                  <p className="text-xs font-black text-[var(--gray)] uppercase tracking-widest">Aguardando início das rodadas...</p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-[var(--border)] text-[10px] font-black text-[var(--gray)] uppercase tracking-widest bg-[var(--gray-l)]">
                          <th className="px-8 py-5 text-center w-20">POS</th>
                          <th className="px-8 py-5">EQUIPE</th>
                          <th className="px-4 py-5 text-center">J</th>
                          <th className="px-4 py-5 text-center">V</th>
                          <th className="px-4 py-5 text-center">D</th>
                          <th className="px-4 py-5 text-center">PF</th>
                          <th className="px-4 py-5 text-center">PC</th>
                          <th className="px-4 py-5 text-center">SC</th>
                          <th className="px-10 py-5 text-center bg-gray-50 text-[var(--black)] border-l border-[var(--border)]">PTS</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--border)]">
                        {catGroup.standings.map((row: any, index: number) => {
                          const isTop3 = index < 3
                          const medalColors = [
                            "text-amber-500 bg-amber-50 border-amber-200", // Gold
                            "text-slate-500 bg-slate-50 border-slate-200", // Silver
                            "text-amber-700 bg-orange-50 border-orange-200"  // Bronze
                          ]
                          
                          return (
                            <tr key={row.id} className="hover:bg-[var(--gray-l)] transition-all group">
                              <td className="px-8 py-5 text-center">
                                {isTop3 ? (
                                  <div className={cn("w-9 h-9 rounded-xl border flex items-center justify-center font-black text-sm mx-auto shadow-sm", medalColors[index])}>
                                    {index + 1}
                                  </div>
                                ) : (
                                  <span className="text-xs font-black text-[var(--gray)]">{index + 1}</span>
                                )}
                              </td>
                              <td className="px-8 py-5">
                                <div className="flex items-center gap-4">
                                  <div className="w-12 h-12 rounded-2xl bg-[var(--gray-l)] border border-[var(--border)] flex items-center justify-center overflow-hidden shadow-inner group-hover:border-[var(--amarelo)] transition-all">
                                    {row.team.logoUrl ? (
                                      <img src={row.team.logoUrl} alt={row.team.name} className="w-full h-full object-cover" />
                                    ) : (
                                      <span className="text-sm font-black text-[var(--black)]">{row.team.name.charAt(0)}</span>
                                    )}
                                  </div>
                                  <div>
                                    <p className="text-sm font-black text-[var(--black)] group-hover:text-orange-600 transition-colors uppercase tracking-tight">{row.team.name}</p>
                                    <div className="flex items-center gap-1.5 mt-1">
                                      <div className="w-1 h-1 rounded-full bg-[var(--verde)]" />
                                      <span className="text-[9px] font-bold text-[var(--gray)] uppercase tracking-widest">Inscrito</span>
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-5 text-center text-xs font-black text-[var(--gray)] tabular-nums">{row.played}</td>
                              <td className="px-4 py-5 text-center text-xs font-black text-green-600 tabular-nums">{row.wins}</td>
                              <td className="px-4 py-5 text-center text-xs font-black text-red-600 tabular-nums">{row.losses}</td>
                              <td className="px-4 py-5 text-center text-[11px] font-bold text-[var(--gray)] tabular-nums">{row.pointsFor}</td>
                              <td className="px-4 py-5 text-center text-[11px] font-bold text-[var(--gray)] tabular-nums">{row.pointsAg}</td>
                              <td className="px-4 py-5 text-center text-[11px] font-black italic tabular-nums">
                                <span className={cn(
                                  row.pointsFor - row.pointsAg > 0 ? "text-blue-600" : row.pointsFor - row.pointsAg < 0 ? "text-orange-600" : "text-[var(--gray)]"
                                )}>
                                  {(row.pointsFor - row.pointsAg) > 0 ? `+${row.pointsFor - row.pointsAg}` : row.pointsFor - row.pointsAg}
                                </span>
                              </td>
                              <td className="px-10 py-5 text-center bg-gray-50 border-l border-[var(--border)]">
                                <span className="text-2xl font-black text-[var(--black)] leading-none tracking-tighter">{row.points}</span>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Integrated Brackets */}
                  {catGroup.games.length > 0 && (
                    <div className="p-8 border-t border-[var(--border)] bg-[var(--gray-l)]">
                      <div className="mb-8 flex items-center gap-3">
                         <Medal className="w-5 h-5 text-orange-600" />
                         <div>
                           <h4 className="text-sm font-black text-[var(--black)] uppercase tracking-wider">Playoffs & Chaves</h4>
                           <p className="text-[10px] font-bold text-[var(--gray)] uppercase tracking-widest">Fase Eliminatória Direta</p>
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
      </div>
    )
  } catch (error: any) {
    console.error('[STANDINGS PAGE ERROR]', error?.message, error?.stack)
    return (
      <div className="p-10 text-center">
        <h2 className="text-xl font-black text-[var(--black)] mb-2">Erro ao carregar Classificação</h2>
        <p className="text-[var(--gray)] font-mono text-xs">{error?.message || 'Erro desconhecido'}</p>
      </div>
    )
  }
}
