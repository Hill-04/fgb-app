'use server'

/**
 * Server actions Fase 6.C — confirmar / recusar / cancelar / solicitar revisão
 * de inscrição com auth admin obrigatório.
 *
 * Wrappers que chamam src/lib/registration-actions.ts e garantem que apenas
 * admins autenticados conseguem disparar transições.
 */

import { revalidatePath } from 'next/cache'
import { requireAdminSession } from '@/lib/athlete-registration-server'
import {
  confirmRegistration,
  rejectRegistration,
  requestRevisionRegistration,
  cancelRegistration,
  type RegistrationActionResult,
} from '@/lib/registration-actions'

export type ActionResponse<T = unknown> =
  | { ok: true; data: T }
  | { ok: false; error: string; details?: string[] }

function revalidatePaths(championshipId: string) {
  revalidatePath(`/admin/championships/${championshipId}/registrations`)
  revalidatePath(`/admin/championships/${championshipId}`)
  revalidatePath('/admin/registrations')
  revalidatePath('/team/registrations')
}

export async function confirmRegistrationAction(input: {
  registrationId: string
  championshipId: string
}): Promise<ActionResponse<RegistrationActionResult>> {
  const session = await requireAdminSession()
  if (!session) return { ok: false, error: 'Acesso negado: requer sessão admin' }

  const actorUserId = (session.user as any)?.id ?? (session.user as any)?.email ?? null

  try {
    const result = await confirmRegistration({
      registrationId: input.registrationId,
      actorUserId,
    })

    if (!result.ok) {
      return { ok: false, error: result.errors[0] || 'Falha ao confirmar inscrição', details: result.errors }
    }

    revalidatePaths(input.championshipId)
    return { ok: true, data: result }
  } catch (err: any) {
    return { ok: false, error: err?.message ?? 'Erro desconhecido ao confirmar' }
  }
}

export async function rejectRegistrationAction(input: {
  registrationId: string
  championshipId: string
  reason: string
}): Promise<ActionResponse<RegistrationActionResult>> {
  const session = await requireAdminSession()
  if (!session) return { ok: false, error: 'Acesso negado: requer sessão admin' }

  const actorUserId = (session.user as any)?.id ?? (session.user as any)?.email ?? null

  try {
    const result = await rejectRegistration({
      registrationId: input.registrationId,
      actorUserId,
      reason: input.reason,
    })

    if (!result.ok) {
      return { ok: false, error: result.errors[0] || 'Falha ao recusar inscrição', details: result.errors }
    }

    revalidatePaths(input.championshipId)
    return { ok: true, data: result }
  } catch (err: any) {
    return { ok: false, error: err?.message ?? 'Erro ao recusar inscrição' }
  }
}

export async function requestRevisionRegistrationAction(input: {
  registrationId: string
  championshipId: string
}): Promise<ActionResponse<RegistrationActionResult>> {
  const session = await requireAdminSession()
  if (!session) return { ok: false, error: 'Acesso negado: requer sessão admin' }

  const actorUserId = (session.user as any)?.id ?? (session.user as any)?.email ?? null

  try {
    const result = await requestRevisionRegistration({
      registrationId: input.registrationId,
      actorUserId,
    })

    if (!result.ok) {
      return { ok: false, error: result.errors[0] || 'Falha ao solicitar revisão', details: result.errors }
    }

    revalidatePaths(input.championshipId)
    return { ok: true, data: result }
  } catch (err: any) {
    return { ok: false, error: err?.message ?? 'Erro ao solicitar revisão' }
  }
}

export async function cancelRegistrationAction(input: {
  registrationId: string
  championshipId: string
  reason?: string
}): Promise<ActionResponse<RegistrationActionResult>> {
  const session = await requireAdminSession()
  if (!session) return { ok: false, error: 'Acesso negado: requer sessão admin' }

  const actorUserId = (session.user as any)?.id ?? (session.user as any)?.email ?? null

  try {
    const result = await cancelRegistration({
      registrationId: input.registrationId,
      actorUserId,
      reason: input.reason,
    })

    if (!result.ok) {
      return { ok: false, error: result.errors[0] || 'Falha ao cancelar inscrição', details: result.errors }
    }

    revalidatePaths(input.championshipId)
    return { ok: true, data: result }
  } catch (err: any) {
    return { ok: false, error: err?.message ?? 'Erro ao cancelar inscrição' }
  }
}
