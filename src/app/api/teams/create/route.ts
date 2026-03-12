import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createTeamSchema } from '@/schemas/teamSchema'
import { TeamService } from '@/services/teamService'
import { logger } from '@/lib/logger'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const body = await req.json()

    // Validate input with Zod
    const validationResult = createTeamSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', issues: validationResult.error.issues },
        { status: 400 }
      )
    }

    // Create team through service layer
    const result = await TeamService.createTeam(session.user.id, validationResult.data)

    return NextResponse.json({
      success: true,
      team: result.team,
      membership: result.membership
    })

  } catch (error) {
    logger.error('Create team API error', error)

    const errorMessage = error instanceof Error ? error.message : 'Erro ao criar equipe'

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}
