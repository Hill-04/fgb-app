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

async function createVideo(formData: FormData) {
  'use server'
  const title = String(formData.get('title') || '').trim()
  const description = String(formData.get('description') || '').trim()
  const videoUrl = String(formData.get('videoUrl') || '').trim()
  const coverUrl = String(formData.get('coverUrl') || '').trim()
  if (!title || !videoUrl) return

  await prisma.videoPost.create({
    data: {
      title,
      slug: slugify(title),
      description: description || null,
      videoUrl,
      coverUrl: coverUrl || null,
      status: 'DRAFT',
    }
  })
  revalidatePath('/admin/videos')
}

export default async function AdminVideosPage() {
  try {
    const videos = await prisma.videoPost.findMany({ orderBy: { createdAt: 'desc' } })

    return (
      <div className="space-y-6 pb-12">
        <div>
          <h1 className="fgb-display text-3xl text-[var(--black)]">Vídeos</h1>
          <p className="fgb-label text-[var(--gray)] mt-1" style={{ textTransform: 'none', letterSpacing: 0 }}>
            Highlights, entrevistas e clips oficiais.
          </p>
        </div>

        <div className="fgb-card p-5">
          <form action={createVideo} className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input name="title" placeholder="Título" className="h-10 rounded-xl border border-[var(--border)] bg-white px-3 text-sm md:col-span-2" />
            <input name="videoUrl" placeholder="URL do vídeo" className="h-10 rounded-xl border border-[var(--border)] bg-white px-3 text-sm md:col-span-2" />
            <input name="coverUrl" placeholder="Capa (opcional)" className="h-10 rounded-xl border border-[var(--border)] bg-white px-3 text-sm md:col-span-2" />
            <textarea name="description" placeholder="Descrição (opcional)" className="min-h-[100px] rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm md:col-span-2" />
            <button type="submit" className="fgb-btn-primary h-10 rounded-xl md:col-span-2">Salvar vídeo</button>
          </form>
        </div>

        <div className="fgb-card overflow-hidden">
          <div className="px-6 py-4 border-b border-[var(--border)] bg-[var(--gray-l)]">
            <p className="fgb-label text-[var(--gray)]" style={{ fontSize: 10 }}>Biblioteca de vídeos</p>
          </div>
          <div className="divide-y divide-[var(--border)] bg-white">
            {videos.length === 0 ? (
              <div className="p-10 text-center text-sm text-[var(--gray)]">Nenhum vídeo cadastrado.</div>
            ) : (
              videos.map((video) => (
                <div key={video.id} className="p-6 flex items-center gap-4">
                  <div className="w-16 h-10 rounded-md bg-[var(--gray-l)] border border-[var(--border)] overflow-hidden">
                    {video.coverUrl ? (
                      <img src={video.coverUrl} alt={video.title} className="w-full h-full object-cover" />
                    ) : null}
                  </div>
                  <div>
                    <p className="text-sm font-black text-[var(--black)]">{video.title}</p>
                    <p className="text-[11px] text-[var(--gray)]">{video.videoUrl}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    )
  } catch (error) {
    console.error('[ADMIN VIDEOS ERROR]', error)
    return (
      <div className="fgb-card p-10 text-center">
        <p className="fgb-label text-[var(--red)]" style={{ textTransform: 'none', letterSpacing: 0 }}>
          Erro ao carregar vídeos.
        </p>
      </div>
    )
  }
}
