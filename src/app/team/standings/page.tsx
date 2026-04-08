import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/db"
import { Badge } from "@/components/Badge"
import { StandingsSelector } from './StandingsSelector'
import { Trophy, TrendingUp, Users } from "lucide-react"
import { Table } from "@/components/ui/table"
import { Brackets } from "@/components/Brackets"

export default async function teamStandingsPage({
  searchParams,
}: {
  searchParams: Promise<{ categoryId?: string }>
}) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'TEAM') {
    redirect('/login')
  }

  const { categoryId } = await searchParams
  const teamId = (session.user as any).teamId

  const registrations = await prisma.registration.findMany({
    where: { teamId },
    include: {
      championship: {
        include: {
          categories: {
            where: categoryId ? { id: categoryId } : undefined,
            include: {
              standings: {
                include: {
                  team: { select: { id: true, name: true, logoUrl: true } }
                },
                orderBy: [
                  { points: 'desc' },
                  { pointsFor: 'desc' }
                ]
              },
              games: {
                where: { phase: { gt: 1 } },
                include: {
                  homeTeam: { select: { name: true, logoUrl: true } },
                  awayTeam: { select: { name: true, logoUrl: true } }
                },
                orderBy: { dateTime: 'asc' }
              }
            }
          }
        }
      }
    }
  })

  const allTeamCategories = await prisma.championshipCategory.findMany({
    where: {
      registrations: {
        some: {
          registration: { teamId }
        }
      }
    },
    select: { id: true, name: true }
  })

  return (
    <div className="space-y-10 max-w-6xl mx-auto font-sans">
      {/* Header */}
      <div className="animate-fade-in border-b border-[var(--border)] pb-8">
        <div className="flex items-center gap-3 mb-3">
           <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-orange-600" />
           </div>
           <span className="text-[var(--gray)] font-bold uppercase tracking-widest text-[10px]">Rankings de Competição</span>
        </div>
        <h1 className="text-4xl font-display font-black text-[var(--black)] tracking-tight uppercase italic">Classificação Geral</h1>
        <p className="text-[var(--gray)] mt-2 font-medium">Acompanhe o desempenho da sua equipe e adversários em tempo real.</p>

        {/* Category Filter — Client Component */}
        <div className="mt-8">
          <StandingsSelector allTeamCategories={allTeamCategories} categoryId={categoryId} />
        </div>
      </div>

      {registrations.length === 0 ? (
        <div className="bg-gray-50 border border-[var(--border)] rounded-3xl p-20 text-center animate-fade-up shadow-inner">
           <Trophy className="w-16 h-16 text-gray-400 mx-auto mb-6" />
           <h3 className="text-xl font-bold text-[var(--black)] mb-2 uppercase italic tracking-tight">Sem classificações disponíveis</h3>
           <p className="text-[var(--gray)] max-w-xs mx-auto font-medium">Sua equipe precisa estar confirmada em um campeonato para visualizar o ranqueamento.</p>
        </div>
      ) : (
        <div className="space-y-16">
          {registrations.map((reg: any) => (
            <div key={reg.id} className="animate-fade-up space-y-8">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-display font-black text-[var(--black)] tracking-tight uppercase italic">{reg.championship.name}</h2>
                  <p className="text-xs font-bold text-[var(--gray)] uppercase tracking-widest mt-1">Temporada {reg.championship.year}</p>
                </div>
                <Badge variant="outline" className="font-black border-green-200 bg-green-50 text-green-700 uppercase tracking-widest text-[10px]">CONFIRMADO</Badge>
              </div>

              <div className="grid gap-10">
                {reg.championship.categories.map((cat: any) => {
                  const standings = cat.standings
                  return (
                    <div key={cat.id} className="fgb-card bg-white border border-[var(--border)] rounded-3xl overflow-hidden shadow-sm">
                      <div className="bg-gray-50 px-6 py-4 border-b border-[var(--border)] flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Users className="w-4 h-4 text-orange-500" />
                          <h3 className="text-sm font-black text-[var(--black)] uppercase tracking-wider">{cat.name}</h3>
                        </div>
                        <span className="text-[10px] font-bold text-[var(--gray)] uppercase tracking-widest">{standings.length} Equipes</span>
                      </div>

                      {standings.length > 0 ? (
                        <div className="overflow-x-auto">
                          <table className="w-full text-left">
                            <thead>
                              <tr className="border-b border-[var(--border)] text-[10px] font-black text-[var(--gray)] uppercase tracking-widest bg-white">
                                <th className="px-6 py-4">#</th>
                                <th className="px-4 py-4">Equipe</th>
                                <th className="px-4 py-4 text-center">PTS</th>
                                <th className="px-4 py-4 text-center">V</th>
                                <th className="px-4 py-4 text-center">D</th>
                                <th className="px-4 py-4 text-center">SP</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 bg-white">
                              {standings.map((s: any, i: number) => (
                                <tr key={s.id} className={`text-xs transition-all ${s.team.id === teamId ? 'bg-orange-50' : 'hover:bg-gray-50'}`}>
                                  <td className="px-6 py-4">
                                    <span className={`text-sm font-black ${i === 0 ? 'text-[var(--amarelo)] drop-shadow-sm' : i === 1 ? 'text-gray-400' : i === 2 ? 'text-orange-800' : 'text-[var(--gray)]'}`}>
                                      {i + 1}°
                                    </span>
                                  </td>
                                  <td className="px-4 py-4">
                                    <span className={`font-bold uppercase tracking-tight ${s.team.id === teamId ? 'text-orange-700' : 'text-gray-800'}`}>
                                      {s.team.name} {s.team.id === teamId && <span className="text-[9px] ml-1 opacity-80">(Sua equipe)</span>}
                                    </span>
                                  </td>
                                  <td className="px-4 py-4 text-center font-black text-[var(--black)]">{s.points}</td>
                                  <td className="px-4 py-4 text-center font-bold text-green-600">{s.wins}</td>
                                  <td className="px-4 py-4 text-center font-bold text-red-600">{s.losses}</td>
                                  <td className="px-4 py-4 text-center font-bold text-[var(--gray)]">{(s.pointsFor ?? 0) - (s.pointsAgainst ?? 0)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="p-16 text-center text-xs text-[var(--gray)] font-medium">Nenhum resultado registrado ainda.</div>
                      )}

                      {reg.championship.hasPlayoffs && cat.games.length > 0 && (
                        <div className="border-t border-[var(--border)] mt-8 pt-8 bg-white">
                          <div className="px-6 mb-6">
                            <h4 className="text-[10px] font-black text-orange-600 uppercase tracking-[0.2em] mb-1">Playoffs</h4>
                            <p className="text-[var(--black)] text-lg font-display font-black uppercase tracking-tight italic">Chaveamento Final</p>
                          </div>
                          <Brackets games={cat.games as any} />
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
