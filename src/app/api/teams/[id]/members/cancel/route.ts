import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { TeamService } from '@/services/teamService'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    await TeamService.cancelRequest(session.user.id)

    return NextResponse.json({ success: true })

  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Erro ao cancelar solicitação'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
