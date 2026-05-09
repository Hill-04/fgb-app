import { notFound } from 'next/navigation'
import { prisma } from '@/lib/db'
import { ensureDatabaseSchema } from '@/lib/db-patch'
import { ArticleForm } from '../ArticleForm'
import { updateArticle } from '../actions'

export const dynamic = 'force-dynamic'

export default async function EditArticlePage(
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  await ensureDatabaseSchema().catch(() => {})

  const article = await prisma.article.findUnique({ where: { id } }).catch(() => null)
  if (!article) notFound()

  const boundUpdate = async (formData: FormData) => {
    'use server'
    await updateArticle(article.id, formData)
  }

  return (
    <div className="space-y-6 pb-12 max-w-4xl">
      <div>
        <h1 className="fgb-display text-3xl text-[var(--fgb-ink-900)]">Editar artigo</h1>
        <p
          className="fgb-label text-[var(--fgb-ink-400)] mt-1"
          style={{ textTransform: 'none', letterSpacing: 0 }}
        >
          /portal/{article.slug}
        </p>
      </div>

      <ArticleForm
        values={{
          slug: article.slug,
          title: article.title,
          subtitle: article.subtitle,
          content: article.content,
          coverImage: article.coverImage,
          category: article.category,
          author: article.author,
          source: article.source,
          sourceUrl: article.sourceUrl,
          tags: article.tags,
          readTime: article.readTime,
          isPublished: article.isPublished,
        }}
        action={boundUpdate}
        submitLabel="Salvar alterações"
      />
    </div>
  )
}
