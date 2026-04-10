import { prisma } from '@/lib/db'
import { revalidatePath } from 'next/cache'

export const dynamic = 'force-dynamic'

function slugify(input: string) {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

async function createNews(formData: FormData) {
  'use server'
  const title = String(formData.get('title') || '').trim()
  const excerpt = String(formData.get('excerpt') || '').trim()
  const content = String(formData.get('content') || '').trim()
  const coverUrl = String(formData.get('coverUrl') || '').trim()
  if (!title || !content) return

  await prisma.newsPost.create({
    data: {
      title,
      slug: slugify(title),
      excerpt: excerpt || null,
      content,
      coverUrl: coverUrl || null,
      status: 'DRAFT',
    }
  })
  revalidatePath('/admin/news')
}

export default async function AdminNewsPage() {
  try {
    const posts = await prisma.newsPost.findMany({ orderBy: { createdAt: 'desc' } })

    return (
      <div className="space-y-6 pb-12">
        <div>
          <h1 className="fgb-display text-3xl text-[var(--black)]">Notícias</h1>
          <p className="fgb-label text-[var(--gray)] mt-1" style={{ textTransform: 'none', letterSpacing: 0 }}>
            Publicações oficiais e comunicados.
          </p>
        </div>

        <div className="fgb-card p-5">
          <form action={createNews} className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input name="title" placeholder="Título" className="h-10 rounded-xl border border-[var(--border)] bg-white px-3 text-sm md:col-span-2" />
            <input name="excerpt" placeholder="Resumo (opcional)" className="h-10 rounded-xl border border-[var(--border)] bg-white px-3 text-sm md:col-span-2" />
            <input name="coverUrl" placeholder="Imagem de capa (opcional)" className="h-10 rounded-xl border border-[var(--border)] bg-white px-3 text-sm md:col-span-2" />
            <textarea name="content" placeholder="Conteúdo" className="min-h-[120px] rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm md:col-span-2" />
            <button type="submit" className="fgb-btn-primary h-10 rounded-xl md:col-span-2">Salvar notícia</button>
          </form>
        </div>

        <div className="fgb-card overflow-hidden">
          <div className="px-6 py-4 border-b border-[var(--border)] bg-[var(--gray-l)]">
            <p className="fgb-label text-[var(--gray)]" style={{ fontSize: 10 }}>Últimas notícias</p>
          </div>
          <div className="divide-y divide-[var(--border)] bg-white">
            {posts.length === 0 ? (
              <div className="p-10 text-center text-sm text-[var(--gray)]">Nenhuma notícia publicada.</div>
            ) : (
              posts.map((post) => (
                <div key={post.id} className="p-6">
                  <p className="text-sm font-black text-[var(--black)]">{post.title}</p>
                  <p className="text-[11px] text-[var(--gray)]">{post.excerpt || 'Sem resumo'}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    )
  } catch (error) {
    console.error('[ADMIN NEWS ERROR]', error)
    return (
      <div className="fgb-card p-10 text-center">
        <p className="fgb-label text-[var(--red)]" style={{ textTransform: 'none', letterSpacing: 0 }}>
          Erro ao carregar notícias.
        </p>
      </div>
    )
  }
}
