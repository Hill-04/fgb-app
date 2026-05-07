import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'

import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { ensureDatabaseSchema } from '@/lib/db-patch'
import { getRegistrationFeesSnapshot, syncRegistrationTeamTotalFeesOwed } from '@/lib/fees-server'
import { roundCurrency } from '@/lib/fees'

type FeeItemInput = {
  feeKey: string
  feeLabel: string
  quantity?: number
  unitValue: number
  totalValue?: number
  notes?: string | null
}

function normalizeFeeItem(item: FeeItemInput) {
  const quantity = Math.max(1, Number(item.quantity || 1))
  const unitValue = roundCurrency(Number(item.unitValue || 0))
  const totalValue = roundCurrency(
    item.totalValue !== undefined ? Number(item.totalValue || 0) : quantity * unitValue
  )

  return {
    feeKey: String(item.feeKey || '').trim().toUpperCase(),
    feeLabel: String(item.feeLabel || '').trim(),
    quantity,
    unitValue,
    totalValue,
    notes: item.notes ? String(item.notes) : null,
  }
}

async function requireAdmin() {
  const session = await getServerSession(authOptions)
  if (!session || !(session.user as any)?.isAdmin) {
    return null
  }

  return session
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await ensureDatabaseSchema()

  const session = await requireAdmin()
  if (!session) {
    return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })
  }

  const { id } = await params
  const snapshot = await getRegistrationFeesSnapshot(id)

  if (!snapshot) {
    return NextResponse.json({ error: 'Inscricao nao encontrada.' }, { status: 404 })
  }

  return NextResponse.json(snapshot)
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await ensureDatabaseSchema()

  const session = await requireAdmin()
  if (!session) {
    return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })
  }

  try {
    const { id } = await params
    const body = await request.json()
    const registration = await prisma.registration.findUnique({
      where: { id },
      include: {
        fees: {
          select: {
            id: true,
            feeKey: true,
          },
        },
      },
    })

    if (!registration) {
      return NextResponse.json({ error: 'Inscricao nao encontrada.' }, { status: 404 })
    }

    const hasItemList = Array.isArray(body.items)
    const normalizedItems = hasItemList
      ? body.items.map(normalizeFeeItem).filter((item: ReturnType<typeof normalizeFeeItem>) => item.totalValue > 0)
      : [normalizeFeeItem(body)].filter((item) => item.totalValue > 0)

    if (normalizedItems.length === 0) {
      return NextResponse.json({ error: 'Nenhuma taxa valida para criar.' }, { status: 400 })
    }

    if (hasItemList && registration.fees.length > 0) {
      return NextResponse.json(
        { error: 'Esta inscricao ja possui taxas geradas. Use a edicao manual para complementar.' },
        { status: 409 }
      )
    }

    const createdFees = await prisma.$transaction(async (tx) => {
      const created = []

      for (const item of normalizedItems) {
        created.push(
          await tx.registrationFee.create({
            data: {
              registrationId: id,
              feeKey: item.feeKey,
              feeLabel: item.feeLabel,
              quantity: item.quantity,
              unitValue: item.unitValue,
              totalValue: item.totalValue,
              notes: item.notes,
            },
          })
        )
      }

      await syncRegistrationTeamTotalFeesOwed(id, tx)
      return created
    })

    const snapshot = await getRegistrationFeesSnapshot(id)

    return NextResponse.json(
      {
        createdFees,
        ...snapshot,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('[REGISTRATION_FEES][POST]', error)
    return NextResponse.json({ error: 'Erro ao criar taxas da inscricao.' }, { status: 500 })
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await ensureDatabaseSchema()

  const session = await requireAdmin()
  if (!session) {
    return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })
  }

  try {
    const { id } = await params
    const body = await request.json()
    const feeId = String(body.feeId || '').trim()
    const status = String(body.status || '').trim().toUpperCase()

    if (!feeId || !['PENDING', 'PAID', 'WAIVED'].includes(status)) {
      return NextResponse.json({ error: 'Dados invalidos para atualizar a taxa.' }, { status: 400 })
    }

    const updatedFee = await prisma.$transaction(async (tx) => {
      const fee = await tx.registrationFee.findFirst({
        where: {
          id: feeId,
          registrationId: id,
        },
      })

      if (!fee) {
        throw new Error('FEE_NOT_FOUND')
      }

      const updated = await tx.registrationFee.update({
        where: { id: feeId },
        data: {
          status,
          paidAt:
            status === 'PAID'
              ? body.paidAt
                ? new Date(body.paidAt)
                : new Date()
              : null,
        },
      })

      await syncRegistrationTeamTotalFeesOwed(id, tx)

      return updated
    })

    const snapshot = await getRegistrationFeesSnapshot(id)

    return NextResponse.json({
      fee: updatedFee,
      ...snapshot,
    })
  } catch (error: any) {
    if (error?.message === 'FEE_NOT_FOUND') {
      return NextResponse.json({ error: 'Taxa nao encontrada para esta inscricao.' }, { status: 404 })
    }

    console.error('[REGISTRATION_FEES][PATCH]', error)
    return NextResponse.json({ error: 'Erro ao atualizar a taxa.' }, { status: 500 })
  }
}
