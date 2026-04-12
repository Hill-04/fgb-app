import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/db'
import { authOptions } from '@/lib/auth'
import { recalculateStandings } from '@/lib/standings'
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

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureDatabaseSchema()
    const { id } = await params

    const game = await prisma.game.findUnique({
      where: { id },
      include: {
        homeTeam: true,
        awayTeam: true,
        category: {
          include: { championship: true },
        },
      },
    })

    return NextResponse.json(game)
  } catch (error) {
    console.error('[C-03][Game GET Error]', error)
    return NextResponse.json({ error: 'Erro ao carregar jogo' }, { status: 500 })
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureDatabaseSchema()
    const session = await getServerSession(authOptions)
    if (!session || !(session.user as any).isAdmin) {
      return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const {
      dateTime,
      venue,
      homeTeamId,
      awayTeamId,
      homeScore,
      awayScore,
      status,
      rescheduleReason,
      wasRescheduled,
      forceBlockedDate,
    } = body

    const currentGame = await prisma.game.findUnique({
      where: { id },
      include: {
        homeTeam: true,
        awayTeam: true,
        category: true,
      },
    })

    if (!currentGame) {
      return NextResponse.json({ error: 'Jogo nao encontrado' }, { status: 404 })
    }

    const nextHomeTeamId = homeTeamId || currentGame.homeTeamId
    const nextAwayTeamId = awayTeamId || currentGame.awayTeamId
    const nextDate = dateTime ? new Date(dateTime) : new Date(currentGame.dateTime)

    for (const teamId of [nextHomeTeamId, nextAwayTeamId]) {
      const registration = await getRegistrationForCategory(teamId, currentGame.categoryId)
      const isBlocked =
        registration &&
        isDateBlockedByRanges(nextDate, registration.blockedDates.map((blockedDate) => ({
          startDate: new Date(blockedDate.startDate),
          endDate: new Date(blockedDate.endDate),
          affectsAllCats: blockedDate.affectsAllCats,
          reason: blockedDate.reason,
        })))

      if (isBlocked && !forceBlockedDate) {
        return NextResponse.json(
          {
            error: 'BLOCKED_DATE',
            message: `A equipe ${registration.team.name} bloqueou esta data. Escolha outra data ou confirme se deseja forcar.`,
            canForce: true,
            conflictingTeam: registration.team.name,
          },
          { status: 409 }
        )
      }
    }

    const updated = await prisma.game.update({
      where: { id },
      data: {
        ...(dateTime && { dateTime: nextDate }),
        ...(venue !== undefined && { venue, location: venue || 'A definir' }),
        ...(homeTeamId && { homeTeamId }),
        ...(awayTeamId && { awayTeamId }),
        ...(homeScore !== undefined && { homeScore: Number(homeScore) }),
        ...(awayScore !== undefined && { awayScore: Number(awayScore) }),
        ...(status && { status }),
        ...(rescheduleReason !== undefined && { rescheduleReason, wasRescheduled: true }),
        ...(wasRescheduled !== undefined && { wasRescheduled }),
        ...(forceBlockedDate && {
          blockedByTeamId:
            homeTeamId && homeTeamId !== currentGame.homeTeamId
              ? homeTeamId
              : awayTeamId && awayTeamId !== currentGame.awayTeamId
                ? awayTeamId
                : null,
        }),
      },
      include: {
        homeTeam: true,
        awayTeam: true,
        category: true,
      },
    })

    if (updated.status === 'FINISHED' && updated.homeScore !== null && updated.awayScore !== null) {
      await recalculateStandings(updated.categoryId)
    }

    return NextResponse.json(updated)
  } catch (error) {
    console.error('[C-03][Game PATCH Error]', error)
    return NextResponse.json({ error: 'Erro ao atualizar jogo' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureDatabaseSchema()
    const session = await getServerSession(authOptions)
    if (!session || !(session.user as any).isAdmin) {
      return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })
    }

    const { id } = await params
    const { reason } = await request.json().catch(() => ({ reason: null }))

    const game = await prisma.game.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        ...(reason && { rescheduleReason: reason }),
      },
    })

    return NextResponse.json({ success: true, game })
  } catch (error) {
    console.error('[C-03][Game DELETE Error]', error)
    return NextResponse.json({ error: 'Erro ao cancelar jogo' }, { status: 500 })
  }
}

