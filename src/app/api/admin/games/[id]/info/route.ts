import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'

import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { ensureDatabaseSchema } from '@/lib/db-patch'

async function requireAdmin() {
  const session = await getServerSession(authOptions)
  if (!session || !(session.user as any).isAdmin) return null
  return session
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureDatabaseSchema()
    if (!await requireAdmin()) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { id } = await params

    const game = await prisma.game.findUnique({
      where: { id },
      select: {
        id: true,
        dateTime: true,
        location: true,
        city: true,
        court: true,
        venue: true,
        attendance: true,
        championship: { select: { name: true, year: true } },
        category: { select: { name: true } },
        officials: { orderBy: { createdAt: 'asc' } },
        refereeAssignments: {
          include: {
            referee: { select: { id: true, name: true, licenseNumber: true } },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    })

    if (!game) {
      return NextResponse.json({ error: 'Jogo não encontrado' }, { status: 404 })
    }

    return NextResponse.json(game)
  } catch (error: any) {
    console.error('[ADMIN][game-info GET]', error)
    return NextResponse.json({ error: error.message || 'Erro ao carregar informações' }, { status: 500 })
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureDatabaseSchema()
    if (!await requireAdmin()) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()

    const data: Record<string, unknown> = {}
    if (body.venue !== undefined) data.venue = body.venue || null
    if (body.location !== undefined) data.location = body.location
    if (body.city !== undefined) data.city = body.city
    if (body.court !== undefined) data.court = body.court || null
    if (body.attendance !== undefined) {
      data.attendance = body.attendance !== '' && body.attendance !== null
        ? Number(body.attendance)
        : null
    }

    const updated = await prisma.game.update({ where: { id }, data })
    return NextResponse.json(updated)
  } catch (error: any) {
    console.error('[ADMIN][game-info PATCH]', error)
    return NextResponse.json({ error: error.message || 'Erro ao salvar informações' }, { status: 500 })
  }
}
