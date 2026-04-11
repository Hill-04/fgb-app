import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/db"
import { Medal, Search, User as UserIcon } from "lucide-react"

export const dynamic = 'force-dynamic'

export default async function AdminCestinhasPage({
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

    // Fetch categories for filter
    const categories = await prisma.championshipCategory.findMany({
      where: { championshipId: id },
      orderBy: { name: 'asc' }
    })

    // Fetch REAL player statistics
    const stats = await prisma.playerStat.groupBy({
      by: ['userId', 'teamId'],
      where: { 
        game: { 
          championshipId: id,
          categoryId: categoryId || undefined,
          status: 'FINISHED'
        } 
      },
      _sum: { points: true },
      _count: { gameId: true },
    })

    // Fetch user and team details for the stats
    const playerDetails = await Promise.all(stats.map(async (s) => {
      const [user, team, membership] = await Promise.all([
        prisma.user.findUnique({ where: { id: s.userId }, select: { name: true } }),
        prisma.team.findUnique({ where: { id: s.teamId }, select: { name: true } }),
        prisma.teamMembership.findUnique({ 
          where: { userId: s.userId }, 
          select: { number: true } 
        })
      ])
      
      const points = s._sum.points || 0
      const games = s._count.gameId || 0

      return {
        id: s.userId,
        name: user?.name || 'Atleta',
        teamName: team?.name || 'Equipe',
        number: membership?.number || null,
        points,
        games,
        avg: games > 0 ? points / games : 0
      }
    }))

    // Sort by points desc
    const sortedScorers = playerDetails.sort((a, b) => b.points - a.points)
    const topScorers = sortedScorers.slice(0, 10) // Show top 10

    // Categories filter for the UI
    const activeCategory = categories.find(c => c.id === categoryId)

    return (
      <div className="space-y-8 pb-20 font-sans">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="fgb-display text-3xl text-[var(--black)] leading-none">Top Cestinhas</h1>
            <p className="fgb-label text-[var(--gray)] mt-1" style={{ fontSize: 10, letterSpacing: 2 }}>
              {activeCategory ? `Ranking: ${activeCategory.name}` : 'Ranking Geral do Campeonato'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <select 
              onChange={(e) => window.location.href = `/admin/championships/${id}/cestinhas?categoryId=${e.target.value}`}
              defaultValue={categoryId || ""}
              className="h-10 px-4 rounded-xl border border-[var(--border)] bg-white text-xs font-bold focus:outline-none focus:border-[var(--verde)]"
            >
              <option value="">Todas as Categorias</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <div className="relative hidden md:block">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--gray)]" />
              <input 
                type="text" 
                placeholder="Buscar atleta..." 
                className="pl-10 pr-4 h-10 w-48 rounded-full bg-[var(--gray-l)] border border-[var(--border)] text-[var(--black)] text-sm focus:outline-none focus:border-[var(--verde)] transition-all font-bold"
              />
            </div>
          </div>
        </div>

        {topScorers.length === 0 ? (
          <div className="fgb-card bg-white p-20 text-center">
            <UserIcon className="w-12 h-12 text-[var(--gray)] mx-auto mb-4 opacity-30" />
            <h3 className="fgb-display text-lg text-[var(--black)] mb-2">Sem estatísticas registradas</h3>
            <p className="fgb-label text-[var(--gray)]" style={{ textTransform: 'none', letterSpacing: 0 }}>
              As pontuações aparecerão aqui após o registro dos resultados dos jogos.
            </p>
          </div>
        ) : (
          <>
            {/* Podium for top 3 */}
            <div className="fgb-card bg-white p-8 overflow-hidden shadow-sm flex flex-col md:flex-row items-end justify-center gap-4 pt-16 relative">
              <div className="absolute top-0 right-0 w-96 h-96 bg-[var(--amarelo)]/10 blur-[100px] rounded-full pointer-events-none -z-10" />

              {/* 2nd Place */}
              {topScorers[1] && (
                <div className="flex flex-col items-center z-10 hidden md:flex">
                  <div className="w-16 h-16 rounded-full bg-slate-100 border-4 border-white flex items-center justify-center shadow-lg mb-4 z-20 overflow-hidden">
                    <UserIcon className="w-8 h-8 text-slate-400" />
                  </div>
                  <div className="bg-gradient-to-b from-slate-200 to-slate-100 w-32 h-40 rounded-t-2xl border border-slate-300 flex flex-col items-center pt-4 shadow-sm">
                    <span className="text-3xl font-black text-slate-500 font-mono tracking-tighter">{topScorers[1].points}</span>
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest mt-1">Pontos</span>
                    <div className="mt-auto bg-slate-300 w-full py-2 text-center rounded-t-lg">
                      <p className="text-[10px] font-black text-slate-700 uppercase leading-tight truncate px-2">{topScorers[1].name}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* 1st Place */}
              {topScorers[0] && (
                <div className="flex flex-col items-center z-20">
                  <div className="w-24 h-24 rounded-full bg-[var(--amarelo)]/20 border-4 border-white flex items-center justify-center shadow-xl mb-4 relative z-30">
                    <UserIcon className="w-12 h-12 text-[var(--amarelo)]" />
                    <div className="absolute -bottom-3 bg-[var(--amarelo)] text-white text-[10px] font-black uppercase tracking-widest px-3 py-0.5 rounded-full border-2 border-white">#1 MVP</div>
                  </div>
                  <div className="bg-gradient-to-b from-[var(--amarelo)]/20 to-[var(--yellow)]/10 w-40 h-52 rounded-t-2xl border border-[var(--amarelo)]/30 border-b-0 flex flex-col items-center pt-6 shadow-2xl">
                    <span className="text-4xl font-black text-[var(--amarelo)] font-mono tracking-tighter">{topScorers[0].points}</span>
                    <span className="text-[10px] font-black uppercase text-orange-600/70 tracking-widest mt-1">Pontos</span>
                    <div className="mt-auto bg-[var(--amarelo)] w-full py-4 text-center rounded-t-xl text-white">
                      <p className="text-xs font-black uppercase leading-tight truncate px-2">{topScorers[0].name}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* 3rd Place */}
              {topScorers[2] && (
                <div className="flex flex-col items-center z-10 hidden md:flex">
                  <div className="w-16 h-16 rounded-full bg-orange-50 border-4 border-white flex items-center justify-center shadow-lg mb-4 z-20 overflow-hidden">
                    <UserIcon className="w-8 h-8 text-orange-400" />
                  </div>
                  <div className="bg-gradient-to-b from-orange-100 to-orange-50 w-32 h-36 rounded-t-2xl border border-orange-200 flex flex-col items-center pt-4 shadow-sm">
                    <span className="text-3xl font-black text-orange-400 font-mono tracking-tighter">{topScorers[2].points}</span>
                    <span className="text-[10px] font-black uppercase text-orange-300 tracking-widest mt-1">Pontos</span>
                    <div className="mt-auto bg-orange-200 w-full py-2 text-center rounded-t-lg">
                      <p className="text-[10px] font-black text-orange-700 uppercase leading-tight truncate px-2">{topScorers[2].name}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Leaderboard Table */}
            <div className="fgb-card bg-white mt-8 overflow-hidden shadow-sm">
              <div className="fgb-table-wrap">
                <table className="fgb-table w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[var(--border)] text-[10px] font-black text-[var(--gray)] uppercase tracking-widest bg-[var(--gray-l)]">
                      <th className="px-8 py-5 text-center w-20">POS</th>
                      <th className="px-8 py-5">ATLETA</th>
                      <th className="px-8 py-5">EQUIPE</th>
                      <th className="px-4 py-5 text-center">J</th>
                      <th className="px-4 py-5 text-center">MÉDIA</th>
                      <th className="px-8 py-5 text-right font-bold text-[var(--black)]">Total PTS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    {sortedScorers.map((scorer, index) => (
                      <tr key={scorer.id} className="hover:bg-[var(--gray-l)] transition-all group">
                        <td className="px-8 py-5 text-center">
                          <span className="text-xs font-black text-[var(--gray)]">{index + 1}</span>
                        </td>
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-[var(--gray-l)] border border-[var(--border)] flex items-center justify-center shrink-0">
                              <UserIcon className="w-4 h-4 text-[var(--gray)]" />
                            </div>
                            <div>
                              <p className="text-sm font-black text-[var(--black)] uppercase">{scorer.name}</p>
                              <span className="text-[9px] font-bold text-[var(--gray)] uppercase">Camisa {scorer.number || '--'}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-5">
                          <span className="text-xs font-black text-[var(--gray)] uppercase">{scorer.teamName}</span>
                        </td>
                        <td className="px-4 py-5 text-center text-xs font-black text-[var(--gray)] tabular-nums">{scorer.games}</td>
                        <td className="px-4 py-5 text-center text-xs font-bold text-blue-600 tabular-nums">{scorer.avg.toFixed(1)}</td>
                        <td className="px-8 py-5 text-right">
                          <span className="text-xl font-black text-[var(--black)] tabular-nums">{scorer.points}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    )
  } catch (error: any) {
    return (
      <div className="p-10 text-center">
        <h2 className="text-xl font-black text-[var(--black)] mb-2">Erro ao carregar Cestinhas</h2>
        <p className="text-[var(--gray)] font-mono text-xs">{error?.message || 'Erro desconhecido'}</p>
      </div>
    )
  }
}
