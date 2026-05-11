import { prisma } from '@/lib/db'
import {
  getSchedulingConfig,
  isWeekdayAllowed,
  isDateInBlackout,
  parseMinutesFromTime,
} from '@/lib/championship/scheduling-config'

export type ConflictSeverity = 'ERROR' | 'WARNING' | 'INFO'

export type Conflict = {
  severity: ConflictSeverity
  type: string
  message: string
  context?: Record<string, unknown>
}

export type ValidationResult = {
  isValid: boolean
  conflicts: Conflict[]
  capacityPercent: number
  totalSlotsAvailable: number
  totalSlotsNeeded: number
}

/**
 * Pre-valida um Championship antes de chamar o motor de scheduling.
 * Bloqueia simulacao se capacityPercent > 100 ou se nao ha dias validos.
 * Tambem reporta avisos: capacidade apertada, bloqueios FGB, treinadores multi-equipe.
 */
export async function preValidateChampionship(
  championshipId: string,
): Promise<ValidationResult> {
  const championship = await prisma.championship.findUnique({
    where: { id: championshipId },
    include: {
      categories: {
        include: {
          registrations: {
            include: {
              registration: {
                include: {
                  team: true,
                  blockedDates: true,
                },
              },
            },
          },
        },
      },
      registrationBlocks: true,
    },
  })

  if (!championship) {
    throw new Error(`Championship ${championshipId} nao encontrado`)
  }

  if (!championship.startDate || !championship.endDate) {
    return {
      isValid: false,
      conflicts: [{
        severity: 'ERROR',
        type: 'NO_DATES',
        message: 'startDate ou endDate ausente — defina o periodo do campeonato',
      }],
      capacityPercent: 0,
      totalSlotsAvailable: 0,
      totalSlotsNeeded: 0,
    }
  }

  const config = getSchedulingConfig(championship)
  const conflicts: Conflict[] = []

  // 1) Dias validos no periodo (allowedWeekdays + blackoutDates).
  // Meio-dia UTC pra estabilidade contra DST.
  let validDays = 0
  const cursor = new Date(championship.startDate)
  cursor.setUTCHours(12, 0, 0, 0)
  const endDay = new Date(championship.endDate)
  endDay.setUTCHours(12, 0, 0, 0)
  while (cursor.getTime() <= endDay.getTime()) {
    if (isWeekdayAllowed(cursor, config) && !isDateInBlackout(cursor, config)) {
      validDays++
    }
    cursor.setUTCDate(cursor.getUTCDate() + 1)
  }

  if (validDays === 0) {
    conflicts.push({
      severity: 'ERROR',
      type: 'NO_VALID_DAYS',
      message:
        'Nenhum dia valido no periodo (verifique allowedWeekdays e blackoutDates)',
    })
  }

  // 2) Slots por dia.
  const slotsPerDay = config.timeSlots.length > 0
    ? config.timeSlots.length
    : Math.max(
        0,
        Math.floor(
          (parseMinutesFromTime(config.regularDayEndTime) -
            parseMinutesFromTime(config.dayStartTime)) /
            Math.max(1, config.slotDurationMinutes),
        ),
      )

  // 3) Jogos necessarios por categoria (round-robin completo * turns).
  let totalGamesNeeded = 0
  const minTeams = championship.minTeamsPerCat ?? 2
  const turns = championship.turns ?? 1
  for (const cat of championship.categories) {
    const teams = cat.registrations.length
    if (teams < minTeams) {
      conflicts.push({
        severity: 'WARNING',
        type: 'INSUFFICIENT_TEAMS',
        message: `Categoria "${cat.name}" tem ${teams} equipes (minimo: ${minTeams})`,
        context: { categoryId: cat.id, categoryName: cat.name, teams, minTeams },
      })
      continue
    }
    const gamesInCategory = ((teams * (teams - 1)) / 2) * turns
    totalGamesNeeded += gamesInCategory
  }

  // 4) Capacidade.
  const numberOfCourts = championship.numberOfCourts ?? 1
  const totalSlotsAvailable = validDays * slotsPerDay * numberOfCourts
  const capacityPercent = totalSlotsAvailable === 0
    ? (totalGamesNeeded > 0 ? 100 : 0)
    : Math.round((totalGamesNeeded / totalSlotsAvailable) * 100)

  if (totalSlotsAvailable === 0 && totalGamesNeeded > 0) {
    conflicts.push({
      severity: 'ERROR',
      type: 'OVERCAPACITY',
      message: `Calendario inviavel: precisa de ${totalGamesNeeded} jogos mas nao ha slots disponiveis (validDays=${validDays}, slotsPerDay=${slotsPerDay}, courts=${numberOfCourts})`,
      context: {
        gamesNeeded: totalGamesNeeded,
        slotsAvailable: 0,
        capacityPercent,
        validDays,
        slotsPerDay,
        numberOfCourts,
      },
    })
  } else if (capacityPercent > 100) {
    conflicts.push({
      severity: 'ERROR',
      type: 'OVERCAPACITY',
      message: `Calendario inviavel: precisa de ${totalGamesNeeded} jogos mas so ha ${totalSlotsAvailable} slots disponiveis`,
      context: {
        gamesNeeded: totalGamesNeeded,
        slotsAvailable: totalSlotsAvailable,
        capacityPercent,
      },
    })
  } else if (capacityPercent > 85) {
    conflicts.push({
      severity: 'WARNING',
      type: 'TIGHT_CAPACITY',
      message: `Calendario apertado: ${capacityPercent}% dos slots serao usados`,
      context: {
        capacityPercent,
        gamesNeeded: totalGamesNeeded,
        slotsAvailable: totalSlotsAvailable,
      },
    })
  }

  // 5) Bloqueios FGB ativos (sem datas — schema atual nao tem range).
  const activeBlocks = championship.registrationBlocks.filter(b => b.isActive)
  if (activeBlocks.length > 0) {
    conflicts.push({
      severity: 'INFO',
      type: 'FGB_BLOCKS_ACTIVE',
      message: `${activeBlocks.length} bloqueio(s) FGB ativo(s) no campeonato`,
      context: {
        count: activeBlocks.length,
        reasons: activeBlocks.slice(0, 5).map(b => b.reason),
      },
    })
  }

  // 6) Treinadores compartilhados (multi-team).
  const coachIndex = new Map<string, Set<string>>()
  for (const cat of championship.categories) {
    for (const rc of cat.registrations) {
      const r = rc.registration
      if (r.coachMultiTeam && r.coachName) {
        const key = r.coachName.toLowerCase().trim()
        if (!coachIndex.has(key)) coachIndex.set(key, new Set())
        coachIndex.get(key)!.add(r.team.name)
      }
    }
  }
  for (const [coach, teamSet] of coachIndex.entries()) {
    if (teamSet.size > 1) {
      conflicts.push({
        severity: 'INFO',
        type: 'SHARED_COACH',
        message: `Treinador "${coach}" comanda ${teamSet.size} equipes (${[...teamSet].join(', ')})`,
        context: { coach, teams: [...teamSet] },
      })
    }
  }

  const hasError = conflicts.some(c => c.severity === 'ERROR')
  return {
    isValid: !hasError,
    conflicts,
    capacityPercent,
    totalSlotsAvailable,
    totalSlotsNeeded: totalGamesNeeded,
  }
}
