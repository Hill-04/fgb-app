import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/db'
import { authOptions } from '@/lib/auth'
import { withDatabaseSchemaRetry } from '@/lib/db-patch'

type ValidationIssue = {
  type: 'error' | 'warning' | 'info'
  field: string
  message: string
  suggestion?: string
}

type ValidationWarning = {
  type: 'warning' | 'info'
  field: string
  message: string
  suggestion?: string
  athletes?: Array<{ name: string; categories: string[] }>
}

type BlockFormat = 'SAT_ONLY' | 'SAT_SUN' | 'FRI_SAT_SUN'

function startOfUtcDay(date: Date) {
  const normalized = new Date(date)
  normalized.setUTCHours(0, 0, 0, 0)
  return normalized
}

function endOfUtcDay(date: Date) {
  const normalized = new Date(date)
  normalized.setUTCHours(23, 59, 59, 999)
  return normalized
}

function parseCategoryIds(value: string) {
  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? parsed.map(String) : []
  } catch {
    return []
  }
}

function getWeekendStarts(startDate: Date, endDate: Date) {
  const weekends: Date[] = []
  const cursor = startOfUtcDay(new Date(startDate))

  while (cursor <= endDate) {
    if (cursor.getUTCDay() === 6) {
      weekends.push(new Date(cursor))
    }
    cursor.setUTCDate(cursor.getUTCDate() + 1)
  }

  return weekends
}

function timeToMinutes(value: string) {
  const [hour, minute] = value.split(':').map(Number)
  return (Number.isFinite(hour) ? hour : 0) * 60 + (Number.isFinite(minute) ? minute : 0)
}

function getSlotsPerDay(startTime: string, endTime: string, slotDurationMinutes: number) {
  const start = timeToMinutes(startTime)
  const end = timeToMinutes(endTime)

  if (slotDurationMinutes <= 0 || end <= start) {
    return 0
  }

  return Math.max(0, Math.floor((end - start) / slotDurationMinutes) + 1)
}

function getCompetitionDaysPerPhase(blockFormat: BlockFormat) {
  if (blockFormat === 'SAT_ONLY') return 1
  if (blockFormat === 'SAT_SUN') return 2
  return 3
}

function getPhaseCapacityGames(
  blockFormat: BlockFormat,
  regularDayCapacity: number,
  extendedDayCapacity: number
) {
  if (blockFormat === 'SAT_ONLY') return extendedDayCapacity
  if (blockFormat === 'SAT_SUN') return extendedDayCapacity + regularDayCapacity
  return extendedDayCapacity + regularDayCapacity * 2
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !(session.user as any).isAdmin) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { championshipId } = await request.json()

    const championship = await withDatabaseSchemaRetry(() =>
      prisma.championship.findUnique({
        where: { id: championshipId },
        include: {
          categories: {
            include: {
              registrations: {
                where: { registration: { status: 'CONFIRMED' } },
                include: {
                  registration: {
                    include: {
                      team: true,
                      blockedDates: true,
                      athletePlayers: true,
                    },
                  },
                },
              },
            },
          },
        },
      })
    )

    if (!championship) {
      return NextResponse.json({ error: 'Campeonato não encontrado' }, { status: 404 })
    }

    const issues: ValidationIssue[] = []
    const warnings: ValidationWarning[] = []
    const fieldControl = championship.fieldControl || 'alternado'
    const isCentralized = fieldControl === 'fixo' || fieldControl === 'neutro'
    const blockFormat = (championship.blockFormat || 'SAT_SUN') as BlockFormat
    const slotDurationMinutes = championship.slotDurationMinutes || 75
    const numberOfCourts = Math.max(1, championship.numberOfCourts || 1)
    const maxGamesPerTeamPerDay = Math.max(1, championship.maxGamesPerTeamPerDay || 2)
    const scheduleOptimizationMode = championship.scheduleOptimizationMode || 'compact'
    const slotsRegularDay = getSlotsPerDay(
      championship.dayStartTime || '08:00',
      championship.regularDayEndTime || '19:00',
      slotDurationMinutes
    )
    const slotsExtendedDay = getSlotsPerDay(
      championship.dayStartTime || '08:00',
      championship.extendedDayEndTime || championship.regularDayEndTime || '20:30',
      slotDurationMinutes
    )
    const regularDayCapacity = slotsRegularDay * numberOfCourts
    const extendedDayCapacity = slotsExtendedDay * numberOfCourts
    const competitionDaysPerPhase = getCompetitionDaysPerPhase(blockFormat)
    const phaseCapacityGames = getPhaseCapacityGames(
      blockFormat,
      regularDayCapacity,
      extendedDayCapacity
    )

    if ((championship.turns || 1) > maxGamesPerTeamPerDay) {
      issues.push({
        type: 'error',
        field: 'capacity.teamDailyLimit',
        message: `O limite de ${maxGamesPerTeamPerDay} jogo(s) por equipe no dia é incompatível com ${championship.turns || 1} turno(s).`,
        suggestion: 'Aumente o limite diário por equipe ou reduza o número de turnos.',
      })
    }

    for (const category of championship.categories) {
      const teamCount = category.registrations.length

      if (teamCount < 2) {
        issues.push({
          type: 'error',
          field: `categoria.${category.name}`,
          message: `${category.name}: apenas ${teamCount} equipe(s). Mínimo: 2.`,
          suggestion: 'Adicione mais equipes ou desative esta categoria.',
        })
      } else if (teamCount < championship.minTeamsPerCat) {
        issues.push({
          type: 'warning',
          field: `minTeams.${category.name}`,
          message: `${category.name}: ${teamCount} equipes, mínimo configurado: ${championship.minTeamsPerCat}.`,
          suggestion: `Adicione ${championship.minTeamsPerCat - teamCount} equipe(s) ou reduza o mínimo.`,
        })
      }
    }

    const categoriesWithTeams = championship.categories.filter(
      (category) => category.registrations.length >= 2
    )
    const categoriesReadyForScheduling = championship.categories.filter(
      (category) => category.registrations.length >= Math.max(2, championship.minTeamsPerCat || 2)
    )

    if (categoriesWithTeams.length === 0) {
      issues.push({
        type: 'error',
        field: 'categorias',
        message: 'Nenhuma categoria possui o minimo de 2 equipes confirmadas.',
        suggestion: 'Adicione equipes ou aguarde novas inscricoes antes de organizar.',
      })
    }

    for (let index = issues.length - 1; index >= 0; index -= 1) {
      const issue = issues[index]
      if (issue.field.startsWith('categoria.')) {
        warnings.push({
          type: 'warning',
          field: issue.field,
          message: `${issue.message} Esta categoria sera ignorada na organizacao.`,
          suggestion: issue.suggestion,
        })
        issues.splice(index, 1)
      }
    }

    const startDate = championship.startDate
      ? new Date(championship.startDate)
      : new Date(Date.now() + 21 * 24 * 60 * 60 * 1000)
    const endDate = championship.endDate ? new Date(championship.endDate) : null
    const availableWeekends = endDate ? getWeekendStarts(startDate, endDate) : []

    for (const category of championship.categories) {
      const registrations = category.registrations
      if (registrations.length < 2) {
        continue
      }

      if (isCentralized && endDate) {
        let freeWeekends = 0

        for (const weekendStart of availableWeekends) {
          const weekendEnd = new Date(weekendStart)
          weekendEnd.setUTCDate(weekendEnd.getUTCDate() + 1)

          const allFree = registrations.every((registration) => {
            return !registration.registration.blockedDates.some((blockedDate) => {
              const blockedStart = startOfUtcDay(new Date(blockedDate.startDate))
              const blockedEnd = endOfUtcDay(new Date(blockedDate.endDate))
              return weekendStart <= blockedEnd && weekendEnd >= blockedStart
            })
          })

          if (allFree) {
            freeWeekends += 1
          }
        }

        const requiredWeekends = championship.phases || 1
        if (freeWeekends < requiredWeekends) {
          issues.push({
            type: 'error',
            field: `datas.${category.name}`,
            message: `${category.name}: apenas ${freeWeekends} fim(ns) de semana onde TODAS as ${registrations.length} equipes estão livres. Necessário: ${requiredWeekends}.`,
            suggestion:
              'Campeonato centralizado exige que todas as equipes estejam presentes. Estenda o período ou negocie as datas bloqueadas.',
          })
        }
      }

      for (const registration of registrations) {
        const totalDays = endDate
          ? Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / 86400000) + 1)
          : 90
        let blockedDays = 0

        for (const blockedDate of registration.registration.blockedDates) {
          const blockedStart = startOfUtcDay(new Date(blockedDate.startDate))
          const blockedEnd = endOfUtcDay(new Date(blockedDate.endDate))
          blockedDays += Math.ceil((blockedEnd.getTime() - blockedStart.getTime()) / 86400000)
        }

        const blockedPct = totalDays > 0 ? (blockedDays / totalDays) * 100 : 0
        if (blockedPct > 50) {
          warnings.push({
            type: 'warning',
            field: `bloqueio.${registration.registration.team.name}`,
            message: `${registration.registration.team.name} (${category.name}): ${Math.round(blockedPct)}% do período bloqueado.`,
            suggestion: 'Esta equipe pode comprometer a organização. Verificar com o responsável.',
          })
        }
      }
    }

    const athleteMap = new Map<string, string[]>()

    for (const category of championship.categories) {
      for (const registration of category.registrations) {
        for (const athlete of registration.registration.athletePlayers || []) {
          const categoryIds = parseCategoryIds(athlete.categoryIds || '[]')
          const key = athlete.athleteDoc || athlete.athleteName

          if (!athleteMap.has(key)) {
            athleteMap.set(key, [])
          }

          for (const categoryId of categoryIds) {
            if (!athleteMap.get(key)!.includes(categoryId)) {
              athleteMap.get(key)!.push(categoryId)
            }
          }
        }
      }
    }

    const multiCategoryAthletes = Array.from(athleteMap.entries()).filter(([, categoryIds]) => categoryIds.length > 1)

    if (multiCategoryAthletes.length > 0) {
      warnings.push({
        type: 'info',
        field: 'atletas',
        message: `${multiCategoryAthletes.length} atleta(s) em múltiplas categorias. A IA ajustará os horários automaticamente.`,
        athletes: multiCategoryAthletes.map(([name, categories]) => ({ name, categories })),
      })
    }

    if (!championship.startDate) {
      issues.push({
        type: 'error',
        field: 'startDate',
        message: 'Data de início não definida.',
        suggestion: 'Defina a data de início nas Configurações.',
      })
    }

    if (championship.hasPlayoffs) {
      const playoffTeams = championship.playoffTeams || 4

      for (const category of championship.categories) {
        if (category.registrations.length < playoffTeams) {
          warnings.push({
            type: 'warning',
            field: `playoff.${category.name}`,
            message: `${category.name}: ${category.registrations.length} equipes, mas playoffs exige ${playoffTeams}.`,
            suggestion: `Reduza para ${Math.max(2, category.registrations.length)} equipes no playoff.`,
          })
        }
      }
    }

    const hasErrors = issues.some((issue) => issue.type === 'error')
    const totalGames = championship.categories.reduce((accumulator, category) => {
      const teamCount = category.registrations.length
      if (teamCount < 2) {
        return accumulator
      }

      const pairs = (teamCount * (teamCount - 1)) / 2
      return accumulator + pairs * (championship.turns || 1)
    }, 0)
    const maxGamesPerPhase = Math.ceil(totalGames / Math.max(1, championship.phases || 1))
    const estimatedDays = Math.ceil(
      totalGames /
        Math.max(
          1,
          blockFormat === 'SAT_ONLY'
            ? extendedDayCapacity
            : Math.ceil(phaseCapacityGames / Math.max(1, competitionDaysPerPhase))
        )
    )
    const totalBlockedCount = championship.categories.reduce(
      (accumulator, category) =>
        accumulator +
        category.registrations.reduce(
          (registrationAccumulator, registration) =>
            registrationAccumulator + registration.registration.blockedDates.length,
          0
        ),
      0
    )
    const totalWeekendWindows = availableWeekends.length
    const totalPotentialGames = endDate ? totalWeekendWindows * phaseCapacityGames : null

    if (phaseCapacityGames <= 0) {
      issues.push({
        type: 'error',
        field: 'capacity.window',
        message: 'A janela de horario configurada nao gera slots suficientes para jogos.',
        suggestion: 'Amplie o horario do dia, aumente o numero de quadras ou ajuste a duracao dos slots.',
      })
    }

    if (maxGamesPerPhase > phaseCapacityGames) {
      issues.push({
        type: 'error',
        field: 'capacity.phase',
        message: `Cada fase comporta no maximo ${phaseCapacityGames} jogo(s), mas o campeonato precisa de ate ${maxGamesPerPhase} por fase.`,
        suggestion: 'Reduza a quantidade de fases, aumente quadras ou amplie a janela de competicao.',
      })
    }

    if (totalPotentialGames !== null && totalGames > totalPotentialGames) {
      issues.push({
        type: 'error',
        field: 'capacity.total',
        message: `A capacidade teorica do periodo e ${totalPotentialGames} jogo(s), mas o campeonato precisa de ${totalGames}.`,
        suggestion: 'Estenda a data final, reduza fases ou aumente a capacidade diaria.',
      })
    }

    let aiMessage = ''
    if (hasErrors) {
      aiMessage = `Encontrei ${issues.filter((issue) => issue.type === 'error').length} problema(s) que impedem a organização. Corrija antes de continuar.`
    } else if (issues.length > 0 || warnings.length > 0) {
      aiMessage = `O campeonato é viável com ${issues.length + warnings.length} ponto(s) de atenção. Você pode continuar ou ajustar.`
    } else {
      aiMessage = `Tudo certo! ${totalGames} jogos distribuídos em aprox. ${estimatedDays} dia(s). ${totalBlockedCount} restrição(ões) de data serão consideradas.`
    }

    return NextResponse.json({
      viable: !hasErrors,
      issues,
      warnings,
      fieldControlType: isCentralized ? 'centralizado' : 'alternado',
      fieldControlImpact: isCentralized
        ? 'Todas as equipes precisam estar presentes em cada fase. Um bloqueio invalida o dia inteiro.'
        : 'Apenas o confronto específico é afetado por um bloqueio.',
      summary: {
        totalTeams: championship.categories.reduce((accumulator, category) => accumulator + category.registrations.length, 0),
        totalCategories: championship.categories.length,
        readyCategories: categoriesReadyForScheduling.length,
        totalGames,
        estimatedDays,
        totalBlockedDates: totalBlockedCount,
        multiCatAthletes: multiCategoryAthletes.length,
        turns: championship.turns || 1,
        phases: championship.phases || 1,
        format: championship.format || 'todos_contra_todos',
        hasPlayoffs: championship.hasPlayoffs || false,
        capacity: {
          blockFormat,
          dayStartTime: championship.dayStartTime || '08:00',
          regularDayEndTime: championship.regularDayEndTime || '19:00',
          extendedDayEndTime: championship.extendedDayEndTime || championship.regularDayEndTime || '20:30',
          slotDurationMinutes,
          minRestSlotsPerTeam: championship.minRestSlotsPerTeam || 1,
          maxGamesPerTeamPerDay,
          scheduleOptimizationMode,
          numberOfCourts,
          slotsRegularDay,
          slotsExtendedDay,
          maxGamesRegularDay: regularDayCapacity,
          maxGamesExtendedDay: extendedDayCapacity,
          competitionDaysPerPhase,
          maxGamesPerPhase: phaseCapacityGames,
          requiredGamesPerPhase: maxGamesPerPhase,
          totalWeekendWindows,
          totalPotentialGames,
        },
      },
      aiMessage,
    })
  } catch (error: any) {
    console.error('[Scheduling Validate Error]', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
