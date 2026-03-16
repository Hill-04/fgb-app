import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/db"
import { Badge } from "@/components/Badge"
import { ClipboardList, Calendar, BarChart3, Trophy, Shield } from "lucide-react"

export const dynamic = 'force-dynamic'

export default async function AdminResultsPage({
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

    const games = await prisma.game.findMany({
      where: {
        status: 'COMPLETED',
        ...(championshipId && { championshipId }),
        ...(categoryId && { categoryId })
      },
      include: {
        homeTeam: { select: { name: true, logoUrl: true } },
        awayTeam: { select: { name: true, logoUrl: true } },
        championship: { select: { name: true } },
        category: { select: { name: true } }
      },
      orderBy: { dateTime: 'desc' }
    })

    return (
      <div className="space-y-8 max-w-6xl mx-auto">
        <div>
          <h1 className="text-4xl font-display font-black text-white uppercase tracking-tight mb-2">Resultados</h1>
          <p className="text-slate-500 font-medium uppercase tracking-widest text-[10px]">Histórico de Placar Geral</p>
        </div>

        <div className="bg-[#111] p-6 rounded-2xl border border-white/5">
          <form className="flex flex-wrap gap-4 w-full" action="/admin/results">
            <div className="space-y-1.5 flex-1 min-w-[200px]">
              <label className="text-[10px] uppercase font-bold text-slate-500 tracking-widest ml-1">Campeonato</label>
              <select
                name="championshipId"
                className="w-full bg-white/[0.03] border-white/10 border h-11 rounded-xl px-3 text-sm text-white focus:outline-none"
                defaultValue={championshipId ?? ''}
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
                defaultValue={categoryId ?? ''}
              >
                <option value="" className="bg-[#0A0A0A]">Todas as Categorias</option>
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

        {games.length === 0 ? (
          <div className="bg-[#111] border border-white/5 rounded-3xl p-20 text-center">
            <ClipboardList className="w-16 h-16 text-slate-800 mx-auto mb-6" />
            <h3 className="text-xl font-bold text-white mb-2">Nenhum resultado encontrado</h3>
            <p className="text-slate-500 text-sm">Selecione outro filtro ou aguarde partidas serem finalizadas em Jogos.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {games.map((game) => (
              <div key={game.id} className="bg-[#121212] border border-white/5 rounded-3xl overflow-hidden hover:border-[#FF6B00]/30 transition-all duration-300">
                <div className="p-5 pb-3 border-b border-white/5 flex justify-between items-center">
                  <Badge variant="outline" className="text-[8px] uppercase tracking-tighter opacity-70">{game.category.name}</Badge>
                  <span className="text-[9px] font-black text-[#FF6B00] uppercase tracking-widest truncate ml-2">{game.championship.name}</span>
                </div>
                <div className="p-6">
                  <div className="flex items-center justify-between gap-4 mb-4">
                    <div className="flex-1 text-center">
                      <div className="text-[10px] font-black uppercase text-slate-500 mb-2">CASA</div>
                      <div className="font-display font-black text-white text-sm uppercase text-center">{game.homeTeam.name}</div>
                    </div>
                    <div className="text-3xl font-display font-black italic text-white">
                      {game.homeScore ?? 0} - {game.awayScore ?? 0}
                    </div>
                    <div className="flex-1 text-center">
                      <div className="text-[10px] font-black uppercase text-slate-500 mb-2">FORA</div>
                      <div className="font-display font-black text-white text-sm uppercase text-center">{game.awayTeam.name}</div>
                    </div>
                  </div>
                  <div className="pt-3 border-t border-white/5">
                    <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      <Calendar className="w-3.5 h-3.5 text-[#FF6B00]" />
                      {new Date(game.dateTime).toLocaleDateString('pt-BR')}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  } catch (error: any) {
    return (
      <div className="space-y-8 max-w-6xl mx-auto">
        <div>
          <h1 className="text-4xl font-display font-black text-white uppercase tracking-tight mb-2">Resultados</h1>
        </div>
        <div className="bg-[#111] border border-white/5 rounded-3xl p-20 text-center">
          <ClipboardList className="w-16 h-16 text-slate-800 mx-auto mb-6" />
          <h3 className="text-xl font-bold text-white mb-2">Nenhum resultado disponível</h3>
          <p className="text-slate-500 text-sm">Finalize partidas em Admin → Jogos para ver os resultados aqui.</p>
        </div>
      </div>
    )
  }
}
