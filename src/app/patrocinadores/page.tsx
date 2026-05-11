import type { Metadata } from 'next'
import { prisma } from '@/lib/db'
import { PublicHeader } from '@/components/PublicHeader'
import { PublicFooter } from '@/components/PublicFooter'
import { FgbImage } from '@/components/FgbImage'
import { StaggerGrid } from '@/components/motion/StaggerGrid'
import { Handshake, ExternalLink } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Patrocinadores — FGB',
  description: 'Parceiros e patrocinadores oficiais da Federacao Gaucha de Basketball.',
}

export default async function PatrocinadoresPage() {
  const sponsors = await prisma.sponsor.findMany({
    where: { isActive: true },
    orderBy: { createdAt: 'desc' },
    take: 50,
  }).catch(() => [])

  return (
    <div>
      <PublicHeader />

      <div className="fgb-page-header">
        <div className="fgb-page-header-bg" />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 relative text-center">
          <div className="fgb-page-header-eyebrow">Parceiros</div>
          <h1 className="fgb-page-header-title">Patrocinadores Oficiais</h1>
          <p className="fgb-page-header-sub mx-auto">
            Marcas que fortalecem o basquete gaucho e apoiam a evolucao do esporte no Rio Grande do Sul.
          </p>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-14">
        {sponsors.length === 0 ? (
          <div className="fgb-card p-12 text-center">
            <Handshake size={48} className="mx-auto mb-4" style={{ color: 'var(--fgb-ink-400)', strokeWidth: 1.5 }} aria-hidden />
            <p className="fgb-label" style={{ color: 'var(--gray)' }}>Nenhum patrocinador cadastrado.</p>
          </div>
        ) : (
          <StaggerGrid
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5"
            stagger={0.05}
          >
            {sponsors.map((sponsor) => {
              const isExternal = Boolean(sponsor.websiteUrl)
              return (
                <a
                  key={sponsor.id}
                  href={sponsor.websiteUrl || '#'}
                  className="fgb-card overflow-hidden group flex flex-col"
                  target={isExternal ? '_blank' : undefined}
                  rel={isExternal ? 'noopener noreferrer' : undefined}
                >
                  <div className="aspect-[4/3] relative" style={{ background: 'var(--fgb-ink-50)' }}>
                    <FgbImage
                      variant="logo"
                      src={sponsor.logoUrl}
                      initials={sponsor.name.slice(0, 2)}
                      alt={sponsor.name}
                      tint="green"
                      className="transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>
                  <div className="p-4 flex items-center justify-between gap-2 border-t" style={{ borderColor: 'var(--border)' }}>
                    <div className="fgb-display text-[14px] truncate" style={{ color: 'var(--fgb-ink-900)' }}>
                      {sponsor.name}
                    </div>
                    {isExternal && (
                      <ExternalLink
                        size={14}
                        className="flex-shrink-0 transition-colors group-hover:text-[var(--verde)]"
                        style={{ color: 'var(--fgb-ink-400)' }}
                        aria-hidden
                      />
                    )}
                  </div>
                </a>
              )
            })}
          </StaggerGrid>
        )}
      </main>

      <PublicFooter />
    </div>
  )
}
