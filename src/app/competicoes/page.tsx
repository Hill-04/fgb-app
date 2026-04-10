import type { Metadata } from 'next'
import Link from 'next/link'
import { prisma } from '@/lib/db'
import { formatChampionshipStatus } from '@/lib/utils'
import { PublicHeader } from '@/components/PublicHeader'
import { PublicFooter } from '@/components/PublicFooter'

export const metadata: Metadata = {
  title: 'Competicoes — FGB',
  description: 'Competicoes oficiais e calendarios da Federacao Gaucha de Basketball.',
}

export default async function CompeticoesPage() {
  const championships = await prisma.championship.findMany({
    where: { isSimulation: false },
    orderBy: { createdAt: 'desc' },
    include: {
      categories: { select: { name: true } },
      _count: { select: { registrations: { where: { status: 'CONFIRMED' } }, games: true } },
    },
  }).catch(() => [])

  const categories = await prisma.championshipCategory.findMany({
    distinct: ['name'],
    select: { name: true },
    orderBy: { name: 'asc' },
  }).catch(() => [])

  return (
    <div>
      <PublicHeader />

      <div className="fgb-page-header">
        <div className="fgb-page-header-bg" />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 relative text-center">
          <div className="fgb-page-header-eyebrow">Temporada 2026</div>
          <h1 className="fgb-page-header-title">Competicoes Oficiais</h1>
          <p className="fgb-page-header-sub mx-auto">
            Listagem completa dos campeonatos estaduais, categorias de base e torneios oficiais.
          </p>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-14">
        {categories.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto fgb-hide-scrollbar mb-8 pb-1">
            <Link href="/competicoes" className="fgb-badge fgb-badge-verde flex-shrink-0">
              Todas
            </Link>
            {categories.map((cat) => (
              <Link key={cat.name} href={`/campeonatos?categoria=${encodeURIComponent(cat.name)}`} className="fgb-badge fgb-badge-outline flex-shrink-0 hover:border-[var(--verde)] hover:text-[var(--verde)] transition-colors">
                {cat.name}
              </Link>
            ))}
          </div>
        )}

        {championships.length === 0 ? (
          <div className="fgb-card p-8 text-center">
            <p className="fgb-label" style={{ color: 'var(--gray)' }}>Nenhuma competicao cadastrada.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {championships.map((c) => (
              <Link key={c.id} href={`/campeonatos/${c.id}`} className="fgb-card admin-card-verde p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="fgb-badge fgb-badge-outline">{formatChampionshipStatus(c.status)}</span>
                  <span className="fgb-label" style={{ color: 'var(--gray)' }}>{c.year}</span>
                </div>
                <h3 className="fgb-display text-[18px] text-[var(--black)] mb-2">{c.name}</h3>
                <p className="fgb-label text-[var(--gray)] mb-4" style={{ textTransform: 'none', letterSpacing: 0 }}>
                  {c.description || 'Competicao oficial da Federacao Gaucha de Basketball.'}
                </p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {c.categories.slice(0, 4).map((cat) => (
                    <span key={cat.name} className="fgb-badge fgb-badge-outline">{cat.name}</span>
                  ))}
                </div>
                <div className="flex items-center justify-between pt-3" style={{ borderTop: '1px solid var(--border)' }}>
                  <span className="fgb-label" style={{ color: 'var(--gray)' }}>{c._count.registrations} equipes</span>
                  <span className="fgb-label" style={{ color: 'var(--verde)' }}>{c._count.games} jogos</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>

      <PublicFooter />
    </div>
  )
}
