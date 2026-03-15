import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session || !(session.user as any).isAdmin) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  try {
    const { id } = await params
    const body = await request.json()
    const { 
      homeScore, 
      awayScore, 
      status, 
      dateTime, 
      location,
      city
    } = body

    const updateData: any = {}
    if (homeScore !== undefined) updateData.homeScore = Number(homeScore)
    if (awayScore !== undefined) updateData.awayScore = Number(awayScore)
    if (status) updateData.status = status
    if (dateTime) updateData.dateTime = new Date(dateTime)
    if (location) updateData.location = location
    if (city) updateData.city = city

    const game = await prisma.game.update({
      where: { id },
      data: updateData,
      include: {
        homeTeam: { select: { name: true } },
        awayTeam: { select: { name: true } },
      }
    })

    // Optional: Update standings if game is completed
    if (status === 'COMPLETED') {
      // Manual logic or trigger a background job to recalc standings
    }

    return NextResponse.json(game)
  } catch (error) {
    console.error('Error updating game:', error)
    return NextResponse.json({ error: 'Erro ao atualizar jogo' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session || !(session.user as any).isAdmin) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  try {
    const { id } = await params
    await prisma.game.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao excluir jogo' }, { status: 500 })
  }
}
