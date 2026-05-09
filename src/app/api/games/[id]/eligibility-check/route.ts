import { NextResponse } from 'next/server'
import { ensureDatabaseSchema } from '@/lib/db-patch'
import { checkBidEligibilityForGame } from '@/lib/championship/bid-eligibility'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await ensureDatabaseSchema()
    const { id } = await params
    const result = await checkBidEligibilityForGame(id)
    return NextResponse.json(result)
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Erro' }, { status: 500 })
  }
}
