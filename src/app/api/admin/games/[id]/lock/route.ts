import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { logHistoricalModification } from '@/lib/live-game/immutability-guard'

async function requireSuperAdmin() {
  const session = await getServerSession(authOptions)
  const userId = (session?.user as any)?.id
  if (!userId) return null
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { isFederationSuperAdmin: true },
  })
  if (!user?.isFederationSuperAdmin) return null
  return { userId }
}

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id: gameId } = await ctx.params

  const auth = await requireSuperAdmin()
  if (!auth) {
    return NextResponse.json(
      { error: 'Apenas super-admin da federação pode travar jogos' },
      { status: 403 }
    )
  }

  let body: { reason?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Body inválido (esperado JSON)' }, { status: 400 })
  }

  const reason = (body?.reason ?? '').trim()
  if (reason.length < 5) {
    return NextResponse.json({ error: 'Motivo é obrigatório (mín. 5 caracteres)' }, { status: 400 })
  }

  const game = await prisma.game.findUnique({
    where: { id: gameId },
    select: { lifecycleState: true, isHistoricallyLocked: true },
  })
  if (!game) return NextResponse.json({ error: 'Jogo não encontrado' }, { status: 404 })
  if (game.isHistoricallyLocked) {
    return NextResponse.json({ error: 'Jogo já está travado' }, { status: 400 })
  }
  if (game.lifecycleState !== 'PUBLISHED') {
    return NextResponse.json(
      { error: 'Apenas jogos publicados podem ser travados definitivamente' },
      { status: 400 }
    )
  }

  await prisma.game.update({
    where: { id: gameId },
    data: {
      isHistoricallyLocked: true,
      lockedAt: new Date(),
      lockedByUserId: auth.userId,
      lockReason: reason,
    },
  })

  await logHistoricalModification({
    entityType: 'Game',
    entityId: gameId,
    fieldChanged: 'isHistoricallyLocked',
    oldValue: 'false',
    newValue: 'true',
    reason,
    performedByUserId: auth.userId,
  })

  return NextResponse.json({ ok: true })
}

export async function DELETE(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id: gameId } = await ctx.params

  const auth = await requireSuperAdmin()
  if (!auth) {
    return NextResponse.json(
      { error: 'Apenas super-admin pode destravar jogos' },
      { status: 403 }
    )
  }

  let body: { reason?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Body inválido (esperado JSON)' }, { status: 400 })
  }

  const reason = (body?.reason ?? '').trim()
  if (reason.length < 5) {
    return NextResponse.json({ error: 'Motivo é obrigatório (mín. 5 caracteres)' }, { status: 400 })
  }

  const game = await prisma.game.findUnique({
    where: { id: gameId },
    select: { isHistoricallyLocked: true },
  })
  if (!game) return NextResponse.json({ error: 'Jogo não encontrado' }, { status: 404 })
  if (!game.isHistoricallyLocked) {
    return NextResponse.json({ error: 'Jogo não está travado' }, { status: 400 })
  }

  await prisma.game.update({
    where: { id: gameId },
    data: {
      isHistoricallyLocked: false,
      lockedAt: null,
      lockedByUserId: null,
      lockReason: null,
    },
  })

  await logHistoricalModification({
    entityType: 'Game',
    entityId: gameId,
    fieldChanged: 'isHistoricallyLocked',
    oldValue: 'true',
    newValue: 'false',
    reason: `UNLOCK: ${reason}`,
    performedByUserId: auth.userId,
  })

  return NextResponse.json({ ok: true })
}
