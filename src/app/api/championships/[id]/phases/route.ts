import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { ensureDatabaseSchema } from '@/lib/db-patch'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await ensureDatabaseSchema()
    const { id } = await params
    const phases = await prisma.championshipPhase.findMany({
      where: { championshipId: id },
      orderBy: { order: 'asc' },
      include: {
        groups: { orderBy: { order: 'asc' } },
        categories: { include: { category: { select: { id: true, name: true } } } },
        _count: { select: { series: true } },
      },
    })
    return NextResponse.json(phases)
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Erro' }, { status: 500 })
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await ensureDatabaseSchema()
    const session = await getServerSession(authOptions)
    if (!session?.user || !(session.user as any).isAdmin) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()
    const {
      name, order, formatType, formatConfig, tiebreakerChain,
      startDate, endDate, qualifiesNextCount, categoryIds,
    } = body

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Nome da fase é obrigatório' }, { status: 400 })
    }

    const validFormats = ['ROUND_ROBIN', 'GROUPS', 'KNOCKOUT', 'SWISS', 'BLOCKS', 'FINAL_STAGE']
    const ft = validFormats.includes(formatType) ? formatType : 'ROUND_ROBIN'

    const phase = await prisma.$transaction(async (tx) => {
      const created = await tx.championshipPhase.create({
        data: {
          championshipId: id,
          name: name.trim(),
          order: Number(order) || 0,
          formatType: ft,
          formatConfigJson: formatConfig ? JSON.stringify(formatConfig) : '{}',
          tiebreakerChain: Array.isArray(tiebreakerChain) ? tiebreakerChain.join(',') : (tiebreakerChain || 'h2h_record,h2h_diff,h2h_for,all_diff,all_for,draw'),
          startDate: startDate ? new Date(startDate) : null,
          endDate: endDate ? new Date(endDate) : null,
          qualifiesNextCount: qualifiesNextCount != null ? Number(qualifiesNextCount) : null,
        },
      })

      if (Array.isArray(categoryIds)) {
        for (const cid of categoryIds) {
          await tx.championshipPhaseCategory.create({
            data: { phaseId: created.id, categoryId: cid },
          })
        }
      }

      return tx.championshipPhase.findUnique({
        where: { id: created.id },
        include: { categories: true, groups: true },
      })
    })

    return NextResponse.json(phase, { status: 201 })
  } catch (error: any) {
    console.error('Error creating phase:', error)
    return NextResponse.json({ error: error?.message || 'Erro' }, { status: 500 })
  }
}
