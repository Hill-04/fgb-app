import type { Metadata } from 'next'
import Image from 'next/image'
import { prisma } from '@/lib/db'
import { PublicHeader } from '@/components/PublicHeader'
import { PublicFooter } from '@/components/PublicFooter'

export const metadata: Metadata = {
  title: 'Videos — FGB',
  description: 'Videos e melhores momentos do basquete gaucho.',
}

export default async function VideosPage() {
  const videos = await prisma.videoPost.findMany({
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
          <div className="fgb-page-header-eyebrow">Multimidia</div>
          <h1 className="fgb-page-header-title">Videos</h1>
          <p className="fgb-page-header-sub mx-auto">
            Highlights, trechos de jogos e bastidores da temporada.
          </p>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-14">
        {videos.length === 0 ? (
          <div className="fgb-card p-8 text-center">
            <p className="fgb-label" style={{ color: 'var(--gray)' }}>Nenhum video publicado ainda.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {videos.map((video) => (
              <article key={video.id} className="fgb-card overflow-hidden">
                <div className="relative h-40 bg-[var(--gray-l)]">
                  {video.coverUrl ? (
                    <Image src={video.coverUrl} alt={video.title} fill className="object-cover" unoptimized />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-[var(--red)]/20 to-[var(--yellow)]/20" />
                  )}
                </div>
                <div className="p-5">
                  <div className="fgb-label text-[var(--gray)] mb-2">
                    {video.publishedAt ? new Date(video.publishedAt).toLocaleDateString('pt-BR') : 'Em breve'}
                  </div>
                  <h3 className="fgb-display text-[16px] text-[var(--black)] mb-2">{video.title}</h3>
                  <p className="fgb-label text-[var(--gray)]" style={{ textTransform: 'none', letterSpacing: 0 }}>
                    {video.description || 'Assista aos melhores momentos do basquete gaucho.'}
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
