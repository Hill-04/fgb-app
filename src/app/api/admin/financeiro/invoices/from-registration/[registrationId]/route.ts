import { NextRequest, NextResponse } from 'next/server'

import {
  createInvoiceFromRegistration,
  RegistrationInvoiceGenerationError,
} from '@/lib/finance-invoice-service'
import { requireAdminSession } from '@/lib/finance-server'

type Params = {
  params: Promise<{ registrationId: string }>
}

export async function POST(_request: NextRequest, { params }: Params) {
  try {
    const session = await requireAdminSession()
    if (!session) return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })

    const { registrationId } = await params
    const result = await createInvoiceFromRegistration(registrationId, {
      createdByUserId: (session.user as any)?.id || null,
      context: 'MANUAL_ADMIN_ENDPOINT',
    })

    const status = result.action === 'created' ? 201 : 200
    return NextResponse.json({
      ...result.invoice,
      generation: {
        action: result.action,
        message:
          result.action === 'created'
            ? 'Fatura criada a partir da inscricao.'
            : result.action === 'existing_draft'
              ? 'Ja existe uma fatura ativa em rascunho para esta inscricao.'
              : 'Ja existe uma fatura ativa para esta inscricao.',
      },
    }, { status })
  } catch (error: any) {
    const status = error instanceof RegistrationInvoiceGenerationError ? error.status : error.message === 'Unauthorized' ? 401 : 500
    return NextResponse.json({ error: error.message || 'Erro ao gerar fatura da inscricao.' }, { status })
  }
}
