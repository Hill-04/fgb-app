import type { Metadata } from 'next'
import { prisma } from '@/lib/db'
import { PublicHeader } from '@/components/PublicHeader'
import { PublicFooter } from '@/components/PublicFooter'
import NoticiasClient from './NoticiasClient'

const CATEGORIES = [
  { value: 'NOTICIAS',      label: 'Notícias',               color: '#145530' },
  { value: 'CURIOSIDADES',  label: 'Curiosidades',           color: '#1d6fa4' },
  { value: 'REGRAS',        label: 'Regras do Jogo',         color: '#7b3fa0' },
  { value: 'HISTORIA',      label: 'História do Basquete',   color: '#c05621' },
  { value: 'CBB',           label: 'CBB & Nacional',         color: '#b44' },
  { value: 'INTERNACIONAL', label: 'Basquete Internacional', color: '#0d7377' },
  { value: 'FEDERACAO',     label: 'FGB & Federação',        color: '#145530' },
]

export const metadata: Metadata = {
  title: 'Portal de Conteúdo — FGB',
  description:
    'Notícias, curiosidades, regras do jogo e tudo sobre o basquete gaúcho e nacional. Federação Gaúcha de Basketball.',
  openGraph: {
    title: 'Portal de Conteúdo — FGB',
    description: 'Conteúdo sobre basquete: notícias, curiosidades, regras e história.',
    type: 'website',
  },
}

export const dynamic = 'force-dynamic'

export default async function NoticiasPage() {
  const posts = await prisma.newsPost.findMany({
    where: { status: 'PUBLISHED' },
    orderBy: { publishedAt: 'desc' },
    take: 50,
    select: {
      id: true,
      title: true,
      slug: true,
      category: true,
      author: true,
      featured: true,
      excerpt: true,
      coverUrl: true,
      readingTime: true,
      publishedAt: true,
    },
  }).catch(() => [])

  const featuredPost = posts.find(p => p.featured) ?? null
  const remaining    = posts.filter(p => p.id !== featuredPost?.id)

  const serialize = (p: typeof posts[0]) => ({
    ...p,
    publishedAt: p.publishedAt?.toISOString() ?? null,
  })

  return (
    <div>
      <PublicHeader />

      <div className="fgb-page-header">
        <div className="fgb-page-header-bg" />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 relative text-center">
          <div className="fgb-page-header-eyebrow">Portal FGB</div>
          <h1 className="fgb-page-header-title">Basquete em Pauta</h1>
          <p className="fgb-page-header-sub mx-auto">
            Notícias, curiosidades, regras e tudo sobre o basquete gaúcho e nacional.
          </p>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-14">
        {posts.length === 0 ? (
          <div className="fgb-card p-12 text-center">
            <p className="fgb-label text-[var(--gray)]">Nenhum conteúdo publicado ainda.</p>
          </div>
        ) : (
          <NoticiasClient
            featured={featuredPost ? serialize(featuredPost) : null}
            posts={remaining.map(serialize)}
            categories={CATEGORIES}
          />
        )}
      </main>

      <PublicFooter />
    </div>
  )
}
