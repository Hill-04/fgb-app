import type { Metadata } from 'next'
import { prisma } from '@/lib/db'
import { PublicHeader } from '@/components/PublicHeader'
import { PublicFooter } from '@/components/PublicFooter'
import { AthleteCard } from '@/components/AthleteCard'
import { StaggerGrid } from '@/components/motion/StaggerGrid'
import { Users } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Atletas — FGB',
  description: 'Atletas filiados à Federação Gaúcha de Basquete. Conheça quem veste a camisa dos clubes do RS.',
}

export const dynamic = 'force-dynamic'

export default async function AtletasPage() {
  const athletes = await prisma.athlete
    .findMany({
      where: { status: 'ACTIVE' },
      include: { team: { select: { name: true } } },
      orderBy: [{ name: 'asc' }],
      take: 60,
    })
    .catch(() => [])

  return (
    <div className="min-h-screen" style={{ background: 'var(--fgb-green-950)' }}>
      <PublicHeader />

      {/* HERO DARK */}
      <header
        className="relative overflow-hidden py-20"
        style={{ background: 'var(--fgb-green-950)' }}
      >
        <div
          className="absolute inset-0 opacity-15"
          style={{ background: 'var(--fgb-gradient-court)' }}
        />
        <div
          className="absolute inset-0 opacity-30 pointer-events-none"
          style={{
            backgroundImage:
              'repeating-linear-gradient(0deg,transparent,transparent 56px,rgba(255,255,255,0.04) 56px,rgba(255,255,255,0.04) 57px),repeating-linear-gradient(90deg,transparent,transparent 56px,rgba(255,255,255,0.04) 56px,rgba(255,255,255,0.04) 57px)',
          }}
        />
        <div className="max-w-7xl mx-auto px-6 relative">
          <div
            className="fgb-label mb-3"
            style={{
              color: 'var(--fgb-yellow-500)',
              fontSize: 11,
              letterSpacing: '0.22em',
            }}
          >
            Temporada 2026
          </div>
          <h1 className="fgb-display fgb-h1 text-white mb-3">
            Atletas{' '}
            <em
              className="not-italic"
              style={{ color: 'var(--fgb-yellow-500)' }}
            >
              Filiados
            </em>
          </h1>
          <p className="text-white/60 max-w-2xl text-sm leading-relaxed">
            Conheça os atletas que vestem a camisa dos clubes filiados à
            Federação Gaúcha de Basquete na temporada 2026.
          </p>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-1 fgb-tricolor" />
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-14">
        {athletes.length === 0 ? (
          <div className="text-center py-20">
            <Users
              size={48}
              className="mx-auto mb-4"
              style={{ color: 'rgba(255,255,255,0.25)', strokeWidth: 1.5 }}
              aria-hidden
            />
            <p className="fgb-label" style={{ color: 'rgba(255,255,255,0.55)' }}>
              Nenhum atleta filiado encontrado.
            </p>
          </div>
        ) : (
          <StaggerGrid
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5"
            stagger={0.06}
          >
            {athletes.map((a) => (
              <AthleteCard
                key={a.id}
                name={a.name}
                position={a.position ?? undefined}
                team={a.team?.name}
                jerseyNumber={
                  a.jerseyNumber ?? a.shirtNumber ?? undefined
                }
                photoUrl={a.photoUrl ?? undefined}
                href={`/atletas/${a.id}`}
                verified={a.verifiedFgb}
              />
            ))}
          </StaggerGrid>
        )}

        {athletes.length === 60 && (
          <p
            className="fgb-label text-center mt-12"
            style={{ color: 'rgba(255,255,255,0.4)' }}
          >
            Mostrando os 60 primeiros · use a área restrita para listagem
            completa com filtros
          </p>
        )}
      </main>

      <PublicFooter />
    </div>
  )
}
