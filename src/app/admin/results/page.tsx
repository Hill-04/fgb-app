import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/db"
import { Badge } from "@/components/Badge"
import { ClipboardList, Calendar, MapPin, Trophy } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

export default async function AdminResultsPage({
  searchParams,
}: {
  searchParams: Promise<{ championshipId?: string; categoryId?: string }>;
}) {
  const session = await getServerSession(authOptions)
  if (!session || !(session.user as any).isAdmin) {
    redirect('/login')
  }

  const { championshipId, categoryId } = await searchParams;

  const championships = await prisma.championship.findMany({
    include: { categories: true }
  })

  const games = await prisma.game.findMany({
    where: {
      status: 'COMPLETED',
      ...(championshipId && { championshipId }),
      ...(categoryId && { categoryId })
    },
    include: {
      homeTeam: true,
      awayTeam: true,
      championship: true,
      category: true
    },
    orderBy: {
      dateTime: 'desc'
    }
  })

  return (
    <div className="space-y-8 max-w-[1200px] mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-display font-black text-white uppercase tracking-tight mb-2">Resultados</h1>
          <p className="text-[--text-secondary] font-medium uppercase tracking-widest text-[10px]">Histórico de Placar Geral</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-4 items-end bg-[#111] p-6 rounded-2xl border border-white/5">
        <form className="flex flex-wrap gap-4 w-full" action="/admin/results">
          <div className="space-y-1.5 flex-1 min-w-[200px]">
            <label className="text-[10px] uppercase font-bold text-slate-500 tracking-widest ml-1">Campeonato</label>
            <select 
              name="championshipId"
              className="w-full bg-white/[0.03] border-white/10 border h-11 rounded-xl px-3 text-sm text-white focus:outline-none"
              defaultValue={championshipId}
            >
              <option value="" className="bg-[#0A0A0A]">Todos os Campeonatos</option>
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
              <option value="" className="bg-[#0A0A0A]">Todas as Categorias</option>
              {championshipId && championships.find(c => c.id === championshipId)?.categories.map(cat => (
                <option key={cat.id} value={cat.id} className="bg-[#0A0A0A]">{cat.name}</option>
              ))}
            </select>
          </div>
          <button type="submit" className="bg-[#FF6B00] hover:bg-[#E66000] text-white font-bold px-8 h-11 rounded-xl transition-all">Filtrar</button>
        </form>
      </div>

      {games.length === 0 ? (
        <div className="bg-[#111] border border-white/5 rounded-3xl p-20 text-center">
           <ClipboardList className="w-16 h-16 text-slate-800 mx-auto mb-6" />
           <p className="text-slate-500 text-sm uppercase font-black tracking-widest">Nenhum resultado finalizado encontrado com os filtros atuais.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {games.map((game) => (
            <Card key={game.id} className="bg-[#121212] border-white/5 rounded-3xl overflow-hidden group hover:border-[#FF6B00]/30 transition-all duration-300">
               <CardHeader className="p-6 pb-2 border-b border-white/5">
                  <div className="flex justify-between items-center">
                    <Badge variant="outline" className="text-[8px] uppercase tracking-tighter opacity-70">{game.category.name}</Badge>
                    <span className="text-[9px] font-black text-[#FF6B00] uppercase tracking-widest">{game.championship.name}</span>
                  </div>
               </CardHeader>
               <CardContent className="p-6">
                  <div className="flex items-center justify-between gap-4 mb-6">
                     <div className="flex-1 text-center">
                        <div className="text-[10px] font-black uppercase text-slate-500 mb-2 truncate">CASA</div>
                        <div className="font-display font-black text-white text-sm uppercase leading-none h-8 flex items-center justify-center">{game.homeTeam.name}</div>
                     </div>
                     <div className="text-3xl font-display font-black italic text-white">
                        {game.homeScore} - {game.awayScore}
                     </div>
                     <div className="flex-1 text-center">
                        <div className="text-[10px] font-black uppercase text-slate-500 mb-2 truncate">FORA</div>
                        <div className="font-display font-black text-white text-sm uppercase leading-none h-8 flex items-center justify-center">{game.awayTeam.name}</div>
                     </div>
                  </div>
                  <div className="space-y-2 pt-4 border-t border-white/5">
                     <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        <Calendar className="w-3.5 h-3.5 text-[#FF6B00]" />
                        {new Date(game.dateTime).toLocaleDateString('pt-BR')}
                     </div>
                  </div>
               </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
