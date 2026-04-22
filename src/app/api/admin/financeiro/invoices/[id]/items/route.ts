import { NextRequest, NextResponse } from 'next/server'

import { addFinancialInvoiceItem, FinancialInvoiceOperationError } from '@/lib/finance-invoice-service'
import { serializeInvoice } from '@/lib/finance'
import { requireAdminSession } from '@/lib/finance-server'

type Params = {
  params: Promise<{ id: string }>
}

export async function POST(request: NextRequest, { params }: Params) {
  try {
    const session = await requireAdminSession()
    if (!session) return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })

    const { id } = await params
    const body = await request.json()
    const invoice = await addFinancialInvoiceItem(id, body, {
      createdByUserId: (session.user as any)?.id || null,
    })

    return NextResponse.json(serializeInvoice(invoice), { status: 201 })
  } catch (error: any) {
    const status = error instanceof FinancialInvoiceOperationError ? error.status : 500
    return NextResponse.json({ error: error.message || 'Erro ao adicionar item.' }, { status })
  }
}
