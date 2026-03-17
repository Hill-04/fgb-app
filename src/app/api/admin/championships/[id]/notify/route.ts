import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { NotificationService } from '@/services/notification-service'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !(session.user as any).isAdmin) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { id: championshipId } = await params
    const { title, message } = await request.json()

    if (!title || !message) {
      return NextResponse.json({ error: 'Título e mensagem são obrigatórios' }, { status: 400 })
    }

    const championship = await prisma.championship.findUnique({
      where: { id: championshipId },
      include: {
        registrations: {
          select: { teamId: true }
        }
      }
    })

    if (!championship) {
      return NextResponse.json({ error: 'Campeonato não encontrado' }, { status: 404 })
    }

    // Send notifications to all registered teams
    const teamIds = Array.from(new Set(championship.registrations.map(r => r.teamId)))

    await Promise.all(teamIds.map(async (teamId) => {
      await NotificationService.sendTeamNotification(teamId, title, message, 'GLOBAL_ANNOUNCEMENT')
      await NotificationService.sendTeamEmail(teamId, title, `<h1>${title}</h1><p>${message}</p>`)
    }))

    return NextResponse.json({ success: true, count: teamIds.length })
  } catch (error) {
    console.error('Error sending mass notifications:', error)
    return NextResponse.json({ error: 'Erro ao enviar notificações' }, { status: 500 })
  }
}
