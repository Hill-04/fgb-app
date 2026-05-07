import { createPost } from '../actions'
import { CATEGORIES } from '../categories'

export default function NewPostPage() {
  return (
    <div className="max-w-5xl space-y-6 pb-12">
      <div>
        <h1 className="fgb-display text-3xl text-[var(--black)]">Novo Artigo</h1>
        <p className="fgb-label text-[var(--gray)] mt-1" style={{ textTransform: 'none', letterSpacing: 0 }}>
          Crie um artigo ou notícia para publicação no portal.
        </p>
      </div>

      <form action={createPost}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Coluna principal */}
          <div className="lg:col-span-2 space-y-4">
            <div className="fgb-card p-5 space-y-4">
              <div>
                <label className="fgb-label text-[var(--gray)] mb-1.5 block">Título *</label>
                <input
                  name="title"
                  required
                  placeholder="Título do artigo"
                  className="w-full h-11 rounded-xl border border-[var(--border)] bg-white px-3 text-sm font-bold"
                />
              </div>
              <div>
                <label className="fgb-label text-[var(--gray)] mb-1.5 block">Resumo</label>
                <input
                  name="excerpt"
                  placeholder="Breve descrição que aparece na listagem"
                  className="w-full h-10 rounded-xl border border-[var(--border)] bg-white px-3 text-sm"
                />
              </div>
              <div>
                <label className="fgb-label text-[var(--gray)] mb-1.5 block">Conteúdo *</label>
                <p className="text-[11px] text-[var(--gray)] mb-1.5">Suporta formatação Markdown (negrito, listas, títulos, links)</p>
                <textarea
                  name="content"
                  required
                  placeholder="## Título da seção&#10;&#10;Escreva o conteúdo aqui..."
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
                  placeholder="Deixe vazio para usar o título do artigo"
                  className="w-full h-10 rounded-xl border border-[var(--border)] bg-white px-3 text-sm"
                />
              </div>
              <div>
                <label className="fgb-label text-[var(--gray)] mb-1.5 block">Meta Descrição</label>
                <textarea
                  name="metaDescription"
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
                  defaultValue="DRAFT"
                  className="w-full h-10 rounded-xl border border-[var(--border)] bg-white px-3 text-sm"
                >
                  <option value="DRAFT">Rascunho</option>
                  <option value="PUBLISHED">Publicar agora</option>
                </select>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" name="featured" className="accent-[var(--verde)] w-4 h-4" />
                <span className="fgb-label text-[var(--gray)]" style={{ textTransform: 'none', letterSpacing: 0 }}>
                  Destacar no topo da página
                </span>
              </label>
              <div className="pt-2 space-y-2">
                <button type="submit" className="fgb-btn-primary w-full h-10 rounded-xl">
                  Salvar artigo
                </button>
                <a
                  href="/admin/news"
                  className="fgb-btn-secondary w-full h-10 rounded-xl flex items-center justify-center text-sm"
                >
                  Cancelar
                </a>
              </div>
            </div>

            <div className="fgb-card p-5 space-y-4">
              <p className="fgb-label text-[var(--gray)]">Classificação</p>
              <div>
                <label className="fgb-label text-[var(--gray)] mb-1.5 block">Categoria</label>
                <select
                  name="category"
                  defaultValue="NOTICIAS"
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
                  placeholder="Nome do autor"
                  className="w-full h-10 rounded-xl border border-[var(--border)] bg-white px-3 text-sm"
                />
              </div>
              <div>
                <label className="fgb-label text-[var(--gray)] mb-1.5 block">Tags</label>
                <input
                  name="tags"
                  placeholder="basquete, fgb, gaúcho (separadas por vírgula)"
                  className="w-full h-10 rounded-xl border border-[var(--border)] bg-white px-3 text-sm"
                />
              </div>
            </div>

            <div className="fgb-card p-5 space-y-3">
              <p className="fgb-label text-[var(--gray)]">Imagem de Capa</p>
              <input
                name="coverUrl"
                placeholder="https://..."
                className="w-full h-10 rounded-xl border border-[var(--border)] bg-white px-3 text-sm"
              />
              <p className="text-[11px] text-[var(--gray)]">Cole a URL de uma imagem (16:9 recomendado)</p>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
