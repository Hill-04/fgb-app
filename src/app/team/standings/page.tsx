import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/db"
import { Badge } from "@/components/Badge"
import { Trophy, TrendingUp, Users, Shield } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
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

  // Fetch championships the team is registered in
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

  // Get all unique categories for the filter
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
        
        {/* Category Filter */}
        <div className="mt-8">
          <form action="/team/standings" className="flex items-center gap-4">
            <div className="flex-1 max-w-xs">
              <select
                name="categoryId"
                className="w-full bg-white/[0.03] border-white/10 border h-11 rounded-xl px-4 text-xs text-white focus:outline-none focus:border-[#FF6B00]/50 transition-all font-bold"
                defaultValue={categoryId ?? ''}
                onChange={(e) => (e.target.form as any).submit()}
              >
                <option value="" className="bg-[#0A0A0A]">Todas as Categorias</option>
                {allTeamCategories.map((cat: any) => (
                  <option key={cat.id} value={cat.id} className="bg-[#0A0A0A]">{cat.name}</option>
                ))}
              </select>
            </div>
            {categoryId && (
              <a href="/team/standings" className="text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-white transition-colors">
                Limpar Filtro
              </a>
            )}
          </form>
        </div>
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
                  const standings = cat.standings
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
                        {/* Table content remains same... */}
                      </Table>

                      {reg.championship.hasPlayoffs && cat.games.length > 0 && (
                        <div className="border-t border-white/5 mt-8 pt-8">
                          <div className="px-6 mb-6">
                            <h4 className="text-[10px] font-black text-[#FF6B00] uppercase tracking-[0.2em] mb-1">Playoffs</h4>
                            <p className="text-white text-lg font-display font-black uppercase tracking-tight italic">Chaveamento Final</p>
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
