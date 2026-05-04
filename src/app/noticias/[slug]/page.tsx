import type { Metadata } from 'next'
import { prisma } from '@/lib/db'
import { PublicHeader } from '@/components/PublicHeader'
import { PublicFooter } from '@/components/PublicFooter'

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://basquetegaucho.com.br'
const FGB_LOGO = 'https://basquetegaucho.com.br/wp-content/uploads/2023/09/Federacao-Gaucha-de-Basketball-Logo-01.png'

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

  const newsArticleJsonLd = post
    ? {
        '@context': 'https://schema.org',
        '@type': 'NewsArticle',
        headline: post.title,
        description: post.excerpt ?? undefined,
        datePublished: post.publishedAt?.toISOString() ?? post.createdAt.toISOString(),
        dateModified: post.updatedAt.toISOString(),
        image: post.coverUrl ? [post.coverUrl] : [FGB_LOGO],
        author: {
          '@type': 'Organization',
          name: 'Federação Gaúcha de Basketball',
          url: BASE_URL,
        },
        publisher: {
          '@type': 'Organization',
          name: 'Federação Gaúcha de Basketball',
          logo: { '@type': 'ImageObject', url: FGB_LOGO },
        },
        mainEntityOfPage: {
          '@type': 'WebPage',
          '@id': `${BASE_URL}/noticias/${post.slug}`,
        },
      }
    : null

  return (
    <div>
      {newsArticleJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(newsArticleJsonLd) }}
        />
      )}
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
