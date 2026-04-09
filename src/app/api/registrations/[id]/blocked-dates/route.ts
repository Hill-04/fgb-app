import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { ensureDatabaseSchema, withDatabaseSchemaRetry } from '@/lib/db-patch'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await ensureDatabaseSchema()
  const { id } = await params

  const dates = await withDatabaseSchemaRetry(() =>
    prisma.blockedDate.findMany({
      where: { registrationId: id },
      orderBy: { startDate: 'asc' },
    })
  )

  return NextResponse.json(dates)
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await ensureDatabaseSchema()
  const { id } = await params
  const { startDate, endDate, reason, affectsAllCats } = await request.json()

  const registration = await withDatabaseSchemaRetry(() =>
    prisma.registration.findUnique({
      where: { id },
      include: { championship: true },
    })
  )

  if (!registration) {
    return NextResponse.json({ error: 'Inscrição não encontrada' }, { status: 404 })
  }

  const blockedDate = await prisma.blockedDate.create({
    data: {
      registrationId: id,
      startDate: new Date(startDate),
      endDate: new Date(endDate || startDate),
      reason,
      affectsAllCats: affectsAllCats ?? false,
    },
  })

  const conflictingGames = await prisma.game.findMany({
    where: {
      championshipId: registration.championshipId,
      OR: [
        { homeTeamId: registration.teamId },
        { awayTeamId: registration.teamId },
      ],
      dateTime: {
        gte: new Date(startDate),
        lte: new Date(endDate || startDate),
      },
      status: { not: 'CANCELLED' },
    },
    include: {
      category: {
        include: {
          championship: {
            select: { name: true },
          },
        },
      },
    },
    orderBy: { dateTime: 'asc' },
  })

  return NextResponse.json({
    blockedDate,
    conflictingGames,
    hasConflicts: conflictingGames.length > 0,
    message:
      conflictingGames.length > 0
        ? `⚠️ ${conflictingGames.length} jogo(s) já marcado(s) neste período. Verificar reagendamento.`
        : 'Data bloqueada registrada com sucesso.',
  })
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await ensureDatabaseSchema()
  const { id } = await params
  const { dateId } = await request.json()

  await prisma.blockedDate.deleteMany({
    where: {
      id: dateId,
      registrationId: id,
    },
  })

  return NextResponse.json({ success: true })
}
