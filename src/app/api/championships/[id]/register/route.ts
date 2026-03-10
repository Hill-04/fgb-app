import { NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user as any).role !== 'TEAM') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const teamId = (session.user as any).teamId
    const { id: championshipId } = await params
    const body = await request.json()
    const { selectedCategories, blockedDates, observations } = body

    if (!selectedCategories || selectedCategories.length === 0) {
      return NextResponse.json({ error: 'Selecione ao menos uma categoria' }, { status: 400 })
    }

    // Buscar categorias do campeonato
    const categories = await prisma.championshipCategory.findMany({
      where: {
        championshipId,
        name: { in: selectedCategories }
      }
    })

    if (categories.length === 0) {
      return NextResponse.json({ error: 'Nenhuma categoria válida encontrada para este campeonato' }, { status: 400 })
    }

    // Criar inscrição
    const registration = await prisma.registration.create({
      data: {
        championshipId,
        teamId,
        status: 'PENDING',
        observations: observations || null,
        categories: {
          create: categories.map(cat => ({
            categoryId: cat.id
          }))
        },
        blockedDates: blockedDates && blockedDates.length > 0 ? {
          create: blockedDates.map((bd: { date: string; reason?: string }) => ({
            date: new Date(bd.date),
            reason: bd.reason || null
          }))
        } : undefined
      },
      include: {
        categories: {
          include: {
            category: true
          }
        }
      }
    })

    return NextResponse.json({ success: true, registration }, { status: 201 })
  } catch (error) {
    console.error('Error registering for championship:', error)
    return NextResponse.json({ error: 'Erro ao realizar inscrição' }, { status: 500 })
  }
}
