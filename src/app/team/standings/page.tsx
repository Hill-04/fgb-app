import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/db"
import { Section } from "@/components/Section"
import { Badge } from "@/components/Badge"
import { Trophy, Award, TrendingUp, Users, Shield } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export default async function teamStandingsPage() {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'TEAM') {
    redirect('/login')
  }

  const teamId = (session.user as any).teamId

  // Fetch championships the team is registered in
  const registrations = await prisma.registration.findMany({
    where: { teamId },
    include: {
      championship: {
        include: {
          categories: {
            include: {
              games: {
                where: { status: 'COMPLETED' },
                include: { homeTeam: true, awayTeam: true }
              }
            }
          }
        }
      }
    }
  })

  // Helper to calculate standings for a category
  const calculateStandings = (category: any) => {
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

  return (
    <div className="space-y-10 max-w-6xl mx-auto">
      {/* Header */}
      <div className="animate-fade-in border-b border-white/[0.05] pb-8">
        <div className="flex items-center gap-3 mb-3">
           <div className="w-8 h-8 rounded-lg bg-[#FF6B00]/10 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-[#FF6B00]" />
           </div>
           <span className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Rankings de Competição</span>
        </div>
        <h1 className="text-4xl font-display font-black text-white tracking-tight">Classificação Geral</h1>
        <p className="text-slate-400 mt-2 font-medium">Acompanhe o desempenho da sua equipe e adversários em tempo real.</p>
      </div>

      {registrations.length === 0 ? (
        <div className="bg-[#111] border border-white/5 rounded-3xl p-20 text-center animate-fade-up">
           <Trophy className="w-16 h-16 text-slate-800 mx-auto mb-6" />
           <h3 className="text-xl font-bold text-white mb-2">Sem classificações disponíveis</h3>
           <p className="text-slate-500 max-w-xs mx-auto">Sua equipe precisa estar confirmada em um campeonato para visualizar o ranqueamento.</p>
        </div>
      ) : (
        <div className="space-y-16">
          {registrations.map((reg) => (
            <div key={reg.id} className="animate-fade-up space-y-8">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-display font-black text-white tracking-tight">{reg.championship.name}</h2>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">Temporada {reg.championship.year}</p>
                </div>
                <Badge variant="orange" className="font-black">CONFIRMADO</Badge>
              </div>

              <div className="grid gap-10">
                {reg.championship.categories.map((cat) => {
                  const standings = calculateStandings(cat)
                  return (
                    <div key={cat.id} className="bg-[#111] border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
                      <div className="bg-white/[0.02] px-6 py-4 border-b border-white/5 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Users className="w-4 h-4 text-[#FF6B00]" />
                          <h3 className="text-sm font-black text-white uppercase tracking-wider">{cat.name}</h3>
                        </div>
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{standings.length} Equipes</span>
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
                              <TableCell colSpan={9} className="text-center py-10 text-slate-600 text-xs italic">Nenhum jogo realizado nesta categoria.</TableCell>
                            </TableRow>
                          ) : (
                            standings.map((team, index) => {
                              const isCurrentTeam = team.id === teamId
                              const diff = team.ptsFor - team.ptsAg
                              return (
                                <TableRow key={team.id} className={`border-white/5 ${isCurrentTeam ? 'bg-[#FF6B00]/5 hover:bg-[#FF6B00]/10' : 'hover:bg-white/[0.02]'} transition-colors`}>
                                  <TableCell className="text-center">
                                    <span className={`text-xs font-black ${index < 4 ? 'text-[#FF6B00]' : 'text-slate-500'}`}>{index + 1}º</span>
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex items-center gap-3">
                                      <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden shrink-0">
                                        {team.logoUrl ? (
                                          <img src={team.logoUrl} alt={team.name} className="w-full h-full object-cover" />
                                        ) : (
                                          <Shield className="w-4 h-4 text-slate-700" />
                                        )}
                                      </div>
                                      <span className={`text-xs font-bold uppercase tracking-tight ${isCurrentTeam ? 'text-white' : 'text-slate-300'}`}>
                                        {team.name}
                                        {isCurrentTeam && <span className="ml-2 text-[8px] text-[#FF6B00] border border-[#FF6B00]/30 px-1.5 py-0.5 rounded-full">VOCÊ</span>}
                                      </span>
                                    </div>
                                  </TableCell>
                                  <TableCell className="text-center text-xs font-medium text-slate-400">{team.played}</TableCell>
                                  <TableCell className="text-center text-xs font-medium text-slate-400">{team.wins}</TableCell>
                                  <TableCell className="text-center text-xs font-medium text-slate-400">{team.losses}</TableCell>
                                  <TableCell className="text-center text-xs font-medium text-slate-400">{team.ptsFor}</TableCell>
                                  <TableCell className="text-center text-xs font-medium text-slate-400">{team.ptsAg}</TableCell>
                                  <TableCell className={`text-center text-xs font-bold ${diff > 0 ? 'text-green-500' : diff < 0 ? 'text-red-500' : 'text-slate-500'}`}>
                                    {diff > 0 ? `+${diff}` : diff}
                                  </TableCell>
                                  <TableCell className="text-center text-xs font-black text-white bg-white/[0.01]">
                                    {team.points}
                                  </TableCell>
                                </TableRow>
                              )
                            })
                          )}
                        </TableBody>
                      </Table>
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
