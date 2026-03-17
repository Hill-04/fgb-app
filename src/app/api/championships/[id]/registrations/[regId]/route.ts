import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { recalculateIsViable } from '@/services/registration-service'
import { NotificationService } from '@/services/notification-service'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; regId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !(session.user as any).isAdmin) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { id: championshipId, regId } = await params
    const body = await request.json()
    const { 
      selectedCategories, 
      blockedDates, 
      observations, 
      status,
      canHost,
      gymName,
      gymAddress,
      gymCity,
      gymMapsLink
    } = body

    // Get current registration to check for status change
    const currentReg = await prisma.registration.findUnique({
      where: { id: regId },
      include: { team: true, championship: true }
    })

    if (!currentReg) {
      return NextResponse.json({ error: 'Inscrição não encontrada' }, { status: 404 })
    }

    const previousStatus = currentReg.status

    // Update registration basic fields
    await prisma.registration.update({
      where: { id: regId },
      data: {
        status,
        observations,
        canHost: canHost !== undefined ? Boolean(canHost) : undefined,
        gymName,
        gymAddress,
        gymCity,
        gymMapsLink,
      }
    })

    // Update categories if provided
    if (selectedCategories) {
      // Get category IDs
      const categories = await prisma.championshipCategory.findMany({
        where: {
          championshipId,
          name: { in: selectedCategories }
        }
      })

      // Delete old categories and create new ones
      await prisma.registrationCategory.deleteMany({
        where: { registrationId: regId }
      })

      await prisma.registrationCategory.createMany({
        data: categories.map(cat => ({
          registrationId: regId,
          categoryId: cat.id
        }))
      })
    }

    // Update blocked dates if provided
    if (blockedDates) {
      await prisma.blockedDate.deleteMany({
        where: { registrationId: regId }
      })

      if (blockedDates.length > 0) {
        await prisma.blockedDate.createMany({
          data: blockedDates.map((bd: { startDate: string; endDate?: string; reason?: string }) => ({
            registrationId: regId,
            startDate: new Date(bd.startDate),
            endDate: bd.endDate ? new Date(bd.endDate) : null,
            reason: bd.reason || null
          }))
        })
      }
    }

    // Recalculate category viability
    await recalculateIsViable(championshipId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating registration:', error)
    return NextResponse.json({ error: 'Erro ao atualizar inscrição' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; regId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !(session.user as any).isAdmin) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { id: championshipId, regId } = await params

    await prisma.registration.delete({
      where: { id: regId }
    })

    // Recalculate category viability
    await recalculateIsViable(championshipId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting registration:', error)
    return NextResponse.json({ error: 'Erro ao excluir inscrição' }, { status: 500 })
  }
}
