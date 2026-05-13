import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions)
    if (!(session?.user as any)?.isAdmin) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }

    const { id } = await params
    const { championshipId, categoryId } = await request.json()

    if (!championshipId) {
      return NextResponse.json({ error: 'championshipId é obrigatório' }, { status: 400 })
    }

    const block = await prisma.externalCompetitionBlock.create({
      data: {
        externalCompetitionId: id,
        championshipId,
        categoryId: categoryId || null,
      },
      include: { championship: true },
    })

    return NextResponse.json(block, { status: 201 })
  } catch (error: any) {
    console.error('Error creating block:', error)
    return NextResponse.json({ error: error?.message || 'Erro ao criar bloqueio' }, { status: 500 })
  }
}
