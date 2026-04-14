import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'

import { authOptions } from '@/lib/auth'
import { ensureDatabaseSchema } from '@/lib/db-patch'
import { LiveGameService } from '@/modules/live-game/services/live-game-service'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureDatabaseSchema()
    const session = await getServerSession(authOptions)
    if (!session || !(session.user as any).isAdmin) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { id } = await params
    const data = await LiveGameService.getAuditTrail(id)
    return NextResponse.json(data)
  } catch (error: any) {
    console.error('[LIVE][Audit GET]', error)
    return NextResponse.json({ error: error.message || 'Erro ao carregar auditoria' }, { status: 500 })
  }
}
