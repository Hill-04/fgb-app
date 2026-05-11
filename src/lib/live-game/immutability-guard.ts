import { prisma } from '@/lib/db'

/**
 * Verifica se um jogo pode ser modificado e por quem.
 * Usado em APIs que tocam GameEvent, GamePlayerStatLine, GameOfficialReport.
 */

export async function canModifyHistoricalData(
  gameId: string,
  userId: string | null,
): Promise<{ allowed: boolean; reason?: string; requiresLogReason: boolean }> {
  if (!userId) {
    return { allowed: false, reason: 'Usuário não autenticado', requiresLogReason: false }
  }

  const [game, user] = await Promise.all([
    prisma.game.findUnique({
      where: { id: gameId },
      select: { isHistoricallyLocked: true, lifecycleState: true },
    }),
    prisma.user.findUnique({
      where: { id: userId },
      select: { isAdmin: true, isFederationSuperAdmin: true },
    }),
  ])

  if (!game) return { allowed: false, reason: 'Jogo não encontrado', requiresLogReason: false }
  if (!user) return { allowed: false, reason: 'Usuário não encontrado', requiresLogReason: false }

  if (game.isHistoricallyLocked) {
    if (!user.isFederationSuperAdmin) {
      return {
        allowed: false,
        reason: 'Jogo travado historicamente. Apenas super-admin pode modificar.',
        requiresLogReason: false,
      }
    }
    return { allowed: true, requiresLogReason: true }
  }

  if (game.lifecycleState === 'PUBLISHED') {
    if (!user.isAdmin) {
      return { allowed: false, reason: 'Jogo publicado. Requer admin.', requiresLogReason: false }
    }
    return { allowed: true, requiresLogReason: true }
  }

  if (!user.isAdmin) {
    return { allowed: false, reason: 'Acesso negado', requiresLogReason: false }
  }
  return { allowed: true, requiresLogReason: false }
}

/**
 * Grava modificação em HistoricalDataAuditLog.
 * Chamar sempre que canModifyHistoricalData retornar requiresLogReason: true.
 */
export async function logHistoricalModification(input: {
  entityType: 'Game' | 'GameEvent' | 'GamePlayerStatLine'
  entityId: string
  fieldChanged?: string
  oldValue?: string
  newValue?: string
  reason: string
  performedByUserId: string
}): Promise<void> {
  await prisma.historicalDataAuditLog.create({
    data: {
      entityType: input.entityType,
      entityId: input.entityId,
      fieldChanged: input.fieldChanged,
      oldValue: input.oldValue,
      newValue: input.newValue,
      reason: input.reason,
      performedByUserId: input.performedByUserId,
    },
  })
}
