import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { ensureDatabaseSchema, withDatabaseSchemaRetry } from '@/lib/db-patch'

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { setChampionshipTiebreakers, type TiebreakerType, FIBA_DEFAULT_CHAIN, LEGACY_KEYS_TO_TYPE } from '@/lib/championship/tiebreakers'

// Generate category name from code e.g. SUB12M -> "Sub 12 Masculino"
function codeToName(code: string): string {
  const match = code.match(/^SUB(\d+)(M|F)$/)
  if (!match) return code
  const age = match[1]
  const sex = match[2] === 'M' ? 'Masculino' : 'Feminino'
  return `Sub ${age} ${sex}`
}

export async function GET() {
  try {
    await ensureDatabaseSchema()
    const session = await getServerSession(authOptions)
    const isAdmin = (session?.user as any)?.isAdmin

    const championships = await withDatabaseSchemaRetry(() =>
      (prisma.championship.findMany({
        where: (isAdmin ? {} : { isSimulation: false }) as any,
        orderBy: { createdAt: 'desc' },
        include: {
          categories: true,
          _count: { select: { registrations: true } },
        },
      }) as any)
    )
    return NextResponse.json(championships)
  } catch (error) {
    console.error('Error fetching championships:', error)
    return NextResponse.json({ error: 'Erro ao buscar campeonatos' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    await ensureDatabaseSchema()
    const body = await request.json()
    const {
      name, year, sex, minTeamsPerCat, categories: selectedCodes,
      format, turns, phases, fieldControl, tiebreakers,
      hasRelegation, relegationDown, promotionUp,
      hasPlayoffs, playoffTeams, playoffFormat, hasThirdPlace,
      hasBlocks,
      maxGamesPerTeamPerDay, scheduleOptimizationMode,
      regDeadline, startDate, endDate,
      // Sprint 1: novos campos
      sanctioning, countsForRanking, countsForBidEligibility, sanctionNumber,
      modality, ageRangeMin, ageRangeMax,
      allowedWeekdays, timeSlots, blackoutDates,
      minRestHoursBetweenGames, maxGamesPerTeamPerWeek, homePattern,
      regulationPdfUrl,
      tiebreakerChain,
      // Fase B: multiplas fases customizadas
      hasMultiplePhases, customPhases,
    } = body

    if (!name?.trim()) return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 })
    if (!selectedCodes || selectedCodes.length === 0) return NextResponse.json({ error: 'Selecione ao menos uma categoria' }, { status: 400 })

    const isValidDate = (d: any) => d && !isNaN(new Date(d).getTime())

    const buildTiebreakerChain = (): TiebreakerType[] => {
      if (Array.isArray(tiebreakerChain) && tiebreakerChain.length > 0) {
        return tiebreakerChain.filter(Boolean) as TiebreakerType[]
      }
      if (Array.isArray(tiebreakers) && tiebreakers.length > 0) {
        return tiebreakers
          .map((k: string) => LEGACY_KEYS_TO_TYPE[k] ?? (k as TiebreakerType))
          .filter(Boolean)
      }
      return FIBA_DEFAULT_CHAIN
    }
    const finalChain = buildTiebreakerChain()

    const safeJson = (v: unknown, fallback: string): string => {
      if (v === undefined || v === null) return fallback
      if (typeof v === 'string') {
        try { JSON.parse(v); return v } catch { return fallback }
      }
      try { return JSON.stringify(v) } catch { return fallback }
    }

    const validSanctioning = ['FGB_OFFICIAL', 'FGB_INVITATIONAL', 'REGIONAL', 'OPEN']
    const sanctioningValue = validSanctioning.includes(sanctioning) ? sanctioning : 'FGB_OFFICIAL'
    const validHomePatterns = ['ALTERNATED', 'FIXED_HOST', 'NEUTRAL', 'SERIES_2_2_1']
    const homePatternValue = validHomePatterns.includes(homePattern) ? homePattern : 'ALTERNATED'

    const championship = await prisma.$transaction(async (tx) => {
      const c = await tx.championship.create({
        data: {
          name: name.trim(),
          year: Number(year) || new Date().getFullYear(),
          sex: sex || 'masculino',
          format: format || 'todos_contra_todos',
          turns: Number(turns) || 1,
          phases: phases !== undefined ? Number(phases) : 1,
          fieldControl: fieldControl || 'alternado',
          tiebreakers: finalChain.join(','),
          hasRelegation: Boolean(hasRelegation),
          relegationDown: Number(relegationDown) || 0,
          promotionUp: Number(promotionUp) || 0,
          hasPlayoffs: Boolean(hasPlayoffs),
          playoffTeams: Number(playoffTeams) || 4,
          playoffFormat: playoffFormat || 'melhor_de_1',
          hasThirdPlace: hasThirdPlace !== false,
          hasBlocks: Boolean(hasBlocks),
          minTeamsPerCat: Number(minTeamsPerCat) || 3,
          maxGamesPerTeamPerDay: Math.max(1, Number(maxGamesPerTeamPerDay) || 2),
          scheduleOptimizationMode: scheduleOptimizationMode === 'compact'
            ? 'compact'
            : scheduleOptimizationMode === 'balanced'
              ? 'balanced'
              : 'less_travel',
          regDeadline: isValidDate(regDeadline) ? new Date(regDeadline) : new Date(),
          startDate: isValidDate(startDate) ? new Date(startDate) : null,
          endDate: isValidDate(endDate) ? new Date(endDate) : null,
          status: 'DRAFT',
          // Sprint 1
          ...(sanctioningValue ? { sanctioning: sanctioningValue } as any : {}),
          ...(countsForRanking !== undefined ? { countsForRanking: Boolean(countsForRanking) } as any : {}),
          ...(countsForBidEligibility !== undefined ? { countsForBidEligibility: Boolean(countsForBidEligibility) } as any : {}),
          ...(sanctionNumber ? { sanctionNumber: String(sanctionNumber) } as any : {}),
          ...(modality ? { modality: String(modality) } as any : {}),
          ...(ageRangeMin !== undefined && ageRangeMin !== null ? { ageRangeMin: Number(ageRangeMin) } as any : {}),
          ...(ageRangeMax !== undefined && ageRangeMax !== null ? { ageRangeMax: Number(ageRangeMax) } as any : {}),
          ...(allowedWeekdays !== undefined ? { allowedWeekdaysJson: safeJson(allowedWeekdays, '[6,0]') } as any : {}),
          ...(timeSlots !== undefined ? { timeSlotsJson: safeJson(timeSlots, '[]') } as any : {}),
          ...(blackoutDates !== undefined ? { blackoutDatesJson: safeJson(blackoutDates, '[]') } as any : {}),
          ...(minRestHoursBetweenGames !== undefined ? { minRestHoursBetweenGames: Number(minRestHoursBetweenGames) } as any : {}),
          ...(maxGamesPerTeamPerWeek !== undefined ? { maxGamesPerTeamPerWeek: Number(maxGamesPerTeamPerWeek) } as any : {}),
          ...(homePatternValue ? { homePattern: homePatternValue } as any : {}),
          ...(regulationPdfUrl ? { regulationPdfUrl: String(regulationPdfUrl) } as any : {}),
        } as any,
      })

      for (const code of (selectedCodes as string[])) {
        await tx.championshipCategory.create({
          data: {
            name: codeToName(code),
            championshipId: c.id,
          },
        })
      }

      // Fase B: múltiplas fases customizadas (modo Tradicional / Encontro)
      if (hasMultiplePhases && Array.isArray(customPhases) && customPhases.length > 0) {
        for (const cp of customPhases) {
          if (!cp || typeof cp !== 'object') continue
          const phaseName = String(cp.name || '').trim()
          if (!phaseName) continue

          const validFormatTypes = ['ROUND_ROBIN', 'ELIMINATORIO', 'GROUPS_ELIMINATORIO']
          const formatType = validFormatTypes.includes(cp.formatType) ? cp.formatType : 'ROUND_ROBIN'

          const mode = cp.mode === 'ENCOUNTER' ? 'ENCOUNTER' : 'TRADITIONAL'
          const formatConfigJson = JSON.stringify({
            mode,
            ...(mode === 'ENCOUNTER'
              ? {
                  encounterVenue: cp.encounterVenue || null,
                  encounterDate: cp.encounterDate || null,
                  encounterEndDate: cp.encounterEndDate || null,
                }
              : {
                  homePattern: cp.homePattern || 'ALTERNATED',
                }),
            ...(cp.notes ? { notes: cp.notes } : {}),
          })

          const startDate = mode === 'ENCOUNTER' && isValidDate(cp.encounterDate)
            ? new Date(cp.encounterDate)
            : null
          const endDate = mode === 'ENCOUNTER' && isValidDate(cp.encounterEndDate)
            ? new Date(cp.encounterEndDate)
            : (startDate || null)

          await (tx as any).championshipPhase.create({
            data: {
              championshipId: c.id,
              name: phaseName,
              order: typeof cp.order === 'number' ? cp.order : 0,
              formatType,
              formatConfigJson,
              tiebreakerChain: finalChain.join(','),
              startDate,
              endDate,
              qualifiesNextCount:
                cp.qualifiesNextCount !== null && cp.qualifiesNextCount !== undefined
                  ? Number(cp.qualifiesNextCount)
                  : null,
              isActive: true,
            },
          })
        }
      }

      return tx.championship.findUnique({
        where: { id: c.id },
        include: { categories: true, _count: { select: { registrations: true } } },
      })
    })

    if (championship?.id) {
      try {
        await setChampionshipTiebreakers(championship.id, finalChain)
      } catch (e) {
        console.warn('[POST /api/championships] tiebreaker save failed:', e)
      }
    }

    return NextResponse.json(championship, { status: 201 })
  } catch (error: any) {
    console.error('Error creating championship:', error)
    // Return more specific error if possible to help user debug
    const message = error?.message || 'Erro interno ao criar campeonato'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
