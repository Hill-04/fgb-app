'use server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'

export const CATEGORIES = [
  { value: 'NOTICIAS',        label: 'Notícias',                color: '#145530' },
  { value: 'CURIOSIDADES',    label: 'Curiosidades',            color: '#1d6fa4' },
  { value: 'REGRAS',          label: 'Regras do Jogo',          color: '#7b3fa0' },
  { value: 'HISTORIA',        label: 'História do Basquete',    color: '#c05621' },
  { value: 'CBB',             label: 'CBB & Nacional',          color: '#b44' },
  { value: 'INTERNACIONAL',   label: 'Basquete Internacional',  color: '#0d7377' },
  { value: 'FEDERACAO',       label: 'FGB & Federação',         color: '#145530' },
]

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

function calcReadingTime(text: string) {
  const words = text.trim().split(/\s+/).length
  return Math.max(1, Math.round(words / 200))
}

function revalidateAll(slug?: string | null) {
  revalidatePath('/admin/news')
  revalidatePath('/noticias')
  revalidatePath('/')
  if (slug) revalidatePath(`/noticias/${slug}`)
}

export async function createPost(formData: FormData) {
  const title = String(formData.get('title') || '').trim()
  const content = String(formData.get('content') || '').trim()
  if (!title || !content) return

  const excerpt  = String(formData.get('excerpt')  || '').trim() || null
  const coverUrl = String(formData.get('coverUrl') || '').trim() || null
  const category = String(formData.get('category') || 'NOTICIAS')
  const tags     = String(formData.get('tags')     || '').trim() || null
  const author   = String(formData.get('author')   || '').trim() || null
  const featured = formData.get('featured') === 'on'
  const metaTitle = String(formData.get('metaTitle') || '').trim() || null
  const metaDesc  = String(formData.get('metaDescription') || '').trim() || null
  const publish   = formData.get('status') === 'PUBLISHED'

  let slug = slugify(title)
  const existing = await prisma.newsPost.findUnique({ where: { slug } })
  if (existing) slug = `${slug}-${Date.now().toString(36)}`

  const post = await prisma.newsPost.create({
    data: {
      title, slug, excerpt, content, coverUrl, category,
      tags, author, featured,
      readingTime: calcReadingTime(content),
      metaTitle, metaDescription: metaDesc,
      status: publish ? 'PUBLISHED' : 'DRAFT',
      publishedAt: publish ? new Date() : null,
    },
  })

  revalidateAll(post.slug)
  redirect(`/admin/news/${post.id}`)
}

export async function updatePost(id: string, formData: FormData) {
  const title = String(formData.get('title') || '').trim()
  const content = String(formData.get('content') || '').trim()
  if (!title || !content) return

  const excerpt  = String(formData.get('excerpt')  || '').trim() || null
  const coverUrl = String(formData.get('coverUrl') || '').trim() || null
  const category = String(formData.get('category') || 'NOTICIAS')
  const tags     = String(formData.get('tags')     || '').trim() || null
  const author   = String(formData.get('author')   || '').trim() || null
  const featured = formData.get('featured') === 'on'
  const metaTitle = String(formData.get('metaTitle') || '').trim() || null
  const metaDesc  = String(formData.get('metaDescription') || '').trim() || null
  const publish   = formData.get('status') === 'PUBLISHED'

  const current = await prisma.newsPost.findUnique({ where: { id } })
  if (!current) return

  const post = await prisma.newsPost.update({
    where: { id },
    data: {
      title, excerpt, content, coverUrl, category,
      tags, author, featured,
      readingTime: calcReadingTime(content),
      metaTitle, metaDescription: metaDesc,
      status: publish ? 'PUBLISHED' : 'DRAFT',
      publishedAt:
        publish && !current.publishedAt ? new Date()
        : !publish ? null
        : current.publishedAt,
    },
  })

  revalidateAll(post.slug)
}

export async function deletePost(id: string) {
  const post = await prisma.newsPost.findUnique({ where: { id } })
  if (!post) return
  await prisma.newsPost.delete({ where: { id } })
  revalidateAll(post.slug)
  redirect('/admin/news')
}

export async function togglePublish(id: string) {
  const post = await prisma.newsPost.findUnique({ where: { id } })
  if (!post) return
  const next = post.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED'
  await prisma.newsPost.update({
    where: { id },
    data: {
      status: next,
      publishedAt: next === 'PUBLISHED' ? (post.publishedAt ?? new Date()) : null,
    },
  })
  revalidateAll(post.slug)
}
