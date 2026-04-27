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

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; officialId: string }> }
) {
  try {
    await ensureDatabaseSchema()
    if (!await requireAdmin()) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { officialId } = await params

    await prisma.gameOfficial.delete({ where: { id: officialId } })
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('[ADMIN][officials DELETE]', error)
    return NextResponse.json({ error: error.message || 'Erro ao remover oficial' }, { status: 500 })
  }
}
