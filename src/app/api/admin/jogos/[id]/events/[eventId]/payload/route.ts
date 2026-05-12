import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { canModifyHistoricalData, logHistoricalModification } from '@/lib/live-game/immutability-guard'
import { validateFibaAction, type FibaEventPayload } from '@/lib/live-game/fiba-protocol'

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string; eventId: string }> }) {
  const { id: gameId, eventId } = await ctx.params
  const session = await getServerSession(authOptions)
  const userId = (session?.user as any)?.id ?? null

  const auth = await canModifyHistoricalData(gameId, userId)
  if (!auth.allowed) {
    return NextResponse.json({ error: auth.reason ?? 'Acesso negado' }, { status: 403 })
  }

  let body: { payload: FibaEventPayload; reason?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Body inválido (esperado JSON)' }, { status: 400 })
  }

  if (!body?.payload) {
    return NextResponse.json({ error: 'Campo "payload" obrigatório' }, { status: 400 })
  }

  const validation = validateFibaAction(body.payload)
  if (!validation.valid) {
    return NextResponse.json({ error: validation.errors.join('; ') }, { status: 400 })
  }

  if (auth.requiresLogReason && !body.reason) {
    return NextResponse.json(
      { error: 'Motivo é obrigatório para modificação de jogo travado/publicado' },
      { status: 400 }
    )
  }

  const oldEvent = await prisma.gameEvent.findUnique({
    where: { id: eventId },
    select: { id: true, gameId: true, payloadJson: true },
  })
  if (!oldEvent) {
    return NextResponse.json({ error: 'Evento não encontrado' }, { status: 404 })
  }
  if (oldEvent.gameId !== gameId) {
    return NextResponse.json({ error: 'Evento não pertence a este jogo' }, { status: 400 })
  }

  const newPayloadJson = JSON.stringify(body.payload)

  await prisma.gameEvent.update({
    where: { id: eventId },
    data: { payloadJson: newPayloadJson },
  })

  if (auth.requiresLogReason && body.reason) {
    await logHistoricalModification({
      entityType: 'GameEvent',
      entityId: eventId,
      fieldChanged: 'payloadJson',
      oldValue: oldEvent.payloadJson ?? undefined,
      newValue: newPayloadJson,
      reason: body.reason,
      performedByUserId: userId!,
    })
  }

  return NextResponse.json({ ok: true })
}
