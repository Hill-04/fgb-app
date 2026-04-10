import type { Metadata } from 'next'
import { prisma } from '@/lib/db'
import { PublicHeader } from '@/components/PublicHeader'
import { PublicFooter } from '@/components/PublicFooter'

type PageProps = {
  params: { slug: string }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const post = await prisma.newsPost.findUnique({
    where: { slug: params.slug },
  })

  if (!post) {
    return { title: 'Noticia nao encontrada — FGB' }
  }

  return {
    title: `${post.title} — FGB`,
    description: post.excerpt || 'Noticia oficial da Federacao Gaucha de Basketball.',
  }
}

export default async function NoticiaPage({ params }: PageProps) {
  const post = await prisma.newsPost.findUnique({
    where: { slug: params.slug },
  })

  return (
    <div>
      <PublicHeader />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-16">
        {!post ? (
          <div className="fgb-card p-8 text-center">
            <h1 className="fgb-display text-[22px] text-[var(--black)] mb-2">Noticia nao encontrada</h1>
            <p className="fgb-label text-[var(--gray)]">Este conteudo nao esta disponivel.</p>
          </div>
        ) : (
          <article className="fgb-card p-8">
            <div className="fgb-label text-[var(--gray)] mb-2">
              {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString('pt-BR') : 'Em breve'}
            </div>
            <h1 className="fgb-display text-[26px] text-[var(--black)] mb-4">{post.title}</h1>
            {post.excerpt && (
              <p className="fgb-label text-[var(--gray)] mb-6" style={{ textTransform: 'none', letterSpacing: 0 }}>
                {post.excerpt}
              </p>
            )}
            <div className="fgb-label text-[var(--gray)]" style={{ textTransform: 'none', letterSpacing: 0, lineHeight: 1.8 }}>
              {post.content}
            </div>
          </article>
        )}
      </main>

      <PublicFooter />
    </div>
  )
}
