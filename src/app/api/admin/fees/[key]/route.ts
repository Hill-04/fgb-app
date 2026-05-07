import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'

import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { ensureDatabaseSchema } from '@/lib/db-patch'

function isAdminSession(session: any) {
  return Boolean(session && (session.user as any)?.isAdmin)
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ key: string }> }
) {
  await ensureDatabaseSchema()

  const session = await getServerSession(authOptions)
  if (!isAdminSession(session)) {
    return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })
  }

  const { key } = await params

  const fee = await prisma.feeConfig.findUnique({
    where: { key },
  })

  if (!fee) {
    return NextResponse.json({ error: 'Taxa nao encontrada.' }, { status: 404 })
  }

  return NextResponse.json(fee)
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ key: string }> }
) {
  await ensureDatabaseSchema()

  const session = await getServerSession(authOptions)
  if (!isAdminSession(session)) {
    return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })
  }

  try {
    const { key } = await params
    const body = await request.json()

    const fee = await prisma.feeConfig.update({
      where: { key },
      data: {
        ...(body.value !== undefined ? { value: Number(body.value) } : {}),
        ...(body.label !== undefined ? { label: String(body.label).trim() } : {}),
        ...(body.description !== undefined
          ? { description: body.description ? String(body.description) : null }
          : {}),
        ...(body.isActive !== undefined ? { isActive: Boolean(body.isActive) } : {}),
        appliesFrom: new Date(),
      },
    })

    return NextResponse.json(fee)
  } catch (error: any) {
    console.error('[FEES][ADMIN][PATCH]', error)

    if (error?.code === 'P2025') {
      return NextResponse.json({ error: 'Taxa nao encontrada.' }, { status: 404 })
    }

    return NextResponse.json({ error: 'Erro ao atualizar taxa.' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ key: string }> }
) {
  await ensureDatabaseSchema()

  const session = await getServerSession(authOptions)
  if (!isAdminSession(session)) {
    return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })
  }

  try {
    const { key } = await params

    const fee = await prisma.feeConfig.update({
      where: { key },
      data: {
        isActive: false,
        appliesFrom: new Date(),
      },
    })

    return NextResponse.json(fee)
  } catch (error: any) {
    console.error('[FEES][ADMIN][DELETE]', error)

    if (error?.code === 'P2025') {
      return NextResponse.json({ error: 'Taxa nao encontrada.' }, { status: 404 })
    }

    return NextResponse.json({ error: 'Erro ao desativar taxa.' }, { status: 500 })
  }
}
