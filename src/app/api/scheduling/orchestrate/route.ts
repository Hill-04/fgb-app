import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { ensureDatabaseSchema } from '@/lib/db-patch'
import { buildSchedulingBriefing } from '@/lib/scheduling/scheduling-briefing'
import { orchestrateScheduling } from '@/lib/scheduling/ai-orchestrator'

export async function POST(request: Request) {
  try {
    await ensureDatabaseSchema()
    const session = await getServerSession(authOptions)
    if (!(session?.user as any)?.isAdmin) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }

    const body = await request.json().catch(() => ({}))
    const { championshipId, forceDeterministic, maxAttempts } = body

    if (!championshipId) {
      return NextResponse.json({ error: 'championshipId é obrigatório' }, { status: 400 })
    }

    const briefing = await buildSchedulingBriefing(championshipId)

    if (briefing.teams.length < 2) {
      return NextResponse.json(
        { error: 'É necessário ter ao menos 2 equipes confirmadas' },
        { status: 400 },
      )
    }

    const result = await orchestrateScheduling(briefing, {
      maxAttempts: typeof maxAttempts === 'number' ? maxAttempts : 3,
      forceDeterministic: Boolean(forceDeterministic),
    })

    return NextResponse.json({
      ok: result.validation.valid,
      source: result.source,
      provider: result.provider,
      attempts: result.attempts,
      rationale: result.rationale,
      games: result.games,
      validation: result.validation,
      briefingSummary: {
        championshipName: briefing.championship.name,
        totalTeams: briefing.teams.length,
        totalCategories: briefing.categories.length,
        totalGamesGenerated: result.games.length,
      },
    })
  } catch (error: any) {
    console.error('Error in orchestrate:', error)
    return NextResponse.json({ error: error?.message || 'Erro' }, { status: 500 })
  }
}
