import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function DELETE() {
  const session = await getServerSession(authOptions)
  if (!session || !(session.user as any).isAdmin) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  try {
    const championships = await prisma.championship.findMany({ where: { isSimulation: true } })

    if (championships.length === 0) {
      const deleted = await prisma.athlete.deleteMany({ where: { federationStatus: 'SIMULATION' } })
      return NextResponse.json({
        success: true,
        message: `Nenhuma simulação encontrada. ${deleted.count} atleta(s) simulado(s) removido(s).`
      })
    }

    for (const championship of championships) {
      // Collect game IDs to safely delete child records
      const gameIds = (await prisma.game.findMany({
        where: { championshipId: championship.id },
        select: { id: true }
      })).map(g => g.id)

      if (gameIds.length > 0) {
        const rosterIds = (await prisma.gameRoster.findMany({
          where: { gameId: { in: gameIds } },
          select: { id: true }
        })).map(r => r.id)

        if (rosterIds.length > 0) {
          await prisma.gameRosterPlayer.deleteMany({ where: { gameRosterId: { in: rosterIds } } })
        }
        await prisma.gameRoster.deleteMany({ where: { gameId: { in: gameIds } } })
        await prisma.gamePlayerStatLine.deleteMany({ where: { gameId: { in: gameIds } } })
        await prisma.gamePeriodScore.deleteMany({ where: { gameId: { in: gameIds } } })
        await prisma.gameOfficial.deleteMany({ where: { gameId: { in: gameIds } } })
      }

      await prisma.standing.deleteMany({ where: { category: { championshipId: championship.id } } })
      await prisma.game.deleteMany({ where: { championshipId: championship.id } })
      await prisma.blockedDate.deleteMany({ where: { registration: { championshipId: championship.id } } })
      await prisma.registrationCategory.deleteMany({ where: { registration: { championshipId: championship.id } } })
      await prisma.registration.deleteMany({ where: { championshipId: championship.id } })
      await prisma.championshipCategory.deleteMany({ where: { championshipId: championship.id } })
      await prisma.championship.delete({ where: { id: championship.id } })
    }

    const deletedAthletes = await prisma.athlete.deleteMany({ where: { federationStatus: 'SIMULATION' } })

    return NextResponse.json({
      success: true,
      message: `${championships.length} simulação(ões) limpa(s). ${deletedAthletes.count} atleta(s) simulado(s) removido(s).`
    })
  } catch (error: any) {
    console.error('Error cleaning simulation:', error)
    return NextResponse.json({ error: error.message || 'Erro ao limpar simulação' }, { status: 500 })
  }
}
