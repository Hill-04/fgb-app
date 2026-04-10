import type { Metadata } from 'next'
import Image from 'next/image'
import { prisma } from '@/lib/db'
import { PublicHeader } from '@/components/PublicHeader'
import { PublicFooter } from '@/components/PublicFooter'

export const metadata: Metadata = {
  title: 'Noticias — FGB',
  description: 'Noticias e comunicados oficiais da Federacao Gaucha de Basketball.',
}

export default async function NoticiasPage() {
  const news = await prisma.newsPost.findMany({
    where: { status: 'PUBLISHED' },
    orderBy: { publishedAt: 'desc' },
    take: 12,
  }).catch(() => [])

  return (
    <div>
      <PublicHeader />

      <div className="fgb-page-header">
        <div className="fgb-page-header-bg" />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 relative text-center">
          <div className="fgb-page-header-eyebrow">Portal FGB</div>
          <h1 className="fgb-page-header-title">Noticias</h1>
          <p className="fgb-page-header-sub mx-auto">
            Atualizacoes semanais, comunicados e destaques do basquete gaucho.
          </p>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-14">
        {news.length === 0 ? (
          <div className="fgb-card p-8 text-center">
            <p className="fgb-label" style={{ color: 'var(--gray)' }}>Nenhuma noticia publicada ainda.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {news.map((item) => (
              <article key={item.id} className="fgb-card overflow-hidden">
                <div className="relative h-40 bg-[var(--gray-l)]">
                  {item.coverUrl ? (
                    <Image src={item.coverUrl} alt={item.title} fill className="object-cover" unoptimized />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-[var(--verde)]/20 to-[var(--yellow)]/20" />
                  )}
                </div>
                <div className="p-5">
                  <div className="fgb-label text-[var(--gray)] mb-2">
                    {item.publishedAt ? new Date(item.publishedAt).toLocaleDateString('pt-BR') : 'Em breve'}
                  </div>
                  <h3 className="fgb-display text-[16px] text-[var(--black)] mb-2">{item.title}</h3>
                  <p className="fgb-label text-[var(--gray)]" style={{ textTransform: 'none', letterSpacing: 0 }}>
                    {item.excerpt || 'Acompanhe os destaques e resultados do basquete gaucho.'}
                  </p>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>

      <PublicFooter />
    </div>
  )
}
