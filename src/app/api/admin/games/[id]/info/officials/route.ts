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

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureDatabaseSchema()
    if (!await requireAdmin()) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { id: gameId } = await params
    const { officialType, name, role } = await request.json()

    if (!officialType || !name || !role) {
      return NextResponse.json({ error: 'officialType, name e role são obrigatórios' }, { status: 400 })
    }

    const official = await prisma.gameOfficial.create({
      data: { gameId, officialType: String(officialType), name: String(name), role: String(role) },
    })

    return NextResponse.json(official, { status: 201 })
  } catch (error: any) {
    console.error('[ADMIN][officials POST]', error)
    return NextResponse.json({ error: error.message || 'Erro ao adicionar oficial' }, { status: 500 })
  }
}
