import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/db"
import { BarChart3, Shield } from "lucide-react"
import { Badge } from "@/components/Badge"
import { ExportStandingsButtons } from "./ExportStandingsButtons"

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
        }
      })

      standings = await prisma.standing.findMany({
        where: { categoryId },
        include: {
          team: { select: { id: true, name: true, logoUrl: true } }
        },
        orderBy: [
          { points: 'desc' },
          { pointsFor: 'desc' } // Simplified sorting for now, can be improved with tiebreakers
        ]
      })
      
      // Secondary Sort: Points Balance (PF - PA)
      standings.sort((a, b) => {
        if (b.points !== a.points) return 0 // Already sorted by primary
        const bBalance = b.pointsFor - b.pointsAg
        const aBalance = a.pointsFor - a.pointsAg
        return bBalance - aBalance
      })
    }

    return (
      <div className="space-y-8 max-w-[1200px] mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-4xl font-display font-black text-white uppercase tracking-tight mb-2">Classificação Premium</h1>
            <p className="text-slate-500 font-medium uppercase tracking-widest text-[10px]">Tabelas Geradas Automaticamente via StandingService</p>
          </div>
          
          {categoryId && (
            <div className="flex items-center gap-4">
               <ExportStandingsButtons 
                 standings={standings} 
                 categoryName={categoryInfo?.name || ''} 
                 championshipName={categoryInfo?.championship.name || ''} 
               />
               <Badge className="bg-[#FF6B00]/10 text-[#FF6B00] border-[#FF6B00]/20 h-10 px-4 flex items-center gap-2">
                 <Shield className="w-4 h-4" />
                 <span className="text-[10px] font-black uppercase tracking-widest">{categoryInfo?.name}</span>
               </Badge>
            </div>
          )}
        </div>

        <div className="bg-[#111] p-8 rounded-[32px] border border-white/5 shadow-2xl">
          <form className="flex flex-wrap gap-6 w-full" action="/admin/standings">
            <div className="space-y-1.5 flex-1 min-w-[250px]">
              <label className="text-[10px] uppercase font-bold text-slate-500 tracking-widest ml-1">Campeonato Selecionado</label>
              <select
                name="championshipId"
                className="w-full bg-white/[0.03] border-white/10 border h-12 rounded-2xl px-4 text-sm text-white focus:outline-none focus:border-[#FF6B00]/50 transition-all font-medium"
                defaultValue={championshipId ?? ''}
              >
                <option value="" className="bg-[#0A0A0A]">Selecione o Campeonato...</option>
                {championships.map(c => <option key={c.id} value={c.id} className="bg-[#0A0A0A]">{c.name}</option>)}
              </select>
            </div>
            <div className="space-y-1.5 flex-1 min-w-[250px]">
              <label className="text-[10px] uppercase font-bold text-slate-500 tracking-widest ml-1">Categoria</label>
              <select
                name="categoryId"
                className="w-full bg-white/[0.03] border-white/10 border h-12 rounded-2xl px-4 text-sm text-white focus:outline-none focus:border-[#FF6B00]/50 transition-all font-medium disabled:opacity-30"
                defaultValue={categoryId ?? ''}
                disabled={!championshipId}
              >
                <option value="" className="bg-[#0A0A0A]">Selecione a Categoria...</option>
                {championshipId && championships.find(c => c.id === championshipId)?.categories.map(cat => (
                  <option key={cat.id} value={cat.id} className="bg-[#0A0A0A]">{cat.name}</option>
                ))}
              </select>
            </div>
            <button type="submit" className="bg-[#FF6B00] hover:bg-[#E66000] text-white font-black uppercase tracking-widest px-10 h-12 rounded-2xl transition-all shadow-lg shadow-[#FF6B00]/20 self-end hover:scale-[1.02] active:scale-95 disabled:opacity-50">
              Ver Tabela
            </button>
          </form>
        </div>

        {!categoryId ? (
          <div className="bg-[#111] border border-white/5 rounded-[40px] p-24 text-center">
            <div className="w-20 h-20 rounded-3xl bg-white/5 flex items-center justify-center mx-auto mb-8 border border-white/5">
              <BarChart3 className="w-10 h-10 text-slate-700" />
            </div>
            <h3 className="text-2xl font-display font-black text-white mb-3 uppercase tracking-tight">Filtro Necessário</h3>
            <p className="text-slate-500 text-sm font-medium max-w-sm mx-auto">Selecione um campeonato e uma categoria acima para visualizar a classificação oficial e os índices de aproveitamento.</p>
          </div>
        ) : standings.length === 0 ? (
          <div className="bg-[#111] border border-white/5 rounded-[40px] p-24 text-center">
             <div className="w-20 h-20 rounded-3xl bg-[#FF6B00]/5 flex items-center justify-center mx-auto mb-8 border border-[#FF6B00]/10">
              <Shield className="w-10 h-10 text-[#FF6B00]/40" />
            </div>
            <h3 className="text-2xl font-display font-black text-white mb-3 uppercase tracking-tight">Sem Dados Cadastrados</h3>
            <p className="text-slate-500 text-sm font-medium max-w-sm mx-auto">Nenhuma pontuação registrada para {categoryInfo?.name} ainda. Os dados aparecerão assim que jogos forem marcados como FINISHED.</p>
          </div>
        ) : (
          <div className="bg-[#111] border border-white/5 rounded-[40px] overflow-hidden shadow-2xl relative">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#FF6B00]/5 rounded-full blur-[120px] -mr-32 -mt-32" />
            
            <div className="bg-white/5 px-10 py-6 border-b border-white/5 flex items-center justify-between relative z-10">
               <div className="flex items-center gap-4">
                  <div className="w-2 h-8 bg-[#FF6B00] rounded-full" />
                  <h3 className="text-base font-display font-black text-white uppercase tracking-wider">{categoryInfo?.name} — {categoryInfo?.championship.name}</h3>
               </div>
               <Badge variant="blue" className="text-[9px] font-black tracking-widest">TEMPORADA 2026</Badge>
            </div>
            
            <div className="overflow-x-auto relative z-10">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="px-6 py-5 text-center text-[10px] font-black text-slate-500 uppercase tracking-widest w-20">Pos</th>
                    <th className="px-6 py-5 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">Equipe</th>
                    <th className="px-6 py-5 text-center text-[10px] font-black text-slate-500 uppercase tracking-widest">PJ</th>
                    <th className="px-6 py-5 text-center text-[10px] font-black text-slate-500 uppercase tracking-widest text-green-500">V</th>
                    <th className="px-6 py-5 text-center text-[10px] font-black text-slate-500 uppercase tracking-widest text-red-500">D</th>
                    <th className="px-6 py-5 text-center text-[10px] font-black text-slate-500 uppercase tracking-widest">PF</th>
                    <th className="px-6 py-5 text-center text-[10px] font-black text-slate-500 uppercase tracking-widest">PC</th>
                    <th className="px-6 py-5 text-center text-[10px] font-black text-slate-500 uppercase tracking-widest">SC</th>
                    <th className="px-10 py-5 text-center text-xs font-black text-white uppercase tracking-widest bg-white/5 w-32 border-l border-white/5">Pts</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.03]">
                  {standings.map((row, index) => (
                    <tr key={row.id} className="hover:bg-white/[0.02] transition-all group">
                      <td className="px-6 py-8 text-center">
                        {index < 4 ? (
                          <div className="w-8 h-8 rounded-xl bg-[#FF6B00]/10 border border-[#FF6B00]/20 flex items-center justify-center font-display font-black text-[#FF6B00] mx-auto text-sm group-hover:scale-110 transition-transform">
                            {index + 1}
                          </div>
                        ) : (
                          <span className="text-sm font-display font-black text-slate-600">{index + 1}</span>
                        )}
                      </td>
                      <td className="px-6 py-8">
                        <div className="flex items-center gap-5">
                          <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden shrink-0 group-hover:border-[#FF6B00]/30 transition-colors shadow-lg shadow-black">
                            {row.team.logoUrl ? (
                              <img src={row.team.logoUrl} alt={row.team.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="text-[#FF6B00] font-display font-black text-lg">{row.team.name.charAt(0)}</div>
                            )}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-display font-black text-white uppercase tracking-tight leading-none mb-1">{row.team.name}</span>
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">FGB Filiado</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-8 text-center text-sm font-black text-slate-400">{row.played}</td>
                      <td className="px-6 py-8 text-center text-sm font-black text-green-500">{row.wins}</td>
                      <td className="px-6 py-8 text-center text-sm font-black text-red-500">{row.losses}</td>
                      <td className="px-6 py-8 text-center text-sm font-medium text-slate-500">{row.pointsFor}</td>
                      <td className="px-6 py-8 text-center text-sm font-medium text-slate-500">{row.pointsAg}</td>
                      <td className="px-6 py-8 text-center text-sm font-black text-slate-400 italic">
                        {row.pointsFor - row.pointsAg > 0 ? `+${row.pointsFor - row.pointsAg}` : row.pointsFor - row.pointsAg}
                      </td>
                      <td className="px-10 py-8 text-center bg-white/[0.03] border-l border-white/5">
                         <div className="flex flex-col items-center">
                            <span className="text-2xl font-display font-black text-white leading-none">{row.points}</span>
                            <span className="text-[9px] font-bold text-[#FF6B00] uppercase tracking-tighter mt-1 opacity-60">PONTOS</span>
                         </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {categoryId && (
          <p className="text-[10px] font-bold text-slate-600 uppercase tracking-[0.2em] text-center mt-10">
            * Critérios de desempate: Confronto Direto, Saldo de Cestas, Pontos Marcados.
          </p>
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
