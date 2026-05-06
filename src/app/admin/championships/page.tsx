import { prisma } from '@/lib/db'
import { Plus } from 'lucide-react'
import Link from 'next/link'
import { ChampionshipCard } from '@/components/ChampionshipCard'
import { SimulationModalWrapper } from './SimulationModalWrapper'

export const dynamic = 'force-dynamic'

const STATUS_FILTERS = [
  { label: 'Todos', value: '' },
  { label: 'Em configuração', value: 'DRAFT' },
  { label: 'Inscrições Abertas', value: 'REGISTRATION_OPEN' },
  { label: 'Inscrições Encerradas', value: 'REGISTRATION_CLOSED' },
  { label: 'Em Andamento', value: 'ONGOING' },
  { label: 'Encerrado', value: 'FINISHED' },
]

type SearchParams = Promise<{ status?: string; year?: string }>

export default async function AdminChampionshipsPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const sp = await searchParams
  const filterStatus = sp.status ?? ''
  const filterYear = sp.year ? parseInt(sp.year, 10) : undefined

  try {
    const whereBase = {
      status: { not: 'ARCHIVED' as const },
      ...(filterStatus ? { status: filterStatus } : {}),
      ...(filterYear ? { year: filterYear } : {}),
    }

    const [activeChampionships, archivedChampionships, allYears] = await Promise.all([
      prisma.championship.findMany({
        where: whereBase,
        orderBy: { createdAt: 'desc' },
        include: {
          categories: { select: { id: true, name: true } },
          _count: {
            select: {
              registrations: { where: { status: 'CONFIRMED' } },
              games: true,
            },
          },
        },
      }),
      prisma.championship.findMany({
        where: { status: 'ARCHIVED' },
        orderBy: { createdAt: 'desc' },
        include: {
          categories: { select: { id: true, name: true } },
          _count: {
            select: {
              registrations: { where: { status: 'CONFIRMED' } },
              games: true,
            },
          },
        },
      }),
      prisma.championship.findMany({
        where: { status: { not: 'ARCHIVED' } },
        select: { year: true },
        distinct: ['year'],
        orderBy: { year: 'desc' },
      }),
    ])

    const uniqueYears = allYears.map((c) => c.year)

    const buildHref = (newStatus?: string, newYear?: number) => {
      const params = new URLSearchParams()
      if (newStatus) params.set('status', newStatus)
      if (newYear) params.set('year', String(newYear))
      const qs = params.toString()
      return `/admin/championships${qs ? `?${qs}` : ''}`
    }

    return (
      <div className="space-y-8 pb-20 animate-in fade-in duration-700 px-4 sm:px-6">
        {/* ── Header ── */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="fgb-label text-[var(--verde)]" style={{ fontSize: 10 }}>Gestao</span>
              <span className="fgb-badge fgb-badge-verde">FEDERACAO</span>
            </div>
            <h1 className="fgb-display text-3xl text-[var(--black)]">Campeonatos</h1>
            <p className="fgb-label text-[var(--gray)] mt-1" style={{ textTransform: 'none', letterSpacing: 0 }}>
              Gestao de competicoes da Federacao Gaucha de Basketball
            </p>
          </div>
          <div className="flex gap-3">
            <SimulationModalWrapper />
            <Link href="/admin/championships/new" className="fgb-btn-primary flex items-center gap-2">
              <Plus className="w-4 h-4" /> Novo Campeonato
            </Link>
          </div>
        </div>

        {/* ── Filtros ── */}
        <div className="flex flex-col gap-3">
          {/* Filtro por status */}
          <div className="flex flex-wrap gap-2">
            {STATUS_FILTERS.map((f) => {
              const isActive = filterStatus === f.value
              const href = buildHref(f.value || undefined, filterYear)
              return (
                <Link
                  key={f.value}
                  href={href}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-[10px] font-black uppercase tracking-widest transition-all ${
                    isActive
                      ? 'bg-[var(--black)] text-white border-[var(--black)]'
                      : 'bg-white text-[var(--gray)] border-[var(--border)] hover:border-[var(--black)] hover:text-[var(--black)]'
                  }`}
                >
                  {f.label}
                </Link>
              )
            })}
          </div>

          {/* Filtro por ano */}
          {uniqueYears.length > 1 && (
            <div className="flex flex-wrap gap-2 items-center">
              <span className="fgb-label text-[var(--gray)]" style={{ fontSize: 9, letterSpacing: 2 }}>ANO</span>
              <Link
                href={buildHref(filterStatus || undefined, undefined)}
                className={`inline-flex items-center rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-widest transition-all ${
                  !filterYear
                    ? 'bg-[var(--black)] text-white border-[var(--black)]'
                    : 'bg-white text-[var(--gray)] border-[var(--border)] hover:border-[var(--black)] hover:text-[var(--black)]'
                }`}
              >
                Todos
              </Link>
              {uniqueYears.map((y) => (
                <Link
                  key={y}
                  href={buildHref(filterStatus || undefined, y)}
                  className={`inline-flex items-center rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-widest transition-all ${
                    filterYear === y
                      ? 'bg-[var(--black)] text-white border-[var(--black)]'
                      : 'bg-white text-[var(--gray)] border-[var(--border)] hover:border-[var(--black)] hover:text-[var(--black)]'
                  }`}
                >
                  {y}
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* ── Grid de campeonatos ── */}
        {activeChampionships.length === 0 && filterStatus ? (
          <div className="fgb-card p-12 text-center">
            <p className="fgb-label text-[var(--gray)]" style={{ textTransform: 'none', letterSpacing: 0 }}>
              Nenhum campeonato encontrado para este filtro.
            </p>
            <Link href="/admin/championships" className="mt-4 inline-block fgb-label text-[var(--verde)]" style={{ fontSize: 10 }}>
              Limpar filtros
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {activeChampionships.map((c) => (
              <ChampionshipCard
                key={c.id}
                id={c.id}
                name={c.name}
                year={c.year}
                status={c.status}
                categories={c.categories}
                teamCount={c._count.registrations}
                gameCount={c._count.games}
                href={`/admin/championships/${c.id}`}
              />
            ))}

            {!filterStatus && (
              <Link
                href="/admin/championships/new"
                className="group fgb-card border-dashed flex flex-col items-center justify-center gap-4 min-h-[200px] hover:border-[var(--verde)] transition-colors"
              >
                <div className="w-12 h-12 rounded-xl bg-[var(--gray-l)] flex items-center justify-center group-hover:bg-[var(--verde)]/10 transition-all">
                  <Plus className="w-6 h-6 text-[var(--gray)] group-hover:text-[var(--verde)] transition-colors" />
                </div>
                <div className="text-center">
                  <p className="fgb-display text-sm text-[var(--gray)] group-hover:text-[var(--black)] transition-colors">
                    Novo Campeonato
                  </p>
                  <p className="fgb-label text-[var(--gray)] mt-1" style={{ fontSize: 10 }}>
                    Criar e configurar
                  </p>
                </div>
              </Link>
            )}
          </div>
        )}

        {/* ── Arquivados ── */}
        {archivedChampionships.length > 0 && !filterStatus && (
          <div className="pt-8 border-t border-[var(--border)]">
            <p className="fgb-label text-[var(--gray)] mb-5 flex items-center gap-3" style={{ fontSize: 10 }}>
              Arquivados ({archivedChampionships.length})
              <span className="h-px bg-[var(--border)] flex-1" />
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 opacity-50 hover:opacity-100 transition-opacity duration-700">
              {archivedChampionships.map((c) => (
                <ChampionshipCard
                  key={c.id}
                  id={c.id}
                  name={c.name}
                  year={c.year}
                  status={c.status}
                  categories={c.categories}
                  teamCount={c._count.registrations}
                  href={`/admin/championships/${c.id}`}
                  buttonLabel="Ver Arquivo"
                />
              ))}
            </div>
          </div>
        )}
      </div>
    )
  } catch (error) {
    console.error('[ADMIN CHAMPIONSHIPS ERROR]', error)
    return (
      <div className="fgb-card p-16 text-center">
        <p className="fgb-label text-[var(--red)]" style={{ textTransform: 'none', letterSpacing: 0 }}>
          Erro ao carregar campeonatos. Tente novamente.
        </p>
      </div>
    )
  }
}
