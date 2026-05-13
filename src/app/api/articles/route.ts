import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const category = url.searchParams.get('category')
  const limit = Math.min(Number(url.searchParams.get('limit') ?? 20), 100)
  const page = Math.max(Number(url.searchParams.get('page') ?? 1), 1)

  const where: any = { isPublished: true }
  if (category && category !== 'Todos') where.category = category

  const [items, total] = await Promise.all([
    prisma.article.findMany({
      where,
      orderBy: { publishedAt: 'desc' },
      take: limit,
      skip: (page - 1) * limit,
      select: {
        id: true,
        slug: true,
        title: true,
        subtitle: true,
        coverImage: true,
        category: true,
        tags: true,
        author: true,
        publishedAt: true,
        readTime: true,
        views: true,
      },
    }),
    prisma.article.count({ where }),
  ])

  return NextResponse.json({ items, total, page, limit })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user || !(session.user as any).isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json().catch(() => ({}))

  const title = String(body.title ?? '').trim()
  const content = String(body.content ?? '').trim()
  if (!title || !content) {
    return NextResponse.json({ error: 'title and content are required' }, { status: 400 })
  }

  let slug = String(body.slug ?? '').trim() || slugify(title)
  const existing = await prisma.article.findUnique({ where: { slug } })
  if (existing) slug = `${slug}-${Date.now().toString(36)}`

  const article = await prisma.article.create({
    data: {
      slug,
      title,
      subtitle: body.subtitle ?? null,
      content,
      coverImage: body.coverImage ?? null,
      category: body.category ?? 'Conhecimento',
      tags: body.tags ?? null,
      author: body.author ?? 'Redação FGB',
      source: body.source ?? null,
      sourceUrl: body.sourceUrl ?? null,
      isPublished: body.isPublished ?? true,
      readTime: Number(body.readTime ?? 5),
      publishedAt: body.publishedAt ? new Date(body.publishedAt) : new Date(),
    },
  })

  return NextResponse.json(article, { status: 201 })
}
