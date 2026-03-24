import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !(session.user as any).isAdmin) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { games, championshipId } = await request.json()

    if (!championshipId || !games || !Array.isArray(games)) {
      return NextResponse.json(
        { error: 'Dados incompletos: championshipId e games[] são obrigatórios' },
        { status: 400 }
      )
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Limpar dados antigos de agendamento
      await tx.game.deleteMany({ where: { championshipId } })
      await tx.block.deleteMany({ where: { championshipId } })

      // 2. Criar todos os jogos do calendário round-robin
      let createdCount = 0
      for (const game of games) {
        await tx.game.create({
          data: {
            championshipId,
            categoryId: game.categoryId,
            homeTeamId: game.homeTeamId,
            awayTeamId: game.awayTeamId,
            phase: game.phase || 1,
            dateTime: new Date(game.dateTime),
            location: 'A definir',
            city: 'A definir',
            status: 'SCHEDULED'
          }
        })
        createdCount++
      }

      // 3. Atualizar status do campeonato para ONGOING
      await tx.championship.update({
        where: { id: championshipId },
        data: { status: 'ONGOING' }
      })

      return { gamesCount: createdCount }
    })

    return NextResponse.json({ success: true, ...result })
  } catch (error: any) {
    console.error('[Apply Schedule Error]', error)
    return NextResponse.json(
      { error: error.message || 'Erro ao persistir o calendário' },
      { status: 500 }
    )
  }
}
