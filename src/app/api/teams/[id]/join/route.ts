import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { TeamService } from '@/services/teamService'
import { logger } from '@/lib/logger'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const { id: teamId } = await params

    // Join team through service layer
    const membership = await TeamService.joinTeam(session.user.id, teamId)

    return NextResponse.json({
      success: true,
      membership
    })

  } catch (error) {
    logger.error('Join team API error', error)

    const errorMessage = error instanceof Error ? error.message : 'Erro ao solicitar entrada na equipe'

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}
