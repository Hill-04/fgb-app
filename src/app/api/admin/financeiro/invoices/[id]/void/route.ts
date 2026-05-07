import { NextRequest, NextResponse } from 'next/server'

import { requireAdminSession } from '@/lib/finance-server'
import { serializeInvoice } from '@/lib/finance'
import { FinancialInvoiceOperationError, voidFinancialInvoice } from '@/lib/finance-invoice-service'

type Params = {
  params: Promise<{ id: string }>
}

export async function POST(request: NextRequest, { params }: Params) {
  try {
    const session = await requireAdminSession()
    if (!session) return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })
    const { id } = await params
    const body = await request.json().catch(() => ({}))

    const updated = await voidFinancialInvoice(id, {
      reason: body.reason,
    }, {
      createdByUserId: (session.user as any)?.id || null,
    })

    return NextResponse.json(serializeInvoice(updated))
  } catch (error: any) {
    const status = error instanceof FinancialInvoiceOperationError ? error.status : error.message === 'Unauthorized' ? 401 : 500
    return NextResponse.json({ error: error.message || 'Erro ao cancelar fatura.' }, { status })
  }
}
