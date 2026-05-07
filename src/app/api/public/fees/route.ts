import { NextResponse } from 'next/server'

import { prisma } from '@/lib/db'
import { ensureDatabaseSchema } from '@/lib/db-patch'

export async function GET() {
  await ensureDatabaseSchema()

  const fees = await prisma.feeConfig.findMany({
    where: { isActive: true },
    orderBy: [{ category: 'asc' }, { label: 'asc' }],
  })

  return NextResponse.json(fees)
}
