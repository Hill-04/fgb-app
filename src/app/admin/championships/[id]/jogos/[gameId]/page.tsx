import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, ClipboardList, FileText, ExternalLink } from 'lucide-react'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { LockGameButton } from '@/components/admin/LockGameButton'

const STATUS_LABEL: Record<string, string> = {
  SCHEDULED: 'Agendado',
  LIVE:      'Ao vivo',
  FINISHED:  'Finalizado',
  CANCELLED: 'Cancelado',
  POSTPONED: 'Adiado',
}

const STATUS_COLOR: Record<string, string> = {
  SCHEDULED: 'bg-gray-100 text-gray-600',
  LIVE:      'bg-green-100 text-green-700',
  FINISHED:  'bg-blue-100 text-blue-700',
  CANCELLED: 'bg-red-100 text-red-600',
  POSTPONED: 'bg-yellow-100 text-yellow-700',
}

export default async function ChampionshipGameHubPage({
  params,
}: {
  params: Promise<{ id: string; gameId: string }>
}) {
  const { id: championshipId, gameId } = await params

  const game = await prisma.game.findFirst({
    where: { id: gameId, championshipId },
    include: {
      championship: { select: { name: true, year: true } },
      category:     { select: { name: true } },
      homeTeam:     { select: { name: true } },
      awayTeam:     { select: { name: true } },
      rosters:      { include: { players: true } },
    },
  })

  if (!game) notFound()

  const session = await getServerSession(authOptions)
  const sessionUserId = (session?.user as any)?.id ?? null
  const currentUser = sessionUserId
    ? await prisma.user.findUnique({
        where: { id: sessionUserId },
        select: { isFederationSuperAdmin: true },
      })
    : null
  const isSuperAdmin = currentUser?.isFederationSuperAdmin === true
  const canLock = isSuperAdmin && game.lifecycleState === 'PUBLISHED' && !game.isHistoricallyLocked
  const canUnlock = isSuperAdmin && game.isHistoricallyLocked

  const scheduledAt = new Date(game.dateTime)
  const homeRoster  = game.rosters.find(r => r.teamId === game.homeTeamId)
  const awayRoster  = game.rosters.find(r => r.teamId === game.awayTeamId)
  const homePlayers = homeRoster?.players.length ?? 0
  const awayPlayers = awayRoster?.players.length ?? 0
  const hasLineup   = homePlayers > 0 || awayPlayers > 0
  const isFinished  = game.status === 'FINISHED'
  const base        = `/admin/championships/${championshipId}/jogos/${gameId}`

  return (
    <div className="max-w-4xl space-y-6 pb-10">
      <Link
        href={`/admin/championships/${championshipId}/jogos`}
        className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[var(--gray)] hover:text-[var(--black)]"
      >
        <ArrowLeft className="h-4 w-4" /> Todos os jogos
      </Link>

      {/* Game header */}
      <div className="fgb-card p-6">
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <span className="fgb-label text-[var(--gray)]">
            {game.championship.name} {game.championship.year} · {game.category.name}
          </span>
          <span className={`text-[10px] font-black px-2.5 py-1 rounded-full ${STATUS_COLOR[game.status] ?? 'bg-gray-100 text-gray-600'}`}>
            {STATUS_LABEL[game.status] ?? game.status}
          </span>
          {game.isHistoricallyLocked && (
            <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-amber-100 text-amber-800">
              Travada
            </span>
          )}
          <div className="ml-auto">
            <LockGameButton
              gameId={game.id}
              isLocked={game.isHistoricallyLocked}
              canLock={canLock}
              canUnlock={canUnlock}
            />
          </div>
        </div>
        <h1 className="fgb-display text-4xl text-[var(--black)] leading-none">
          {game.homeTeam.name}{' '}
          <span className="text-[var(--verde)]">{game.homeScore ?? '-'}</span>
          {' × '}
          <span className="text-[var(--verde)]">{game.awayScore ?? '-'}</span>{' '}
          {game.awayTeam.name}
        </h1>
        <p className="text-sm text-[var(--gray)] mt-3">
          {scheduledAt.toLocaleDateString('pt-BR', {
            weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
          })}
          {' · '}
          {scheduledAt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
          {game.venue ? ` · ${game.venue}` : ''}
        </p>
      </div>

      {/* Action cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          href={`${base}/roster`}
          className="fgb-card p-5 hover:border-[var(--verde)] hover:-translate-y-0.5 transition-all group"
        >
          <div className="flex items-center justify-between mb-4">
            <span className="text-[9px] font-black uppercase tracking-widest text-[var(--gray)]">01</span>
            <ClipboardList className="h-4 w-4 text-[var(--gray)] group-hover:text-[var(--verde)] transition-colors" />
          </div>
          <h3 className="fgb-display text-xl text-[var(--black)] mb-2">Escalação</h3>
          <p className="text-sm text-[var(--gray)] mb-4">
            Selecione os atletas que vão jogar e informe os técnicos.
          </p>
          {hasLineup ? (
            <span className="text-[10px] font-black text-[var(--verde)]">
              ✓ {homePlayers} + {awayPlayers} atletas escalados
            </span>
          ) : (
            <span className="text-[10px] text-[var(--gray)]">Escalação não definida</span>
          )}
        </Link>

        <Link
          href={`${base}/sumula`}
          className="fgb-card p-5 hover:border-[var(--verde)] hover:-translate-y-0.5 transition-all group"
        >
          <div className="flex items-center justify-between mb-4">
            <span className="text-[9px] font-black uppercase tracking-widest text-[var(--gray)]">02</span>
            <FileText className="h-4 w-4 text-[var(--gray)] group-hover:text-[var(--verde)] transition-colors" />
          </div>
          <h3 className="fgb-display text-xl text-[var(--black)] mb-2">Súmula</h3>
          <p className="text-sm text-[var(--gray)] mb-4">
            Placar por quarto, estatísticas de cada atleta e oficiais.
          </p>
          {isFinished ? (
            <span className="text-[10px] font-black text-[var(--verde)]">✓ Jogo finalizado</span>
          ) : (
            <span className="text-[10px] text-[var(--gray)]">Preencher dados do jogo</span>
          )}
        </Link>

        <a
          href={`/sumula/${gameId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="fgb-card p-5 hover:border-[var(--verde)] hover:-translate-y-0.5 transition-all group"
        >
          <div className="flex items-center justify-between mb-4">
            <span className="text-[9px] font-black uppercase tracking-widest text-[var(--gray)]">03</span>
            <ExternalLink className="h-4 w-4 text-[var(--gray)] group-hover:text-[var(--verde)] transition-colors" />
          </div>
          <h3 className="fgb-display text-xl text-[var(--black)] mb-2">Ver Súmula</h3>
          <p className="text-sm text-[var(--gray)] mb-4">
            Documento oficial para compartilhar com as equipes.
          </p>
          <span className="text-[10px] text-[var(--gray)]">Abre em nova aba ↗</span>
        </a>
      </div>
    </div>
  )
}
