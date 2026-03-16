import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/db"
import { BarChart3, Shield } from "lucide-react"

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

    const championships = await prisma.championship.findMany({
      include: { categories: true },
      orderBy: { createdAt: 'desc' }
    })

    let standings: any[] = []
    let categoryInfo: any = null

    if (categoryId) {
      categoryInfo = await prisma.championshipCategory.findUnique({
        where: { id: categoryId },
        include: {
          championship: { select: { name: true } },
          games: {
            where: { status: 'COMPLETED' },
            include: { homeTeam: { select: { id: true, name: true, logoUrl: true } }, awayTeam: { select: { id: true, name: true, logoUrl: true } } }
          }
        }
      })

      if (categoryInfo) {
        const map = new Map<string, any>()
        
        for (const game of categoryInfo.games) {
          for (const team of [game.homeTeam, game.awayTeam]) {
            if (!map.has(team.id)) {
              map.set(team.id, { id: team.id, name: team.name, logoUrl: team.logoUrl, played: 0, wins: 0, losses: 0, ptsFor: 0, ptsAg: 0, points: 0 })
            }
          }
          const home = map.get(game.homeTeamId)!
          const away = map.get(game.awayTeamId)!
          home.played++; away.played++
          home.ptsFor += game.homeScore ?? 0; home.ptsAg += game.awayScore ?? 0
          away.ptsFor += game.awayScore ?? 0; away.ptsAg += game.homeScore ?? 0
          if ((game.homeScore ?? 0) > (game.awayScore ?? 0)) {
            home.wins++; home.points += 2; away.losses++; away.points += 1
          } else if ((game.awayScore ?? 0) > (game.homeScore ?? 0)) {
            away.wins++; away.points += 2; home.losses++; home.points += 1
          }
        }
        
        standings = [...map.values()].sort((a, b) => b.points - a.points || (b.ptsFor - b.ptsAg) - (a.ptsFor - a.ptsAg))
      }
    }

    return (
      <div className="space-y-8 max-w-6xl mx-auto">
        <div>
          <h1 className="text-4xl font-display font-black text-white uppercase tracking-tight mb-2">Classificação</h1>
          <p className="text-slate-500 font-medium uppercase tracking-widest text-[10px]">Visão Geral de Pontuação</p>
        </div>

        <div className="bg-[#111] p-6 rounded-2xl border border-white/5">
          <form className="flex flex-wrap gap-4 w-full" action="/admin/standings">
            <div className="space-y-1.5 flex-1 min-w-[200px]">
              <label className="text-[10px] uppercase font-bold text-slate-500 tracking-widest ml-1">Campeonato</label>
              <select
                name="championshipId"
                className="w-full bg-white/[0.03] border-white/10 border h-11 rounded-xl px-3 text-sm text-white focus:outline-none"
                defaultValue={championshipId ?? ''}
              >
                <option value="" className="bg-[#0A0A0A]">Selecionar Campeonato</option>
                {championships.map(c => <option key={c.id} value={c.id} className="bg-[#0A0A0A]">{c.name}</option>)}
              </select>
            </div>
            <div className="space-y-1.5 flex-1 min-w-[200px]">
              <label className="text-[10px] uppercase font-bold text-slate-500 tracking-widest ml-1">Categoria</label>
              <select
                name="categoryId"
                className="w-full bg-white/[0.03] border-white/10 border h-11 rounded-xl px-3 text-sm text-white focus:outline-none"
                defaultValue={categoryId ?? ''}
              >
                <option value="" className="bg-[#0A0A0A]">Selecionar Categoria</option>
                {championshipId && championships.find(c => c.id === championshipId)?.categories.map(cat => (
                  <option key={cat.id} value={cat.id} className="bg-[#0A0A0A]">{cat.name}</option>
                ))}
              </select>
            </div>
            <button type="submit" className="bg-[#FF6B00] hover:bg-[#E66000] text-white font-bold px-8 h-11 rounded-xl transition-all self-end">
              Filtrar
            </button>
          </form>
        </div>

        {!categoryId ? (
          <div className="bg-[#111] border border-white/5 rounded-3xl p-20 text-center">
            <BarChart3 className="w-16 h-16 text-slate-800 mx-auto mb-6" />
            <h3 className="text-xl font-bold text-white mb-2">Selecione uma categoria</h3>
            <p className="text-slate-500 text-sm">Escolha um campeonato e depois uma categoria para ver a classificação.</p>
          </div>
        ) : standings.length === 0 ? (
          <div className="bg-[#111] border border-white/5 rounded-3xl p-20 text-center">
            <BarChart3 className="w-16 h-16 text-slate-800 mx-auto mb-6" />
            <h3 className="text-xl font-bold text-white mb-2">Sem jogos finalizados</h3>
            <p className="text-slate-500 text-sm">Finalize jogos em Admin → Jogos para ver a classificação aqui.</p>
          </div>
        ) : (
          <div className="bg-[#111] border border-white/5 rounded-3xl overflow-hidden">
            <div className="bg-white/[0.02] px-6 py-4 border-b border-white/5">
              <h3 className="text-sm font-black text-white uppercase tracking-wider">{categoryInfo?.name} — {categoryInfo?.championship.name}</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="px-4 py-3 text-center text-[10px] font-black text-slate-500 uppercase tracking-widest w-12">Pos</th>
                    <th className="px-4 py-3 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">Equipe</th>
                    <th className="px-4 py-3 text-center text-[10px] font-black text-slate-500 uppercase tracking-widest">J</th>
                    <th className="px-4 py-3 text-center text-[10px] font-black text-slate-500 uppercase tracking-widest">V</th>
                    <th className="px-4 py-3 text-center text-[10px] font-black text-slate-500 uppercase tracking-widest">D</th>
                    <th className="px-4 py-3 text-center text-[10px] font-black text-slate-500 uppercase tracking-widest">PF</th>
                    <th className="px-4 py-3 text-center text-[10px] font-black text-slate-500 uppercase tracking-widest">PC</th>
                    <th className="px-4 py-3 text-center text-[10px] font-black text-slate-500 uppercase tracking-widest">SC</th>
                    <th className="px-4 py-3 text-center text-[10px] font-black text-white uppercase tracking-widest bg-white/[0.02]">Pts</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.03]">
                  {standings.map((team, index) => (
                    <tr key={team.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-4 py-4 text-center">
                        <span className={`text-xs font-black ${index < 4 ? 'text-[#FF6B00]' : 'text-slate-500'}`}>{index + 1}º</span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden shrink-0">
                            {team.logoUrl ? <img src={team.logoUrl} alt={team.name} className="w-full h-full object-cover" /> : <Shield className="w-4 h-4 text-slate-700" />}
                          </div>
                          <span className="text-xs font-bold uppercase tracking-tight text-slate-300">{team.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center text-xs font-medium text-slate-400">{team.played}</td>
                      <td className="px-4 py-4 text-center text-xs font-medium text-green-400">{team.wins}</td>
                      <td className="px-4 py-4 text-center text-xs font-medium text-slate-400">{team.losses}</td>
                      <td className="px-4 py-4 text-center text-xs font-medium text-slate-400">{team.ptsFor}</td>
                      <td className="px-4 py-4 text-center text-xs font-medium text-slate-400">{team.ptsAg}</td>
                      <td className="px-4 py-4 text-center text-xs font-bold text-slate-500">{team.ptsFor - team.ptsAg}</td>
                      <td className="px-4 py-4 text-center text-xs font-black text-white bg-white/[0.01]">{team.points}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    )
  } catch (error: any) {
    return (
      <div className="space-y-8 max-w-6xl mx-auto">
        <div>
          <h1 className="text-4xl font-display font-black text-white uppercase tracking-tight mb-2">Classificação</h1>
        </div>
        <div className="bg-[#111] border border-white/5 rounded-3xl p-20 text-center">
          <BarChart3 className="w-16 h-16 text-slate-800 mx-auto mb-6" />
          <h3 className="text-xl font-bold text-white mb-2">Classificação indisponível</h3>
          <p className="text-slate-500 text-sm">Selecione um campeonato e categoria para ver os dados.</p>
        </div>
      </div>
    )
  }
}
