import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { ensureDatabaseSchema } from '@/lib/db-patch'
import { buildSchedulingBriefing } from '@/lib/scheduling/scheduling-briefing'
import {
  validateProposedSchedule,
  validateRoundRobinCompleteness,
  type ProposedGame,
} from '@/lib/scheduling/scheduling-validator'

export async function POST(request: Request) {
  try {
    await ensureDatabaseSchema()
    const session = await getServerSession(authOptions)
    if (!(session?.user as any)?.isAdmin) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }

    const { championshipId, games, replaceExisting } = await request.json() as {
      championshipId: string
      games: ProposedGame[]
      replaceExisting?: boolean
    }

    if (!championshipId || !Array.isArray(games)) {
      return NextResponse.json({ error: 'Payload inválido' }, { status: 400 })
    }

    const briefing = await buildSchedulingBriefing(championshipId)
    const validation = validateProposedSchedule(games, briefing)
    const completeness = validateRoundRobinCompleteness(games, briefing)
    validation.errors.push(...completeness.filter((i) => i.severity === 'error'))
    validation.valid = validation.errors.length === 0

    if (!validation.valid) {
      return NextResponse.json(
        { error: 'Calendário inválido', validation },
        { status: 400 },
      )
    }

    let inserted = 0
    await prisma.$transaction(async (tx) => {
      if (replaceExisting) {
        await tx.game.deleteMany({ where: { championshipId } })
      }

      for (const g of games) {
        const homeGym = briefing.teams.find((t) => t.id === g.homeTeamId)?.homeVenue
        await tx.game.create({
          data: {
            championshipId,
            categoryId: g.categoryId,
            homeTeamId: g.homeTeamId,
            awayTeamId: g.awayTeamId,
            dateTime: new Date(g.dateTime),
            location: homeGym?.name ?? 'A definir',
            city: homeGym?.city ?? '',
            court: g.court ?? null,
            status: 'SCHEDULED',
          },
        })
        inserted += 1
      }
    })

    return NextResponse.json({ ok: true, inserted })
  } catch (error: any) {
    console.error('Error applying orchestrated schedule:', error)
    return NextResponse.json({ error: error?.message || 'Erro' }, { status: 500 })
  }
}
