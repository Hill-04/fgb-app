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

    // MOCKUP DATA for visually stunning Cestinhas Display 
    // since the DB schema 'PlayerStat' needs synchronization with Turso
    const mockTopScorers = [
      { id: '1', name: 'Lucas Silva', number: 10, teamName: 'Corinthians', points: 154, avg: 25.6, games: 6 },
      { id: '2', name: 'Thiago Costa', number: 23, teamName: 'Sogipa', points: 142, avg: 23.6, games: 6 },
      { id: '3', name: 'Pedro Henrique', number: 7, teamName: 'Grêmio', points: 128, avg: 21.3, games: 6 },
      { id: '4', name: 'Rafael Souza', number: 14, teamName: 'Internacional', points: 110, avg: 18.3, games: 6 },
      { id: '5', name: 'Gabriel Santos', number: 5, teamName: 'Caxias', points: 95, avg: 15.8, games: 6 },
    ]

    return (
      <div className="space-y-8 pb-20 font-sans">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="fgb-display text-3xl text-[var(--black)] leading-none">Top Cestinhas</h1>
            <p className="fgb-label text-[var(--gray)] mt-1" style={{ fontSize: 10, letterSpacing: 2 }}>Ranking Oficial de Pontuadores</p>
          </div>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--gray)]" />
            <input 
              type="text" 
              placeholder="Buscar atleta..." 
              className="pl-10 pr-4 h-11 w-64 rounded-full bg-[var(--gray-l)] border border-[var(--border)] text-[var(--black)] text-sm focus:outline-none focus:border-[var(--verde)] transition-all font-bold"
            />
          </div>
        </div>

        {/* Top 3 Podium Mockup */}
        <div className="fgb-card bg-white p-8 overflow-hidden shadow-sm flex flex-col md:flex-row items-end justify-center gap-4 pt-16 relative">
          
          <div className="absolute top-0 right-0 w-96 h-96 bg-[var(--amarelo)]/10 blur-[100px] rounded-full pointer-events-none -z-10" />

          {/* 2nd Place */}
          <div className="flex flex-col items-center z-10 hidden md:flex">
             <div className="w-16 h-16 rounded-full bg-slate-100 border-4 border-white flex items-center justify-center shadow-lg mb-4 -ml-4 z-20">
               <UserIcon className="w-8 h-8 text-slate-400" />
             </div>
             <div className="bg-gradient-to-b from-slate-200 to-slate-100 w-32 h-40 rounded-t-2xl border border-slate-300 flex flex-col items-center pt-4">
                <span className="text-3xl font-black text-slate-500 font-mono tracking-tighter">142</span>
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest mt-1">Pontos</span>
                <div className="mt-auto bg-slate-300 w-full py-2 text-center rounded-t-lg">
                   <p className="text-xs font-black text-slate-700 uppercase leading-tight truncate px-2">{mockTopScorers[1].name}</p>
                </div>
             </div>
          </div>

          {/* 1st Place */}
          <div className="flex flex-col items-center z-20">
             <div className="w-24 h-24 rounded-full bg-[var(--amarelo)]/20 border-4 border-white flex items-center justify-center shadow-xl mb-4 relative z-20">
               <UserIcon className="w-12 h-12 text-[var(--amarelo)]" />
               <div className="absolute -bottom-3 bg-[var(--amarelo)] text-white text-[10px] font-black uppercase tracking-widest px-3 py-0.5 rounded-full border-2 border-white">#1 MVP</div>
             </div>
             <div className="bg-gradient-to-b from-[var(--amarelo)]/20 to-[var(--yellow)]/10 w-40 h-48 rounded-t-2xl border border-[var(--amarelo)]/30 border-b-0 flex flex-col items-center pt-6 shadow-2xl">
                <span className="text-4xl font-black text-[var(--amarelo)] font-mono tracking-tighter">154</span>
                <span className="text-[10px] font-black uppercase text-orange-600/70 tracking-widest mt-1">Pontos</span>
                <div className="mt-auto bg-[var(--amarelo)] w-full py-3 text-center rounded-t-xl text-white">
                   <p className="text-xs font-black uppercase leading-tight truncate px-2">{mockTopScorers[0].name}</p>
                </div>
             </div>
          </div>

          {/* 3rd Place */}
          <div className="flex flex-col items-center z-10 hidden md:flex">
             <div className="w-16 h-16 rounded-full bg-orange-50 border-4 border-white flex items-center justify-center shadow-lg mb-4 -mr-4 z-20">
               <UserIcon className="w-8 h-8 text-orange-400" />
             </div>
             <div className="bg-gradient-to-b from-orange-100 to-orange-50 w-32 h-36 rounded-t-2xl border border-orange-200 flex flex-col items-center pt-4">
                <span className="text-3xl font-black text-orange-400 font-mono tracking-tighter">128</span>
                <span className="text-[10px] font-black uppercase text-orange-300 tracking-widest mt-1">Pontos</span>
                <div className="mt-auto bg-orange-200 w-full py-2 text-center rounded-t-lg">
                   <p className="text-xs font-black text-orange-700 uppercase leading-tight truncate px-2">{mockTopScorers[2].name}</p>
                </div>
             </div>
          </div>

        </div>

        {/* Leaderboard Table */}
        <div className="fgb-card bg-white mt-8 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
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
                {mockTopScorers.map((scorer, index) => (
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
                            <span className="text-[9px] font-bold text-[var(--gray)] uppercase">Camisa {scorer.number}</span>
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
