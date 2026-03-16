import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/db"
import { Badge } from "@/components/Badge"
import { BarChart3, Users, Trophy, Shield } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export default async function AdminStandingsPage({
  searchParams,
}: {
  searchParams: Promise<{ championshipId?: string; categoryId?: string }>;
}) {
  const session = await getServerSession(authOptions)
  if (!session || !(session.user as any).isAdmin) {
    redirect('/login')
  }

  const { championshipId, categoryId } = await searchParams;

  // Fetch championships for filter
  const championships = await prisma.championship.findMany({
    include: { categories: true }
  })

  // Fetch data for standings
  const categoryWithGames = categoryId ? await prisma.championshipCategory.findUnique({
    where: { id: categoryId },
    include: {
      championship: true,
      games: {
        where: { status: 'COMPLETED' },
        include: { homeTeam: true, awayTeam: true }
      }
    }
  }) : null

  // Standings calculation logic (extracted for reuse)
  const calculateStandings = (category: any) => {
    if (!category) return []
    const standingsMap = new Map()

    category.games.forEach((game: any) => {
      const teams = [game.homeTeam, game.awayTeam]
      teams.forEach(team => {
        if (!standingsMap.has(team.id)) {
          standingsMap.set(team.id, {
            id: team.id,
            name: team.name,
            logoUrl: team.logoUrl,
            played: 0,
            wins: 0,
            losses: 0,
            ptsFor: 0,
            ptsAg: 0,
            points: 0
          })
        }
      })

      const home = standingsMap.get(game.homeTeamId)
      const away = standingsMap.get(game.awayTeamId)

      home.played++
      away.played++
      home.ptsFor += game.homeScore || 0
      home.ptsAg += game.awayScore || 0
      away.ptsFor += game.awayScore || 0
      away.ptsAg += game.homeScore || 0

      if ((game.homeScore || 0) > (game.awayScore || 0)) {
        home.wins++
        home.points += 2
        away.losses++
        away.points += 1
      } else if ((game.homeScore || 0) < (game.awayScore || 0)) {
        away.wins++
        away.points += 2
        home.losses++
        home.points += 1
      }
    })

    return Array.from(standingsMap.values()).sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points
      const diffB = b.ptsFor - b.ptsAg
      const diffA = a.ptsFor - a.ptsAg
      return diffB - diffA
    })
  }

  const standings = calculateStandings(categoryWithGames)

  return (
    <div className="space-y-8 max-w-[1200px] mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-display font-black text-white uppercase tracking-tight mb-2">Classificação</h1>
          <p className="text-[--text-secondary] font-medium uppercase tracking-widest text-[10px]">Visão Geral de Pontuação</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-4 items-end bg-[#111] p-6 rounded-2xl border border-white/5">
        <form className="flex flex-wrap gap-4 w-full" action="/admin/standings">
          <div className="space-y-1.5 flex-1 min-w-[200px]">
            <label className="text-[10px] uppercase font-bold text-slate-500 tracking-widest ml-1">Campeonato</label>
            <select 
              name="championshipId"
              className="w-full bg-white/[0.03] border-white/10 border h-11 rounded-xl px-3 text-sm text-white focus:outline-none"
              defaultValue={championshipId}
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
              defaultValue={categoryId}
            >
              <option value="" className="bg-[#0A0A0A]">Selecionar Categoria</option>
              {championshipId && championships.find(c => c.id === championshipId)?.categories.map(cat => (
                <option key={cat.id} value={cat.id} className="bg-[#0A0A0A]">{cat.name}</option>
              ))}
            </select>
          </div>
          <button type="submit" className="bg-[#FF6B00] hover:bg-[#E66000] text-white font-bold px-8 h-11 rounded-xl transition-all">Filtrar</button>
        </form>
      </div>

      {!categoryId ? (
        <div className="bg-[#111] border border-white/5 rounded-3xl p-20 text-center">
           <BarChart3 className="w-16 h-16 text-slate-800 mx-auto mb-6" />
           <p className="text-slate-500 text-sm uppercase font-black tracking-widest">Selecione um campeonato e categoria para ver a classificação.</p>
        </div>
      ) : (
        <div className="bg-[#111] border border-white/5 rounded-3xl overflow-hidden">
          <div className="bg-white/[0.02] px-6 py-4 border-b border-white/5 flex items-center justify-between">
            <h3 className="text-sm font-black text-white uppercase tracking-wider">{categoryWithGames?.name} - {categoryWithGames?.championship.name}</h3>
          </div>
          <Table>
            <TableHeader>
              <TableRow className="border-white/5 hover:bg-transparent">
                <TableHead className="w-12 text-center text-[10px] font-black text-slate-500 uppercase tracking-widest">Pos</TableHead>
                <TableHead className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Equipe</TableHead>
                <TableHead className="text-center text-[10px] font-black text-slate-500 uppercase tracking-widest">J</TableHead>
                <TableHead className="text-center text-[10px] font-black text-slate-500 uppercase tracking-widest">V</TableHead>
                <TableHead className="text-center text-[10px] font-black text-slate-500 uppercase tracking-widest">D</TableHead>
                <TableHead className="text-center text-[10px] font-black text-slate-500 uppercase tracking-widest">PF</TableHead>
                <TableHead className="text-center text-[10px] font-black text-slate-500 uppercase tracking-widest">PC</TableHead>
                <TableHead className="text-center text-[10px] font-black text-slate-500 uppercase tracking-widest">SC</TableHead>
                <TableHead className="text-center text-[10px] font-black text-slate-500 uppercase tracking-widest bg-white/[0.02] text-white">Pts</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {standings.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-10 text-slate-600 text-xs italic">Nenhum jogo finalizado nesta categoria.</TableCell>
                </TableRow>
              ) : (
                standings.map((team, index) => (
                  <TableRow key={team.id} className="border-white/5 hover:bg-white/[0.02] transition-colors">
                    <TableCell className="text-center">
                      <span className={`text-xs font-black ${index < 4 ? 'text-[#FF6B00]' : 'text-slate-500'}`}>{index + 1}º</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden shrink-0">
                          {team.logoUrl ? <img src={team.logoUrl} alt={team.name} className="w-full h-full object-cover" /> : <Shield className="w-4 h-4 text-slate-700" />}
                        </div>
                        <span className="text-xs font-bold uppercase tracking-tight text-slate-300">{team.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center text-xs font-medium text-slate-400">{team.played}</TableCell>
                    <TableCell className="text-center text-xs font-medium text-slate-400">{team.wins}</TableCell>
                    <TableCell className="text-center text-xs font-medium text-slate-400">{team.losses}</TableCell>
                    <TableCell className="text-center text-xs font-medium text-slate-400">{team.ptsFor}</TableCell>
                    <TableCell className="text-center text-xs font-medium text-slate-400">{team.ptsAg}</TableCell>
                    <TableCell className="text-center text-xs font-bold text-slate-500">{team.ptsFor - team.ptsAg}</TableCell>
                    <TableCell className="text-center text-xs font-black text-white bg-white/[0.01]">{team.points}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
