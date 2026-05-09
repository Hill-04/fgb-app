import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { ensureDatabaseSchema } from '@/lib/db-patch'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createExternalRegistrationWithBlocks } from '@/lib/competition-eligibility'

export async function GET(request: Request) {
  try {
    await ensureDatabaseSchema()
    const url = new URL(request.url)
    const teamId = url.searchParams.get('teamId')
    const competitionId = url.searchParams.get('externalCompetitionId')

    const where: any = {}
    if (teamId) where.teamId = teamId
    if (competitionId) where.externalCompetitionId = competitionId

    const registrations = await prisma.externalRegistration.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        externalCompetition: { select: { id: true, name: true, organizer: true, startDate: true, endDate: true } },
        blocksGenerated: {
          include: { championship: { select: { id: true, name: true } } },
        },
      },
    })

    const enriched = await Promise.all(
      registrations.map(async (r) => {
        const athlete = r.athleteId
          ? await prisma.athlete.findUnique({
              where: { id: r.athleteId },
              select: { id: true, name: true, team: { select: { id: true, name: true } } },
            })
          : null
        return { ...r, athlete }
      }),
    )

    return NextResponse.json(enriched)
  } catch (error) {
    console.error('Error fetching external registrations:', error)
    return NextResponse.json({ error: 'Erro ao buscar declarações' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    await ensureDatabaseSchema()
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const body = await request.json()
    const { externalCompetitionId, athleteIds, teamId, categoryId } = body

    if (!externalCompetitionId) {
      return NextResponse.json({ error: 'externalCompetitionId é obrigatório' }, { status: 400 })
    }
    if (!Array.isArray(athleteIds) || athleteIds.length === 0) {
      return NextResponse.json({ error: 'Selecione ao menos uma atleta' }, { status: 400 })
    }
    if (!teamId) {
      return NextResponse.json({ error: 'teamId é obrigatório' }, { status: 400 })
    }

    const userId = (session.user as any).id as string
    const result = await createExternalRegistrationWithBlocks(
      externalCompetitionId,
      athleteIds,
      teamId,
      categoryId,
      userId,
    )

    return NextResponse.json(result, { status: 201 })
  } catch (error: any) {
    console.error('Error creating external registration:', error)
    return NextResponse.json({ error: error?.message || 'Erro ao registrar declaração' }, { status: 500 })
  }
}
