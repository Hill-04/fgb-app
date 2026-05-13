import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { prisma } from '@/lib/db'
import { PublicHeader } from '@/components/PublicHeader'
import { PublicFooter } from '@/components/PublicFooter'

const CATEGORIES: Record<string, { label: string; color: string }> = {
  NOTICIAS:      { label: 'Notícias',               color: '#145530' },
  CURIOSIDADES:  { label: 'Curiosidades',           color: '#1d6fa4' },
  REGRAS:        { label: 'Regras do Jogo',         color: '#7b3fa0' },
  HISTORIA:      { label: 'História do Basquete',   color: '#c05621' },
  CBB:           { label: 'CBB & Nacional',         color: '#b44' },
  INTERNACIONAL: { label: 'Basquete Internacional', color: '#0d7377' },
  FEDERACAO:     { label: 'FGB & Federação',        color: '#145530' },
}

type PageProps = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const post = await prisma.newsPost.findUnique({
    where: { slug },
    select: { title: true, metaTitle: true, excerpt: true, metaDescription: true, coverUrl: true },
  })

  if (!post) return { title: 'Artigo não encontrado — FGB' }

  const title = post.metaTitle || `${post.title} — FGB`
  const description =
    post.metaDescription ||
    post.excerpt ||
    'Conteúdo sobre basquete da Federação Gaúcha de Basketball.'

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'article',
      images: post.coverUrl ? [{ url: post.coverUrl }] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: post.coverUrl ? [post.coverUrl] : [],
    },
  }
}

export const revalidate = 60

export default async function NoticiaPage({ params }: PageProps) {
  const { slug } = await params

  const post = await prisma.newsPost.findUnique({ where: { slug } })
  if (!post || post.status !== 'PUBLISHED') notFound()

  const related = await prisma.newsPost.findMany({
    where: {
      status: 'PUBLISHED',
      category: post.category,
      id: { not: post.id },
    },
    orderBy: { publishedAt: 'desc' },
    take: 3,
    select: { id: true, title: true, slug: true, excerpt: true, coverUrl: true, publishedAt: true, readingTime: true },
  })

  const cat   = CATEGORIES[post.category]
  const tags  = post.tags ? post.tags.split(',').map(t => t.trim()).filter(Boolean) : []

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.excerpt ?? undefined,
    image: post.coverUrl ?? undefined,
    datePublished: post.publishedAt?.toISOString(),
    dateModified: post.updatedAt.toISOString(),
    author: post.author ? { '@type': 'Person', name: post.author } : undefined,
    publisher: {
      '@type': 'Organization',
      name: 'Federação Gaúcha de Basketball',
      url: 'https://fgb.org.br',
    },
  }

  return (
    <div>
      <PublicHeader />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Cover hero */}
      {post.coverUrl && (
        <div className="relative w-full h-[340px] md:h-[460px] bg-[var(--gray-l)]">
          <Image
            src={post.coverUrl}
            alt={post.title}
            fill
            className="object-cover"
            priority
            unoptimized
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          {cat && (
            <span
              className="absolute bottom-6 left-6 text-xs font-bold px-3 py-1 rounded-full text-white"
              style={{ backgroundColor: cat.color }}
            >
              {cat.label}
            </span>
          )}
        </div>
      )}

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
        {/* Meta header */}
        <div className="flex items-center gap-3 flex-wrap mb-4">
          {cat && !post.coverUrl && (
            <span
              className="text-xs font-bold px-3 py-1 rounded-full text-white"
              style={{ backgroundColor: cat.color }}
            >
              {cat.label}
            </span>
          )}
          {post.publishedAt && (
            <span className="fgb-label text-[var(--gray)]">
              {new Date(post.publishedAt).toLocaleDateString('pt-BR', {
                day: '2-digit', month: 'long', year: 'numeric',
              })}
            </span>
          )}
          {post.readingTime && (
            <span className="fgb-label text-[var(--gray)]">· {post.readingTime} min de leitura</span>
          )}
          {post.author && (
            <span className="fgb-label text-[var(--gray)]">· Por {post.author}</span>
          )}
        </div>

        {/* Title */}
        <h1 className="fgb-display text-[28px] md:text-[36px] text-[var(--black)] leading-tight mb-5">
          {post.title}
        </h1>

        {/* Excerpt lead */}
        {post.excerpt && (
          <p className="text-lg text-[var(--gray)] leading-relaxed mb-8 border-l-4 border-[var(--verde)] pl-4">
            {post.excerpt}
          </p>
        )}

        {/* Markdown content */}
        <div className="prose prose-neutral max-w-none prose-headings:fgb-display prose-a:text-[var(--verde)] prose-a:no-underline hover:prose-a:underline prose-img:rounded-xl prose-blockquote:border-[var(--verde)]">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {post.content}
          </ReactMarkdown>
        </div>

        {/* Tags */}
        {tags.length > 0 && (
          <div className="mt-10 pt-6 border-t border-[var(--border)] flex flex-wrap gap-2">
            {tags.map(tag => (
              <span
                key={tag}
                className="text-xs px-3 py-1 rounded-full bg-[var(--gray-l)] text-[var(--gray)] font-medium"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Back link */}
        <div className="mt-8">
          <Link href="/noticias" className="fgb-label" style={{ color: 'var(--verde)' }}>
            ← Voltar ao portal
          </Link>
        </div>
      </main>

      {/* Related posts */}
      {related.length > 0 && (
        <section className="bg-[var(--gray-l)] py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <p className="fgb-label text-[var(--gray)] mb-6">Leia também</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {related.map(r => (
                <Link
                  key={r.id}
                  href={`/noticias/${r.slug}`}
                  className="fgb-card overflow-hidden group hover:shadow-md transition-shadow"
                >
                  <div className="relative h-36 bg-[var(--gray-l)]">
                    {r.coverUrl ? (
                      <Image src={r.coverUrl} alt={r.title} fill className="object-cover" unoptimized />
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-[var(--verde)]/10 to-transparent" />
                    )}
                  </div>
                  <div className="p-4">
                    <p className="fgb-label text-[var(--gray)] mb-1">
                      {r.publishedAt ? new Date(r.publishedAt).toLocaleDateString('pt-BR') : ''}
                      {r.readingTime && <span className="ml-2">· {r.readingTime} min</span>}
                    </p>
                    <h4 className="fgb-display text-[14px] text-[var(--black)] leading-snug line-clamp-2 group-hover:text-[var(--verde)] transition-colors">
                      {r.title}
                    </h4>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <PublicFooter />
    </div>
  )
}
