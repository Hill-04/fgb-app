import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { PublicHeader } from '@/components/PublicHeader'
import { PublicFooter } from '@/components/PublicFooter'
import { FgbImage } from '@/components/FgbImage'
import { StaggerGrid } from '@/components/motion/StaggerGrid'
import { getGameWithStats } from '@/lib/queries/games'
import { prisma } from '@/lib/db'
import { ArrowLeft, MapPin, Calendar, Trophy } from 'lucide-react'

type Props = { params: { id: string } }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const response = await getGameWithStats(params.id).catch(() => null)
    const game: any = response?.game
    if (!game) throw new Error()
    return {
      title: `${game.home_team?.short_name || 'Home'} vs ${game.away_team?.short_name || 'Away'} — Box Score | FGB`,
      description: `Estatísticas completas da partida entre ${game.home_team?.name || 'Home'} e ${game.away_team?.name || 'Away'}.`,
    }
  } catch (e) {
    return { title: 'Súmula | FGB' }
  }
}

type StatusKey = 'finished' | 'live' | 'scheduled'

const STATUS_LABEL: Record<StatusKey, string> = {
  finished: 'Final',
  live: 'Ao Vivo',
  scheduled: 'Agendado',
}

export default async function GameSumulaPage({ params }: Props) {
  let data: any
  try {
    data = await getGameWithStats(params.id).catch(() => null)
  } catch (e) {
    notFound()
  }

  const { game, stats }: { game: any; stats: any[] } = data || {}
  if (!game) notFound()

  const homeStats = stats.filter((s: any) => s.team_id === game.home_team_id)
  const awayStats = stats.filter((s: any) => s.team_id === game.away_team_id)

  const liveGame = await prisma.game
    .findUnique({
      where: { id: params.id },
      select: { isLivePublished: true, liveStatus: true },
    })
    .catch(() => null)
  const showLiveCta = Boolean(
    liveGame?.isLivePublished &&
      ['PRE_GAME_READY', 'LIVE', 'HALFTIME', 'PERIOD_BREAK'].includes(liveGame.liveStatus ?? ''),
  )

  const status = (game.status as StatusKey) ?? 'scheduled'
  const date = new Date(game.scheduled_at)
  const homeWon = game.home_score > game.away_score && status === 'finished'
  const awayWon = game.away_score > game.home_score && status === 'finished'

  return (
    <div className="min-h-screen" style={{ background: 'var(--fgb-ink-50)' }}>
      <PublicHeader />

      {/* HERO DARK COM SCOREBOARD */}
      <div className="relative overflow-hidden pt-12 pb-16" style={{ background: 'var(--fgb-green-950)' }}>
        <div className="fgb-tricolor absolute top-0 w-full" />
        <div
          className="absolute inset-0 pointer-events-none opacity-25"
          style={{
            backgroundImage:
              'repeating-linear-gradient(0deg,transparent,transparent 56px,rgba(255,255,255,0.04) 56px,rgba(255,255,255,0.04) 57px),repeating-linear-gradient(90deg,transparent,transparent 56px,rgba(255,255,255,0.04) 56px,rgba(255,255,255,0.04) 57px)',
          }}
        />

        <div className="max-w-6xl mx-auto px-4 relative z-10">
          <Link
            href="/jogos"
            className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-widest mb-10 transition-colors"
            style={{ color: 'rgba(255,255,255,0.55)' }}
          >
            <ArrowLeft size={14} aria-hidden />
            Voltar aos Jogos
          </Link>

          <div className="flex flex-col md:flex-row items-center justify-between gap-8 md:gap-12">
            {/* HOME TEAM */}
            <div className="flex-1 flex flex-col items-center md:items-end gap-4 min-w-0 text-center md:text-right">
              <div className="w-24 h-24 md:w-28 md:h-28 rounded-full overflow-hidden flex-shrink-0" style={{ background: 'rgba(255,255,255,0.06)', border: '2px solid rgba(255,255,255,0.12)' }}>
                <FgbImage
                  variant="logo"
                  src={game.home_team?.logo_url}
                  initials={(game.home_team?.short_name || game.home_team?.name || '??').slice(0, 2)}
                  alt={game.home_team?.name || 'Time mandante'}
                  tint="green"
                />
              </div>
              <div className="min-w-0">
                <h2
                  className="truncate"
                  style={{
                    fontFamily: 'var(--font-anton)',
                    fontSize: 'clamp(28px, 4vw, 44px)',
                    lineHeight: 1,
                    textTransform: 'uppercase',
                    color: homeWon ? 'var(--fgb-yellow-500)' : '#fff',
                  }}
                >
                  {game.home_team?.name || 'Time Mandante'}
                </h2>
                {game.home_team?.city && (
                  <div className="fgb-label mt-2" style={{ color: 'rgba(255,255,255,0.45)' }}>
                    {game.home_team.city}
                  </div>
                )}
              </div>
            </div>

            {/* SCORE */}
            <div className="flex flex-col items-center gap-4 min-w-44">
              <StatusPill status={status} />
              <div
                className="flex items-baseline gap-5 tabular-nums"
                style={{ fontFamily: 'var(--font-anton)', fontSize: 'clamp(56px, 9vw, 96px)', lineHeight: 0.9 }}
              >
                <span style={{ color: homeWon ? 'var(--fgb-yellow-500)' : '#fff' }}>
                  {game.home_score ?? '-'}
                </span>
                <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: '0.45em' }}>×</span>
                <span style={{ color: awayWon ? 'var(--fgb-yellow-500)' : '#fff' }}>
                  {game.away_score ?? '-'}
                </span>
              </div>
              <div
                className="flex flex-col items-center gap-1 fgb-label text-center"
                style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10, letterSpacing: '0.18em' }}
              >
                <span className="inline-flex items-center gap-1.5">
                  <Calendar size={11} aria-hidden />
                  {date.toLocaleDateString('pt-BR')} · {date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </span>
                {game.venue && (
                  <span className="inline-flex items-center gap-1.5 max-w-[220px] truncate">
                    <MapPin size={11} aria-hidden />
                    {game.venue}
                  </span>
                )}
              </div>
              {showLiveCta && (
                <Link
                  href={`/live/${game.id}`}
                  className="fgb-btn-primary mt-2"
                  style={{ fontSize: 11, padding: '10px 22px' }}
                >
                  Ver ao Vivo
                </Link>
              )}
            </div>

            {/* AWAY TEAM */}
            <div className="flex-1 flex flex-col items-center md:items-start gap-4 min-w-0 text-center md:text-left">
              <div className="w-24 h-24 md:w-28 md:h-28 rounded-full overflow-hidden flex-shrink-0" style={{ background: 'rgba(255,255,255,0.06)', border: '2px solid rgba(255,255,255,0.12)' }}>
                <FgbImage
                  variant="logo"
                  src={game.away_team?.logo_url}
                  initials={(game.away_team?.short_name || game.away_team?.name || '??').slice(0, 2)}
                  alt={game.away_team?.name || 'Time visitante'}
                  tint="navy"
                />
              </div>
              <div className="min-w-0">
                <h2
                  className="truncate"
                  style={{
                    fontFamily: 'var(--font-anton)',
                    fontSize: 'clamp(28px, 4vw, 44px)',
                    lineHeight: 1,
                    textTransform: 'uppercase',
                    color: awayWon ? 'var(--fgb-yellow-500)' : '#fff',
                  }}
                >
                  {game.away_team?.name || 'Time Visitante'}
                </h2>
                {game.away_team?.city && (
                  <div className="fgb-label mt-2" style={{ color: 'rgba(255,255,255,0.45)' }}>
                    {game.away_team.city}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION HEADER */}
      <div className="max-w-6xl mx-auto px-4 mt-12 mb-6">
        <div className="flex items-center gap-3">
          <Trophy size={18} style={{ color: 'var(--fgb-green-700)', strokeWidth: 2 }} aria-hidden />
          <h2
            style={{
              fontFamily: 'var(--font-anton)',
              fontSize: 28,
              textTransform: 'uppercase',
              letterSpacing: '0.01em',
              lineHeight: 1,
              color: 'var(--fgb-ink-900)',
            }}
          >
            Box Score
          </h2>
        </div>
        <p className="fgb-label mt-2" style={{ color: 'var(--fgb-ink-500)', textTransform: 'none', letterSpacing: 0, fontSize: 12 }}>
          Estatísticas individuais registradas pela súmula oficial da partida.
        </p>
      </div>

      <main className="max-w-6xl mx-auto px-4 pb-14">
        {stats.length > 0 ? (
          <StaggerGrid className="grid grid-cols-1 xl:grid-cols-2 gap-6" stagger={0.1}>
            <BoxScoreTable team={game.home_team} stats={homeStats} isWinner={homeWon} tint="green" />
            <BoxScoreTable team={game.away_team} stats={awayStats} isWinner={awayWon} tint="navy" />
          </StaggerGrid>
        ) : (
          <div
            className="fgb-card p-12 text-center"
            style={{ background: '#fff', color: 'var(--fgb-ink-500)' }}
          >
            Súmula estatística ainda não registrada para este jogo.
          </div>
        )}
      </main>

      <PublicFooter />
    </div>
  )
}

function StatusPill({ status }: { status: StatusKey }) {
  if (status === 'live') {
    return (
      <span
        className="fgb-label inline-flex items-center gap-2 px-3 py-1.5"
        style={{
          background: 'var(--fgb-red-500)',
          color: '#fff',
          fontSize: 10,
          letterSpacing: '0.22em',
          animation: 'fgb-pulse 1.4s ease-in-out infinite',
        }}
      >
        <span
          className="inline-block rounded-full"
          style={{ width: 6, height: 6, background: '#fff' }}
        />
        {STATUS_LABEL.live}
      </span>
    )
  }

  return (
    <span
      className="fgb-label inline-flex items-center gap-2 px-3 py-1.5"
      style={{
        background: status === 'finished' ? 'rgba(255,255,255,0.08)' : 'transparent',
        border: status === 'scheduled' ? '1px solid rgba(255,255,255,0.2)' : 'none',
        color: status === 'finished' ? 'var(--fgb-yellow-500)' : 'rgba(255,255,255,0.65)',
        fontSize: 10,
        letterSpacing: '0.22em',
      }}
    >
      {STATUS_LABEL[status]}
    </span>
  )
}

function BoxScoreTable({
  team,
  stats,
  isWinner,
  tint,
}: {
  team: any
  stats: any[]
  isWinner: boolean
  tint: 'green' | 'navy'
}) {
  const displayStats = [...stats].sort((a, b) => b.points - a.points)
  const accentColor = isWinner ? 'var(--fgb-green-700)' : 'var(--fgb-ink-400)'

  return (
    <div
      className="fgb-card overflow-hidden"
      style={{ background: '#fff', borderTop: `4px solid ${accentColor}` }}
    >
      <div
        className="p-5 flex items-center justify-between gap-4"
        style={{ background: 'var(--fgb-green-50)', borderBottom: '1px solid var(--border)' }}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0" style={{ border: '1px solid var(--border)' }}>
            <FgbImage
              variant="logo"
              src={team?.logo_url}
              initials={(team?.short_name || team?.name || '??').slice(0, 2)}
              alt={team?.name || 'Equipe'}
              tint={tint}
            />
          </div>
          <h3
            className="truncate"
            style={{
              fontFamily: 'var(--font-anton)',
              fontSize: 22,
              textTransform: 'uppercase',
              color: 'var(--fgb-ink-900)',
            }}
          >
            {team?.name || 'Equipe'}
          </h3>
        </div>
        {isWinner && (
          <span
            className="fgb-badge"
            style={{
              background: 'var(--fgb-green-700)',
              color: '#fff',
            }}
          >
            Vencedor
          </span>
        )}
      </div>

      <div className="overflow-x-auto fgb-hide-scrollbar">
        <table className="w-full text-left border-collapse whitespace-nowrap min-w-full">
          <thead>
            <tr
              className="fgb-label"
              style={{
                background: '#fff',
                fontSize: 10,
                color: 'var(--fgb-ink-500)',
                borderBottom: '1px solid var(--border)',
              }}
            >
              <th className="py-3 px-4 w-12 text-center">#</th>
              <th className="py-3 px-4">Atleta</th>
              <th className="py-3 px-2 text-center" title="Pontos">PTS</th>
              <th className="py-3 px-2 text-center" title="Rebotes Totais">REB</th>
              <th className="py-3 px-2 text-center" title="Assistências">AST</th>
              <th className="py-3 px-2 text-center" title="Tocos">BLK</th>
              <th className="py-3 px-2 text-center" title="Roubos">STL</th>
              <th className="py-3 px-2 text-center" style={{ color: 'var(--fgb-ink-400)' }} title="Arremessos de Campo">FG</th>
              <th className="py-3 px-2 text-center" style={{ color: 'var(--fgb-ink-400)' }} title="Arremessos de 3">3PT</th>
              <th className="py-3 px-4 text-center" style={{ color: 'var(--fgb-green-700)' }} title="Eficiência">EFF</th>
            </tr>
          </thead>
          <tbody className="text-sm font-medium fgb-tabular">
            {displayStats.map((s) => (
              <tr
                key={s.id}
                className="transition-colors hover:brightness-95"
                style={{ borderBottom: '1px solid var(--fgb-ink-100)' }}
              >
                <td
                  className="py-3 px-4 text-center text-xs"
                  style={{ color: 'var(--fgb-ink-400)', fontFamily: 'var(--font-mono)' }}
                >
                  {s.athlete?.jersey_number ?? '-'}
                </td>
                <td className="py-3 px-4 truncate max-w-48">
                  <span style={{ color: 'var(--fgb-ink-900)' }}>
                    {s.athlete?.name || 'Atleta não identificado'}
                  </span>
                  {s.athlete?.position && (
                    <span
                      className="fgb-label block mt-0.5"
                      style={{ fontSize: 9, color: 'var(--fgb-ink-400)' }}
                    >
                      {s.athlete.position}
                    </span>
                  )}
                </td>
                <td
                  className="py-3 px-2 text-center font-bold"
                  style={{ color: 'var(--fgb-ink-900)' }}
                >
                  {s.points}
                </td>
                <td className="py-3 px-2 text-center" style={{ color: 'var(--fgb-ink-600)' }}>{s.rebounds_total}</td>
                <td className="py-3 px-2 text-center" style={{ color: 'var(--fgb-ink-600)' }}>{s.assists}</td>
                <td className="py-3 px-2 text-center" style={{ color: 'var(--fgb-ink-400)' }}>{s.blocks}</td>
                <td className="py-3 px-2 text-center" style={{ color: 'var(--fgb-ink-400)' }}>{s.steals}</td>
                <td
                  className="py-3 px-2 text-center text-xs"
                  style={{ color: 'var(--fgb-ink-400)', fontFamily: 'var(--font-mono)' }}
                >
                  {s.fg_made}/{s.fg_attempted}
                </td>
                <td
                  className="py-3 px-2 text-center text-xs"
                  style={{ color: 'var(--fgb-ink-400)', fontFamily: 'var(--font-mono)' }}
                >
                  {s.three_made}/{s.three_attempted}
                </td>
                <td
                  className="py-3 px-4 text-center font-bold"
                  style={{ color: 'var(--fgb-green-700)' }}
                >
                  {s.efficiency}
                </td>
              </tr>
            ))}
            {displayStats.length === 0 && (
              <tr>
                <td
                  colSpan={10}
                  className="py-12 text-center text-sm"
                  style={{ color: 'var(--fgb-ink-400)' }}
                >
                  Nenhum atleta registrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
