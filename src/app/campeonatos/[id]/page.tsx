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

function getStatusBadge(status: string) {
  if (status === 'ONGOING') return 'fgb-badge-red'
  if (status === 'REGISTRATION_OPEN') return 'fgb-badge-verde'
  if (status === 'FINISHED') return 'fgb-badge-outline'
  return 'fgb-badge-outline'
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
            include: { homeTeam: { select: { name: true } }, awayTeam: { select: { name: true } } },
            orderBy: { dateTime: 'asc' }, take: 8,
          },
        },
      },
      registrations: {
        where: { status: 'CONFIRMED' },
        include: { team: { select: { name: true, city: true } } }, take: 20,
      },
      _count: { select: { registrations: true, games: true } },
    },
  }).catch(() => null)

  if (!championship) notFound()

  const upcomingGames = championship.categories.flatMap(cat => cat.games.filter(g => g.status === 'SCHEDULED'))
  const recentGames = championship.categories.flatMap(cat => cat.games.filter(g => g.status === 'FINISHED')).slice(0, 6)

  return (
    <div>
      <PublicHeader />

      <div className="fgb-page-header">
        <div className="fgb-page-header-bg" />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 relative text-center">
          <div className="fgb-page-header-eyebrow">
            <Link href="/" className="hover:text-white transition-colors">Início</Link> · 
            <Link href="/campeonatos" className="hover:text-white transition-colors"> Campeonatos</Link>
          </div>
          <div className="flex justify-center items-center gap-3 mb-4">
            <span className={`fgb-badge ${getStatusBadge(championship.status)} border-0 text-[10px] px-3 py-1.5`}>
              {getStatusLabel(championship.status)}
            </span>
            <span className="fgb-badge fgb-badge-outline text-[white] border-[rgba(255,255,255,0.2)]">
              {championship.sex}
            </span>
          </div>
          <h1 className="fgb-page-header-title" style={{ fontSize: 'clamp(28px, 4vw, 52px)' }}>
            {championship.name}
          </h1>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-14">
        {/* Stats Strip */}
        <div className="fgb-stats-strip rounded overflow-hidden mb-14 shadow-sm" style={{ border: '1px solid var(--border)' }}>
          {[
            { value: championship._count.registrations, label: 'Equipes' },
            { value: championship._count.games, label: 'Jogos' },
            { value: championship.categories.length, label: 'Categorias' },
            { value: championship.year, label: 'Temporada' },
          ].map((s, i) => (
            <div key={i} className="fgb-stats-strip-item" style={{ padding: '20px', background: '#fff' }}>
              <div className="fgb-stats-num" style={{ fontSize: 32, color: 'var(--verde)' }}>{s.value}</div>
              <div className="fgb-stats-label text-[var(--gray)]">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Categorias e Classificação */}
        {championship.categories.map((cat) => (
          <section key={cat.id} className="mb-14">
            <div className="fgb-section-header">
              <div>
                <div className="fgb-accent fgb-accent-verde" />
                <h2 className="fgb-section-title">Categoria <span className="verde">{cat.name}</span></h2>
              </div>
            </div>

            {cat.standings.length > 0 && (
              <div className="bg-white border border-[var(--border)] rounded overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-[var(--gray-l)] border-b border-[var(--border)]">
                        <th className="px-4 py-3 fgb-label text-[10px] text-[var(--gray)]">Pos</th>
                        <th className="px-4 py-3 fgb-label text-[10px] text-[var(--gray)]">Equipe</th>
                        <th className="px-3 py-3 fgb-label text-[10px] text-[var(--gray)] text-center">J</th>
                        <th className="px-3 py-3 fgb-label text-[10px] text-[var(--gray)] text-center">V</th>
                        <th className="px-3 py-3 fgb-label text-[10px] text-[var(--gray)] text-center">D</th>
                        <th className="px-3 py-3 fgb-label text-[10px] text-[var(--verde)] text-center">Pts</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cat.standings.map((s, i) => (
                        <tr key={s.id} className={`border-b border-[var(--border)] last:border-0 hover:bg-[var(--verde-light)] transition-colors ${i === 0 ? 'bg-[var(--yellow-light)]' : ''}`}>
                          <td className={`px-4 py-3 fgb-display text-[14px] ${i === 0 ? 'text-[var(--orange)]' : 'text-[var(--gray)]'}`}>{i + 1}º</td>
                          <td className="px-4 py-3">
                            <p className="fgb-display text-[13px] text-[var(--black)]">{s.team.name}</p>
                            {s.team.city && <p className="fgb-label text-[10px] text-[var(--gray)]" style={{ textTransform: 'none', letterSpacing: 0 }}>{s.team.city}</p>}
                          </td>
                          <td className="px-3 py-3 text-center fgb-display text-[13px] text-[var(--gray)]">{s.played}</td>
                          <td className="px-3 py-3 text-center fgb-display text-[13px] text-[var(--verde)]">{s.wins}</td>
                          <td className="px-3 py-3 text-center fgb-display text-[13px] text-[var(--red)]">{s.losses}</td>
                          <td className="px-3 py-3 text-center fgb-display text-[14px] text-[var(--black)]">{s.points}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </section>
        ))}

        {/* Últimos Resultados */}
        {recentGames.length > 0 && (
          <section className="mb-14">
            <div className="fgb-section-header">
              <div>
                <div className="fgb-accent fgb-accent-red" />
                <h2 className="fgb-section-title">Últimos <span className="red">Resultados</span></h2>
              </div>
            </div>
            <div className="bg-white border border-[var(--border)] rounded overflow-hidden shadow-sm">
              {recentGames.map((game, idx) => (
               <div key={game.id} style={{ display: 'flex', alignItems: 'center', padding: '14px 16px', borderBottom: idx < recentGames.length - 1 ? '1px solid var(--border)' : 'none' }}>
                 <div className="flex items-center gap-3 flex-1 justify-center">
                   <span className="fgb-display flex-1 text-right truncate" style={{ fontSize: 13, color: 'var(--black)' }}>{game.homeTeam.name}</span>
                   <div className="flex items-center gap-2 flex-shrink-0">
                     <span className="fgb-score-num">{game.homeScore ?? '—'}</span>
                     <span className="fgb-label" style={{ color: 'var(--gray)' }}>×</span>
                     <span className="fgb-score-num">{game.awayScore ?? '—'}</span>
                   </div>
                   <span className="fgb-display flex-1 truncate" style={{ fontSize: 13, color: 'var(--black)' }}>{game.awayTeam.name}</span>
                 </div>
                 <span className="fgb-badge fgb-badge-outline flex-shrink-0 hide-mobile bg-[var(--gray-l)] ml-4">Encerrado</span>
               </div>
              ))}
            </div>
          </section>
        )}

        {/* Próximos jogos */}
        {upcomingGames.length > 0 && (
          <section className="mb-14">
            <div className="fgb-section-header">
              <div>
                <div className="fgb-accent fgb-accent-yellow" />
                <h2 className="fgb-section-title">Próximos <span className="yellow">Jogos</span></h2>
              </div>
            </div>
            <div className="bg-white border border-[var(--border)] rounded overflow-hidden shadow-sm">
              {upcomingGames.slice(0, 8).map((game, idx) => (
                <div key={game.id} className="px-6 py-4 flex items-center justify-between border-b border-[var(--border)] last:border-0 hover:bg-[var(--gray-l)] transition-all">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <span className="fgb-display text-[13px] text-[var(--black)] truncate flex-1 text-right">{game.homeTeam.name}</span>
                    <span className="fgb-label text-[10px] text-[var(--gray)] flex-shrink-0 px-2">VS</span>
                    <span className="fgb-display text-[13px] text-[var(--black)] truncate flex-1">{game.awayTeam.name}</span>
                  </div>
                  <div className="text-right flex-shrink-0 ml-4 border-l border-[var(--border)] pl-4">
                    <p className="fgb-label text-[10px] text-[var(--verde)]">
                      {new Date(game.dateTime).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </p>
                    <p className="fgb-label text-[9px] text-[var(--gray)] mt-1" style={{ textTransform: 'none', letterSpacing: 0 }}>{game.location}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        <div className="text-center mt-12">
          <Link href="/campeonatos" className="fgb-btn-secondary" style={{ borderColor: 'var(--border)', color: 'var(--black)', background: 'var(--gray-l)' }}>
            Voltar para Campeonatos
          </Link>
        </div>
      </main>

      <PublicFooter />
    </div>
  )
}
