import { notFound } from 'next/navigation'
import { prisma } from '@/lib/db'
import { updatePost, deletePost, CATEGORIES } from '../actions'

export const dynamic = 'force-dynamic'

export default async function EditPostPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const post = await prisma.newsPost.findUnique({ where: { id } })
  if (!post) notFound()

  const update = updatePost.bind(null, id)
  const remove = deletePost.bind(null, id)

  return (
    <div className="max-w-5xl space-y-6 pb-12">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="fgb-display text-3xl text-[var(--black)]">Editar Artigo</h1>
          <p
            className="fgb-label text-[var(--gray)] mt-1 truncate max-w-xl"
            style={{ textTransform: 'none', letterSpacing: 0 }}
          >
            {post.title}
          </p>
        </div>
        {post.status === 'PUBLISHED' && (
          <a
            href={`/noticias/${post.slug}`}
            target="_blank"
            rel="noopener"
            className="fgb-btn-secondary h-9 px-4 rounded-xl text-sm flex items-center gap-1 shrink-0"
          >
            Ver no site ↗
          </a>
        )}
      </div>

      <form action={update}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Coluna principal */}
          <div className="lg:col-span-2 space-y-4">
            <div className="fgb-card p-5 space-y-4">
              <div>
                <label className="fgb-label text-[var(--gray)] mb-1.5 block">Título *</label>
                <input
                  name="title"
                  required
                  defaultValue={post.title}
                  className="w-full h-11 rounded-xl border border-[var(--border)] bg-white px-3 text-sm font-bold"
                />
              </div>
              <div>
                <label className="fgb-label text-[var(--gray)] mb-1.5 block">Resumo</label>
                <input
                  name="excerpt"
                  defaultValue={post.excerpt ?? ''}
                  placeholder="Breve descrição que aparece na listagem"
                  className="w-full h-10 rounded-xl border border-[var(--border)] bg-white px-3 text-sm"
                />
              </div>
              <div>
                <label className="fgb-label text-[var(--gray)] mb-1.5 block">Conteúdo *</label>
                <p className="text-[11px] text-[var(--gray)] mb-1.5">Suporta formatação Markdown</p>
                <textarea
                  name="content"
                  required
                  defaultValue={post.content}
                  className="w-full min-h-[400px] rounded-xl border border-[var(--border)] bg-white px-3 py-2.5 text-sm font-mono resize-y"
                />
              </div>
            </div>

            <div className="fgb-card p-5 space-y-4">
              <p className="fgb-label text-[var(--gray)]">SEO</p>
              <div>
                <label className="fgb-label text-[var(--gray)] mb-1.5 block">Meta Título</label>
                <input
                  name="metaTitle"
                  defaultValue={post.metaTitle ?? ''}
                  placeholder="Deixe vazio para usar o título do artigo"
                  className="w-full h-10 rounded-xl border border-[var(--border)] bg-white px-3 text-sm"
                />
              </div>
              <div>
                <label className="fgb-label text-[var(--gray)] mb-1.5 block">Meta Descrição</label>
                <textarea
                  name="metaDescription"
                  defaultValue={post.metaDescription ?? ''}
                  placeholder="Descrição para motores de busca (ideal: até 160 caracteres)"
                  className="w-full h-20 rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm resize-none"
                  maxLength={320}
                />
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <div className="fgb-card p-5 space-y-4">
              <p className="fgb-label text-[var(--gray)]">Publicação</p>
              <div>
                <label className="fgb-label text-[var(--gray)] mb-1.5 block">Status</label>
                <select
                  name="status"
                  defaultValue={post.status}
                  className="w-full h-10 rounded-xl border border-[var(--border)] bg-white px-3 text-sm"
                >
                  <option value="DRAFT">Rascunho</option>
                  <option value="PUBLISHED">Publicado</option>
                </select>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="featured"
                  defaultChecked={post.featured}
                  className="accent-[var(--verde)] w-4 h-4"
                />
                <span className="fgb-label text-[var(--gray)]" style={{ textTransform: 'none', letterSpacing: 0 }}>
                  Destacar no topo da página
                </span>
              </label>
              {post.publishedAt && (
                <p className="text-[11px] text-[var(--gray)]">
                  Publicado em {new Date(post.publishedAt).toLocaleDateString('pt-BR')}
                </p>
              )}
              <div className="pt-2 space-y-2">
                <button type="submit" className="fgb-btn-primary w-full h-10 rounded-xl">
                  Salvar alterações
                </button>
                <a
                  href="/admin/news"
                  className="fgb-btn-secondary w-full h-10 rounded-xl flex items-center justify-center text-sm"
                >
                  Voltar à lista
                </a>
              </div>
            </div>

            <div className="fgb-card p-5 space-y-4">
              <p className="fgb-label text-[var(--gray)]">Classificação</p>
              <div>
                <label className="fgb-label text-[var(--gray)] mb-1.5 block">Categoria</label>
                <select
                  name="category"
                  defaultValue={post.category}
                  className="w-full h-10 rounded-xl border border-[var(--border)] bg-white px-3 text-sm"
                >
                  {CATEGORIES.map(c => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="fgb-label text-[var(--gray)] mb-1.5 block">Autor</label>
                <input
                  name="author"
                  defaultValue={post.author ?? ''}
                  placeholder="Nome do autor"
                  className="w-full h-10 rounded-xl border border-[var(--border)] bg-white px-3 text-sm"
                />
              </div>
              <div>
                <label className="fgb-label text-[var(--gray)] mb-1.5 block">Tags</label>
                <input
                  name="tags"
                  defaultValue={post.tags ?? ''}
                  placeholder="basquete, fgb, gaúcho"
                  className="w-full h-10 rounded-xl border border-[var(--border)] bg-white px-3 text-sm"
                />
              </div>
            </div>

            <div className="fgb-card p-5 space-y-3">
              <p className="fgb-label text-[var(--gray)]">Imagem de Capa</p>
              <input
                name="coverUrl"
                defaultValue={post.coverUrl ?? ''}
                placeholder="https://..."
                className="w-full h-10 rounded-xl border border-[var(--border)] bg-white px-3 text-sm"
              />
            </div>

            <div className="fgb-card p-5 border border-red-100">
              <p className="fgb-label text-[var(--gray)] mb-3">Zona de Perigo</p>
              <form action={remove}>
                <button
                  type="submit"
                  className="w-full h-9 rounded-xl border border-red-200 bg-white hover:bg-red-50 transition-colors text-xs font-bold text-red-500"
                >
                  Excluir artigo permanentemente
                </button>
              </form>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
