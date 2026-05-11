'use server'

/**
 * Server actions Fase 5 — fechamento, revisao e publicacao de jogo
 * com auth admin obrigatorio e audit log.
 *
 * Estes wrappers chamam src/lib/game-close-service.ts e garantem que apenas
 * admins autenticados conseguem disparar transicoes irreversiveis.
 *
 * NAO substitui finalizeGame() legacy em actions.ts — coexistem ate migracao.
 */

import { revalidatePath } from 'next/cache'
import { requireAdminSession } from '@/lib/athlete-registration-server'
import {
  closeGame,
  requestReview,
  publishGame,
  type CloseGameResult,
} from '@/lib/game-close-service'

export type CloseGameActionInput = {
  gameId: string
  championshipId: string
  allowParityErrors?: boolean
  reason?: string
}

export type ActionResponse<T = unknown> =
  | { ok: true; data: T }
  | { ok: false; error: string; details?: string[] }

// ─────────────── closeGameAction ───────────────

export async function closeGameAction(
  input: CloseGameActionInput,
): Promise<ActionResponse<CloseGameResult>> {
  const session = await requireAdminSession()
  if (!session) {
    return { ok: false, error: 'Acesso negado: requer sessao admin' }
  }

  const actorUserId = (session.user as any)?.id ?? (session.user as any)?.email ?? null

  try {
    const result = await closeGame({
      gameId: input.gameId,
      actorUserId,
      allowParityErrors: input.allowParityErrors ?? false,
      reason: input.reason,
    })

    if (!result.ok) {
      return {
        ok: false,
        error: result.parityErrors[0] || 'Falha ao fechar jogo',
        details: [...result.parityErrors, ...result.warnings],
      }
    }

    // Revalida rotas afetadas
    revalidatePath(`/admin/championships/${input.championshipId}/jogos/${input.gameId}`)
    revalidatePath(`/admin/championships/${input.championshipId}/jogos/${input.gameId}/sumula`)
    revalidatePath(`/admin/championships/${input.championshipId}`)
    revalidatePath(`/jogos/${input.gameId}`)

    return { ok: true, data: result }
  } catch (err: any) {
    return {
      ok: false,
      error: err?.message ?? 'Erro desconhecido ao fechar jogo',
    }
  }
}

// ─────────────── requestReviewAction ───────────────

export async function requestReviewAction(input: {
  gameId: string
  championshipId: string
  reason: string
}): Promise<ActionResponse<{ newState: string }>> {
  const session = await requireAdminSession()
  if (!session) {
    return { ok: false, error: 'Acesso negado: requer sessao admin' }
  }

  const actorUserId = (session.user as any)?.id ?? (session.user as any)?.email ?? null

  try {
    const result = await requestReview({
      gameId: input.gameId,
      reason: input.reason,
      actorUserId,
    })

    revalidatePath(`/admin/championships/${input.championshipId}/jogos/${input.gameId}`)
    return { ok: true, data: { newState: result.newState } }
  } catch (err: any) {
    return { ok: false, error: err?.message ?? 'Erro ao solicitar revisao' }
  }
}

// ─────────────── publishGameAction ───────────────

export async function publishGameAction(input: {
  gameId: string
  championshipId: string
}): Promise<ActionResponse<{ newState: string }>> {
  const session = await requireAdminSession()
  if (!session) {
    return { ok: false, error: 'Acesso negado: requer sessao admin' }
  }

  const actorUserId = (session.user as any)?.id ?? (session.user as any)?.email ?? null

  try {
    const result = await publishGame({
      gameId: input.gameId,
      actorUserId,
    })

    revalidatePath(`/admin/championships/${input.championshipId}/jogos/${input.gameId}`)
    revalidatePath(`/jogos/${input.gameId}`)
    return { ok: true, data: { newState: result.newState } }
  } catch (err: any) {
    return { ok: false, error: err?.message ?? 'Erro ao publicar jogo' }
  }
}
