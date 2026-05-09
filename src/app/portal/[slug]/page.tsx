import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { ChevronRight } from 'lucide-react'
import { prisma } from '@/lib/db'
import { ensureDatabaseSchema } from '@/lib/db-patch'
import { PublicHeader } from '@/components/PublicHeader'
import { PublicFooter } from '@/components/PublicFooter'
import ShareButtons from './ShareButtons'
import './article.css'

export const dynamic = 'force-dynamic'

function parseTags(json: string | null): string[] {
  if (!json) return []
  try {
    const v = JSON.parse(json)
    return Array.isArray(v) ? v.filter((t) => typeof t === 'string') : []
  } catch {
    return json
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)
  }
}

function formatDate(d: Date | string) {
  return new Date(d).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> },
): Promise<Metadata> {
  const { slug } = await params
  await ensureDatabaseSchema().catch(() => {})

  const article = await prisma.article
    .findUnique({ where: { slug } })
    .catch(() => null)

  if (!article) return { title: 'Artigo não encontrado | FGB' }

  const tags = parseTags(article.tags)
  const cover = article.coverImage || undefined
  const description = article.subtitle ?? article.title

  return {
    title: `${article.title} | FGB — Portal do Basquete Gaúcho`,
    description,
    keywords: tags.length ? tags : undefined,
    openGraph: {
      title: article.title,
      description,
      images: cover ? [cover] : undefined,
      type: 'article',
      publishedTime: article.publishedAt.toISOString(),
      tags: tags.length ? tags : undefined,
      siteName: 'FGB - Federação Gaúcha de Basketball',
    },
    twitter: {
      card: 'summary_large_image',
      title: article.title,
      description,
      images: cover ? [cover] : undefined,
    },
  }
}

export default async function ArticlePage(
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params
  await ensureDatabaseSchema().catch(() => {})

  const article = await prisma.article
    .findUnique({ where: { slug } })
    .catch(() => null)

  if (!article || !article.isPublished) notFound()

  prisma.article
    .update({ where: { id: article.id }, data: { views: { increment: 1 } } })
    .catch(() => {})

  const related = await prisma.article
    .findMany({
      where: {
        isPublished: true,
        category: article.category,
        NOT: { id: article.id },
      },
      orderBy: { publishedAt: 'desc' },
      take: 3,
      select: {
        id: true,
        slug: true,
        title: true,
        coverImage: true,
        category: true,
        readTime: true,
        publishedAt: true,
      },
    })
    .catch(() => [])

  const tags = parseTags(article.tags)

  return (
    <div>
      <PublicHeader />

      <nav
        className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 fgb-label flex items-center gap-1.5 flex-wrap"
        style={{ fontSize: 10, color: 'var(--fgb-ink-400)' }}
      >
        <Link href="/" style={{ color: 'inherit' }}>Início</Link>
        <ChevronRight size={11} />
        <Link href="/portal" style={{ color: 'inherit' }}>Portal</Link>
        <ChevronRight size={11} />
        <span style={{ color: 'var(--fgb-green-700)' }}>{article.category}</span>
      </nav>

      <header className="max-w-7xl mx-auto px-4 sm:px-6 mt-6">
        <div
          className="relative w-full overflow-hidden rounded-lg"
          style={{ background: 'var(--fgb-ink-900)', maxHeight: 420 }}
        >
          {article.coverImage && (
            <div className="relative w-full" style={{ aspectRatio: '16/7', maxHeight: 420 }}>
              <Image
                src={article.coverImage}
                alt={article.title}
                fill
                priority
                sizes="(min-width: 1280px) 1200px, 100vw"
                className="object-cover"
                unoptimized
              />
              <div
                className="absolute inset-0"
                style={{
                  background:
                    'linear-gradient(to bottom, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.7) 100%)',
                }}
              />
            </div>
          )}
          <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-10 text-white">
            <div className="flex items-center gap-3 flex-wrap mb-3">
              <span
                className="fgb-label px-2.5 py-1"
                style={{ background: 'var(--fgb-green-700)', color: '#fff', fontSize: 10 }}
              >
                {article.category}
              </span>
              <span className="fgb-label" style={{ color: 'rgba(255,255,255,0.75)', fontSize: 10 }}>
                {article.readTime} min de leitura
              </span>
              <span className="fgb-label" style={{ color: 'rgba(255,255,255,0.75)', fontSize: 10 }}>
                {formatDate(article.publishedAt)}
              </span>
            </div>
            <h1
              className="fgb-display"
              style={{ fontSize: 'clamp(28px, 4.5vw, 44px)', maxWidth: 880 }}
            >
              {article.title}
            </h1>
            {article.subtitle && (
              <p
                className="mt-3"
                style={{ fontSize: 17, lineHeight: 1.45, color: 'rgba(255,255,255,0.9)', maxWidth: 760 }}
              >
                {article.subtitle}
              </p>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 mt-10 grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-10 pb-16">
        <article
          className="fgb-article-body"
          dangerouslySetInnerHTML={{ __html: article.content }}
        />

        <aside className="space-y-6">
          {related.length > 0 && (
            <div>
              <p
                className="fgb-label mb-3 pb-2 border-b border-[var(--fgb-ink-200)]"
                style={{ fontSize: 10, color: 'var(--fgb-ink-500)', letterSpacing: '0.18em' }}
              >
                Leia também
              </p>
              <ul className="space-y-3">
                {related.map((r) => (
                  <li key={r.id}>
                    <Link
                      href={`/portal/${r.slug}`}
                      className="flex gap-3 group"
                    >
                      <div className="relative w-20 h-20 flex-shrink-0 overflow-hidden rounded bg-[var(--fgb-ink-100)]">
                        {r.coverImage && (
                          <Image
                            src={r.coverImage}
                            alt={r.title}
                            fill
                            sizes="80px"
                            className="object-cover"
                            unoptimized
                          />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p
                          className="fgb-label"
                          style={{ fontSize: 8, color: 'var(--fgb-green-700)' }}
                        >
                          {r.category}
                        </p>
                        <p
                          className="text-[var(--fgb-ink-900)] group-hover:text-[var(--fgb-green-700)] transition-colors mt-1"
                          style={{
                            fontSize: 13,
                            fontWeight: 600,
                            lineHeight: 1.3,
                            display: '-webkit-box',
                            WebkitLineClamp: 3,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                          }}
                        >
                          {r.title}
                        </p>
                        <p
                          className="fgb-label mt-1"
                          style={{ fontSize: 8, color: 'var(--fgb-ink-400)' }}
                        >
                          {r.readTime} min
                        </p>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div
            className="p-5 rounded-lg"
            style={{ background: 'var(--fgb-ink-50)', border: '1px solid var(--fgb-ink-200)' }}
          >
            <p className="fgb-label mb-2" style={{ fontSize: 9, color: 'var(--fgb-green-700)', letterSpacing: '0.2em' }}>
              Sobre a FGB
            </p>
            <p className="text-[var(--fgb-ink-700)]" style={{ fontSize: 13, lineHeight: 1.55 }}>
              A Federação Gaúcha de Basketball, fundada em 1952, organiza
              campeonatos e desenvolve o basquete em todo o Rio Grande do Sul.
            </p>
            <Link
              href="/fgb/historia"
              className="fgb-label inline-block mt-3"
              style={{ fontSize: 10, color: 'var(--fgb-green-700)' }}
            >
              Conheça nossa história →
            </Link>
          </div>

          <div
            className="p-5 rounded-lg"
            style={{ background: 'var(--fgb-green-700)', color: '#fff' }}
          >
            <p
              className="fgb-label mb-2"
              style={{ fontSize: 9, color: 'var(--fgb-yellow-500)', letterSpacing: '0.2em' }}
            >
              Nossas competições
            </p>
            <p style={{ fontSize: 14, lineHeight: 1.5 }}>
              Acompanhe os campeonatos da FGB em todas as categorias.
            </p>
            <Link
              href="/campeonatos"
              className="fgb-label inline-block mt-3"
              style={{ fontSize: 10, color: 'var(--fgb-yellow-500)' }}
            >
              Ver campeonatos →
            </Link>
          </div>
        </aside>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:pr-[340px] pb-12">
        {article.sourceUrl && (
          <p
            className="fgb-label mb-5 pb-3 border-b border-[var(--fgb-ink-200)]"
            style={{ fontSize: 10, color: 'var(--fgb-ink-400)' }}
          >
            Fonte:{' '}
            <a
              href={article.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: 'var(--fgb-green-700)' }}
            >
              {article.source ?? article.sourceUrl}
            </a>
          </p>
        )}

        {tags.length > 0 && (
          <div className="mb-6 flex flex-wrap gap-2">
            {tags.map((t) => (
              <span
                key={t}
                className="fgb-label px-2.5 py-1"
                style={{
                  fontSize: 9,
                  background: 'var(--fgb-ink-100)',
                  color: 'var(--fgb-ink-700)',
                }}
              >
                #{t}
              </span>
            ))}
          </div>
        )}

        <div className="pt-5 border-t border-[var(--fgb-ink-200)]">
          <p
            className="fgb-label mb-3"
            style={{ fontSize: 10, color: 'var(--fgb-ink-500)' }}
          >
            Compartilhar
          </p>
          <ShareButtons title={article.title} slug={article.slug} />
        </div>
      </div>

      <PublicFooter />
    </div>
  )
}
