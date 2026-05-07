import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import {
  assertRegistrationHasBillableFees,
  createInvoiceFromRegistration,
  RegistrationInvoiceGenerationError,
} from '@/lib/finance-invoice-service'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !(session.user as any).isAdmin) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { status } = body

    if (!['CONFIRMED', 'REJECTED', 'PENDING'].includes(status)) {
      return NextResponse.json({ error: 'Status inválido' }, { status: 400 })
    }

    if (status === 'CONFIRMED') {
      await assertRegistrationHasBillableFees(id)
    }

    const registration = await prisma.registration.update({
      where: { id },
      data: { status }
    })

    const financialInvoiceGeneration =
      status === 'CONFIRMED'
        ? await createInvoiceFromRegistration(id, {
            createdByUserId: (session.user as any)?.id || null,
            context: 'REGISTRATION_STATUS_CONFIRMATION',
          })
        : null

    return NextResponse.json({ success: true, registration, financialInvoiceGeneration }, { status: 200 })
  } catch (error: any) {
    console.error('Error updating registration status:', error)
    const status = error instanceof RegistrationInvoiceGenerationError ? error.status : 500
    return NextResponse.json({ error: error.message || 'Erro ao atualizar status' }, { status })
  }
}
