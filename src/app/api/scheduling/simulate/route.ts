import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { generateChampionshipSchedule } from '@/lib/scheduling/roundRobin'
import { optimizeSchedule } from '@/lib/scheduling/aiOptimizer'
import { ensureDatabaseSchema } from '@/lib/db-patch'
import { preValidateChampionship } from '@/lib/scheduling/pre-validate'
import { getSchedulingConfig } from '@/lib/championship/scheduling-config'

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !(session.user as any).isAdmin) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { championshipId } = await request.json()
    await ensureDatabaseSchema()

    if (!championshipId) {
      return NextResponse.json(
        { error: 'championshipId é obrigatório' },
        { status: 400 }
      )
    }

    // 1. Pre-validacao: bloqueia configs inviaveis (capacityPercent > 100, sem dias, etc).
    const validation = await preValidateChampionship(championshipId)
    if (!validation.isValid) {
      return NextResponse.json({
        success: false,
        error: 'Configuracao inviavel para gerar calendario',
        validation: {
          isValid: false,
          capacityPercent: validation.capacityPercent,
          totalSlotsAvailable: validation.totalSlotsAvailable,
          totalSlotsNeeded: validation.totalSlotsNeeded,
          conflicts: validation.conflicts,
        },
      }, { status: 400 })
    }

    // 2. Gerar calendário base com round-robin (sempre funciona)
    const schedule = await generateChampionshipSchedule(championshipId)

    if (!schedule.success || schedule.totalGames === 0) {
      return NextResponse.json(
        { error: 'Não foi possível gerar o calendário. Verifique se há equipes confirmadas em todas as categorias.' },
        { status: 400 }
      )
    }

    // 3. Tentar otimizar com IA (Gemini 2.5 Flash JSON mode)
    const championship = await prisma.championship.findUnique({
      where: { id: championshipId },
      select: {
        name: true,
        startDate: true,
        endDate: true,
        turns: true,
        format: true,
        hasPlayoffs: true,
        allowedWeekdaysJson: true,
        timeSlotsJson: true,
        blackoutDatesJson: true,
        minRestHoursBetweenGames: true,
        maxGamesPerTeamPerWeek: true,
        homePattern: true,
        scheduleOptimizationMode: true,
        dayStartTime: true,
        regularDayEndTime: true,
        extendedDayEndTime: true,
        slotDurationMinutes: true,
        numberOfCourts: true,
        blockFormat: true,
        maxGamesPerTeamPerDay: true,
        maxCategoriesPerDay: true,
        minAgeGapBetweenGames: true,
        lunchBreakMinutes: true,
        afternoonStartTime: true,
        fridayEnabled: true,
        sharedGymHandlingMode: true,
      }
    })

    const schedulingConfig = championship
      ? getSchedulingConfig(championship)
      : null

    const generatedSchedule = schedule.games.map((g, idx) => ({
      gameId: `g${idx}`,
      categoryName: g.categoryName,
      homeTeamName: g.homeTeamName,
      awayTeamName: g.awayTeamName,
      date: g.date,
      time: g.time,
      round: g.round,
    }))

    const aiResult = schedulingConfig && championship?.startDate && championship?.endDate
      ? await optimizeSchedule({
          championship: {
            name: championship.name || '',
            startDate: championship.startDate.toISOString().slice(0, 10),
            endDate: championship.endDate.toISOString().slice(0, 10),
            format: championship.format || 'todos_contra_todos',
            turns: championship.turns || 1,
            hasPlayoffs: championship.hasPlayoffs || false,
          },
          config: {
            allowedWeekdays: schedulingConfig.allowedWeekdays,
            timeSlots: schedulingConfig.timeSlots.map(s => ({ start: s.start, end: s.end })),
            blackoutDates: schedulingConfig.blackoutDates.map(b => ({ date: b.date, reason: b.reason })),
            minRestHoursBetweenGames: schedulingConfig.minRestHoursBetweenGames,
            maxGamesPerTeamPerWeek: schedulingConfig.maxGamesPerTeamPerWeek,
            homePattern: schedulingConfig.homePattern,
            optimizationMode: schedulingConfig.scheduleOptimizationMode,
          },
          generatedSchedule,
          capacityPercent: validation.capacityPercent,
        })
      : {
          optimized: false,
          provider: 'none' as const,
          moves: [],
          warnings: [],
          insights: [],
          error: 'Championship sem datas — pulando IA',
        }

    // 4. Aplicar moves da IA no schedule retornado
    if (aiResult.optimized && aiResult.moves.length > 0) {
      for (const move of aiResult.moves) {
        const idx = parseInt(move.gameId.replace(/^g/, ''), 10)
        if (!Number.isFinite(idx) || idx < 0 || idx >= schedule.games.length) continue
        const game = schedule.games[idx]
        game.date = move.newDate
        game.time = move.newTime
        game.dateTime = `${move.newDate}T${move.newTime}:00`
        game.wasRescheduled = true
        game.rescheduleReason = `IA: ${move.reason}`
      }
    }

    return NextResponse.json({
      success: true,
      totalGames: schedule.totalGames,
      summary: schedule.summary,
      totalBlockedDates: schedule.totalBlockedDates,
      totalDays: schedule.totalDays,
      maxGamesPerDay: schedule.maxGamesPerDay,
      conflictsResolved: schedule.conflictsResolved,
      unresolvableConflicts: schedule.unresolvableConflicts,
      phases: schedule.phases,
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
        moves: aiResult.moves,
        warnings: aiResult.warnings,
        insights: aiResult.insights,
        error: aiResult.error
      },
      validation: {
        isValid: true,
        capacityPercent: validation.capacityPercent,
        totalSlotsAvailable: validation.totalSlotsAvailable,
        totalSlotsNeeded: validation.totalSlotsNeeded,
        warnings: validation.conflicts.filter(c => c.severity !== 'ERROR'),
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
