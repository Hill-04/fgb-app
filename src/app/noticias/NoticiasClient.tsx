'use client'
import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'

type Category = { value: string; label: string; color: string }
type Post = {
  id: string
  title: string
  slug: string
  category: string
  author: string | null
  featured: boolean
  excerpt: string | null
  coverUrl: string | null
  readingTime: number | null
  publishedAt: string | null
}

export default function NoticiasClient({
  featured,
  posts,
  categories,
}: {
  featured: Post | null
  posts: Post[]
  categories: Category[]
}) {
  const [activeTab, setActiveTab] = useState('ALL')

  const filtered = activeTab === 'ALL'
    ? posts
    : posts.filter(p => p.category === activeTab)

  const getCat   = (val: string) => categories.find(c => c.value === val)
  const getColor = (val: string) => getCat(val)?.color ?? '#888'
  const getLabel = (val: string) => getCat(val)?.label ?? val

  return (
    <div>
      {/* Featured hero */}
      {featured && (
        <div className="mb-10">
          <Link
            href={`/noticias/${featured.slug}`}
            className="group block fgb-card overflow-hidden hover:shadow-lg transition-shadow"
          >
            <div className="grid grid-cols-1 md:grid-cols-2">
              <div className="relative h-64 md:h-auto min-h-[280px] bg-[var(--gray-l)]">
                {featured.coverUrl ? (
                  <Image
                    src={featured.coverUrl}
                    alt={featured.title}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-[var(--verde)]/30 to-[var(--yellow)]/20" />
                )}
                <span
                  className="absolute top-4 left-4 text-[11px] font-bold px-2.5 py-1 rounded-full text-white shadow"
                  style={{ backgroundColor: getColor(featured.category) }}
                >
                  ★ Destaque · {getLabel(featured.category)}
                </span>
              </div>
              <div className="p-8 flex flex-col justify-center">
                <div className="fgb-label text-[var(--gray)] mb-3">
                  {featured.publishedAt
                    ? new Date(featured.publishedAt).toLocaleDateString('pt-BR', {
                        day: '2-digit', month: 'long', year: 'numeric',
                      })
                    : ''}
                  {featured.readingTime && (
                    <span className="ml-3">{featured.readingTime} min de leitura</span>
                  )}
                </div>
                <h2 className="fgb-display text-[22px] md:text-[28px] text-[var(--black)] mb-4 leading-tight group-hover:text-[var(--verde)] transition-colors">
                  {featured.title}
                </h2>
                {featured.excerpt && (
                  <p
                    className="fgb-label text-[var(--gray)] mb-6"
                    style={{ textTransform: 'none', letterSpacing: 0, lineHeight: 1.7 }}
                  >
                    {featured.excerpt}
                  </p>
                )}
                <span className="fgb-label" style={{ color: 'var(--verde)' }}>
                  Ler artigo completo →
                </span>
              </div>
            </div>
          </Link>
        </div>
      )}

      {/* Category tabs */}
      <div className="flex gap-2 flex-wrap mb-8">
        <button
          onClick={() => setActiveTab('ALL')}
          className={`text-xs font-bold px-4 py-2 rounded-full border transition-colors ${
            activeTab === 'ALL'
              ? 'bg-[var(--black)] text-white border-[var(--black)]'
              : 'bg-white text-[var(--gray)] border-[var(--border)] hover:border-[var(--black)]'
          }`}
        >
          Todos
        </button>
        {categories.map(cat => (
          <button
            key={cat.value}
            onClick={() => setActiveTab(cat.value)}
            className="text-xs font-bold px-4 py-2 rounded-full border transition-colors"
            style={
              activeTab === cat.value
                ? { backgroundColor: cat.color, color: 'white', borderColor: cat.color }
                : { backgroundColor: 'white', color: 'var(--gray)', borderColor: 'var(--border)' }
            }
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="fgb-card p-12 text-center">
          <p className="fgb-label text-[var(--gray)]">Nenhum artigo nesta categoria ainda.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map(post => (
            <article key={post.id} className="fgb-card overflow-hidden group hover:shadow-md transition-shadow">
              <Link href={`/noticias/${post.slug}`} className="block">
                <div className="relative h-44 bg-[var(--gray-l)]">
                  {post.coverUrl ? (
                    <Image
                      src={post.coverUrl}
                      alt={post.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      unoptimized
                    />
                  ) : (
                    <div
                      className="absolute inset-0 opacity-10"
                      style={{ backgroundColor: getColor(post.category) }}
                    />
                  )}
                  <span
                    className="absolute top-3 left-3 text-[10px] font-bold px-2 py-0.5 rounded-full text-white"
                    style={{ backgroundColor: getColor(post.category) }}
                  >
                    {getLabel(post.category)}
                  </span>
                </div>
                <div className="p-5">
                  <div className="fgb-label text-[var(--gray)] mb-2">
                    {post.publishedAt
                      ? new Date(post.publishedAt).toLocaleDateString('pt-BR')
                      : ''}
                    {post.readingTime && (
                      <span className="ml-2">· {post.readingTime} min</span>
                    )}
                  </div>
                  <h3 className="fgb-display text-[15px] text-[var(--black)] mb-2 leading-snug line-clamp-2 group-hover:text-[var(--verde)] transition-colors">
                    {post.title}
                  </h3>
                  {post.excerpt && (
                    <p
                      className="fgb-label text-[var(--gray)] line-clamp-2"
                      style={{ textTransform: 'none', letterSpacing: 0, lineHeight: 1.6 }}
                    >
                      {post.excerpt}
                    </p>
                  )}
                  <span className="fgb-label mt-3 inline-flex" style={{ color: 'var(--verde)' }}>
                    Ler artigo →
                  </span>
                </div>
              </Link>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
