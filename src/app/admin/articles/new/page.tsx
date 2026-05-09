import { ArticleForm } from '../ArticleForm'
import { createArticle } from '../actions'

export const dynamic = 'force-dynamic'

export default function NewArticlePage() {
  return (
    <div className="space-y-6 pb-12 max-w-4xl">
      <div>
        <h1 className="fgb-display text-3xl text-[var(--fgb-ink-900)]">Novo artigo</h1>
        <p
          className="fgb-label text-[var(--fgb-ink-400)] mt-1"
          style={{ textTransform: 'none', letterSpacing: 0 }}
        >
          Publique no Portal do Basquete Gaúcho.
        </p>
      </div>

      <ArticleForm action={createArticle} submitLabel="Criar artigo" />
    </div>
  )
}
