import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/db'
import { authOptions } from '@/lib/auth'
import { isDateBlockedByRanges } from '@/lib/scheduling/availability'
import { ensureDatabaseSchema } from '@/lib/db-patch'

async function getRegistrationForCategory(teamId: string, categoryId: string) {
  return prisma.registration.findFirst({
    where: {
      teamId,
      categories: {
        some: { categoryId },
      },
    },
    include: {
      blockedDates: true,
      team: true,
    },
  })
}

export async function GET(request: Request) {
  try {
    await ensureDatabaseSchema()
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const championshipId = searchParams.get('championshipId')
    const categoryId = searchParams.get('categoryId')

    const games = await prisma.game.findMany({
      where: {
        ...(categoryId && { categoryId }),
        ...(championshipId && { championshipId }),
        status: { not: 'CANCELLED' },
      },
      include: {
        homeTeam: { select: { id: true, name: true } },
        awayTeam: { select: { id: true, name: true } },
        category: {
          select: {
            id: true,
            name: true,
            championship: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { dateTime: 'asc' },
    })

    return NextResponse.json(games)
  } catch (error) {
    console.error('[C-03][Games API Error]', error)
    return NextResponse.json({ error: 'Erro ao carregar jogos' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    await ensureDatabaseSchema()
    const session = await getServerSession(authOptions)
    if (!session || !(session.user as any).isAdmin) {
      return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })
    }

    const {
      categoryId,
      homeTeamId,
      awayTeamId,
      dateTime,
      venue,
      phase,
      round,
    } = await request.json()

    if (!categoryId || !homeTeamId || !awayTeamId || !dateTime) {
      return NextResponse.json(
        { error: 'Campos obrigatorios: categoryId, homeTeamId, awayTeamId, dateTime' },
        { status: 400 }
      )
    }

    const category = await prisma.championshipCategory.findUnique({
      where: { id: categoryId },
      select: { id: true, championshipId: true, name: true },
    })

    if (!category) {
      return NextResponse.json({ error: 'Categoria nao encontrada' }, { status: 404 })
    }

    const newDate = new Date(dateTime)
    const warnings: string[] = []

    for (const teamId of [homeTeamId, awayTeamId]) {
      const registration = await getRegistrationForCategory(teamId, categoryId)
      const isBlocked =
        registration &&
        isDateBlockedByRanges(newDate, registration.blockedDates.map((blockedDate) => ({
          startDate: new Date(blockedDate.startDate),
          endDate: new Date(blockedDate.endDate),
          affectsAllCats: blockedDate.affectsAllCats,
          reason: blockedDate.reason,
        })))

      if (isBlocked) {
        warnings.push(`A equipe ${registration.team.name} bloqueou esta data.`)
      }
    }

    const game = await prisma.game.create({
      data: {
        championshipId: category.championshipId,
        categoryId,
        homeTeamId,
        awayTeamId,
        dateTime: newDate,
        venue: venue || 'A definir',
        location: venue || 'A definir',
        city: 'A definir',
        phase: Number(phase) || 1,
        round: Number(round) || 1,
        status: 'SCHEDULED',
      },
      include: {
        homeTeam: true,
        awayTeam: true,
        category: true,
      },
    })

    return NextResponse.json({
      game,
      warning: warnings.length > 0 ? warnings.join(' ') : undefined,
    }, { status: 201 })
  } catch (error) {
    console.error('[C-03][Games POST Error]', error)
    return NextResponse.json({ error: 'Erro ao criar jogo' }, { status: 500 })
  }
}

