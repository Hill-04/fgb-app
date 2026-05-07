import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'

import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { ensureDatabaseSchema } from '@/lib/db-patch'
import { FEE_CATEGORIES } from '@/lib/fees'

function isAdminSession(session: any) {
  return Boolean(session && (session.user as any)?.isAdmin)
}

export async function GET(request: Request) {
  await ensureDatabaseSchema()

  const session = await getServerSession(authOptions)
  if (!isAdminSession(session)) {
    return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const includeInactive = searchParams.get('includeInactive') === 'true'

  const fees = await prisma.feeConfig.findMany({
    where: includeInactive ? undefined : { isActive: true },
    orderBy: [{ category: 'asc' }, { label: 'asc' }],
  })

  return NextResponse.json(fees)
}

export async function POST(request: Request) {
  await ensureDatabaseSchema()

  const session = await getServerSession(authOptions)
  if (!isAdminSession(session)) {
    return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const key = String(body.key || '').trim().toUpperCase()
    const label = String(body.label || '').trim()
    const value = Number(body.value)
    const category = String(body.category || '').trim().toUpperCase()
    const description =
      body.description === null || body.description === undefined || body.description === ''
        ? null
        : String(body.description)

    if (!key || !label || !Number.isFinite(value) || !category) {
      return NextResponse.json({ error: 'Dados invalidos para criar a taxa.' }, { status: 400 })
    }

    if (!FEE_CATEGORIES.includes(category as (typeof FEE_CATEGORIES)[number])) {
      return NextResponse.json({ error: 'Categoria de taxa invalida.' }, { status: 400 })
    }

    const fee = await prisma.feeConfig.create({
      data: {
        key,
        label,
        value,
        category,
        description,
        isActive: body.isActive !== false,
        appliesFrom: body.appliesFrom ? new Date(body.appliesFrom) : new Date(),
      },
    })

    return NextResponse.json(fee, { status: 201 })
  } catch (error: any) {
    if (error?.code === 'P2002') {
      return NextResponse.json({ error: 'Ja existe uma taxa com essa chave.' }, { status: 409 })
    }

    console.error('[FEES][ADMIN][POST]', error)
    return NextResponse.json({ error: 'Erro ao criar taxa.' }, { status: 500 })
  }
}
