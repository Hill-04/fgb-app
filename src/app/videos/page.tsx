import type { Metadata } from 'next'
import { prisma } from '@/lib/db'
import { PublicHeader } from '@/components/PublicHeader'
import { PublicFooter } from '@/components/PublicFooter'
import { FgbImage } from '@/components/FgbImage'
import { StaggerGrid } from '@/components/motion/StaggerGrid'
import { Play, Video } from 'lucide-react'

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
          <div className="fgb-card p-12 text-center">
            <Video size={48} className="mx-auto mb-4" style={{ color: 'var(--fgb-ink-400)', strokeWidth: 1.5 }} aria-hidden />
            <p className="fgb-label" style={{ color: 'var(--gray)' }}>Nenhum video publicado ainda.</p>
          </div>
        ) : (
          <StaggerGrid className="grid grid-cols-1 md:grid-cols-3 gap-5" stagger={0.07}>
            {videos.map((video) => (
              <a
                key={video.id}
                href={`/videos/${video.slug}`}
                className="fgb-card overflow-hidden group block"
              >
                <div className="relative aspect-video overflow-hidden">
                  <FgbImage
                    variant="cover"
                    src={video.coverUrl}
                    tint="red"
                    icon={Video}
                    alt={video.title}
                  />
                  {/* gradient overlay para legibilidade do botao */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent transition-opacity group-hover:opacity-70" />
                  {/* play button overlay */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div
                      className="flex items-center justify-center rounded-full transition-all duration-300 group-hover:scale-110"
                      style={{
                        width: 64,
                        height: 64,
                        background: 'rgba(229,171,0,0.92)',
                        boxShadow: '0 8px 24px rgba(0,0,0,0.35)',
                      }}
                    >
                      <Play
                        size={26}
                        fill="var(--fgb-ink-900)"
                        style={{ color: 'var(--fgb-ink-900)', marginLeft: 3 }}
                        aria-hidden
                      />
                    </div>
                  </div>
                </div>
                <div className="p-5">
                  <div className="fgb-label text-[var(--gray)] mb-2">
                    {video.publishedAt
                      ? new Date(video.publishedAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
                      : 'Em breve'}
                  </div>
                  <h3 className="fgb-display text-[16px] text-[var(--black)] mb-2 line-clamp-2 group-hover:text-[var(--verde)] transition-colors">
                    {video.title}
                  </h3>
                  {video.description && (
                    <p
                      className="fgb-label text-[var(--gray)] line-clamp-2"
                      style={{ textTransform: 'none', letterSpacing: 0 }}
                    >
                      {video.description}
                    </p>
                  )}
                  <span
                    className="fgb-label mt-3 inline-flex items-center gap-1"
                    style={{ color: 'var(--red)' }}
                  >
                    Assistir video →
                  </span>
                </div>
              </a>
            ))}
          </StaggerGrid>
        )}
      </main>

      <PublicFooter />
    </div>
  )
}
