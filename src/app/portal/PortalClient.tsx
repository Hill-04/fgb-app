'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'

type ArticleCard = {
  id: string
  slug: string
  title: string
  subtitle: string | null
  coverImage: string | null
  category: string
  author: string
  publishedAt: string | null
  readTime: number
}

const CATEGORIES = ['Todos', 'Conhecimento', 'Notícias', 'Basquete Gaúcho', 'Institucional']

function formatDate(iso: string | null) {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function PortalClient({ articles }: { articles: ArticleCard[] }) {
  const [active, setActive] = useState<string>('Todos')

  const filtered = useMemo(() => {
    if (active === 'Todos') return articles
    return articles.filter((a) => a.category === active)
  }, [active, articles])

  return (
    <>
      <div className="flex flex-wrap gap-2 mb-10 border-b border-[var(--fgb-ink-200)] pb-3">
        {CATEGORIES.map((cat) => {
          const isActive = cat === active
          return (
            <button
              key={cat}
              onClick={() => setActive(cat)}
              className="fgb-label px-4 py-2 transition-colors"
              style={{
                fontSize: 11,
                background: isActive ? 'var(--fgb-green-700)' : 'transparent',
                color: isActive ? '#fff' : 'var(--fgb-ink-600)',
                border: `1px solid ${isActive ? 'var(--fgb-green-700)' : 'var(--fgb-ink-200)'}`,
              }}
            >
              {cat}
            </button>
          )
        })}
      </div>

      {filtered.length === 0 ? (
        <div className="fgb-card p-12 text-center">
          <p className="fgb-label text-[var(--fgb-ink-400)]">
            Nenhum artigo nesta categoria ainda.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((a) => (
            <Link
              key={a.id}
              href={`/portal/${a.slug}`}
              className="fgb-card overflow-hidden group flex flex-col"
            >
              <div className="relative aspect-[16/9] overflow-hidden bg-[var(--fgb-ink-100)]">
                {a.coverImage ? (
                  <Image
                    src={a.coverImage}
                    alt={a.title}
                    fill
                    sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    unoptimized
                  />
                ) : (
                  <div className="absolute inset-0 fgb-tricolor opacity-30" />
                )}
                <span
                  className="fgb-label absolute top-3 left-3 px-2.5 py-1"
                  style={{
                    fontSize: 9,
                    background: 'var(--fgb-green-700)',
                    color: '#fff',
                  }}
                >
                  {a.category}
                </span>
              </div>
              <div className="p-5 flex flex-col flex-1">
                <h3
                  className="fgb-heading text-[var(--fgb-ink-900)] mb-2"
                  style={{ fontSize: 18, lineHeight: 1.25, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
                >
                  {a.title}
                </h3>
                {a.subtitle && (
                  <p
                    className="text-[var(--fgb-ink-500)] mb-4"
                    style={{ fontSize: 14, lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
                  >
                    {a.subtitle}
                  </p>
                )}
                <div
                  className="fgb-label mt-auto pt-3 border-t border-[var(--fgb-ink-200)] flex items-center gap-2 flex-wrap"
                  style={{ fontSize: 9, color: 'var(--fgb-ink-400)' }}
                >
                  <span>{a.author}</span>
                  <span>·</span>
                  <span>{formatDate(a.publishedAt)}</span>
                  <span>·</span>
                  <span>{a.readTime} min</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  )
}
