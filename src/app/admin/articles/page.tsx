import Link from 'next/link'
import { prisma } from '@/lib/db'
import { ensureDatabaseSchema } from '@/lib/db-patch'
import { deleteArticle } from './actions'

export const dynamic = 'force-dynamic'

function formatDate(d: Date | null) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  })
}

export default async function AdminArticlesPage() {
  await ensureDatabaseSchema().catch(() => {})

  const articles = await prisma.article
    .findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        slug: true,
        title: true,
        category: true,
        isPublished: true,
        publishedAt: true,
        views: true,
        readTime: true,
      },
      take: 200,
    })
    .catch(() => [])

  const published = articles.filter((a) => a.isPublished).length
  const drafts = articles.filter((a) => !a.isPublished).length

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="fgb-display text-3xl text-[var(--fgb-ink-900)]">Portal — Artigos</h1>
          <p
            className="fgb-label text-[var(--fgb-ink-400)] mt-1"
            style={{ textTransform: 'none', letterSpacing: 0 }}
          >
            {published} publicados · {drafts} rascunhos
          </p>
        </div>
        <Link
          href="/admin/articles/new"
          className="fgb-btn-primary h-10 px-5 flex items-center gap-2 text-sm shrink-0"
        >
          + Novo Artigo
        </Link>
      </div>

      <div className="fgb-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr
                className="text-left fgb-label"
                style={{
                  background: 'var(--fgb-ink-50)',
                  fontSize: 10,
                  color: 'var(--fgb-ink-500)',
                  letterSpacing: '0.14em',
                }}
              >
                <th className="px-4 py-3">Título</th>
                <th className="px-4 py-3">Categoria</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Publicado</th>
                <th className="px-4 py-3 text-right">Views</th>
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {articles.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-[var(--fgb-ink-400)]">
                    Nenhum artigo criado ainda.
                  </td>
                </tr>
              ) : (
                articles.map((a) => (
                  <tr
                    key={a.id}
                    className="border-t border-[var(--fgb-ink-200)]"
                  >
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/articles/${a.id}`}
                        className="text-[var(--fgb-ink-900)] hover:text-[var(--fgb-green-700)] transition-colors"
                        style={{ fontWeight: 600 }}
                      >
                        {a.title}
                      </Link>
                      <p
                        className="fgb-label mt-0.5"
                        style={{ fontSize: 9, color: 'var(--fgb-ink-400)', textTransform: 'none', letterSpacing: 0 }}
                      >
                        /portal/{a.slug}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-[var(--fgb-ink-700)]">{a.category}</td>
                    <td className="px-4 py-3">
                      <span
                        className="fgb-label px-2 py-0.5"
                        style={{
                          fontSize: 9,
                          background: a.isPublished ? 'var(--fgb-green-50)' : 'var(--fgb-ink-100)',
                          color: a.isPublished ? 'var(--fgb-green-700)' : 'var(--fgb-ink-500)',
                        }}
                      >
                        {a.isPublished ? 'Publicado' : 'Rascunho'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[var(--fgb-ink-700)]">{formatDate(a.publishedAt)}</td>
                    <td className="px-4 py-3 text-right text-[var(--fgb-ink-700)]">{a.views}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center gap-3 justify-end">
                        <Link
                          href={`/portal/${a.slug}`}
                          target="_blank"
                          className="fgb-label"
                          style={{ fontSize: 10, color: 'var(--fgb-ink-500)' }}
                        >
                          Ver
                        </Link>
                        <Link
                          href={`/admin/articles/${a.id}`}
                          className="fgb-label"
                          style={{ fontSize: 10, color: 'var(--fgb-green-700)' }}
                        >
                          Editar
                        </Link>
                        {a.isPublished && (
                          <form
                            action={async () => {
                              'use server'
                              await deleteArticle(a.id)
                            }}
                          >
                            <button
                              type="submit"
                              className="fgb-label"
                              style={{ fontSize: 10, color: 'var(--fgb-red-500)' }}
                            >
                              Despublicar
                            </button>
                          </form>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
