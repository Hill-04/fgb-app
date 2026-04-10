import type { Metadata } from 'next'
import { prisma } from '@/lib/db'
import { PublicHeader } from '@/components/PublicHeader'
import { PublicFooter } from '@/components/PublicFooter'

type PageProps = {
  params: { slug: string }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const video = await prisma.videoPost.findUnique({
    where: { slug: params.slug },
  })

  if (!video) {
    return { title: 'Video nao encontrado — FGB' }
  }

  return {
    title: `${video.title} — FGB`,
    description: video.description || 'Video oficial da Federacao Gaucha de Basketball.',
  }
}

export default async function VideoPage({ params }: PageProps) {
  const video = await prisma.videoPost.findUnique({
    where: { slug: params.slug },
  })

  return (
    <div>
      <PublicHeader />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-16">
        {!video ? (
          <div className="fgb-card p-8 text-center">
            <h1 className="fgb-display text-[22px] text-[var(--black)] mb-2">Video nao encontrado</h1>
            <p className="fgb-label text-[var(--gray)]">Este conteudo nao esta disponivel.</p>
          </div>
        ) : (
          <article className="fgb-card p-8">
            <div className="fgb-label text-[var(--gray)] mb-2">
              {video.publishedAt ? new Date(video.publishedAt).toLocaleDateString('pt-BR') : 'Em breve'}
            </div>
            <h1 className="fgb-display text-[26px] text-[var(--black)] mb-4">{video.title}</h1>
            {video.description && (
              <p className="fgb-label text-[var(--gray)] mb-6" style={{ textTransform: 'none', letterSpacing: 0 }}>
                {video.description}
              </p>
            )}
            <div className="fgb-card p-4 bg-[var(--gray-l)] border border-[var(--border)] text-center">
              <p className="fgb-label text-[var(--gray)]">Embed do video: {video.videoUrl}</p>
            </div>
          </article>
        )}
      </main>

      <PublicFooter />
    </div>
  )
}
