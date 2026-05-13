import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { withDatabaseSchemaRetry } from '@/lib/db-patch'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const season = url.searchParams.get('season')
    const isPublishedParam = url.searchParams.get('isPublished')

    const where: any = {}
    if (season) where.season = Number(season)
    if (isPublishedParam !== null) where.isPublished = isPublishedParam === 'true'

    const competitions = await withDatabaseSchemaRetry(() =>
      prisma.externalCompetition.findMany({
        where,
        orderBy: { startDate: 'asc' },
        include: {
          blocks: {
            include: {
              championship: { select: { id: true, name: true, year: true } },
            },
          },
          _count: { select: { registrations: true } },
        },
      }),
    )

    return NextResponse.json(competitions)
  } catch (error) {
    console.error('Error fetching external competitions:', error)
    return NextResponse.json({ error: 'Erro ao buscar competições externas' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!(session?.user as any)?.isAdmin) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }

    const body = await request.json()
    const {
      name, organizer, city, state, startDate, endDate,
      categories, gender, description, websiteUrl, logoUrl,
      isPublished, season, blocks,
    } = body

    if (!name?.trim()) return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 })
    if (!organizer?.trim()) return NextResponse.json({ error: 'Organizador é obrigatório' }, { status: 400 })
    if (!startDate) return NextResponse.json({ error: 'Data de início é obrigatória' }, { status: 400 })
    if (!endDate) return NextResponse.json({ error: 'Data de fim é obrigatória' }, { status: 400 })

    const created = await prisma.$transaction(async (tx) => {
      const comp = await tx.externalCompetition.create({
        data: {
          name: name.trim(),
          organizer: organizer.trim(),
          city: city?.trim() || null,
          state: state?.trim() || null,
          startDate: new Date(startDate),
          endDate: new Date(endDate),
          categoriesJson: JSON.stringify(Array.isArray(categories) ? categories : []),
          gender: gender || null,
          description: description?.trim() || null,
          websiteUrl: websiteUrl?.trim() || null,
          logoUrl: logoUrl?.trim() || null,
          isPublished: Boolean(isPublished),
          season: Number(season) || 2026,
        },
      })

      if (Array.isArray(blocks)) {
        for (const b of blocks) {
          if (!b?.championshipId) continue
          await tx.externalCompetitionBlock.create({
            data: {
              externalCompetitionId: comp.id,
              championshipId: b.championshipId,
              categoryId: b.categoryId || null,
            },
          })
        }
      }

      return tx.externalCompetition.findUnique({
        where: { id: comp.id },
        include: { blocks: { include: { championship: true } } },
      })
    })

    return NextResponse.json(created, { status: 201 })
  } catch (error: any) {
    console.error('Error creating external competition:', error)
    return NextResponse.json({ error: error?.message || 'Erro ao criar competição externa' }, { status: 500 })
  }
}
