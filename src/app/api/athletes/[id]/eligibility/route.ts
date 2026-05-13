import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params

    const athlete = await prisma.athlete.findUnique({
      where: { id },
      select: { id: true, name: true, teamId: true },
    })
    if (!athlete) {
      return NextResponse.json({ error: 'Atleta não encontrada' }, { status: 404 })
    }

    const championships = await prisma.championship.findMany({
      where: { isSimulation: false },
      orderBy: { startDate: 'asc' },
      select: { id: true, name: true, year: true, status: true },
    })

    const blocks = await prisma.fGBRegistrationBlock.findMany({
      where: { athleteId: id, isActive: true },
      include: {
        externalRegistration: {
          include: { externalCompetition: { select: { name: true, organizer: true } } },
        },
      },
    })

    const blocksByChampionship = new Map<string, typeof blocks>()
    for (const b of blocks) {
      const list = blocksByChampionship.get(b.championshipId) ?? []
      list.push(b)
      blocksByChampionship.set(b.championshipId, list)
    }

    const result = championships.map((c) => {
      const cBlocks = blocksByChampionship.get(c.id) ?? []
      return {
        championshipId: c.id,
        championshipName: c.name,
        year: c.year,
        status: cBlocks.length > 0 ? 'BLOCKED' : 'ELIGIBLE',
        blocks: cBlocks.map((b) => ({
          id: b.id,
          reason: b.reason,
          externalCompetitionName: b.externalRegistration.externalCompetition.name,
          externalCompetitionOrganizer: b.externalRegistration.externalCompetition.organizer,
        })),
      }
    })

    return NextResponse.json({
      athlete,
      championships: result,
      hasAnyBlock: blocks.length > 0,
    })
  } catch (error: any) {
    console.error('Error checking eligibility:', error)
    return NextResponse.json({ error: error?.message || 'Erro ao verificar elegibilidade' }, { status: 500 })
  }
}
