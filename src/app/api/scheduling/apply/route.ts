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

    const { blocks, viableCategories, championshipId } = await request.json()

    if (!championshipId || !blocks) {
      return NextResponse.json({ error: 'Dados incompletos: championshipId e blocks são obrigatórios' }, { status: 400 })
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Limpar dados antigos de agendamento se existirem (para permitir re-agendamento)
      // Opcional: Podíamos arquivar, mas para este MVP vamos limpar e criar novos
      await tx.game.deleteMany({ where: { championshipId } })
      await tx.block.deleteMany({ where: { championshipId } })

      // 2. Atualizar viabilidade das categorias
      if (viableCategories) {
        for (const vc of viableCategories) {
          await tx.championshipCategory.updateMany({
            where: { 
              championshipId,
              name: vc.title 
            },
            data: { isViable: true }
          })
        }
      }

      // 3. Criar Blocos e Jogos
      const createdBlocks = []
      for (const blockData of blocks) {
        const block = await tx.block.create({
          data: {
            name: blockData.title,
            championshipId,
            categories: JSON.stringify(blockData.categories),
          }
        })

        for (const phase of blockData.phases) {
          if (phase.matches && Array.isArray(phase.matches)) {
            for (const match of phase.matches) {
              await tx.game.create({
                data: {
                  championshipId,
                  categoryId: match.categoryId,
                  blockId: block.id,
                  homeTeamId: match.homeTeamId,
                  awayTeamId: match.awayTeamId,
                  phase: match.phase || 1,
                  dateTime: phase.date ? new Date(phase.date) : new Date(),
                  location: phase.location || 'A definir',
                  city: phase.city || 'A definir',
                  status: 'SCHEDULED'
                }
              })
            }
          }
        }
        createdBlocks.push(block)
      }

      // 4. Atualizar status do campeonato
      await tx.championship.update({
        where: { id: championshipId },
        data: { status: 'CONFIRMED' }
      })

      return { blocksCount: createdBlocks.length }
    })

    return NextResponse.json({ success: true, ...result })
  } catch (error) {
    console.error('Error applying schedule:', error)
    return NextResponse.json({ error: 'Erro ao persistir o calendário' }, { status: 500 })
  }
}
