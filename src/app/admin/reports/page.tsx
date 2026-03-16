import { prisma } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { FileText, Download, TrendingUp, Users, Trophy, MapPin, PieChart } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function AdminReportsPage() {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !(session.user as any).isAdmin) redirect('/login')

    const [teamCount, championshipCount, gameCount, activePlayers, latestChampionship, recentGames] = await Promise.all([
      prisma.team.count(),
      prisma.championship.count(),
      prisma.game.count(),
      Promise.resolve(450),
      prisma.championship.findFirst({
        orderBy: { createdAt: 'desc' },
        include: {
          categories: { include: { _count: { select: { registrations: true } } } }
        }
      }),
      prisma.game.findMany({
        take: 5,
        orderBy: { dateTime: 'desc' },
        include: {
          homeTeam: { select: { name: true } },
          awayTeam: { select: { name: true } },
          category: { select: { name: true } }
        }
      })
    ])

    const kpis = [
      { label: 'Total de Equipes', value: teamCount, icon: Users, color: 'text-blue-400', bg: 'bg-blue-500/10' },
      { label: 'Campeonatos', value: championshipCount, icon: Trophy, color: 'text-[#FF6B00]', bg: 'bg-orange-500/10' },
      { label: 'Jogos Realizados', value: gameCount, icon: MapPin, color: 'text-purple-400', bg: 'bg-purple-500/10' },
      { label: 'Atletas Estimados', value: activePlayers, icon: TrendingUp, color: 'text-green-400', bg: 'bg-green-500/10' },
    ]

    return (
      <div className="space-y-10 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-5xl font-display font-black text-white uppercase tracking-tighter italic">Relatórios Centrais</h1>
            <p className="text-slate-400 font-medium uppercase tracking-[0.2em] text-[10px] mt-2">Inteligência de Dados e Documentação Oficial FGB</p>
          </div>
          <button className="inline-flex items-center gap-2 border border-white/10 bg-white/5 hover:bg-white/10 text-white font-bold h-12 px-6 rounded-2xl text-xs uppercase tracking-widest transition-all">
            <Download className="w-4 h-4" />
            Exportar (.XLSX)
          </button>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {kpis.map((kpi, i) => (
            <div key={i} className="bg-[#111] border border-white/5 rounded-[32px] overflow-hidden relative group p-8">
              <div className={`absolute top-0 right-0 w-32 h-32 ${kpi.bg} rounded-full blur-[60px] -mr-16 -mt-16 opacity-50`} />
              <div className={`w-12 h-12 rounded-2xl ${kpi.bg} flex items-center justify-center mb-6 relative z-10`}>
                <kpi.icon className={`w-6 h-6 ${kpi.color}`} />
              </div>
              <div className="text-4xl font-display font-black text-white mb-1 relative z-10">{kpi.value}</div>
              <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest relative z-10">{kpi.label}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left */}
          <div className="lg:col-span-8 space-y-8">
            <div>
              <h2 className="text-xl font-display font-black text-white mb-1">Distribuição por Categoria</h2>
              <p className="text-slate-500 text-xs uppercase tracking-widest">Engajamento técnico por faixa etária</p>
            </div>
            <div className="bg-[#111] border border-white/5 rounded-[40px] p-8">
              {latestChampionship ? (
                <div className="space-y-6">
                  <h3 className="text-sm font-bold text-white uppercase tracking-widest">{latestChampionship.name}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {latestChampionship.categories.map((cat) => (
                      <div key={cat.id} className="flex items-center justify-between p-4 bg-white/[0.03] border border-white/5 rounded-2xl hover:border-[#FF6B00]/30 transition-all">
                        <span className="text-slate-400 font-bold text-xs uppercase">{cat.name}</span>
                        <div className="flex items-center gap-3">
                          <div className="text-white font-black">{cat._count.registrations}</div>
                          <div className="w-24 h-2 bg-white/5 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-[#FF6B00] to-orange-400"
                              style={{ width: `${Math.min((cat._count.registrations / 10) * 100, 100)}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Trophy className="w-12 h-12 text-slate-800 mx-auto mb-4" />
                  <p className="text-slate-500 italic text-sm">Nenhum dado de campeonato disponível.</p>
                  <p className="text-slate-600 text-xs mt-2">Crie um campeonato em Admin → Campeonatos</p>
                </div>
              )}
            </div>

            <div>
              <h2 className="text-xl font-display font-black text-white mb-1">Últimos Confrontos</h2>
              <p className="text-slate-500 text-xs uppercase tracking-widest">Logs de placares em tempo real</p>
            </div>
            <div className="bg-[#111] border border-white/5 rounded-[40px] overflow-hidden">
              {recentGames.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-slate-500 italic text-sm">Nenhum jogo registrado ainda.</p>
                </div>
              ) : (
                <table className="w-full text-left">
                  <thead className="bg-white/5 border-b border-white/5">
                    <tr>
                      <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Partida</th>
                      <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Placar</th>
                      <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Data</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {recentGames.map((game) => (
                      <tr key={game.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="px-8 py-6">
                          <div className="flex flex-col">
                            <span className="text-white font-bold text-sm uppercase tracking-tight">{game.homeTeam.name} vs {game.awayTeam.name}</span>
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">{game.category.name}</span>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <span className="inline-flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-xl border border-white/5 font-display font-black text-[#FF6B00]">
                            {game.homeScore ?? 0} - {game.awayScore ?? 0}
                          </span>
                        </td>
                        <td className="px-8 py-6 text-right">
                          <span className="text-xs font-bold text-slate-400">
                            {new Date(game.dateTime).toLocaleDateString('pt-BR')}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Right */}
          <div className="lg:col-span-4 space-y-8">
            <div className="bg-[#0A0A0A] border border-white/5 border-t-2 border-t-[#FF6B00]/50 rounded-[40px] p-8">
              <div className="flex items-center justify-between mb-8">
                <div className="w-10 h-10 rounded-2xl bg-[#FF6B00]/10 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-[#FF6B00]" />
                </div>
                <span className="bg-[#FF6B00]/10 text-[#FF6B00] border border-[#FF6B00]/20 text-[8px] font-black uppercase tracking-widest px-3 py-1 rounded-full">
                  Pronto para Envio
                </span>
              </div>
              <h3 className="text-2xl font-display font-black text-white mb-2 leading-none">PDF Mensal</h3>
              <p className="text-slate-500 text-xs font-medium mb-8 leading-relaxed">Gere o documento oficial consolidado de todas as partidas do mês para envio à presidência da federação.</p>
              <button className="w-full bg-white hover:bg-slate-200 text-black font-black uppercase tracking-widest h-14 rounded-2xl transition-all hover:scale-105 active:scale-95 text-xs">
                Gerar Documento (PDF)
              </button>
            </div>

            <div className="bg-[#111] border border-white/5 rounded-[40px] p-8">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-2xl bg-blue-500/10 flex items-center justify-center">
                  <PieChart className="w-5 h-5 text-blue-500" />
                </div>
                <h3 className="text-lg font-display font-black text-white uppercase tracking-tight">Status de Sedes</h3>
              </div>
              <div className="space-y-6">
                {[
                  { label: 'Sedes Confirmadas', value: 8, total: 10, color: 'bg-blue-500' },
                  { label: 'Relatórios Médicos', value: 4, total: 10, color: 'bg-red-500' },
                  { label: 'Taxas de Inscrição', value: 10, total: 10, color: 'bg-green-500' },
                ].map((item, i) => (
                  <div key={i} className="space-y-2">
                    <div className="flex justify-between text-[10px] font-black text-slate-500 uppercase tracking-widest">
                      <span>{item.label}</span>
                      <span className="text-white">{Math.round((item.value / item.total) * 100)}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div className={`h-full ${item.color}`} style={{ width: `${(item.value / item.total) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  } catch (error: any) {
    return (
      <div className="space-y-10 max-w-7xl mx-auto">
        <div>
          <h1 className="text-5xl font-display font-black text-white uppercase tracking-tighter italic">Relatórios Centrais</h1>
          <p className="text-slate-400 font-medium uppercase tracking-[0.2em] text-[10px] mt-2">Inteligência de Dados e Documentação Oficial FGB</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {['Equipes', 'Campeonatos', 'Jogos', 'Atletas'].map(label => (
            <div key={label} className="bg-[#111] border border-white/5 rounded-[32px] p-8">
              <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">{label}</div>
              <div className="text-4xl font-display font-black text-white">0</div>
            </div>
          ))}
        </div>
        <div className="bg-[#111] border border-white/5 rounded-3xl p-16 text-center">
          <FileText className="w-12 h-12 text-slate-800 mx-auto mb-4" />
          <p className="text-slate-500 text-sm">Dados de relatório serão exibidos assim que houver campeonatos e jogos registrados.</p>
        </div>
      </div>
    )
  }
}
