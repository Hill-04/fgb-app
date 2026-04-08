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
      <div className="space-y-10 max-w-7xl mx-auto pb-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="fgb-display text-5xl text-[var(--black)] leading-none italic mb-2">Relatórios Centrais</h1>
            <p className="fgb-label text-[var(--gray)]" style={{ fontSize: 10 }}>Inteligência de Dados e Documentação Oficial FGB</p>
          </div>
          <button className="inline-flex items-center gap-2 fgb-btn-outline h-12 px-6">
            <Download className="w-4 h-4" />
            Exportar (.XLSX)
          </button>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {kpis.map((kpi, i) => (
            <div key={i} className="bg-[var(--gray-l)] border border-[var(--border)] rounded-[32px] overflow-hidden relative group p-8">
              <div className={`absolute top-0 right-0 w-32 h-32 ${kpi.bg} rounded-full blur-[40px] -mr-16 -mt-16 opacity-50`} />
              <div className={`w-12 h-12 rounded-2xl ${kpi.bg} flex items-center justify-center mb-6 relative z-10`}>
                <kpi.icon className={`w-6 h-6 ${kpi.color.replace('text-[#FF6B00]', 'text-[var(--verde)]')}`} />
              </div>
              <div className="fgb-display text-4xl text-[var(--black)] mb-1 relative z-10 leading-none">{kpi.value}</div>
              <div className="fgb-label text-[var(--gray)] relative z-10" style={{ fontSize: 10 }}>{kpi.label}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left */}
          <div className="lg:col-span-8 space-y-8">
            <div>
              <h2 className="fgb-display text-xl text-[var(--black)] mb-1">Distribuição por Categoria</h2>
              <p className="fgb-label text-[var(--gray)]" style={{ fontSize: 10 }}>Engajamento técnico por faixa etária</p>
            </div>
            <div className="fgb-card p-8">
              {latestChampionship ? (
                <div className="space-y-6">
                  <h3 className="fgb-display text-sm text-[var(--black)] mb-4">{latestChampionship.name}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {latestChampionship.categories.map((cat) => (
                      <div key={cat.id} className="flex items-center justify-between p-4 bg-[var(--gray-l)] border border-[var(--border)] rounded-2xl">
                        <span className="fgb-label text-[var(--gray)]" style={{ fontSize: 12 }}>{cat.name}</span>
                        <div className="flex items-center gap-3">
                          <div className="fgb-display text-[var(--black)]">{cat._count.registrations}</div>
                          <div className="w-24 h-2 bg-slate-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-[var(--verde)]"
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
                  <Trophy className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-[var(--gray)] italic text-sm font-sans">Nenhum dado de campeonato disponível.</p>
                  <p className="fgb-label text-[var(--gray)] mt-2" style={{ textTransform: 'none', letterSpacing: 0 }}>Crie um campeonato em Admin → Campeonatos</p>
                </div>
              )}
            </div>

            <div>
              <h2 className="fgb-display text-xl text-[var(--black)] mb-1">Últimos Confrontos</h2>
              <p className="fgb-label text-[var(--gray)]" style={{ fontSize: 10 }}>Logs de placares em tempo real</p>
            </div>
            <div className="fgb-card p-0 overflow-hidden">
              {recentGames.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-[var(--gray)] italic text-sm font-sans">Nenhum jogo registrado ainda.</p>
                </div>
              ) : (
                <table className="w-full text-left">
                  <thead className="bg-[var(--gray-l)] border-b border-[var(--border)] fgb-label text-[var(--gray)]">
                    <tr>
                      <th className="px-8 py-5">Partida</th>
                      <th className="px-8 py-5">Placar</th>
                      <th className="px-8 py-5 text-right">Data</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    {recentGames.map((game) => (
                      <tr key={game.id} className="hover:bg-[var(--gray-l)] transition-colors">
                        <td className="px-8 py-6">
                          <div className="flex flex-col">
                            <span className="font-bold text-[var(--black)] text-sm tracking-tight font-sans">{game.homeTeam.name} vs {game.awayTeam.name}</span>
                            <span className="fgb-label text-[var(--gray)] mt-1" style={{ fontSize: 10 }}>{game.category.name}</span>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <span className="inline-flex items-center gap-2 bg-[var(--gray-l)] px-3 py-1.5 rounded-xl border border-[var(--border)] fgb-display text-[var(--black)]">
                            {game.homeScore ?? 0} <span className="text-[var(--gray)] font-sans font-normal mx-1">-</span> {game.awayScore ?? 0}
                          </span>
                        </td>
                        <td className="px-8 py-6 text-right">
                          <span className="text-xs font-bold text-[var(--gray)] font-sans">
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
            <div className="fgb-card admin-card-verde p-8">
              <div className="flex items-center justify-between mb-8">
                <div className="w-10 h-10 rounded-2xl bg-white border border-[var(--verde)]/20 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-[var(--verde)]" />
                </div>
                <span className="fgb-badge fgb-badge-verde" style={{ fontSize: 8 }}>
                  Pronto para Envio
                </span>
              </div>
              <h3 className="fgb-display text-2xl text-[var(--black)] mb-2">PDF Mensal</h3>
              <p className="fgb-label text-[var(--gray)] mb-8" style={{ textTransform: 'none', letterSpacing: 0, lineHeight: 1.5 }}>Gere o documento oficial consolidado de todas as partidas do mês para envio à presidência da federação.</p>
              <button className="w-full fgb-btn-primary h-14">
                Gerar Documento (PDF)
              </button>
            </div>

            <div className="fgb-card p-8 bg-[var(--gray-l)]">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center">
                  <PieChart className="w-5 h-5 text-blue-500" />
                </div>
                <h3 className="fgb-display text-lg text-[var(--black)]">Status de Sedes</h3>
              </div>
              <div className="space-y-6">
                {[
                  { label: 'Sedes Confirmadas', value: 8, total: 10, color: 'bg-blue-500' },
                  { label: 'Relatórios Médicos', value: 4, total: 10, color: 'bg-[var(--red)]' },
                  { label: 'Taxas de Inscrição', value: 10, total: 10, color: 'bg-[var(--verde)]' },
                ].map((item, i) => (
                  <div key={i} className="space-y-2">
                    <div className="flex justify-between fgb-label text-[var(--gray)] text-[10px]">
                      <span>{item.label}</span>
                      <span className="text-[var(--black)]">{Math.round((item.value / item.total) * 100)}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
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
          <h1 className="fgb-display text-5xl text-[var(--black)] leading-none italic mb-2">Relatórios Centrais</h1>
          <p className="fgb-label text-[var(--gray)]" style={{ fontSize: 10 }}>Inteligência de Dados e Documentação Oficial FGB</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {['Equipes', 'Campeonatos', 'Jogos', 'Atletas'].map(label => (
            <div key={label} className="fgb-card p-8 bg-[var(--gray-l)]">
              <div className="fgb-label text-[var(--gray)] mb-2" style={{ fontSize: 10 }}>{label}</div>
              <div className="fgb-display text-4xl text-[var(--black)]">0</div>
            </div>
          ))}
        </div>
        <div className="fgb-card p-16 text-center bg-[var(--gray-l)]">
          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="fgb-label text-[var(--gray)]" style={{ textTransform: 'none', letterSpacing: 0 }}>Данные relatórios serão exibidos assim que houver campeonatos e jogos registrados.</p>
        </div>
      </div>
    )
  }
}
