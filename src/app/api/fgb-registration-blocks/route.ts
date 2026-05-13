import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!(session?.user as any)?.isAdmin) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }

    const url = new URL(request.url)
    const championshipId = url.searchParams.get('championshipId')
    const teamId = url.searchParams.get('teamId')
    const isActiveParam = url.searchParams.get('isActive')

    const where: any = {}
    if (championshipId) where.championshipId = championshipId
    if (teamId) where.teamId = teamId
    if (isActiveParam !== null) where.isActive = isActiveParam === 'true'

    const blocks = await prisma.fGBRegistrationBlock.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        championship: { select: { id: true, name: true, year: true } },
        externalRegistration: {
          include: {
            externalCompetition: { select: { id: true, name: true, organizer: true } },
          },
        },
      },
    })

    const enriched = await Promise.all(
      blocks.map(async (b) => {
        const athlete = b.athleteId
          ? await prisma.athlete.findUnique({
              where: { id: b.athleteId },
              select: { id: true, name: true, team: { select: { id: true, name: true } } },
            })
          : null
        return { ...b, athlete }
      }),
    )

    return NextResponse.json(enriched)
  } catch (error: any) {
    console.error('Error fetching blocks:', error)
    return NextResponse.json({ error: error?.message || 'Erro ao buscar bloqueios' }, { status: 500 })
  }
}
