import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { recalculateIsViable } from '@/services/registration-service'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { id: championshipId } = await params
    const body = await request.json()
    const { 
      selectedCategories, 
      blockedDates, 
      observations, 
      teamId: manualTeamId, 
      status: manualStatus,
      canHost,
      gymName,
      gymAddress,
      gymCity,
      gymMapsLink
    } = body

    const isAdmin = (session.user as any).isAdmin
    
    // Se não for admin, usa o teamId do próprio usuário logado
    const teamId = isAdmin ? (manualTeamId || (session.user as any).teamId) : (session.user as any).teamId

    if (!teamId) {
      return NextResponse.json({ error: 'ID da equipe não identificado' }, { status: 400 })
    }

    if (!selectedCategories || selectedCategories.length === 0) {
      return NextResponse.json({ error: 'Selecione ao menos uma categoria' }, { status: 400 })
    }

    // Verificar se o campeonato existe
    const championship = await prisma.championship.findUnique({
      where: { id: championshipId }
    })

    if (!championship) {
      return NextResponse.json({ error: 'Campeonato não encontrado' }, { status: 404 })
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
        status: isAdmin && manualStatus ? manualStatus : 'PENDING',
        observations: observations || null,
        canHost: Boolean(canHost),
        gymName: gymName || null,
        gymAddress: gymAddress || null,
        gymCity: gymCity || null,
        gymMapsLink: gymMapsLink || null,
        categories: {
          create: categories.map(cat => ({
            categoryId: cat.id
          }))
        },
        blockedDates: blockedDates && blockedDates.length > 0 ? {
          create: blockedDates.map((bd: { startDate: string; endDate?: string; reason?: string }) => ({
            startDate: new Date(bd.startDate),
            endDate: bd.endDate ? new Date(bd.endDate) : null,
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

    // Recalcular viabilidade das categorias
    await recalculateIsViable(championshipId)

    return NextResponse.json({ success: true, registration }, { status: 201 })
  } catch (error) {
    console.error('Error registering for championship:', error)
    return NextResponse.json({ error: 'Erro ao realizar inscrição' }, { status: 500 })
  }
}
