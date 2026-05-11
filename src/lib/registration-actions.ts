/**
 * Registration Actions Service — Fase 6.C
 *
 * Services transacionais que mudam o estado de uma Registration de forma segura:
 *   1. Lê estado atual
 *   2. Valida transição (state machine)
 *   3. Atualiza lifecycleState + lifecycleVersion + legacy status (compat) +
 *      timestamp + actor fields, tudo em uma única transação
 *
 * Garantias:
 *   - Idempotência: chamar 2x retorna ok:false no 2º (já no estado alvo)
 *   - Audit: confirmedBy/At, rejectedBy/At/Reason gravados em DB
 *   - Backward compat: legacy `status` field é mantido em sync
 *
 * NÃO substitui edição direta via admin modal (que ainda chama UPDATE direto).
 * Esses services são o caminho recomendado going forward.
 */

import { prisma } from '@/lib/db'
import {
  assertCanTransition,
  canTransition,
  deriveLifecycleFromLegacy,
  type RegistrationLifecycleState,
} from '@/lib/registration-lifecycle'

// ─────────────── Types ───────────────

export type RegistrationActionResult = {
  ok: boolean
  registrationId: string
  fromState: RegistrationLifecycleState
  newState: RegistrationLifecycleState
  errors: string[]
}

export type ConfirmInput = {
  registrationId: string
  actorUserId?: string
}

export type RejectInput = {
  registrationId: string
  actorUserId?: string
  reason: string
}

export type CancelInput = {
  registrationId: string
  actorUserId?: string
  reason?: string
}

export type RequestRevisionInput = {
  registrationId: string
  actorUserId?: string
}

export type ResubmitInput = {
  registrationId: string
  actorUserId?: string
}

// ─────────────── Helpers ───────────────

/** Mapeia lifecycleState para legacy status (compat com UI antiga). */
function lifecycleToLegacyStatus(state: RegistrationLifecycleState): string {
  if (state === 'CONFIRMED') return 'CONFIRMED'
  if (state === 'REJECTED' || state === 'CANCELLED') return 'REJECTED'
  return 'PENDING' // DRAFT, SUBMITTED, UNDER_REVIEW
}

/** Lê estado atual da registration, derivando do legacy se necessário. */
async function readCurrentState(registrationId: string) {
  const reg = await prisma.registration.findUnique({
    where: { id: registrationId },
    select: {
      id: true,
      lifecycleState: true,
      status: true,
      registeredAt: true,
      teamId: true,
      championship: { select: { name: true, year: true } },
    },
  })
  if (!reg) return null

  // Se lifecycleState está no default 'SUBMITTED' mas status indica outra coisa,
  // derive (backfill pode não ter rodado ainda)
  const stored = (reg.lifecycleState ?? 'SUBMITTED') as RegistrationLifecycleState
  const derived = deriveLifecycleFromLegacy({ status: reg.status })
  const current = stored === 'SUBMITTED' && derived !== 'SUBMITTED' ? derived : stored

  return { reg, current }
}

/**
 * Cria notificação para a equipe. Best-effort: nunca lança (silenciosamente loga).
 * Tipo possíveis: REGISTRATION_CONFIRMED, REGISTRATION_REJECTED, REGISTRATION_UNDER_REVIEW, REGISTRATION_CANCELLED.
 */
async function notifyTeam(input: {
  teamId: string
  title: string
  message: string
  type: string
}): Promise<void> {
  try {
    await prisma.notification.create({
      data: {
        teamId: input.teamId,
        title: input.title,
        message: input.message,
        type: input.type,
      },
    })
  } catch (err) {
    console.error('[registration-actions] notifyTeam falhou:', err)
  }
}

function championshipLabel(ctx: { championship: { name: string; year: number } | null }) {
  if (!ctx.championship) return 'campeonato'
  return `${ctx.championship.name} ${ctx.championship.year}`
}

// ─────────────── confirmRegistration ───────────────

export async function confirmRegistration(input: ConfirmInput): Promise<RegistrationActionResult> {
  const { registrationId, actorUserId } = input

  const ctx = await readCurrentState(registrationId)
  if (!ctx) throw new Error(`Inscrição ${registrationId} não encontrada`)

  const from = ctx.current
  const to: RegistrationLifecycleState = 'CONFIRMED'

  if (!canTransition(from, to)) {
    return {
      ok: false,
      registrationId,
      fromState: from,
      newState: from,
      errors: [`Transição inválida: ${from} → CONFIRMED. Estados que permitem confirmação: SUBMITTED, UNDER_REVIEW.`],
    }
  }

  await prisma.registration.update({
    where: { id: registrationId },
    data: {
      lifecycleState: to,
      lifecycleVersion: { increment: 1 },
      status: lifecycleToLegacyStatus(to),
      confirmedAt: new Date(),
      confirmedByUserId: actorUserId ?? null,
      // Limpa rejection se estava REJECTED antes (caso re-submitted+confirmed)
      rejectedAt: null,
      rejectedByUserId: null,
      rejectionReason: null,
    },
  })

  await notifyTeam({
    teamId: ctx.reg.teamId,
    title: 'Inscrição confirmada',
    message: `Sua inscrição em ${championshipLabel(ctx.reg)} foi aprovada pela FGB.`,
    type: 'REGISTRATION_CONFIRMED',
  })

  return { ok: true, registrationId, fromState: from, newState: to, errors: [] }
}

// ─────────────── rejectRegistration ───────────────

export async function rejectRegistration(input: RejectInput): Promise<RegistrationActionResult> {
  const { registrationId, actorUserId, reason } = input

  if (!reason || reason.trim().length < 3) {
    throw new Error('Motivo de recusa é obrigatório (min. 3 caracteres)')
  }

  const ctx = await readCurrentState(registrationId)
  if (!ctx) throw new Error(`Inscrição ${registrationId} não encontrada`)

  const from = ctx.current
  const to: RegistrationLifecycleState = 'REJECTED'

  if (!canTransition(from, to)) {
    return {
      ok: false,
      registrationId,
      fromState: from,
      newState: from,
      errors: [`Transição inválida: ${from} → REJECTED. Estados que permitem recusa: SUBMITTED, UNDER_REVIEW.`],
    }
  }

  await prisma.registration.update({
    where: { id: registrationId },
    data: {
      lifecycleState: to,
      lifecycleVersion: { increment: 1 },
      status: lifecycleToLegacyStatus(to),
      rejectedAt: new Date(),
      rejectedByUserId: actorUserId ?? null,
      rejectionReason: reason.trim(),
    },
  })

  await notifyTeam({
    teamId: ctx.reg.teamId,
    title: 'Inscrição recusada',
    message: `Sua inscrição em ${championshipLabel(ctx.reg)} foi recusada. Motivo: ${reason.trim()}`,
    type: 'REGISTRATION_REJECTED',
  })

  return { ok: true, registrationId, fromState: from, newState: to, errors: [] }
}

// ─────────────── requestRevisionRegistration ───────────────

/**
 * Move CONFIRMED → UNDER_REVIEW para correção pós-confirmação.
 * Mantém confirmedAt/By como histórico (não limpa).
 */
export async function requestRevisionRegistration(
  input: RequestRevisionInput,
): Promise<RegistrationActionResult> {
  const { registrationId, actorUserId } = input

  const ctx = await readCurrentState(registrationId)
  if (!ctx) throw new Error(`Inscrição ${registrationId} não encontrada`)

  const from = ctx.current
  const to: RegistrationLifecycleState = 'UNDER_REVIEW'

  if (!canTransition(from, to)) {
    return {
      ok: false,
      registrationId,
      fromState: from,
      newState: from,
      errors: [`Transição inválida: ${from} → UNDER_REVIEW. Use a partir de CONFIRMED ou SUBMITTED.`],
    }
  }

  await prisma.registration.update({
    where: { id: registrationId },
    data: {
      lifecycleState: to,
      lifecycleVersion: { increment: 1 },
      status: lifecycleToLegacyStatus(to),
    },
  })

  await notifyTeam({
    teamId: ctx.reg.teamId,
    title: 'Inscrição em revisão',
    message: `Sua inscrição em ${championshipLabel(ctx.reg)} foi marcada para revisão pela secretaria FGB.`,
    type: 'REGISTRATION_UNDER_REVIEW',
  })

  return { ok: true, registrationId, fromState: from, newState: to, errors: [] }
}

// ─────────────── cancelRegistration ───────────────

export async function cancelRegistration(input: CancelInput): Promise<RegistrationActionResult> {
  const { registrationId, actorUserId, reason } = input

  const ctx = await readCurrentState(registrationId)
  if (!ctx) throw new Error(`Inscrição ${registrationId} não encontrada`)

  const from = ctx.current
  const to: RegistrationLifecycleState = 'CANCELLED'

  if (!canTransition(from, to)) {
    return {
      ok: false,
      registrationId,
      fromState: from,
      newState: from,
      errors: [`Transição inválida: ${from} → CANCELLED.`],
    }
  }

  await prisma.registration.update({
    where: { id: registrationId },
    data: {
      lifecycleState: to,
      lifecycleVersion: { increment: 1 },
      status: lifecycleToLegacyStatus(to),
      rejectionReason: reason?.trim() || 'Cancelado',
      rejectedAt: new Date(),
      rejectedByUserId: actorUserId ?? null,
    },
  })

  await notifyTeam({
    teamId: ctx.reg.teamId,
    title: 'Inscrição cancelada',
    message: `Sua inscrição em ${championshipLabel(ctx.reg)} foi cancelada.${reason ? ' Motivo: ' + reason.trim() : ''}`,
    type: 'REGISTRATION_CANCELLED',
  })

  return { ok: true, registrationId, fromState: from, newState: to, errors: [] }
}

// ─────────────── resubmitRegistration ───────────────

/**
 * Move REJECTED → SUBMITTED para a equipe re-submeter após corrigir.
 * Não limpa rejectionReason (histórico).
 */
export async function resubmitRegistration(input: ResubmitInput): Promise<RegistrationActionResult> {
  const { registrationId, actorUserId } = input

  const ctx = await readCurrentState(registrationId)
  if (!ctx) throw new Error(`Inscrição ${registrationId} não encontrada`)

  const from = ctx.current
  const to: RegistrationLifecycleState = 'SUBMITTED'

  if (!canTransition(from, to)) {
    return {
      ok: false,
      registrationId,
      fromState: from,
      newState: from,
      errors: [`Transição inválida: ${from} → SUBMITTED. Use a partir de REJECTED ou UNDER_REVIEW.`],
    }
  }

  await prisma.registration.update({
    where: { id: registrationId },
    data: {
      lifecycleState: to,
      lifecycleVersion: { increment: 1 },
      status: lifecycleToLegacyStatus(to),
      submittedAt: new Date(),
    },
  })

  return { ok: true, registrationId, fromState: from, newState: to, errors: [] }
}
