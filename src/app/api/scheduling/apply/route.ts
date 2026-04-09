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

    // 1. Deletar dados antigos de agendamento (sem transação para evitar timeout)
    await prisma.game.deleteMany({ where: { championshipId } })
    await prisma.block.deleteMany({ where: { championshipId } })

    // 2. Criar jogos em lotes de 5 para evitar timeout no Turso
    const BATCH_SIZE = 5
    let createdCount = 0

    for (let i = 0; i < games.length; i += BATCH_SIZE) {
      const batch = games.slice(i, i + BATCH_SIZE)
      await Promise.all(
        batch.map(game =>
          prisma.game.create({
            data: {
              championshipId,
              categoryId: game.categoryId,
              homeTeamId: game.homeTeamId,
              awayTeamId: game.awayTeamId,
              phase: game.phase || 1,
              round: game.round || 1,
              dateTime: new Date(game.dateTime),
              isReturn: game.isReturn || false,
              period: game.period || null,
              venue: game.venue || 'A definir',
              location: game.location || game.venue || 'A definir',
              city: game.city || 'A definir',
              wasRescheduled: game.wasRescheduled || false,
              rescheduleReason: game.rescheduleReason || null,
              blockedByTeamId: game.blockedByTeamId || null,
              status: 'SCHEDULED',
            }
          })
        )
      )
      createdCount += batch.length

      // Pequeno delay entre lotes para não sobrecarregar
      if (i + BATCH_SIZE < games.length) {
        await new Promise(resolve => setTimeout(resolve, 100))
      }
    }

    // 3. Atualizar status do campeonato para ONGOING
    await prisma.championship.update({
      where: { id: championshipId },
      data: { status: 'ONGOING' }
    })

    return NextResponse.json({ 
      success: true, 
      gamesCount: createdCount 
    })
  } catch (error: any) {
    console.error('[Apply Schedule Error]', error)
    return NextResponse.json(
      { error: error.message || 'Erro ao persistir o calendário' },
      { status: 500 }
    )
  }
}
