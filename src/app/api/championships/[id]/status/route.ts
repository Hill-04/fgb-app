import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { NotificationService } from '@/services/notification-service'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { status } = body

    const validStatuses = ['DRAFT', 'REGISTRATION_OPEN', 'SCHEDULED', 'IN_PROGRESS', 'FINISHED']
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Status inválido' }, { status: 400 })
    }

    const currentChampionship = await prisma.championship.findUnique({
      where: { id },
      include: { registrations: { select: { teamId: true } } }
    })

    const previousStatus = currentChampionship?.status

    const championship = await prisma.championship.update({
      where: { id },
      data: { status },
      include: { 
        categories: true,
        registrations: { select: { teamId: true } }
      }
    })

    // Notify teams if championship is now open or in a specific state
    if (status !== previousStatus && status === 'REGISTRATION_OPEN') {
      const teamIds = Array.from(new Set(championship.registrations.map(r => r.teamId)))
      await Promise.all(teamIds.map(async (teamId) => {
        await NotificationService.sendTeamNotification(
          teamId, 
          'Inscrições Abertas', 
          `O campeonato ${championship.name} está com inscrições abertas!`,
          'INFO'
        )
      }))
    }

    return NextResponse.json(championship)
  } catch (error) {
    console.error('Error updating championship status:', error)
    return NextResponse.json({ error: 'Erro ao atualizar status do campeonato' }, { status: 500 })
  }
}
