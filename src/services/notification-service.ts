import { prisma } from '@/lib/db'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY || 're_mock_key')

export class NotificationService {
  /**
   * Sends a notification to a specific team (database entry)
   */
  static async sendTeamNotification(teamId: string, title: string, message: string, type: string = 'INFO') {
    return await prisma.notification.create({
      data: {
        teamId,
        title,
        message,
        type,
        read: false
      }
    })
  }

  /**
   * Sends an email to all admins/members of a team
   */
  static async sendTeamEmail(teamId: string, subject: string, html: string) {
    try {
      // Find team members with emails
      const team = await prisma.team.findUnique({
        where: { id: teamId },
        include: {
          members: {
            include: { user: true }
          }
        }
      })

      if (!team) throw new Error('Time não encontrado')

      const recipientEmails = team.members
        .map(m => m.user.email)
        .filter(email => !!email) as string[]

      if (recipientEmails.length === 0) return { success: false, reason: 'Nenhum email encontrado' }

      if (!process.env.RESEND_API_KEY) {
        console.log(`[MOCK EMAIL] To: ${recipientEmails.join(', ')} | Subject: ${subject}`)
        return { success: true, mocked: true }
      }

      const { data, error } = await resend.emails.send({
        from: 'FGB Championship <onboarding@resend.dev>',
        to: recipientEmails,
        subject,
        html,
      })

      if (error) throw error
      return { success: true, data }
    } catch (error) {
      console.error('Failed to send team email:', error)
      return { success: false, error }
    }
  }

  /**
   * Notify team about a game update
   */
  static async notifyGameUpdate(teamId: string, gameInfo: string) {
    const title = 'Atualização de Jogo'
    const message = `Detalhes do seu jogo foram atualizados: ${gameInfo}`
    
    await this.sendTeamNotification(teamId, title, message, 'GAME_UPDATE')
    await this.sendTeamEmail(teamId, title, `<p>${message}</p>`)
  }

  /**
   * Notify team about registration approval
   */
  static async notifyRegistrationStatus(teamId: string, championshipName: string, status: string) {
    const title = `Inscrição ${status === 'APPROVED' ? 'Aprovada' : 'Rejeitada'}`
    const message = `Sua inscrição para o campeonato ${championshipName} foi ${status === 'APPROVED' ? 'aprovada' : 'rejeitada pelo administrador'}.`
    
    await this.sendTeamNotification(teamId, title, message, status === 'APPROVED' ? 'SUCCESS' : 'WARNING')
    await this.sendTeamEmail(teamId, title, `<h1>${title}</h1><p>${message}</p>`)
  }
}
