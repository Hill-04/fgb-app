import { prisma } from '@/lib/db'
import { notFound } from 'next/navigation'
import { Badge } from '@/components/Badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Trophy, Calendar, Info, BarChart3, Shield } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export const dynamic = 'force-dynamic'

export default async function PublicChampionshipPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  
  const championship = await prisma.championship.findUnique({
    where: { id },
    include: {
      categories: {
        include: {
          standings: {
            include: { team: true },
            orderBy: [
              { points: 'desc' },
              { wins: 'desc' },
              { pointsFor: 'desc' }
            ]
          }
        }
      }
    }
  })

  if (!championship) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-[#FF6B00]/30 selection:text-[#FF6B00]">
      {/* Premium Hero Section */}
      <div className="relative h-[400px] flex items-center justify-center overflow-hidden border-b border-white/5">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#FF6B00]/10 via-transparent to-transparent opacity-50" />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
        
        <div className="container relative z-10 px-6 text-center">
          <Badge variant="blue" className="bg-blue-500/10 text-blue-400 border-blue-500/20 mb-6 px-4 py-1">
            FGB CHAMPIONSHIP PUBLIC VIEW
          </Badge>
          <h1 className="text-6xl md:text-8xl font-display font-black tracking-tighter uppercase italic leading-tight scale-y-110 mb-4">
            {championship.name}
          </h1>
          <div className="flex flex-wrap items-center justify-center gap-6 mt-8">
            <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-full border border-white/10 backdrop-blur-sm">
              <Calendar className="w-4 h-4 text-[#FF6B00]" />
              <span className="text-xs font-black uppercase tracking-widest text-slate-300">
                {championship.startDate ? format(championship.startDate, 'dd MMM yyyy', { locale: ptBR }) : 'A definir'}
              </span>
            </div>
            <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-full border border-white/10 backdrop-blur-sm">
              <Trophy className="w-4 h-4 text-[#FF6B00]" />
              <span className="text-xs font-black uppercase tracking-widest text-slate-300">
                {championship.format.replace(/_/g, ' ')}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-20">
        <div className="grid grid-cols-1 gap-12">
          {championship.categories.map((category) => (
            <div key={category.id} className="space-y-8 animate-in slide-in-from-bottom-8 duration-700">
              <div className="flex items-end justify-between border-b border-white/5 pb-6">
                <div>
                  <h2 className="text-4xl font-display font-black uppercase text-white tracking-tighter italic">
                    {category.name}
                  </h2>
                  <p className="text-slate-500 text-[10px] uppercase font-black tracking-[0.3em] mt-2">Classificação Oficial</p>
                </div>
                <div className="hidden md:flex gap-4">
                   <div className="text-right">
                      <p className="text-[10px] font-black text-slate-500 uppercase">Equipes</p>
                      <p className="text-xl font-display font-black text-white">{category.standings.length}</p>
                   </div>
                </div>
              </div>

              <Card className="bg-[#0A0A0A] border-white/5 text-white overflow-hidden rounded-[32px] shadow-2xl shadow-black/50">
                <Table>
                  <TableHeader className="bg-white/[0.02]">
                    <TableRow className="border-white/5 hover:bg-transparent">
                      <TableHead className="w-16 text-center py-6 text-[10px] font-black uppercase text-slate-500">Pos</TableHead>
                      <TableHead className="py-6 text-[10px] font-black uppercase text-slate-500">Equipe</TableHead>
                      <TableHead className="text-center py-6 text-[10px] font-black uppercase text-slate-500">P</TableHead>
                      <TableHead className="text-center py-6 text-[10px] font-black uppercase text-slate-500">J</TableHead>
                      <TableHead className="text-center py-6 text-[10px] font-black uppercase text-slate-500">V</TableHead>
                      <TableHead className="text-center py-6 text-[10px] font-black uppercase text-slate-500">D</TableHead>
                      <TableHead className="text-center py-6 text-[10px] font-black uppercase text-slate-500">PF</TableHead>
                      <TableHead className="text-center py-6 text-[10px] font-black uppercase text-slate-500">PA</TableHead>
                      <TableHead className="text-center py-6 text-[10px] font-black uppercase text-slate-500">S</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {category.standings.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="py-20 text-center text-slate-500 font-bold uppercase text-xs">
                          Nenhum dado disponível ainda.
                        </TableCell>
                      </TableRow>
                    ) : (
                      category.standings.map((standing, index) => (
                        <TableRow key={standing.id} className="border-white/5 hover:bg-white/[0.02] group transition-all">
                          <TableCell className="text-center py-6">
                            <span className={`text-sm font-black ${index < 4 ? 'text-[#FF6B00]' : 'text-slate-500'}`}>
                              {index + 1}º
                            </span>
                          </TableCell>
                          <TableCell className="py-6">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center group-hover:border-[#FF6B00]/30 transition-colors">
                                <Shield className="w-4 h-4 text-slate-400 group-hover:text-[#FF6B00] transition-colors" />
                              </div>
                              <span className="font-bold text-sm tracking-tight">{standing.team.name}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-center py-6">
                            <div className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-[#FF6B00]/10 text-[#FF6B00] font-black text-sm">
                              {standing.points}
                            </div>
                          </TableCell>
                          <TableCell className="text-center py-6 text-xs font-bold text-slate-300">{standing.played}</TableCell>
                          <TableCell className="text-center py-6 text-xs font-bold text-green-500">{standing.wins}</TableCell>
                          <TableCell className="text-center py-6 text-xs font-bold text-red-500">{standing.losses}</TableCell>
                          <TableCell className="text-center py-6 text-xs font-bold text-slate-300">{standing.pointsFor}</TableCell>
                          <TableCell className="text-center py-6 text-xs font-bold text-slate-300">{standing.pointsAg}</TableCell>
                          <TableCell className="text-center py-6">
                            <Badge variant={standing.pointsFor - standing.pointsAg >= 0 ? 'success' : 'error'} className="text-[10px]">
                              {standing.pointsFor - standing.pointsAg}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </Card>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-white/5 py-20 bg-black">
        <div className="container mx-auto px-6 text-center">
          <p className="text-slate-600 text-[10px] font-black uppercase tracking-[0.5em]">
            Powered by FGB Championship App
          </p>
        </div>
      </footer>
    </div>
  )
}
