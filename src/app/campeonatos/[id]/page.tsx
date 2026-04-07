import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/db'
import { PublicHeader } from '@/components/PublicHeader'
import { PublicFooter } from '@/components/PublicFooter'

type Props = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const championship = await prisma.championship.findUnique({
    where: { id },
    select: { name: true, description: true },
  }).catch(() => null)

  if (!championship) return { title: 'Campeonato não encontrado — FGB' }

  return {
    title: `${championship.name} — FGB`,
    description: championship.description ?? `Acompanhe o campeonato ${championship.name} da Federação Gaúcha de Basketball.`,
  }
}

function getStatusLabel(status: string) {
  const map: Record<string, string> = {
    DRAFT: 'Rascunho',
    REGISTRATION_OPEN: 'Inscrições Abertas',
    ONGOING: 'Em Andamento',
    FINISHED: 'Finalizado',
    CANCELLED: 'Cancelado',
  }
  return map[status] ?? status
}

function getStatusStyle(status: string) {
  if (status === 'ONGOING') return 'text-[#FF6B00] bg-[#FF6B00]/10 border-[#FF6B00]/20'
  if (status === 'REGISTRATION_OPEN') return 'text-green-400 bg-green-500/10 border-green-500/20'
  if (status === 'FINISHED') return 'text-slate-400 bg-white/[0.05] border-white/[0.08]'
  return 'text-slate-500 bg-white/[0.03] border-white/[0.05]'
}

export default async function CampeonatoPublicPage({ params }: Props) {
  const { id } = await params

  const championship = await prisma.championship.findUnique({
    where: { id },
    include: {
      categories: {
        include: {
          standings: {
            include: { team: { select: { name: true, city: true } } },
            orderBy: { points: 'desc' },
            take: 10,
          },
          games: {
            where: { status: { in: ['SCHEDULED', 'FINISHED'] } },
            include: {
              homeTeam: { select: { name: true } },
              awayTeam: { select: { name: true } },
            },
            orderBy: { dateTime: 'asc' },
            take: 8,
          },
        },
      },
      registrations: {
        where: { status: 'CONFIRMED' },
        include: { team: { select: { name: true, city: true } } },
        take: 20,
      },
      _count: { select: { registrations: true, games: true } },
    },
  }).catch(() => null)

  if (!championship) notFound()

  const upcomingGames = championship.categories.flatMap((cat) =>
    cat.games.filter((g) => g.status === 'SCHEDULED')
  )
  const recentGames = championship.categories.flatMap((cat) =>
    cat.games.filter((g) => g.status === 'FINISHED')
  ).slice(0, 6)

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      <PublicHeader />

      <main className="max-w-6xl mx-auto px-6 py-16">
        {/* Breadcrumb */}
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600 mb-8">
          <Link href="/" className="hover:text-slate-400 transition-colors">Início</Link>
          {' · '}
          <Link href="/campeonatos" className="hover:text-slate-400 transition-colors">Campeonatos</Link>
          {' · '}
          {championship.name}
        </p>

        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-5">
            <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1.5 rounded-full border ${getStatusStyle(championship.status)}`}>
              {getStatusLabel(championship.status)}
            </span>
            <span className="text-[10px] text-slate-500 uppercase tracking-widest">
              {championship.sex}
            </span>
          </div>
          <h1 className="text-4xl md:text-6xl font-black italic uppercase text-white tracking-tight mb-6 leading-[0.95]" style={{ fontFamily: 'var(--font-display), sans-serif' }}>
            {championship.name}
          </h1>
          {championship.description && (
            <p className="text-slate-400 text-base leading-relaxed max-w-3xl">
              {championship.description}
            </p>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-14">
          {[
            { value: championship._count.registrations, label: 'Equipes' },
            { value: championship._count.games, label: 'Jogos' },
            { value: championship.categories.length, label: 'Categorias' },
            { value: championship.year, label: 'Temporada' },
          ].map((s, i) => (
            <div key={i} className="bg-[#141414] border border-white/[0.08] rounded-2xl p-5 text-center">
              <p className="text-3xl font-black italic uppercase text-[#FF6B00]" style={{ fontFamily: 'var(--font-display), sans-serif' }}>
                {s.value}
              </p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Categorias e Classificação */}
        {championship.categories.map((cat) => (
          <section key={cat.id} className="mb-14">
            <div className="flex items-center gap-4 mb-7">
              <h2 className="text-lg font-black italic uppercase text-white" style={{ fontFamily: 'var(--font-display), sans-serif' }}>
                {cat.name}
              </h2>
              <div className="flex-1 h-px bg-white/[0.05]" />
            </div>

            {cat.standings.length > 0 && (
              <div className="bg-[#141414] border border-white/[0.08] rounded-3xl overflow-hidden mb-6">
                <div className="px-6 py-4 border-b border-white/[0.05]">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                    Classificação
                  </p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-[9px] font-black uppercase tracking-widest text-slate-600 border-b border-white/[0.04]">
                        <th className="text-left px-6 py-3">Pos</th>
                        <th className="text-left px-6 py-3">Equipe</th>
                        <th className="text-center px-3 py-3">J</th>
                        <th className="text-center px-3 py-3">V</th>
                        <th className="text-center px-3 py-3">D</th>
                        <th className="text-center px-3 py-3">Pts</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cat.standings.map((s, i) => (
                        <tr
                          key={s.id}
                          className={`border-b border-white/[0.04] last:border-0 transition-colors hover:bg-white/[0.02] ${i === 0 ? 'bg-[#FF6B00]/[0.03]' : ''}`}
                        >
                          <td className="px-6 py-3.5">
                            <span className={`text-xs font-black ${i === 0 ? 'text-[#FF6B00]' : 'text-slate-500'}`}>
                              {i + 1}º
                            </span>
                          </td>
                          <td className="px-6 py-3.5">
                            <p className="text-xs font-black text-white uppercase">
                              {s.team.name}
                            </p>
                            {s.team.city && (
                              <p className="text-[10px] text-slate-600">{s.team.city}</p>
                            )}
                          </td>
                          <td className="text-center px-3 py-3.5 text-xs text-slate-400">{s.played}</td>
                          <td className="text-center px-3 py-3.5 text-xs text-green-400">{s.wins}</td>
                          <td className="text-center px-3 py-3.5 text-xs text-red-400">{s.losses}</td>
                          <td className="text-center px-3 py-3.5 text-xs font-black text-white">{s.points}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </section>
        ))}

        {/* Próximos jogos */}
        {upcomingGames.length > 0 && (
          <section className="mb-14">
            <div className="flex items-center gap-4 mb-7">
              <h2 className="text-lg font-black italic uppercase text-white" style={{ fontFamily: 'var(--font-display), sans-serif' }}>
                Próximos Jogos
              </h2>
              <div className="flex-1 h-px bg-white/[0.05]" />
            </div>
            <div className="bg-[#141414] border border-white/[0.08] rounded-3xl overflow-hidden">
              {upcomingGames.slice(0, 8).map((game) => (
                <div
                  key={game.id}
                  className="px-6 py-4 flex items-center justify-between border-b border-white/[0.05] last:border-0 hover:bg-white/[0.02] transition-all"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <span className="text-xs font-black uppercase text-white truncate flex-1 text-right">
                      {game.homeTeam.name}
                    </span>
                    <span className="text-xs font-bold text-slate-500 flex-shrink-0 px-3">vs</span>
                    <span className="text-xs font-black uppercase text-white truncate flex-1">
                      {game.awayTeam.name}
                    </span>
                  </div>
                  <div className="text-right flex-shrink-0 ml-4">
                    <p className="text-[10px] text-slate-400">
                      {new Date(game.dateTime).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                    <p className="text-[10px] text-slate-600 truncate max-w-[120px]">{game.location}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Últimos Resultados */}
        {recentGames.length > 0 && (
          <section className="mb-14">
            <div className="flex items-center gap-4 mb-7">
              <h2 className="text-lg font-black italic uppercase text-white" style={{ fontFamily: 'var(--font-display), sans-serif' }}>
                Últimos Resultados
              </h2>
              <div className="flex-1 h-px bg-white/[0.05]" />
            </div>
            <div className="bg-[#141414] border border-white/[0.08] rounded-3xl overflow-hidden">
              {recentGames.map((game) => (
                <div
                  key={game.id}
                  className="px-6 py-4 flex items-center justify-between border-b border-white/[0.05] last:border-0 hover:bg-white/[0.02] transition-all"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <span className="text-xs font-black uppercase text-white truncate flex-1 text-right">
                      {game.homeTeam.name}
                    </span>
                    <span className="text-lg font-black text-[#FF6B00] flex-shrink-0 px-3 tabular-nums">
                      {game.homeScore ?? '—'} × {game.awayScore ?? '—'}
                    </span>
                    <span className="text-xs font-black uppercase text-white truncate flex-1">
                      {game.awayTeam.name}
                    </span>
                  </div>
                  <span className="text-[9px] font-black uppercase text-slate-500 bg-white/[0.05] border border-white/[0.06] px-2.5 py-1 rounded-full flex-shrink-0 ml-4">
                    Encerrado
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Equipes Inscritas */}
        {championship.registrations.length > 0 && (
          <section className="mb-14">
            <div className="flex items-center gap-4 mb-7">
              <h2 className="text-lg font-black italic uppercase text-white" style={{ fontFamily: 'var(--font-display), sans-serif' }}>
                Equipes Participantes
              </h2>
              <div className="flex-1 h-px bg-white/[0.05]" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {championship.registrations.map((reg) => (
                <div
                  key={reg.id}
                  className="bg-[#141414] border border-white/[0.08] rounded-2xl p-4 flex items-center gap-3"
                >
                  <div className="w-8 h-8 rounded-xl bg-[#FF6B00]/10 flex items-center justify-center text-sm flex-shrink-0">
                    🏀
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-black uppercase text-white truncate">{reg.team.name}</p>
                    {reg.team.city && (
                      <p className="text-[10px] text-slate-600 truncate">{reg.team.city}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        <div className="mt-8">
          <Link
            href="/campeonatos"
            className="text-[10px] font-black uppercase tracking-widest text-[#FF6B00] hover:underline"
          >
            ← Voltar para campeonatos
          </Link>
        </div>
      </main>

      <PublicFooter />
    </div>
  )
}
