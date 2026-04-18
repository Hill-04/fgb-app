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

const OFFICIAL_FLOW = [
  {
    step: '01',
    segment: 'roster',
    title: 'Roster',
    description: 'Pre-jogo, atletas elegiveis, oficiais e travamento de roster.',
    status: 'Base da partida',
    icon: ClipboardList,
  },
  {
    step: '02',
    segment: 'stats',
    title: 'Stats',
    description: 'Leitura consolidada por atleta e por equipe durante e apos a operacao.',
    status: 'Consolidado automatico',
    icon: BarChart3,
  },
  {
    step: '03',
    segment: 'live',
    title: 'Live',
    description: 'Mesa oficial com eventos, placar, play-by-play e sincronizacao do jogo.',
    status: 'Operacao em quadra',
    icon: Activity,
  },
  {
    step: '04',
    segment: 'encerramento',
    title: 'Encerramento',
    description: 'Checklist final da partida e fechamento oficial do jogo.',
    status: 'Validacao final',
    icon: ShieldCheck,
  },
  {
    step: '05',
    segment: 'sumula',
    title: 'Sumula',
    description: 'Documento oficial consolidado com box score e saida final da partida.',
    status: 'Documento oficial',
    icon: FileText,
  },
  {
    step: '06',
    segment: 'auditoria',
    title: 'Auditoria',
    description: 'Historico tecnico, eventos e trilha de operacao da mesa.',
    status: 'Rastreabilidade',
    icon: Gavel,
  },
] as const

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
  const officialCycleStatus =
    game.status === 'FINISHED'
      ? 'Jogo finalizado e pronto para conferencia oficial.'
      : game.status === 'LIVE'
        ? 'Jogo em operacao. O fluxo oficial segue de live para encerramento, sumula e auditoria.'
        : 'Use o ciclo oficial abaixo para operar o jogo do inicio ao fim dentro do campeonato.'

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
          {scheduledAt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} ·{' '}
          {game.venue || 'Local a definir'}
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <div className="inline-flex rounded-full border border-[var(--border)] bg-[var(--gray-l)] px-3 py-1 text-[9px] font-black uppercase tracking-widest text-[var(--gray)]">
            {eventsCount} evento(s) live registrado(s)
          </div>
          <div className="inline-flex rounded-full bg-[var(--verde)]/10 px-3 py-1 text-[9px] font-black uppercase tracking-widest text-[var(--verde)]">
            Ciclo oficial do jogo ativo
          </div>
        </div>
      </div>

      <div className="rounded-[28px] border border-[var(--border)] bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="fgb-label text-[var(--verde)]">Fluxo Canônico da Partida</p>
            <h2 className="mt-2 fgb-display text-3xl leading-none text-[var(--black)]">
              Operacao oficial do jogo dentro do campeonato
            </h2>
            <p className="mt-3 max-w-3xl text-sm text-[var(--gray)]">{officialCycleStatus}</p>
          </div>
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--gray-l)] px-4 py-3 text-xs text-[var(--gray)]">
            Ordem oficial: Roster → Stats → Live → Encerramento → Sumula → Auditoria
          </div>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {OFFICIAL_FLOW.map((item) => {
          const Icon = item.icon

          return (
            <Link
              key={item.segment}
              href={buildChampionshipGamePath(championshipId, gameId, item.segment)}
              className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm transition-all hover:border-[var(--verde)] hover:-translate-y-0.5"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2 text-[var(--black)]">
                  <Icon className="h-4 w-4" />
                  <p className="text-[10px] font-black uppercase tracking-widest">
                    Etapa {item.step}
                  </p>
                </div>
                <span className="rounded-full bg-[var(--gray-l)] px-2 py-1 text-[9px] font-black uppercase tracking-widest text-[var(--gray)]">
                  {item.status}
                </span>
              </div>
              <h3 className="mt-4 text-lg font-black text-[var(--black)]">{item.title}</h3>
              <p className="mt-2 text-sm text-[var(--gray)]">{item.description}</p>
            </Link>
          )
        })}
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
