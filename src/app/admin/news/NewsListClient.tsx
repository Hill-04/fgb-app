'use client'
import { useState, useTransition } from 'react'
import Link from 'next/link'
import { togglePublish, deletePost } from './actions'

type Category = { value: string; label: string; color: string }
type Post = {
  id: string
  title: string
  slug: string
  category: string
  author: string | null
  featured: boolean
  status: string
  publishedAt: string | null
  createdAt: string
  readingTime: number | null
  excerpt: string | null
}

export default function NewsListClient({
  posts,
  categories,
}: {
  posts: Post[]
  categories: Category[]
}) {
  const [search, setSearch]       = useState('')
  const [catFilter, setCatFilter] = useState('ALL')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [isPending, startTransition]    = useTransition()

  const filtered = posts.filter(p => {
    const q = search.toLowerCase()
    const matchSearch =
      !q ||
      p.title.toLowerCase().includes(q) ||
      (p.author?.toLowerCase().includes(q) ?? false)
    const matchCat    = catFilter === 'ALL'    || p.category === catFilter
    const matchStatus = statusFilter === 'ALL' || p.status   === statusFilter
    return matchSearch && matchCat && matchStatus
  })

  function handleToggle(id: string) {
    startTransition(() => togglePublish(id))
  }

  function handleDelete(id: string, title: string) {
    if (!confirm(`Excluir "${title}"?\n\nEsta ação não pode ser desfeita.`)) return
    startTransition(() => deletePost(id))
  }

  const getCat   = (val: string) => categories.find(c => c.value === val)
  const getColor = (val: string) => getCat(val)?.color ?? '#888'
  const getLabel = (val: string) => getCat(val)?.label ?? val

  return (
    <div className="fgb-card overflow-hidden">
      <div className="px-5 py-4 border-b border-[var(--border)] bg-[var(--gray-l)] flex flex-wrap gap-3">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por título ou autor..."
          className="h-9 rounded-xl border border-[var(--border)] bg-white px-3 text-sm w-64"
        />
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="h-9 rounded-xl border border-[var(--border)] bg-white px-3 text-sm"
        >
          <option value="ALL">Todos os status</option>
          <option value="PUBLISHED">Publicado</option>
          <option value="DRAFT">Rascunho</option>
        </select>
        <select
          value={catFilter}
          onChange={e => setCatFilter(e.target.value)}
          className="h-9 rounded-xl border border-[var(--border)] bg-white px-3 text-sm"
        >
          <option value="ALL">Todas as categorias</option>
          {categories.map(c => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
        <span className="ml-auto text-[11px] text-[var(--gray)] self-center">
          {filtered.length} artigo{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="divide-y divide-[var(--border)] bg-white">
        {filtered.length === 0 ? (
          <div className="p-10 text-center text-sm text-[var(--gray)]">
            Nenhum artigo encontrado.
          </div>
        ) : (
          filtered.map(post => (
            <div
              key={post.id}
              className={`px-5 py-4 flex items-start justify-between gap-4 transition-opacity ${isPending ? 'opacity-50 pointer-events-none' : ''}`}
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  <span
                    className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white"
                    style={{ backgroundColor: getColor(post.category) }}
                  >
                    {getLabel(post.category)}
                  </span>
                  {post.featured && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-fgb-yellow-100 text-fgb-yellow-700">
                      ★ Destaque
                    </span>
                  )}
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      post.status === 'PUBLISHED'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-fgb-ink-100 text-fgb-ink-500'
                    }`}
                  >
                    {post.status === 'PUBLISHED' ? 'Publicado' : 'Rascunho'}
                  </span>
                </div>
                <p className="text-sm font-black text-[var(--black)] leading-snug line-clamp-1">
                  {post.title}
                </p>
                <div className="flex items-center gap-3 mt-1 flex-wrap">
                  {post.author && (
                    <span className="text-[11px] text-[var(--gray)]">{post.author}</span>
                  )}
                  {post.readingTime && (
                    <span className="text-[11px] text-[var(--gray)]">{post.readingTime} min de leitura</span>
                  )}
                  <span className="text-[11px] text-[var(--gray)]">
                    {post.publishedAt
                      ? new Date(post.publishedAt).toLocaleDateString('pt-BR')
                      : new Date(post.createdAt).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Link
                  href={`/admin/news/${post.id}`}
                  className="fgb-btn-secondary h-8 px-3 text-xs rounded-xl"
                >
                  Editar
                </Link>
                <button
                  onClick={() => handleToggle(post.id)}
                  disabled={isPending}
                  className="h-8 px-3 text-xs rounded-xl border border-[var(--border)] bg-white hover:bg-[var(--gray-l)] transition-colors font-bold text-[var(--gray)]"
                >
                  {post.status === 'PUBLISHED' ? 'Despublicar' : 'Publicar'}
                </button>
                <button
                  onClick={() => handleDelete(post.id, post.title)}
                  disabled={isPending}
                  className="h-8 px-3 text-xs rounded-xl border border-red-200 bg-white hover:bg-red-50 transition-colors font-bold text-red-500"
                >
                  Excluir
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
