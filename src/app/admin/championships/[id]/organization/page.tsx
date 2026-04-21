import { prisma } from '@/lib/db'
import Link from 'next/link'
import {
  AlertTriangle,
  ArrowRight,
  Calendar,
  CheckCircle2,
  ShieldCheck,
  Sparkles,
  Target,
  Users,
} from 'lucide-react'
import { OrganizationPlannerClient } from './OrganizationPlannerClient'

export default async function OrganizationPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const championship = await prisma.championship.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      status: true,
      minTeamsPerCat: true,
      hasPlayoffs: true,
      startDate: true,
      endDate: true,
    },
  })

  const categoriesWithTeams = await prisma.championshipCategory.findMany({
    where: { championshipId: id },
    include: {
      _count: {
        select: {
          registrations: {
            where: { registration: { status: 'CONFIRMED' } },
          },
        },
      },
      games: {
        where: { phase: 1 },
        take: 1,
        select: { id: true },
      },
    },
    orderBy: { name: 'asc' },
  })

  if (!championship) return <div>Campeonato nao encontrado</div>

  const minTeams = championship.minTeamsPerCat || 3
  const categoriesReady = categoriesWithTeams.filter((cat) => cat._count.registrations >= minTeams)
  const categoriesMissing = categoriesWithTeams.filter((cat) => cat._count.registrations < minTeams)
  const categoriesOrganized = categoriesWithTeams.filter((cat) => cat.games.length > 0)
  const hasAnyReady = categoriesReady.length > 0
  const readinessScore = categoriesWithTeams.length > 0
    ? Math.round((categoriesReady.length / categoriesWithTeams.length) * 100)
    : 0
  const totalConfirmedTeams = categoriesWithTeams.reduce((acc, cat) => acc + cat._count.registrations, 0)
  const totalMissingTeams = categoriesMissing.reduce(
    (acc, cat) => acc + Math.max(0, minTeams - cat._count.registrations),
    0
  )

  const startLabel = championship.startDate
    ? championship.startDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
    : 'sem inicio'
  const endLabel = championship.endDate
    ? championship.endDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
    : 'sem fim'

  return (
    <div className="space-y-8 pb-10">
      <section className="relative overflow-hidden rounded-[36px] border border-[var(--border)] bg-white p-6 shadow-sm md:p-8">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(245,194,0,0.18),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(27,115,64,0.13),transparent_32%)]" />

        <div className="relative grid gap-8 xl:grid-cols-[1fr_360px] xl:items-end">
          <div>
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-[var(--verde)] px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-white">
                Organizacao IA
              </span>
              <span className="rounded-full border border-[var(--border)] bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-[var(--gray)]">
                {startLabel} - {endLabel}
              </span>
            </div>
            <h1 className="fgb-display max-w-4xl text-4xl leading-none text-[var(--black)] md:text-6xl">
              Centro de organizacao do campeonato
            </h1>
            <p className="mt-4 max-w-2xl text-sm font-medium leading-6 text-[var(--gray)]">
              Antes de gerar jogos, a tela mostra se cada categoria esta pronta, o que ainda falta
              e qual acao destrava a proxima etapa.
            </p>
          </div>

          <div className="rounded-[30px] border border-[var(--border)] bg-[var(--black)] p-5 text-white shadow-premium">
            <div className="mb-5 flex items-center justify-between">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/55">Prontidao</p>
              <Target className="h-5 w-5 text-[var(--yellow)]" />
            </div>
            <div className="flex items-end gap-2">
              <p className="fgb-display text-6xl leading-none text-white">{readinessScore}</p>
              <p className="mb-2 text-xl font-black text-[var(--yellow)]">%</p>
            </div>
            <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/12">
              <div className="h-full rounded-full bg-[var(--yellow)]" style={{ width: `${readinessScore}%` }} />
            </div>
            <p className="mt-4 text-xs font-semibold leading-5 text-white/65">
              {hasAnyReady
                ? `${categoriesReady.length} de ${categoriesWithTeams.length} categorias prontas para planejamento.`
                : `Faltam ${totalMissingTeams} equipe(s) para liberar a primeira organizacao.`}
            </p>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-[24px] border border-[var(--border)] bg-white p-5 shadow-sm">
          <p className="fgb-label text-[var(--gray)]" style={{ fontSize: 9 }}>Categorias prontas</p>
          <p className="fgb-display mt-4 text-4xl leading-none text-[var(--black)]">{categoriesReady.length}</p>
        </div>
        <div className="rounded-[24px] border border-[var(--border)] bg-white p-5 shadow-sm">
          <p className="fgb-label text-[var(--gray)]" style={{ fontSize: 9 }}>Equipes confirmadas</p>
          <p className="fgb-display mt-4 text-4xl leading-none text-[var(--black)]">{totalConfirmedTeams}</p>
        </div>
        <div className="rounded-[24px] border border-[var(--border)] bg-white p-5 shadow-sm">
          <p className="fgb-label text-[var(--gray)]" style={{ fontSize: 9 }}>Minimo por categoria</p>
          <p className="fgb-display mt-4 text-4xl leading-none text-[var(--black)]">{minTeams}</p>
        </div>
        <div className="rounded-[24px] border border-[var(--border)] bg-white p-5 shadow-sm">
          <p className="fgb-label text-[var(--gray)]" style={{ fontSize: 9 }}>Ja organizadas</p>
          <p className="fgb-display mt-4 text-4xl leading-none text-[var(--black)]">{categoriesOrganized.length}</p>
        </div>
      </section>

      {!hasAnyReady && (
        <section className="rounded-[28px] border border-orange-200 bg-orange-50 p-6 shadow-sm md:p-7">
          <div className="flex flex-col gap-5 md:flex-row md:items-center">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-orange-200 bg-white">
              <AlertTriangle className="h-6 w-6 text-orange-600" />
            </div>
            <div className="flex-1">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-700">
                Acao requerida
              </p>
              <h2 className="mt-2 text-lg font-black text-[var(--black)]">Ainda nao ha categoria viavel</h2>
              <p className="mt-1 text-sm font-medium leading-6 text-orange-800/75">
                Confirme mais equipes antes de usar a IA. O sistema precisa de ao menos {minTeams}
                equipes em uma categoria para montar confrontos com seguranca.
              </p>
            </div>
            <Link
              href={`/admin/championships/${id}/registrations`}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-white px-5 text-[10px] font-black uppercase tracking-widest text-[var(--black)] shadow-sm transition-all hover:-translate-y-0.5 hover:bg-[var(--yellow)]"
            >
              Gerenciar inscricoes
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </section>
      )}

      {hasAnyReady && categoriesMissing.length > 0 && (
        <section className="rounded-[28px] border border-[var(--border)] bg-white p-6 shadow-sm md:p-7">
          <div className="flex flex-col gap-5 md:flex-row md:items-center">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--gray-l)]">
              <Sparkles className="h-6 w-6 text-[var(--verde)]" />
            </div>
            <div className="flex-1">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--verde)]">
                Organizacao parcial liberada
              </p>
              <h2 className="mt-2 text-lg font-black text-[var(--black)]">A IA vai planejar somente o que esta pronto</h2>
              <p className="mt-1 text-sm font-medium leading-6 text-[var(--gray)]">
                Categorias pendentes continuam visiveis no painel, sem bloquear as categorias que ja atingiram o minimo.
              </p>
            </div>
            <Link
              href={`/admin/championships/${id}/registrations`}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-[var(--border)] bg-[var(--gray-l)] px-5 text-[10px] font-black uppercase tracking-widest text-[var(--black)] transition-all hover:border-[var(--yellow)] hover:bg-[var(--yellow)]"
            >
              Ver pendencias
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </section>
      )}

      {hasAnyReady && (
        <section className="space-y-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="fgb-label text-[var(--verde)]" style={{ fontSize: 10 }}>Planejamento com IA</p>
              <h2 className="fgb-display mt-2 text-3xl leading-none text-[var(--black)]">Gerar tabela de jogos</h2>
              <p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-[var(--gray)]">
                Use quando as inscricoes ja estiverem validadas. Depois de aplicar o calendario,
                os ajustes finos ficam na tela de jogos.
              </p>
            </div>
            <Link
              href={`/admin/championships/${id}/jogos`}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-[var(--border)] bg-white px-5 text-[10px] font-black uppercase tracking-widest text-[var(--black)] transition-all hover:border-[var(--yellow)] hover:bg-[var(--yellow)]"
            >
              Ajustar manualmente
              <Calendar className="h-3.5 w-3.5" />
            </Link>
          </div>

          <OrganizationPlannerClient
            championshipId={id}
            championshipName={championship.name}
          />
        </section>
      )}

      <section className="space-y-4">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="fgb-label text-[var(--gray)]" style={{ fontSize: 10 }}>Mapa de categorias</p>
            <h2 className="fgb-display mt-2 text-2xl leading-none text-[var(--black)]">Prontidao por categoria</h2>
          </div>
          <p className="text-xs font-semibold leading-5 text-[var(--gray)]">
            Verde: pronta ou organizada. Amarelo: precisa de inscricoes.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {categoriesWithTeams.map((cat) => {
            const count = cat._count.registrations
            const ready = count >= minTeams
            const hasGames = cat.games.length > 0
            const pct = Math.min(100, Math.round((count / minTeams) * 100))

            return (
              <div
                key={cat.id}
                className="group rounded-[26px] border border-[var(--border)] bg-white p-5 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md"
              >
                <div className="mb-5 flex items-start justify-between gap-4">
                  <div>
                    <p className="fgb-display text-2xl leading-none text-[var(--black)]">{cat.name}</p>
                    <p className="mt-2 text-[10px] font-black uppercase tracking-[0.18em] text-[var(--gray)]">
                      Categoria oficial
                    </p>
                  </div>
                  <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border ${
                    hasGames
                      ? 'border-green-200 bg-green-50 text-green-600'
                      : ready
                        ? 'border-[var(--yellow)]/40 bg-[var(--yellow-light)] text-[var(--black)]'
                        : 'border-[var(--border)] bg-[var(--gray-l)] text-[var(--gray)]'
                  }`}>
                    {hasGames ? <ShieldCheck className="h-5 w-5" /> : ready ? <CheckCircle2 className="h-5 w-5" /> : <Users className="h-5 w-5" />}
                  </div>
                </div>

                <div className="mb-5">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-widest text-[var(--gray)]">
                      Equipes confirmadas
                    </span>
                    <span className={`text-sm font-black ${ready ? 'text-[var(--verde)]' : 'text-orange-600'}`}>
                      {count}/{minTeams}
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full border border-[var(--border)] bg-[var(--gray-l)]">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${ready ? 'bg-[var(--verde)]' : 'bg-[var(--yellow)]'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-[var(--border)] pt-4">
                  <span className={`rounded-full px-3 py-1 text-[9px] font-black uppercase tracking-[0.18em] ${
                    hasGames
                      ? 'bg-green-50 text-green-700'
                      : ready
                        ? 'bg-[var(--yellow-light)] text-[var(--black)]'
                        : 'bg-[var(--gray-l)] text-[var(--gray)]'
                  }`}>
                    {hasGames ? 'Organizada' : ready ? 'Pronta para IA' : `Faltam ${Math.max(0, minTeams - count)}`}
                  </span>
                  {hasGames && (
                    <Link
                      href={`/admin/championships/${id}/jogos`}
                      className="inline-flex h-8 items-center gap-1.5 rounded-xl border border-[var(--border)] bg-[var(--gray-l)] px-3 text-[9px] font-black uppercase tracking-widest text-[var(--black)] transition-all hover:border-[var(--yellow)] hover:bg-[var(--yellow)]"
                    >
                      Jogos
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )
}
