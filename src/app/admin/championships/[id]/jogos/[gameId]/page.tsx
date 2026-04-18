import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  Activity,
  ArrowLeft,
  BarChart3,
  ClipboardList,
  FileText,
  Gavel,
  Globe,
  ShieldCheck,
} from 'lucide-react'
import { prisma } from '@/lib/db'
import { buildChampionshipGamePath } from '@/lib/admin-game-routing'

export default async function ChampionshipGameHubPage({
  params,
}: {
  params: Promise<{ id: string; gameId: string }>
}) {
  const { id: championshipId, gameId } = await params

  const [game, eventsCount] = await Promise.all([
    prisma.game.findFirst({
      where: { id: gameId, championshipId },
      include: {
        championship: { select: { name: true } },
        category: { select: { name: true } },
        homeTeam: { select: { name: true } },
        awayTeam: { select: { name: true } },
      },
    }),
    prisma.gameEvent.count({ where: { gameId } }),
  ])

  if (!game) notFound()

  const gameStatusLabel: Record<string, string> = {
    SCHEDULED: 'Agendado',
    LIVE: 'Ao vivo',
    FINISHED: 'Finalizado',
    CANCELLED: 'Cancelado',
    POSTPONED: 'Adiado',
  }

  const scheduledAt = new Date(game.dateTime)

  return (
    <div className="mx-auto max-w-[1100px] space-y-6 pb-10">
      <Link
        href={`/admin/championships/${championshipId}/jogos`}
        className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[var(--gray)] hover:text-[var(--black)]"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar para Jogos do Campeonato
      </Link>

      <div className="rounded-[28px] border border-[var(--border)] bg-white p-6 shadow-sm">
        <p className="fgb-label text-[var(--gray)]">
          {game.championship.name} · {game.category.name}
        </p>
        <h1 className="mt-2 fgb-display text-4xl leading-none text-[var(--black)]">
          {game.homeTeam.name}{' '}
          <span className="text-[var(--verde)]">{game.homeScore ?? '-'}</span> ×{' '}
          <span className="text-[var(--verde)]">{game.awayScore ?? '-'}</span>{' '}
          {game.awayTeam.name}
        </h1>
        <p className="mt-3 text-sm text-[var(--gray)]">
          {gameStatusLabel[game.status] || game.status} · {scheduledAt.toLocaleDateString('pt-BR')} ·{' '}
          {scheduledAt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} · {game.venue || 'Local a definir'}
        </p>
        <div className="mt-4 inline-flex rounded-full border border-[var(--border)] bg-[var(--gray-l)] px-3 py-1 text-[9px] font-black uppercase tracking-widest text-[var(--gray)]">
          {eventsCount} evento(s) live registrado(s)
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        <Link
          href={buildChampionshipGamePath(championshipId, gameId, 'roster')}
          className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm transition-all hover:border-[var(--verde)]"
        >
          <div className="flex items-center gap-2 text-[var(--black)]">
            <ClipboardList className="h-4 w-4" />
            <p className="text-[10px] font-black uppercase tracking-widest">Roster</p>
          </div>
          <p className="mt-2 text-sm text-[var(--gray)]">Pré-jogo, atletas elegíveis e travamento.</p>
        </Link>

        <Link
          href={buildChampionshipGamePath(championshipId, gameId, 'stats')}
          className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm transition-all hover:border-[var(--verde)]"
        >
          <div className="flex items-center gap-2 text-[var(--black)]">
            <BarChart3 className="h-4 w-4" />
            <p className="text-[10px] font-black uppercase tracking-widest">Stats</p>
          </div>
          <p className="mt-2 text-sm text-[var(--gray)]">Consolidados por atleta e por equipe.</p>
        </Link>

        <Link
          href={buildChampionshipGamePath(championshipId, gameId, 'live')}
          className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm transition-all hover:border-[var(--verde)]"
        >
          <div className="flex items-center gap-2 text-[var(--black)]">
            <Activity className="h-4 w-4" />
            <p className="text-[10px] font-black uppercase tracking-widest">Live Scout</p>
          </div>
          <p className="mt-2 text-sm text-[var(--gray)]">Operação de mesa com eventos e placar automático.</p>
        </Link>

        <Link
          href={buildChampionshipGamePath(championshipId, gameId, 'encerramento')}
          className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm transition-all hover:border-[var(--verde)]"
        >
          <div className="flex items-center gap-2 text-[var(--black)]">
            <ShieldCheck className="h-4 w-4" />
            <p className="text-[10px] font-black uppercase tracking-widest">Encerramento</p>
          </div>
          <p className="mt-2 text-sm text-[var(--gray)]">Checklist final e fechamento oficial da partida.</p>
        </Link>

        <Link
          href={buildChampionshipGamePath(championshipId, gameId, 'sumula')}
          className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm transition-all hover:border-[var(--verde)]"
        >
          <div className="flex items-center gap-2 text-[var(--black)]">
            <FileText className="h-4 w-4" />
            <p className="text-[10px] font-black uppercase tracking-widest">Súmula</p>
          </div>
          <p className="mt-2 text-sm text-[var(--gray)]">Relatório consolidado e saída oficial da partida.</p>
        </Link>

        <Link
          href={buildChampionshipGamePath(championshipId, gameId, 'auditoria')}
          className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm transition-all hover:border-[var(--verde)]"
        >
          <div className="flex items-center gap-2 text-[var(--black)]">
            <Gavel className="h-4 w-4" />
            <p className="text-[10px] font-black uppercase tracking-widest">Auditoria</p>
          </div>
          <p className="mt-2 text-sm text-[var(--gray)]">Eventos e trilha técnica da operação de mesa.</p>
        </Link>
      </div>

      <div className="flex flex-wrap gap-3">
        <Link
          href={`/games/${gameId}/live`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] bg-white px-4 py-2 text-[10px] font-black uppercase tracking-widest text-[var(--black)]"
        >
          <Globe className="h-4 w-4" />
          Ver Live Público
        </Link>
      </div>
    </div>
  )
}
