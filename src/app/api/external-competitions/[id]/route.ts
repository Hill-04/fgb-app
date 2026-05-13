import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params

    const competition = await prisma.externalCompetition.findUnique({
      where: { id },
      include: {
        blocks: {
          include: { championship: { select: { id: true, name: true, year: true } } },
        },
        registrations: {
          orderBy: { createdAt: 'desc' },
        },
        _count: { select: { registrations: true } },
      },
    })

    if (!competition) {
      return NextResponse.json({ error: 'Competição não encontrada' }, { status: 404 })
    }

    return NextResponse.json(competition)
  } catch (error) {
    console.error('Error fetching external competition:', error)
    return NextResponse.json({ error: 'Erro ao buscar competição' }, { status: 500 })
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions)
    if (!(session?.user as any)?.isAdmin) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()
    const {
      name, organizer, city, state, startDate, endDate,
      categories, gender, description, websiteUrl, logoUrl,
      isPublished, season, blocks,
    } = body

    const updated = await prisma.$transaction(async (tx) => {
      await tx.externalCompetition.update({
        where: { id },
        data: {
          ...(name !== undefined && { name: String(name).trim() }),
          ...(organizer !== undefined && { organizer: String(organizer).trim() }),
          ...(city !== undefined && { city: city?.trim() || null }),
          ...(state !== undefined && { state: state?.trim() || null }),
          ...(startDate !== undefined && { startDate: new Date(startDate) }),
          ...(endDate !== undefined && { endDate: new Date(endDate) }),
          ...(categories !== undefined && {
            categoriesJson: JSON.stringify(Array.isArray(categories) ? categories : []),
          }),
          ...(gender !== undefined && { gender: gender || null }),
          ...(description !== undefined && { description: description?.trim() || null }),
          ...(websiteUrl !== undefined && { websiteUrl: websiteUrl?.trim() || null }),
          ...(logoUrl !== undefined && { logoUrl: logoUrl?.trim() || null }),
          ...(isPublished !== undefined && { isPublished: Boolean(isPublished) }),
          ...(season !== undefined && { season: Number(season) }),
        },
      })

      if (Array.isArray(blocks)) {
        await tx.externalCompetitionBlock.deleteMany({
          where: { externalCompetitionId: id },
        })
        for (const b of blocks) {
          if (!b?.championshipId) continue
          await tx.externalCompetitionBlock.create({
            data: {
              externalCompetitionId: id,
              championshipId: b.championshipId,
              categoryId: b.categoryId || null,
            },
          })
        }
      }

      return tx.externalCompetition.findUnique({
        where: { id },
        include: { blocks: { include: { championship: true } } },
      })
    })

    return NextResponse.json(updated)
  } catch (error: any) {
    console.error('Error updating external competition:', error)
    return NextResponse.json({ error: error?.message || 'Erro ao atualizar' }, { status: 500 })
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions)
    if (!(session?.user as any)?.isAdmin) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }

    const { id } = await params

    await prisma.externalCompetition.update({
      where: { id },
      data: { isPublished: false },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error archiving external competition:', error)
    return NextResponse.json({ error: error?.message || 'Erro ao arquivar' }, { status: 500 })
  }
}
