import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: championshipId } = await params
    const body = await request.json()
    const { selectedCategories, blockedDates } = body

    if (!selectedCategories || selectedCategories.length === 0) {
      return NextResponse.json({ error: 'Selecione ao menos uma categoria' }, { status: 400 })
    }

    // For MVP: use the first team in the DB as the "current team"
    const team = await prisma.team.findFirst({ orderBy: { createdAt: 'asc' } })
    if (!team) {
      return NextResponse.json({ error: 'Nenhuma equipe encontrada. Por favor, cadastre sua equipe primeiro.' }, { status: 404 })
    }

    // Find categories by code in this championship
    const categories = await prisma.category.findMany({
      where: {
        championshipId,
        code: { in: selectedCategories }
      }
    })

    if (categories.length === 0) {
      return NextResponse.json({ error: 'Nenhuma categoria válida encontrada para este campeonato' }, { status: 400 })
    }

    const result = await prisma.$transaction(async (tx) => {
      // Create registrations for each selected category (skip duplicates)
      const registrations = await Promise.all(
        categories.map((cat) =>
          tx.registration.upsert({
            where: { teamId_categoryId: { teamId: team.id, categoryId: cat.id } },
            update: {},
            create: {
              teamId: team.id,
              categoryId: cat.id,
              status: 'PENDING',
            }
          })
        )
      )

      // Create blocked dates
      let createdBlockedDates: any[] = []
      if (blockedDates && blockedDates.length > 0) {
        const datesToCreate = blockedDates.slice(0, 3).map((d: { date: string; reason?: string }) => ({
          date: new Date(d.date),
          reason: d.reason || null,
          teamId: team.id,
        }))
        createdBlockedDates = await Promise.all(
          datesToCreate.map((bd: any) => tx.blockedDate.create({ data: bd }))
        )
      }

      return { registrations, blockedDates: createdBlockedDates }
    })

    return NextResponse.json({ success: true, ...result }, { status: 201 })
  } catch (error) {
    console.error('Error registering for championship:', error)
    return NextResponse.json({ error: 'Erro ao realizar inscrição' }, { status: 500 })
  }
}
