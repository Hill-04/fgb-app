import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    const championships = await prisma.championship.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        categories: true,
        _count: {
          select: { categories: true }
        }
      }
    })

    // Get registration counts per championship
    const championshipsWithCounts = await Promise.all(
      championships.map(async (c) => {
        const registrationCount = await prisma.registration.count({
          where: { championshipId: c.id }
        })
        return { ...c, registrationCount }
      })
    )

    return NextResponse.json(championshipsWithCounts)
  } catch (error) {
    console.error('Error fetching championships:', error)
    return NextResponse.json({ error: 'Erro ao buscar campeonatos' }, { status: 500 })
  }
}

const CATEGORY_NAMES: Record<string, string> = {
  SUB12M: 'Sub 12 Masculino',
  SUB12F: 'Sub 12 Feminino',
  SUB13M: 'Sub 13 Masculino',
  SUB13F: 'Sub 13 Feminino',
  SUB15M: 'Sub 15 Masculino',
  SUB15F: 'Sub 15 Feminino',
  SUB17M: 'Sub 17 Masculino',
  SUB17F: 'Sub 17 Feminino',
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, year, minTeamsPerCategory, categories: selectedCodes } = body

    if (!name || !year || !selectedCodes || selectedCodes.length === 0) {
      return NextResponse.json({ error: 'Nome, ano e pelo menos uma categoria são obrigatórios' }, { status: 400 })
    }

    const championship = await prisma.$transaction(async (tx) => {
      const newChampionship = await tx.championship.create({
        data: {
          name,
          description: body.description || null,
          sex: body.sex || 'masculino',
          format: body.format || 'todos_contra_todos',
          phases: body.phases || 3,
          minTeamsPerCat: Number(minTeamsPerCategory) || 3,
          regDeadline: body.regDeadline ? new Date(body.regDeadline) : new Date(),
          status: 'DRAFT',
        }
      })

      await tx.championshipCategory.createMany({
        data: (selectedCodes as string[]).map((code: string) => ({
          name: CATEGORY_NAMES[code] || code,
          championshipId: newChampionship.id,
        }))
      })

      return tx.championship.findUnique({
        where: { id: newChampionship.id },
        include: { categories: true }
      })
    })

    return NextResponse.json(championship, { status: 201 })
  } catch (error) {
    console.error('Error creating championship:', error)
    return NextResponse.json({ error: 'Erro ao criar campeonato' }, { status: 500 })
  }
}
