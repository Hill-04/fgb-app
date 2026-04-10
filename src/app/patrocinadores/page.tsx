import type { Metadata } from 'next'
import Image from 'next/image'
import { prisma } from '@/lib/db'
import { PublicHeader } from '@/components/PublicHeader'
import { PublicFooter } from '@/components/PublicFooter'

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
            Marcas que fortalecem o basquete gaucho e apoiam a evolucao do esporte no RS.
          </p>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-14">
        {sponsors.length === 0 ? (
          <div className="fgb-card p-8 text-center">
            <p className="fgb-label" style={{ color: 'var(--gray)' }}>Nenhum patrocinador cadastrado.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5">
            {sponsors.map((sponsor) => (
              <a
                key={sponsor.id}
                href={sponsor.websiteUrl || '#'}
                className="fgb-card p-5 flex flex-col items-center text-center hover:shadow-md transition-shadow"
                target={sponsor.websiteUrl ? '_blank' : undefined}
                rel={sponsor.websiteUrl ? 'noopener noreferrer' : undefined}
              >
                <div className="relative w-full h-14 mb-3">
                  {sponsor.logoUrl ? (
                    <Image src={sponsor.logoUrl} alt={sponsor.name} fill className="object-contain" unoptimized />
                  ) : (
                    <div className="fgb-label text-[var(--gray)]">{sponsor.name}</div>
                  )}
                </div>
                <div className="fgb-display text-[14px] text-[var(--black)]">{sponsor.name}</div>
              </a>
            ))}
          </div>
        )}
      </main>

      <PublicFooter />
    </div>
  )
}
