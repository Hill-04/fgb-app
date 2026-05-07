import { prisma } from '@/lib/db'
import Link from 'next/link'
import { CATEGORIES } from './actions'
import NewsListClient from './NewsListClient'

export const dynamic = 'force-dynamic'

export default async function AdminNewsPage() {
  const posts = await prisma.newsPost.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      title: true,
      slug: true,
      category: true,
      author: true,
      featured: true,
      status: true,
      publishedAt: true,
      createdAt: true,
      readingTime: true,
      excerpt: true,
    },
  }).catch(() => [])

  const published = posts.filter(p => p.status === 'PUBLISHED').length
  const drafts    = posts.filter(p => p.status === 'DRAFT').length
  const featured  = posts.filter(p => p.featured).length

  const serialized = posts.map(p => ({
    ...p,
    publishedAt: p.publishedAt?.toISOString() ?? null,
    createdAt:   p.createdAt.toISOString(),
  }))

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="fgb-display text-3xl text-[var(--black)]">Conteúdo Editorial</h1>
          <p className="fgb-label text-[var(--gray)] mt-1" style={{ textTransform: 'none', letterSpacing: 0 }}>
            Artigos, notícias, curiosidades e conteúdo educativo sobre basquete.
          </p>
        </div>
        <Link
          href="/admin/news/new"
          className="fgb-btn-primary h-10 px-5 rounded-xl flex items-center gap-2 text-sm shrink-0"
        >
          + Novo Artigo
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="fgb-card p-5">
          <p className="fgb-label text-[var(--gray)]">Total</p>
          <p className="fgb-display text-3xl mt-1 text-[var(--black)]">{posts.length}</p>
        </div>
        <div className="fgb-card p-5">
          <p className="fgb-label text-[var(--gray)]">Publicados</p>
          <p className="fgb-display text-3xl mt-1" style={{ color: 'var(--verde)' }}>{published}</p>
        </div>
        <div className="fgb-card p-5">
          <p className="fgb-label text-[var(--gray)]">Rascunhos</p>
          <p className="fgb-display text-3xl mt-1" style={{ color: '#c05621' }}>{drafts}</p>
        </div>
        <div className="fgb-card p-5">
          <p className="fgb-label text-[var(--gray)]">Em Destaque</p>
          <p className="fgb-display text-3xl mt-1" style={{ color: '#1d6fa4' }}>{featured}</p>
        </div>
      </div>

      <NewsListClient posts={serialized} categories={CATEGORIES} />
    </div>
  )
}
