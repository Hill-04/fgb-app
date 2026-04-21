import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'

import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { ensureDatabaseSchema } from '@/lib/db-patch'
import { FGB_DEFAULT_FEES } from '@/lib/fee-defaults'

export async function POST() {
  await ensureDatabaseSchema()

  const session = await getServerSession(authOptions)
  if (!session || !(session.user as any)?.isAdmin) {
    return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })
  }

  const createdKeys: string[] = []

  for (const fee of FGB_DEFAULT_FEES) {
    const existing = await prisma.feeConfig.findUnique({
      where: { key: fee.key },
      select: { key: true },
    })

    if (existing) {
      continue
    }

    await prisma.feeConfig.create({
      data: {
        key: fee.key,
        label: fee.label,
        value: fee.value,
        category: fee.category,
        description: fee.description,
        isActive: true,
      },
    })

    createdKeys.push(fee.key)
  }

  return NextResponse.json({
    inserted: createdKeys.length,
    skipped: FGB_DEFAULT_FEES.length - createdKeys.length,
    createdKeys,
  })
}
