import type { Metadata } from 'next'
import { prisma } from '@/lib/db'
import { PublicHeader } from '@/components/PublicHeader'
import { PublicFooter } from '@/components/PublicFooter'
import PortalClient from './PortalClient'

export const revalidate = 60

export const metadata: Metadata = {
  title: 'Portal do Basquete Gaúcho | FGB',
  description:
    'Conhecimento, história e notícias sobre o basquete no Rio Grande do Sul e no Brasil. Federação Gaúcha de Basketball.',
  openGraph: {
    title: 'Portal do Basquete Gaúcho | FGB',
    description:
      'Conhecimento, história e notícias sobre o basquete no Rio Grande do Sul e no Brasil.',
    type: 'website',
    siteName: 'FGB - Federação Gaúcha de Basketball',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Portal do Basquete Gaúcho | FGB',
    description:
      'Conhecimento, história e notícias sobre o basquete no Rio Grande do Sul e no Brasil.',
  },
}

export default async function PortalPage() {
  const articles = await prisma.article
    .findMany({
      where: { isPublished: true },
      orderBy: { publishedAt: 'desc' },
      select: {
        id: true,
        slug: true,
        title: true,
        subtitle: true,
        coverImage: true,
        category: true,
        author: true,
        publishedAt: true,
        readTime: true,
      },
      take: 60,
    })
    .catch(() => [])

  const serialized = articles.map((a) => ({
    ...a,
    publishedAt: a.publishedAt?.toISOString() ?? null,
  }))

  return (
    <div>
      <PublicHeader />

      <section
        className="relative overflow-hidden"
        style={{ background: 'var(--fgb-gradient-court)' }}
      >
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16 sm:py-20 text-center relative z-10">
          <p
            className="fgb-label mb-3"
            style={{ color: 'var(--fgb-yellow-500)', fontSize: 11, letterSpacing: '0.22em' }}
          >
            FGB · Conteúdo Oficial
          </p>
          <h1
            className="fgb-display text-white"
            style={{ fontSize: 'clamp(36px, 6vw, 56px)' }}
          >
            Portal do Basquete Gaúcho
          </h1>
          <p
            className="mt-4 mx-auto text-white/80"
            style={{ fontSize: 17, lineHeight: 1.55, maxWidth: 640 }}
          >
            Conhecimento, história e notícias sobre o basquete no Rio Grande do
            Sul e no Brasil.
          </p>
        </div>
        <div className="fgb-tricolor" />
      </section>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <PortalClient articles={serialized} />
      </main>

      <PublicFooter />
    </div>
  )
}
