import { NextRequest, NextResponse } from 'next/server'

import { buildInvoicePdfBuffer } from '@/lib/finance-pdf'
import { getFinancialInvoiceById, requireAdminSession } from '@/lib/finance-server'
import { serializeInvoice } from '@/lib/finance'

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

    const buffer = await buildInvoicePdfBuffer(serializeInvoice(invoice))

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="fatura-${invoice.number}.pdf"`,
      },
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Erro ao gerar PDF.' }, { status: error.message === 'Unauthorized' ? 401 : 500 })
  }
}
