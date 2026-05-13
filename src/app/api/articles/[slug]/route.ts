import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ slug: string }> },
) {
  const { slug } = await context.params

  const article = await prisma.article.findUnique({ where: { slug } })
  if (!article || !article.isPublished) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  prisma.article
    .update({ where: { id: article.id }, data: { views: { increment: 1 } } })
    .catch(() => {})

  return NextResponse.json(article)
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ slug: string }> },
) {
  const session = await getServerSession(authOptions)
  if (!session?.user || !(session.user as any).isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { slug } = await context.params
  const body = await req.json().catch(() => ({}))

  const data: any = {}
  for (const key of [
    'title', 'subtitle', 'content', 'coverImage', 'category',
    'tags', 'author', 'source', 'sourceUrl', 'isPublished', 'readTime',
  ]) {
    if (body[key] !== undefined) data[key] = body[key]
  }
  if (body.publishedAt) data.publishedAt = new Date(body.publishedAt)

  const article = await prisma.article.update({ where: { slug }, data })
  return NextResponse.json(article)
}

export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ slug: string }> },
) {
  const session = await getServerSession(authOptions)
  if (!session?.user || !(session.user as any).isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { slug } = await context.params

  const article = await prisma.article.update({
    where: { slug },
    data: { isPublished: false },
  })
  return NextResponse.json(article)
}
