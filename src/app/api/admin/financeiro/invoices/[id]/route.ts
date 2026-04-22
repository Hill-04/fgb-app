import { NextRequest, NextResponse } from 'next/server'

import { getFinancialInvoiceById, requireAdminSession } from '@/lib/finance-server'
import { serializeInvoice } from '@/lib/finance'
import { FinancialInvoiceOperationError, updateFinancialInvoiceFields } from '@/lib/finance-invoice-service'

type Params = {
  params: Promise<{ id: string }>
}

export async function GET(_request: NextRequest, { params }: Params) {
  try {
    const session = await requireAdminSession()
    if (!session) return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })
    const { id } = await params
    const invoice = await getFinancialInvoiceById(id)

    if (!invoice) {
      return NextResponse.json({ error: 'Fatura nao encontrada.' }, { status: 404 })
    }

    return NextResponse.json(serializeInvoice(invoice))
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Erro ao carregar fatura.' }, { status: error.message === 'Unauthorized' ? 401 : 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const session = await requireAdminSession()
    if (!session) return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })
    const { id } = await params
    const body = await request.json()

    const updated = await updateFinancialInvoiceFields(id, {
      dueDate: 'dueDate' in body ? body.dueDate : undefined,
      notes: 'notes' in body ? body.notes : undefined,
    }, {
      createdByUserId: (session.user as any)?.id || null,
    })

    return NextResponse.json(serializeInvoice(updated))
  } catch (error: any) {
    const status = error instanceof FinancialInvoiceOperationError ? error.status : error.message === 'Unauthorized' ? 401 : 500
    return NextResponse.json({ error: error.message || 'Erro ao atualizar fatura.' }, { status })
  }
}
