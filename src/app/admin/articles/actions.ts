'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { ensureDatabaseSchema } from '@/lib/db-patch'

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

function calcReadTime(text: string) {
  const words = text.replace(/<[^>]+>/g, ' ').trim().split(/\s+/).length
  return Math.max(1, Math.round(words / 200))
}

function tagsToJson(input: string): string | null {
  const trimmed = input.trim()
  if (!trimmed) return null
  if (trimmed.startsWith('[')) return trimmed
  const arr = trimmed
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean)
  return arr.length ? JSON.stringify(arr) : null
}

async function requireAdmin() {
  const session = await getServerSession(authOptions)
  if (!session?.user || !(session.user as any).isAdmin) {
    throw new Error('Forbidden')
  }
}

function revalidateAll(slug?: string | null) {
  revalidatePath('/admin/articles')
  revalidatePath('/portal')
  revalidatePath('/')
  if (slug) revalidatePath(`/portal/${slug}`)
}

export async function createArticle(formData: FormData) {
  await requireAdmin()
  await ensureDatabaseSchema()

  const title = String(formData.get('title') ?? '').trim()
  const content = String(formData.get('content') ?? '').trim()
  if (!title || !content) return

  const subtitle = String(formData.get('subtitle') ?? '').trim() || null
  const coverImage = String(formData.get('coverImage') ?? '').trim() || null
  const category = String(formData.get('category') ?? 'Conhecimento')
  const author = String(formData.get('author') ?? 'Redação FGB').trim() || 'Redação FGB'
  const source = String(formData.get('source') ?? '').trim() || null
  const sourceUrl = String(formData.get('sourceUrl') ?? '').trim() || null
  const tags = tagsToJson(String(formData.get('tags') ?? ''))
  const readTimeRaw = Number(formData.get('readTime'))
  const readTime = Number.isFinite(readTimeRaw) && readTimeRaw > 0 ? readTimeRaw : calcReadTime(content)
  const isPublished = formData.get('isPublished') === 'on'

  let slug = String(formData.get('slug') ?? '').trim() || slugify(title)
  const existing = await prisma.article.findUnique({ where: { slug } })
  if (existing) slug = `${slug}-${Date.now().toString(36)}`

  const created = await prisma.article.create({
    data: {
      slug, title, subtitle, content, coverImage, category, tags, author,
      source, sourceUrl, readTime, isPublished,
      publishedAt: new Date(),
    },
  })

  revalidateAll(created.slug)
  redirect(`/admin/articles/${created.id}`)
}

export async function updateArticle(id: string, formData: FormData) {
  await requireAdmin()
  await ensureDatabaseSchema()

  const title = String(formData.get('title') ?? '').trim()
  const content = String(formData.get('content') ?? '').trim()
  if (!title || !content) return

  const current = await prisma.article.findUnique({ where: { id } })
  if (!current) return

  const subtitle = String(formData.get('subtitle') ?? '').trim() || null
  const coverImage = String(formData.get('coverImage') ?? '').trim() || null
  const category = String(formData.get('category') ?? current.category)
  const author = String(formData.get('author') ?? current.author).trim() || current.author
  const source = String(formData.get('source') ?? '').trim() || null
  const sourceUrl = String(formData.get('sourceUrl') ?? '').trim() || null
  const tags = tagsToJson(String(formData.get('tags') ?? ''))
  const readTimeRaw = Number(formData.get('readTime'))
  const readTime = Number.isFinite(readTimeRaw) && readTimeRaw > 0 ? readTimeRaw : calcReadTime(content)
  const isPublished = formData.get('isPublished') === 'on'

  let slug = String(formData.get('slug') ?? '').trim() || slugify(title)
  if (slug !== current.slug) {
    const dupe = await prisma.article.findUnique({ where: { slug } })
    if (dupe) slug = `${slug}-${Date.now().toString(36)}`
  }

  const updated = await prisma.article.update({
    where: { id },
    data: {
      slug, title, subtitle, content, coverImage, category, tags, author,
      source, sourceUrl, readTime, isPublished,
    },
  })

  revalidateAll(updated.slug)
  revalidatePath(`/admin/articles/${id}`)
}

export async function deleteArticle(id: string) {
  await requireAdmin()
  await ensureDatabaseSchema()

  const current = await prisma.article.findUnique({ where: { id } })
  if (!current) return

  await prisma.article.update({
    where: { id },
    data: { isPublished: false },
  })

  revalidateAll(current.slug)
}
