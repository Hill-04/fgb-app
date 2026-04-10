'use client'

import Image from 'next/image'

type Sponsor = {
  id: string
  name: string
  logoUrl: string | null
  websiteUrl: string | null
}

type SponsorsStripProps = {
  sponsors: Sponsor[]
}

export function SponsorsStrip({ sponsors }: SponsorsStripProps) {
  if (sponsors.length === 0) return null

  const handleClick = async (sponsor: Sponsor) => {
    try {
      await fetch(`/api/sponsors/${sponsor.id}/click`, { method: 'POST' })
    } catch {
      // ignore
    }
  }

  return (
    <section className="fgb-section fgb-section-alt" style={{ borderTop: '1px solid var(--border)' }}>
      <div className="max-w-7xl mx-auto">
        <div className="fgb-section-header">
          <div>
            <div className="fgb-accent fgb-accent-yellow" />
            <h2 className="fgb-section-title">
              Patrocinadores <span className="yellow">Oficiais</span>
            </h2>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
          {sponsors.map((sponsor) => (
            <a
              key={sponsor.id}
              href={sponsor.websiteUrl || '#'}
              onClick={() => handleClick(sponsor)}
              className="fgb-card p-4 flex items-center justify-center bg-white hover:shadow-md transition-shadow"
              target={sponsor.websiteUrl ? '_blank' : undefined}
              rel={sponsor.websiteUrl ? 'noopener noreferrer' : undefined}
            >
              {sponsor.logoUrl ? (
                <div className="relative w-full h-12">
                  <Image src={sponsor.logoUrl} alt={sponsor.name} fill className="object-contain" unoptimized />
                </div>
              ) : (
                <span className="fgb-label text-[var(--gray)]">{sponsor.name}</span>
              )}
            </a>
          ))}
        </div>
      </div>
    </section>
  )
}
