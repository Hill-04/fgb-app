import { prisma } from '@/lib/db'
import { Plus } from 'lucide-react'
import Link from 'next/link'
import { ChampionshipCard } from '@/components/ChampionshipCard'
import { SimulationModalWrapper } from './SimulationModalWrapper'

export const dynamic = 'force-dynamic'

export default async function AdminChampionshipsPage() {
  try {
    const activeChampionships = await prisma.championship.findMany({
      where: { status: { not: 'ARCHIVED' } },
      orderBy: { createdAt: 'desc' },
      include: {
        categories: { select: { id: true, name: true } },
        _count: {
          select: {
            registrations: { where: { status: 'CONFIRMED' } },
            games: true,
          }
        }
      }
    })

    const archivedChampionships = await prisma.championship.findMany({
      where: { status: 'ARCHIVED' },
      orderBy: { createdAt: 'desc' },
      include: {
        categories: { select: { id: true, name: true } },
        _count: {
          select: {
            registrations: { where: { status: 'CONFIRMED' } },
            games: true,
          }
        }
      }
    })

    return (
      <div className="space-y-8 pb-20 animate-in fade-in duration-700">
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
        </div>

        {archivedChampionships.length > 0 && (
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

