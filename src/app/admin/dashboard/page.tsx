import { prisma } from '@/lib/db'
import Link from 'next/link'
import { StatCard } from '@/components/StatCard'
import { ChampionshipCard } from '@/components/ChampionshipCard'
import {
  AlertTriangle,
  ArrowRight,
  Calendar,
  CheckCircle2,
  Clock,
  Flag,
  ShieldCheck,
  Trophy,
  Users,
  UserCheck,
  Building2,
  DollarSign,
  Send,
  RotateCcw,
  Radio,
  FileCheck,
} from 'lucide-react'

export const dynamic = 'force-dynamic'

function formatDate(date: Date | null) {
  if (!date) return 'Sem prazo'
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}

export default async function FederationDashboardPage() {
  try {
    const [activeChampionships, pendingAthletes, totalActiveAthletes, pendingRosters] = await Promise.all([
      prisma.championship.findMany({
        where: { status: { not: 'ARCHIVED' } },
        include: {
          _count: {
            select: {
              registrations: { where: { status: 'CONFIRMED' } },
              games: true,
            },
          },
        },
      }),
      prisma.athlete.count({ where: { situation: 'PENDING' } }).catch(() => 0),
      prisma.athlete.count({ where: { situation: 'ACTIVE' } }).catch(() => 0),
      prisma.officialRoster.count({ where: { status: 'SUBMITTED' } }).catch(() => 0),
    ])

    const totalActive = activeChampionships.length
    const totalTeams = activeChampionships.reduce((acc, curr) => acc + curr._count.registrations, 0)
    const totalGames = activeChampionships.reduce((acc, curr) => acc + curr._count.games, 0)

    const finishedGames = await prisma.game.count({
      where: {
        championship: { status: { not: 'ARCHIVED' } },
        status: 'FINISHED',
      },
    })

    const statusCounts = activeChampionships.reduce((acc, curr) => {
      acc[curr.status] = (acc[curr.status] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const featuredChampionships = await prisma.championship.findMany({
      where: { status: { in: ['ONGOING', 'REGISTRATION_OPEN', 'REGISTRATION_CLOSED', 'ORGANIZING'] } },
      orderBy: { createdAt: 'desc' },
      take: 3,
      include: {
        categories: { select: { id: true, name: true } },
        _count: {
          select: {
            registrations: { where: { status: 'CONFIRMED' } },
            games: true,
          },
        },
      },
    })

    const pendingRegistrations = await prisma.registration.count({
      where: {
        status: 'PENDING',
        championship: { status: { not: 'ARCHIVED' } },
      },
    })

    // Fase 7 — KPIs por lifecycleState (Fases 1 e 6)
    const [
      regSubmitted,
      regUnderReview,
      regRecentRejected,
      gameLive,
      gameUnderReview,
      gameRecentConfirmed,
    ] = await Promise.all([
      prisma.registration.count({
        where: { lifecycleState: 'SUBMITTED', championship: { status: { not: 'ARCHIVED' } } },
      }).catch(() => 0),
      prisma.registration.count({
        where: { lifecycleState: 'UNDER_REVIEW', championship: { status: { not: 'ARCHIVED' } } },
      }).catch(() => 0),
      prisma.registration.count({
        where: {
          lifecycleState: 'REJECTED',
          rejectedAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        },
      }).catch(() => 0),
      prisma.game.count({
        where: { lifecycleState: 'LIVE' },
      }).catch(() => 0),
      prisma.game.count({
        where: { lifecycleState: 'UNDER_REVIEW' },
      }).catch(() => 0),
      prisma.game.count({
        where: { lifecycleState: 'CONFIRMED' },
      }).catch(() => 0),
    ])

    const closingSoon = await prisma.championship.findMany({
      where: {
        status: 'REGISTRATION_OPEN',
        regDeadline: { lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
      },
      select: { id: true, name: true, regDeadline: true },
      orderBy: { regDeadline: 'asc' },
      take: 3,
    })

    const gamesMissingVenue = await prisma.game.count({
      where: {
        status: 'SCHEDULED',
        championship: { status: { not: 'ARCHIVED' } },
        OR: [{ venue: null }, { venue: '' }],
      },
    })

    const finishedWithoutScore = await prisma.game.count({
      where: {
        status: 'FINISHED',
        championship: { status: { not: 'ARCHIVED' } },
        OR: [{ homeScore: null }, { awayScore: null }],
      },
    })

    const operationalIssues = pendingRegistrations + closingSoon.length + gamesMissingVenue + finishedWithoutScore
    const gameProgress = totalGames > 0 ? Math.round((finishedGames / totalGames) * 100) : 0
    const activeNow = (statusCounts.ONGOING || 0) + (statusCounts.ACTIVE || 0)

    const actionCards = [
      {
        label: 'Validar inscricoes',
        value: pendingRegistrations,
        detail: pendingRegistrations === 1 ? 'equipe aguardando decisao' : 'equipes aguardando decisao',
        href: '/admin/championships',
        tone: 'red',
      },
      {
        label: 'Prazos nesta semana',
        value: closingSoon.length,
        detail: closingSoon.length === 0 ? 'nenhum campeonato em risco' : `${closingSoon[0].name} ate ${formatDate(closingSoon[0].regDeadline)}`,
        href: '/admin/championships',
        tone: 'yellow',
      },
      {
        label: 'Jogos sem local',
        value: gamesMissingVenue,
        detail: 'partidas precisam de ginasio definido',
        href: '/admin/championships',
        tone: 'orange',
      },
      {
        label: 'Resultados incompletos',
        value: finishedWithoutScore,
        detail: 'sumulas precisam ser revisadas',
        href: '/admin/championships',
        tone: 'green',
      },
    ]

    return (
      <div className="space-y-8 pb-10">
        <section className="relative overflow-hidden rounded-[36px] border border-[var(--border)] bg-[var(--black)] p-6 text-white shadow-premium md:p-8">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(245,194,0,0.22),transparent_32%),radial-gradient(circle_at_bottom_left,rgba(27,115,64,0.34),transparent_34%)]" />
          <div className="pointer-events-none absolute right-8 top-8 hidden h-28 w-28 rounded-full border border-white/10 md:block" />

          <div className="relative grid gap-8 lg:grid-cols-[1fr_340px] lg:items-end">
            <div className="max-w-3xl">
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-[var(--yellow)]">
                  Central de comando
                </span>
                <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-white/70">
                  {operationalIssues === 0 ? 'Operacao estavel' : `${operationalIssues} pontos de atencao`}
                </span>
              </div>
              <h1 className="fgb-display max-w-4xl text-4xl leading-none text-white md:text-6xl">
                Painel da Federacao
              </h1>
              <p className="mt-4 max-w-2xl text-sm font-medium leading-6 text-white/68">
                Uma visao executiva para decidir rapido: campeonatos ativos, gargalos de inscricao,
                organizacao de jogos e pendencias que podem travar a temporada.
              </p>
            </div>

            <div className="rounded-[28px] border border-white/12 bg-white/10 p-5 backdrop-blur">
              <div className="mb-4 flex items-center justify-between">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/55">Saude operacional</p>
                {operationalIssues === 0 ? (
                  <CheckCircle2 className="h-5 w-5 text-[var(--yellow)]" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-[var(--yellow)]" />
                )}
              </div>
              <p className="fgb-display text-5xl leading-none text-white">
                {operationalIssues === 0 ? 'OK' : operationalIssues}
              </p>
              <p className="mt-2 text-xs font-semibold leading-5 text-white/62">
                {operationalIssues === 0
                  ? 'Nenhuma pendencia critica encontrada no momento.'
                  : 'Resolva primeiro inscricoes, prazos e jogos sem local.'}
              </p>
              <Link
                href="/admin/championships"
                className="mt-5 inline-flex h-11 items-center gap-2 rounded-2xl bg-[var(--yellow)] px-5 text-[10px] font-black uppercase tracking-widest text-[var(--black)] transition-all hover:-translate-y-0.5 hover:shadow-lg"
              >
                Abrir campeonatos
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </section>

        {/* FASE 7 — Lifecycle FGB (state machine das Fases 1 e 6) */}
        <section>
          <div className="mb-3 flex items-baseline gap-3">
            <p className="fgb-label text-[var(--verde)]" style={{ fontSize: 10 }}>
              Lifecycle FGB
            </p>
            <p className="text-xs text-[var(--gray)]">
              estado atual do ciclo de vida de jogos e inscrições
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
            <LifecycleKpi
              label="Inscrições novas"
              count={regSubmitted}
              tone={regSubmitted > 0 ? 'warning' : 'ok'}
              icon={<Send className="h-4 w-4" />}
              href="/admin/registrations"
              subtitle="SUBMITTED · aguardando admin"
            />
            <LifecycleKpi
              label="Em análise"
              count={regUnderReview}
              tone={regUnderReview > 0 ? 'warning' : 'ok'}
              icon={<RotateCcw className="h-4 w-4" />}
              href="/admin/registrations"
              subtitle="UNDER_REVIEW · em revisão FGB"
            />
            <LifecycleKpi
              label="Recusadas (7d)"
              count={regRecentRejected}
              tone={regRecentRejected > 0 ? 'error' : 'neutral'}
              icon={<AlertTriangle className="h-4 w-4" />}
              href="/admin/registrations"
              subtitle="REJECTED · últimos 7 dias"
            />
            <LifecycleKpi
              label="Jogos ao vivo"
              count={gameLive}
              tone={gameLive > 0 ? 'live' : 'neutral'}
              icon={<Radio className="h-4 w-4" />}
              href="/admin/championships"
              subtitle="LIVE · em andamento agora"
            />
            <LifecycleKpi
              label="Súmulas em revisão"
              count={gameUnderReview}
              tone={gameUnderReview > 0 ? 'warning' : 'ok'}
              icon={<FileCheck className="h-4 w-4" />}
              href="/admin/championships"
              subtitle="UNDER_REVIEW · correção solicitada"
            />
            <LifecycleKpi
              label="Confirmadas"
              count={gameRecentConfirmed}
              tone="ok"
              icon={<CheckCircle2 className="h-4 w-4" />}
              href="/admin/championships"
              subtitle="CONFIRMED · prontas para publicar"
            />
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Campeonatos ativos"
            value={totalActive}
            sublabel={`${activeNow} em andamento agora`}
            accent="verde"
            icon={<Trophy className="h-5 w-5" />}
          />
          <StatCard
            label="Equipes confirmadas"
            value={totalTeams}
            sublabel="base competitiva validada"
            accent="yellow"
            icon={<Users className="h-5 w-5" />}
          />
          <StatCard
            label="Calendario geral"
            value={totalGames}
            sublabel={`${gameProgress}% dos jogos realizados`}
            accent="red"
            icon={<Calendar className="h-5 w-5" />}
          />
          <StatCard
            label="Sumulas integradas"
            value={finishedGames}
            sublabel="resultados ja processados"
            accent="orange"
            icon={<Flag className="h-5 w-5" />}
          />
        </section>

        {/* KPIs BID — linha 2 */}
        <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Link href="/admin/athletes?situation=PENDING"
            className="group flex items-center gap-4 rounded-[20px] border border-[var(--border)] bg-white p-5 shadow-sm hover:border-[var(--yellow)] transition-all">
            <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${pendingAthletes > 0 ? 'bg-[var(--yellow)]/20 text-[var(--black)]' : 'bg-[var(--gray-l)] text-[var(--gray)]'}`}>
              <UserCheck className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-[var(--gray)]">Atletas Pendentes</p>
                {pendingAthletes > 0 && (
                  <span className="rounded-full bg-[var(--yellow)] px-2 py-0.5 text-[9px] font-black text-[var(--black)]">{pendingAthletes}</span>
                )}
              </div>
              <p className="fgb-display text-2xl text-[var(--black)]">{pendingAthletes}</p>
              <p className="text-[10px] text-[var(--gray)]">{totalActiveAthletes} ativos na base</p>
            </div>
            <ArrowRight className="h-4 w-4 text-[var(--gray)] group-hover:translate-x-1 transition-transform" />
          </Link>

          <Link href="/admin/championships"
            className="group flex items-center gap-4 rounded-[20px] border border-[var(--border)] bg-white p-5 shadow-sm hover:border-[var(--verde)] transition-all">
            <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${pendingRosters > 0 ? 'bg-[var(--verde)]/10 text-[var(--verde)]' : 'bg-[var(--gray-l)] text-[var(--gray)]'}`}>
              <Building2 className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <p className="text-[10px] font-black uppercase tracking-widest text-[var(--gray)]">Listagens p/ Aprovar</p>
              <p className="fgb-display text-2xl text-[var(--black)]">{pendingRosters}</p>
              <p className="text-[10px] text-[var(--gray)]">submetidas aguardando aprovação</p>
            </div>
            <ArrowRight className="h-4 w-4 text-[var(--gray)] group-hover:translate-x-1 transition-transform" />
          </Link>

          <Link href="/admin/fees"
            className="group flex items-center gap-4 rounded-[20px] border border-[var(--border)] bg-white p-5 shadow-sm hover:border-[var(--verde)] transition-all">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--gray-l)] text-[var(--gray)]">
              <DollarSign className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <p className="text-[10px] font-black uppercase tracking-widest text-[var(--gray)]">Taxas de Clube</p>
              <p className="fgb-display text-2xl text-[var(--black)]">Temp. 2026</p>
              <p className="text-[10px] text-[var(--gray)]">gestão financeira básica</p>
            </div>
            <ArrowRight className="h-4 w-4 text-[var(--gray)] group-hover:translate-x-1 transition-transform" />
          </Link>
        </section>

        <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_360px]">
          <div className="rounded-[28px] border border-[var(--border)] bg-white p-6 shadow-sm md:p-7">
            <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="fgb-label text-[var(--red)]" style={{ fontSize: 10 }}>Prioridades da rodada</p>
                <h2 className="fgb-display mt-2 text-2xl leading-none text-[var(--black)]">
                  O que precisa de acao
                </h2>
              </div>
              <p className="max-w-sm text-xs font-medium leading-5 text-[var(--gray)]">
                Cards curtos substituem listas longas: cada bloco mostra uma pendencia e o proximo caminho.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {actionCards.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="group rounded-[22px] border border-[var(--border)] bg-[var(--gray-l)] p-5 transition-all hover:-translate-y-1 hover:border-[var(--yellow)] hover:bg-white hover:shadow-md"
                >
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[var(--gray)]">
                      {item.label}
                    </p>
                    <span className={`h-2.5 w-2.5 rounded-full ${
                      item.tone === 'red' ? 'bg-[var(--red)]' :
                      item.tone === 'yellow' ? 'bg-[var(--yellow)]' :
                      item.tone === 'orange' ? 'bg-[var(--orange)]' :
                      'bg-[var(--verde)]'
                    }`} />
                  </div>
                  <div className="flex items-end justify-between gap-4">
                    <div>
                      <p className="fgb-display text-4xl leading-none text-[var(--black)]">{item.value}</p>
                      <p className="mt-2 text-xs font-semibold leading-5 text-[var(--gray)]">{item.detail}</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-[var(--gray)] transition-transform group-hover:translate-x-1 group-hover:text-[var(--black)]" />
                  </div>
                </Link>
              ))}
            </div>
          </div>

          <div className="rounded-[28px] border border-[var(--border)] bg-white p-6 shadow-sm md:p-7">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--verde)]/10 text-[var(--verde)]">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <p className="fgb-label text-[var(--gray)]" style={{ fontSize: 9 }}>Distribuicao por etapa</p>
                <h2 className="fgb-display text-xl leading-none text-[var(--black)]">Status da temporada</h2>
              </div>
            </div>

            <div className="space-y-3">
              {[
                { label: 'Rascunho', count: statusCounts.DRAFT || 0, color: 'bg-slate-300' },
                { label: 'Inscricoes abertas', count: statusCounts.REGISTRATION_OPEN || 0, color: 'bg-[var(--yellow)]' },
                { label: 'Organizacao', count: statusCounts.ORGANIZING || 0, color: 'bg-[var(--orange)]' },
                { label: 'Em andamento', count: activeNow, color: 'bg-[var(--verde)]' },
                { label: 'Encerrados', count: statusCounts.FINISHED || 0, color: 'bg-[var(--red)]' },
              ].map((item) => (
                <div key={item.label} className="rounded-2xl border border-[var(--border)] bg-[var(--gray-l)] px-4 py-3">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-[0.16em] text-[var(--gray)]">{item.label}</span>
                    <span className="text-sm font-black text-[var(--black)]">{item.count}</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-white">
                    <div
                      className={`h-full rounded-full ${item.color}`}
                      style={{ width: `${totalActive > 0 ? Math.max(6, Math.round((item.count / totalActive) * 100)) : 0}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {featuredChampionships.length > 0 && (
          <section className="space-y-5">
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="fgb-label text-[var(--verde)]" style={{ fontSize: 10 }}>Operacao ativa</p>
                <h2 className="fgb-display mt-2 text-2xl leading-none text-[var(--black)]">
                  Campeonatos para acompanhar
                </h2>
              </div>
              <Link
                href="/admin/championships"
                className="inline-flex items-center gap-2 self-start rounded-full border border-[var(--border)] bg-white px-4 py-2 text-[10px] font-black uppercase tracking-widest text-[var(--black)] transition-all hover:border-[var(--yellow)] hover:bg-[var(--yellow)]"
              >
                Ver todos
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
              {featuredChampionships.map((championship) => (
                <ChampionshipCard
                  key={championship.id}
                  id={championship.id}
                  name={championship.name}
                  year={championship.year}
                  status={championship.status}
                  categories={championship.categories}
                  teamCount={championship._count.registrations}
                  gameCount={championship._count.games}
                  href={`/admin/championships/${championship.id}`}
                />
              ))}
            </div>
          </section>
        )}

        <section className="rounded-[28px] border border-dashed border-[var(--border)] bg-white/70 p-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-[var(--gray)]" />
              <p className="text-xs font-semibold leading-5 text-[var(--gray)]">
                Menos atalhos soltos, mais fluxo: relatorios, ranking e arbitragem continuam acessiveis por URL,
                mas saem da navegacao principal ate terem valor operacional claro.
              </p>
            </div>
            <Link href="/admin/financeiro/taxas" className="text-[10px] font-black uppercase tracking-widest text-[var(--verde)] hover:underline">
              Revisar taxas
            </Link>
          </div>
        </section>
      </div>
    )
  } catch (error: any) {
    console.error('Dashboard Global Error:', error)
    return (
      <div className="fgb-card admin-card-red p-20 text-center">
        <h2 className="fgb-display mb-2 text-2xl text-[var(--black)]">Erro ao carregar Dashboard Executivo</h2>
        <p className="fgb-label mb-6 font-mono text-[var(--gray)]" style={{ textTransform: 'none', letterSpacing: 0 }}>
          {error.message}
        </p>
      </div>
    )
  }
}

// ─────────────── Lifecycle KPI card (Fase 7) ───────────────

function LifecycleKpi({
  label,
  count,
  subtitle,
  icon,
  href,
  tone,
}: {
  label: string
  count: number
  subtitle: string
  icon: React.ReactNode
  href: string
  tone: 'ok' | 'warning' | 'error' | 'live' | 'neutral'
}) {
  const accent =
    tone === 'ok' ? 'var(--fgb-green-700)' :
    tone === 'warning' ? 'var(--fgb-yellow-700)' :
    tone === 'error' ? 'var(--fgb-red-600)' :
    tone === 'live' ? 'var(--fgb-red-500)' :
    'var(--fgb-ink-500)'

  const bgIcon =
    tone === 'ok' ? 'var(--fgb-green-50)' :
    tone === 'warning' ? 'var(--fgb-yellow-50)' :
    tone === 'error' ? 'var(--fgb-red-50)' :
    tone === 'live' ? 'var(--fgb-red-50)' :
    'var(--fgb-ink-50)'

  return (
    <Link
      href={href}
      className="group relative overflow-hidden rounded-2xl border bg-white p-4 transition-all hover:-translate-y-0.5 hover:shadow-md"
      style={{ borderColor: 'var(--fgb-ink-200)' }}
    >
      <div className="mb-3 flex items-center justify-between">
        <span
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg"
          style={{ background: bgIcon, color: accent }}
        >
          {icon}
        </span>
        {tone === 'live' && count > 0 && (
          <span
            className="inline-flex h-2 w-2 rounded-full"
            style={{ background: 'var(--fgb-red-500)', animation: 'fgb-pulse 1.4s ease-in-out infinite' }}
            aria-hidden
          />
        )}
      </div>
      <div
        className="tabular-nums"
        style={{
          fontFamily: 'var(--font-anton)',
          fontSize: 28,
          lineHeight: 1,
          color: accent,
        }}
      >
        {count}
      </div>
      <p
        className="fgb-label mt-2"
        style={{ fontSize: 9, color: 'var(--fgb-ink-700)', letterSpacing: '0.16em' }}
      >
        {label}
      </p>
      <p
        className="mt-1 text-xs"
        style={{ color: 'var(--fgb-ink-400)', lineHeight: 1.4 }}
      >
        {subtitle}
      </p>
    </Link>
  )
}
