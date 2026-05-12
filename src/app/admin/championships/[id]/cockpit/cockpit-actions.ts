'use server'

import { requireAdminSession } from '@/lib/athlete-registration-server'
import { prisma } from '@/lib/db'
import { createInvoiceFromRegistration } from '@/lib/finance-invoice-service'
import { revalidatePath } from 'next/cache'

type BulkResult = {
  ok: boolean
  error?: string
  succeeded?: number
  failed?: number
  errors?: string[]
}

export async function bulkApproveAction(input: { championshipId: string; registrationIds: string[] }): Promise<BulkResult> {
  const session = await requireAdminSession()
  if (!session) return { ok: false, error: 'Acesso negado' }
  if (input.registrationIds.length === 0) return { ok: true, succeeded: 0 }

  const result = await prisma.registration.updateMany({
    where: { id: { in: input.registrationIds } },
    data: { status: 'CONFIRMED', confirmedAt: new Date() },
  })

  revalidatePath(`/admin/championships/${input.championshipId}/cockpit`)
  return { ok: true, succeeded: result.count }
}

export async function bulkRejectAction(input: { championshipId: string; registrationIds: string[]; reason: string }): Promise<BulkResult> {
  const session = await requireAdminSession()
  if (!session) return { ok: false, error: 'Acesso negado' }
  if (input.registrationIds.length === 0) return { ok: true, succeeded: 0 }

  const result = await prisma.registration.updateMany({
    where: { id: { in: input.registrationIds } },
    data: { status: 'REJECTED', rejectedAt: new Date(), rejectionReason: input.reason },
  })

  revalidatePath(`/admin/championships/${input.championshipId}/cockpit`)
  return { ok: true, succeeded: result.count }
}

export async function bulkSendInvoiceAction(input: { championshipId: string; registrationIds: string[] }): Promise<BulkResult> {
  const session = await requireAdminSession()
  if (!session) return { ok: false, error: 'Acesso negado' }
  if (input.registrationIds.length === 0) return { ok: true, succeeded: 0 }

  let succeeded = 0
  let failed = 0
  const errors: string[] = []

  for (const registrationId of input.registrationIds) {
    try {
      await createInvoiceFromRegistration(registrationId)
      succeeded++
    } catch (err: any) {
      failed++
      errors.push(`${registrationId}: ${err?.message || 'erro desconhecido'}`)
    }
  }

  revalidatePath(`/admin/championships/${input.championshipId}/cockpit`)
  return { ok: true, succeeded, failed, errors }
}
