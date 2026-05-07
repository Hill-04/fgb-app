import { NextRequest, NextResponse } from 'next/server'

import { removeFinancialInvoiceItem, FinancialInvoiceOperationError } from '@/lib/finance-invoice-service'
import { serializeInvoice } from '@/lib/finance'
import { requireAdminSession } from '@/lib/finance-server'

type Params = {
  params: Promise<{ id: string; itemId: string }>
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    const session = await requireAdminSession()
    if (!session) return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })

    const { id, itemId } = await params
    const invoice = await removeFinancialInvoiceItem(id, itemId, {
      createdByUserId: (session.user as any)?.id || null,
    })

    return NextResponse.json(serializeInvoice(invoice))
  } catch (error: any) {
    const status = error instanceof FinancialInvoiceOperationError ? error.status : 500
    return NextResponse.json({ error: error.message || 'Erro ao remover item.' }, { status })
  }
}
