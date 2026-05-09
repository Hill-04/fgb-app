import { prisma } from '@/lib/db'

export type ChampionshipNotificationType =
  | 'GAME_RESCHEDULED'
  | 'GAME_VENUE_CHANGED'
  | 'GAME_CANCELLED'
  | 'SCHEDULE_PUBLISHED'
  | 'STATUS_CHANGED'
  | 'OFFICIAL_NOTE'
  | 'CHAMPIONSHIP_FINISHED'

export async function notifyChampionshipTeams(
  championshipId: string,
  notification: {
    type: ChampionshipNotificationType
    title: string
    message: string
    excludeTeamIds?: string[]
  },
): Promise<{ sent: number }> {
  const registrations = await prisma.registration.findMany({
    where: {
      championshipId,
      status: { in: ['CONFIRMED', 'PENDING'] },
      ...(notification.excludeTeamIds && notification.excludeTeamIds.length > 0
        ? { teamId: { notIn: notification.excludeTeamIds } }
        : {}),
    },
    select: { teamId: true },
  })

  if (registrations.length === 0) return { sent: 0 }

  let sent = 0
  for (const r of registrations) {
    try {
      await prisma.notification.create({
        data: {
          teamId: r.teamId,
          title: notification.title,
          message: notification.message,
          type: notification.type,
        },
      })
      sent += 1
    } catch (e) {
      console.warn('[notifyChampionshipTeams] failed for team', r.teamId, e)
    }
  }
  return { sent }
}

export async function notifyGameChange(
  gameId: string,
  changeType: 'RESCHEDULED' | 'VENUE_CHANGED' | 'CANCELLED',
  details: { reason?: string; oldDate?: Date; newDate?: Date; oldVenue?: string; newVenue?: string },
): Promise<void> {
  const game = await prisma.game.findUnique({
    where: { id: gameId },
    include: {
      championship: { select: { id: true, name: true } },
      homeTeam: { select: { id: true, name: true } },
      awayTeam: { select: { id: true, name: true } },
    },
  })
  if (!game) return

  const fmt = (d: Date) => d.toLocaleString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })

  let title = ''
  let message = ''

  if (changeType === 'RESCHEDULED') {
    title = `Jogo remarcado: ${game.homeTeam.name} × ${game.awayTeam.name}`
    message = `${details.oldDate ? `Era ${fmt(details.oldDate)}. ` : ''}Agora é ${details.newDate ? fmt(details.newDate) : 'a definir'}.${details.reason ? ` Motivo: ${details.reason}` : ''}`
  } else if (changeType === 'VENUE_CHANGED') {
    title = `Local alterado: ${game.homeTeam.name} × ${game.awayTeam.name}`
    message = `${details.oldVenue ? `De "${details.oldVenue}" ` : ''}para "${details.newVenue ?? 'a definir'}".${details.reason ? ` Motivo: ${details.reason}` : ''}`
  } else {
    title = `Jogo cancelado: ${game.homeTeam.name} × ${game.awayTeam.name}`
    message = details.reason || 'Sem motivo informado'
  }

  for (const teamId of [game.homeTeamId, game.awayTeamId]) {
    try {
      await prisma.notification.create({
        data: {
          teamId,
          title,
          message,
          type: changeType === 'RESCHEDULED' ? 'GAME_RESCHEDULED' : changeType === 'VENUE_CHANGED' ? 'GAME_VENUE_CHANGED' : 'GAME_CANCELLED',
        },
      })
    } catch (e) {
      console.warn('[notifyGameChange] failed', e)
    }
  }
}
