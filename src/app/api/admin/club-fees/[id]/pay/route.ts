import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()
    const fee = await prisma.teamFee.update({
      where: { id },
      data: {
        paidAt: new Date(),
        paidAmount: Number(body.paidAmount),
        paymentProof: body.paymentProofUrl || null,
        status: 'PAID',
      },
    })
    return NextResponse.json(fee)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
