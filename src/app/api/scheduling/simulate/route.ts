import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { generateChampionshipSchedule } from '@/lib/scheduling/roundRobin'
import { optimizeSchedule } from '@/lib/scheduling/aiOptimizer'

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !(session.user as any).isAdmin) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { championshipId } = await request.json()

    if (!championshipId) {
      return NextResponse.json(
        { error: 'championshipId é obrigatório' },
        { status: 400 }
      )
    }

    // 1. Gerar calendário base com round-robin (sempre funciona)
    const schedule = await generateChampionshipSchedule(championshipId)

    if (!schedule.success || schedule.totalGames === 0) {
      return NextResponse.json(
        { error: 'Não foi possível gerar o calendário. Verifique se há equipes confirmadas em todas as categorias.' },
        { status: 400 }
      )
    }

    // 2. Tentar otimizar com IA (fallback automático entre provedores)
    const championship = await prisma.championship.findUnique({
      where: { id: championshipId },
      select: { 
        name: true, 
        startDate: true, 
        endDate: true, 
        turns: true, 
        format: true, 
        hasPlayoffs: true 
      }
    })

    const aiResult = await optimizeSchedule({
      name: championship?.name || '',
      categories: schedule.categories.map(c => ({
        name: c.name,
        teams: c.teams,
        games: c.gamesCount
      })),
      totalGames: schedule.totalGames,
      startDate: championship?.startDate?.toLocaleDateString('pt-BR') || 'A definir',
      endDate: championship?.endDate?.toLocaleDateString('pt-BR') || undefined,
      turns: championship?.turns || 1,
      format: championship?.format || undefined,
      hasPlayoffs: championship?.hasPlayoffs || false,
      totalBlockedDates: schedule.totalBlockedDates || 0
    })

    return NextResponse.json({
      success: true,
      totalGames: schedule.totalGames,
      summary: schedule.summary,
      totalBlockedDates: schedule.totalBlockedDates,
      totalDays: schedule.totalDays,
      maxGamesPerDay: schedule.maxGamesPerDay,
      schedulePreview: schedule.schedulePreview,
      categories: schedule.categories.map(c => ({
        id: c.id,
        name: c.name,
        teams: c.teams,
        gamesCount: c.gamesCount,
        games: c.games
      })),
      games: schedule.games,
      aiOptimization: {
        available: aiResult.optimized,
        provider: aiResult.provider,
        suggestion: aiResult.suggestion,
        error: aiResult.error
      }
    })

  } catch (error: any) {
    console.error('[Scheduling Simulate Error]', error)
    return NextResponse.json(
      { error: error.message || 'Erro interno ao gerar calendário' },
      { status: 500 }
    )
  }
}
