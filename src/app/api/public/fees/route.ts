import { NextResponse } from 'next/server'

import { prisma } from '@/lib/db'

export async function GET() {
  const fees = await prisma.feeConfig.findMany({
    where: { isActive: true },
    orderBy: [{ category: 'asc' }, { label: 'asc' }],
  })

  return NextResponse.json(fees)
}
