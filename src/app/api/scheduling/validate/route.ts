import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { validateCategoryTeams } from '@/lib/calendar/validation'

type ValidationIssue = {
  type: 'error' | 'warning' | 'info'
  field: string
  message: string
  suggestion: string
}

type ValidationResult = {
  viable: boolean
  issues: ValidationIssue[]
  summary: {
    totalTeams: number
    totalCategories: number
    totalGames: number
    estimatedDays: number
    periodDays: number
    gamesPerDay: number
    turns: number
    format: string
    hasPlayoffs: boolean
  }
  aiMessage: string
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !(session.user as any).isAdmin) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { championshipId } = await request.json()

    const championship = await prisma.championship.findUnique({
      where: { id: championshipId },
      include: {
        categories: {
          include: {
            registrations: {
              where: { registration: { status: 'CONFIRMED' } },
              include: { registration: { include: { team: true } } }
            }
          }
        }
      }
    })

    if (!championship) {
      return NextResponse.json({ error: 'Campeonato não encontrado' }, { status: 404 })
    }

    const issues: ValidationIssue[] = []
    const MAX_GAMES_PER_DAY = 8
    const PREFERRED_DAYS_PER_WEEK = 3 // sex, sáb, dom

    // Calcular total de jogos necessários
    let totalGames = 0
    const teamsPerCategory: { name: string; count: number }[] = []

    for (const cat of championship.categories) {
      const n = cat.registrations.length
      teamsPerCategory.push({ name: cat.name, count: n })

      const validation = validateCategoryTeams(n)
      if (!validation.isValid) {
        issues.push({
          type: 'warning',
          field: `categoria.${cat.name}`,
          message: `A categoria "${cat.name}" tem apenas ${n} equipe(s) confirmada(s) e será IGNORADA no agendamento.`,
          suggestion: validation.error || 'Adicione mais equipes se desejar incluir esta categoria.'
        })
        continue
      } else if (validation.warning) {
        issues.push({
          type: 'warning',
          field: `categoria.${cat.name}`,
          message: `A categoria "${cat.name}" tem ${n} equipe(s).`,
          suggestion: validation.warning
        })
      }

      // Round-robin: n*(n-1)/2 jogos por turno
      const gamesPerTurn = (n * (n - 1)) / 2
      totalGames += gamesPerTurn * (championship.turns || 1)
    }

    // Verificar viabilidade de cada grupo por fase
    const maxTeamsInAnyCat = Math.max(...championship.categories.map(c => c.registrations.length), 0)
    const maxPairsForAnyCat = (maxTeamsInAnyCat * (maxTeamsInAnyCat - 1)) / 2
    const pairsPerPhaseCalc = Math.ceil(maxPairsForAnyCat / (championship.phases || 1))

    // Calcular jogos por dia máximo para 2 cats (limite FGB)
    const MAX_SLOTS_PER_DAY = 6  // 6 jogos de 75min cabem das 08:00 às 16:45
    const jogsPerGroupPerFase = pairsPerPhaseCalc * 2 * (championship.turns || 1)
    const diasNecessariosPorGrupoFase = Math.ceil(jogsPerGroupPerFase / MAX_SLOTS_PER_DAY)

    if (diasNecessariosPorGrupoFase > 3) {
      issues.push({
        type: 'error',
        field: 'phases',
        message: `Cada fase precisaria de ${diasNecessariosPorGrupoFase} dias para os jogos do grupo, mas o máximo permitido é 3 (sex+sáb+dom).`,
        suggestion: `Aumente o número de fases para ${Math.ceil((championship.phases || 1) * diasNecessariosPorGrupoFase / 3)} ou reduza o número de equipes por categoria.`
      })
    }

    // -- Verificar data de início
    if (!championship.startDate) {
      issues.push({
        type: 'error',
        field: 'startDate',
        message: 'Data de início não definida.',
        suggestion: 'Defina uma data de início nas Configurações antes de organizar.'
      })
    }

    // -- Calcular período disponível
    const startDate = championship.startDate ? new Date(championship.startDate) : null
    const endDate = championship.endDate ? new Date(championship.endDate) : null
    let periodDays = 0

    if (startDate && endDate) {
      periodDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
      const availableDays = Math.floor(periodDays / 7) * PREFERRED_DAYS_PER_WEEK

      if (periodDays < 7) {
        issues.push({
          type: 'error',
          field: 'endDate',
          message: `Período muito curto: apenas ${periodDays} dia(s) entre início e fim.`,
          suggestion: 'Estenda a data de fim para ter pelo menos 2 fins de semana disponíveis.'
        })
      } else if (totalGames > 0) {
        const estimatedDays = Math.ceil(totalGames / MAX_GAMES_PER_DAY)

        if (estimatedDays > availableDays) {
          const extraWeeks = Math.ceil((estimatedDays - availableDays) / PREFERRED_DAYS_PER_WEEK)
          issues.push({
            type: 'error',
            field: 'periodo',
            message: `Período insuficiente. Necessário ${estimatedDays} dia(s) de jogo, disponível ${availableDays} nos fins de semana.`,
            suggestion: `Estenda o campeonato em ${extraWeeks} semana(s), reduza de ${championship.turns} para 1 turno, ou remova categorias com poucos times.`
          })
        } else if (estimatedDays > availableDays * 0.8) {
          issues.push({
            type: 'warning',
            field: 'periodo',
            message: `Calendário apertado: ${totalGames} jogos em ${availableDays} dias disponíveis (${estimatedDays} necessários).`,
            suggestion: 'O calendário é viável, mas com pouca margem de segurança. Considere estender o período se houver imprevistos.'
          })
        }
      }
    } else if (startDate && !endDate) {
      const daysNeeded = Math.ceil(totalGames / MAX_GAMES_PER_DAY / PREFERRED_DAYS_PER_WEEK * 7)
      issues.push({
        type: 'warning',
        field: 'endDate',
        message: 'Data de fim não definida.',
        suggestion: `Com ${totalGames} jogos, o campeonato precisará de aproximadamente ${daysNeeded} dias corridos. Defina uma data de fim para melhor controle.`
      })
    }

    // -- Verificar playoffs
    if (championship.hasPlayoffs) {
      const minTeamsForPlayoff = championship.playoffTeams || 4
      for (const cat of championship.categories) {
        if (cat.registrations.length > 0 && cat.registrations.length < minTeamsForPlayoff) {
          issues.push({
            type: 'warning',
            field: `playoff.${cat.name}`,
            message: `"${cat.name}": ${cat.registrations.length} equipe(s), mas os playoffs exigem ${minTeamsForPlayoff}.`,
            suggestion: `Reduza "Equipes no Playoff" para ${Math.max(2, cat.registrations.length)} nas Configurações, ou adicione mais times.`
          })
        }
      }
    }

    // -- Verificar mínimo de times por categoria
    for (const cat of teamsPerCategory) {
      if (cat.count > 0 && cat.count < championship.minTeamsPerCat) {
        issues.push({
          type: 'warning',
          field: `minTeams.${cat.name}`,
          message: `"${cat.name}": ${cat.count} equipe(s), mínimo configurado: ${championship.minTeamsPerCat}.`,
          suggestion: `Confirme mais ${championship.minTeamsPerCat - cat.count} equipe(s) ou altere "Mínimo por Categoria" nas Configurações.`
        })
      }
    }

    // -- Verificar categorias vazias (sem nenhuma equipe)
    const categoriesWithNoTeams = championship.categories.filter(c => c.registrations.length === 0)
    if (categoriesWithNoTeams.length > 0) {
      issues.push({
        type: 'info',
        field: 'categorias_vazias',
        message: `${categoriesWithNoTeams.length} categoria(s) sem equipes confirmadas e serão ignoradas: ${categoriesWithNoTeams.map(c => c.name).join(', ')}.`,
        suggestion: 'Isso é normal se algumas categorias estiverem sem participantes. Elas serão puladas na geração do calendário.'
      })
    }

    // Determinar viabilidade
    const hasErrors = issues.some(i => i.type === 'error')
    const hasWarnings = issues.some(i => i.type === 'warning')
    const viable = !hasErrors

    // Calcular estimativas finais
    const estimatedDays = totalGames > 0 ? Math.ceil(totalGames / MAX_GAMES_PER_DAY) : 0
    const gamesPerDay = totalGames > 0
      ? Math.min(MAX_GAMES_PER_DAY, Math.ceil(totalGames / Math.max(estimatedDays, 1)))
      : 0

    // Gerar mensagem IA humanizada
    let aiMessage: string
    if (!viable) {
      const errorCount = issues.filter(i => i.type === 'error').length
      aiMessage = `Encontrei ${errorCount} problema(s) que impedem a geração do calendário. Corrija os itens abaixo nas Configurações do campeonato antes de continuar.`
    } else if (hasWarnings) {
      const warnCount = issues.filter(i => i.type === 'warning').length
      aiMessage = `O campeonato pode ser organizado! Mas identifiquei ${warnCount} ponto(s) de atenção. Você pode continuar ou ajustar os itens listados para um calendário mais robusto.`
    } else {
      aiMessage = `Tudo certo! O campeonato está perfeitamente configurado. Posso gerar o calendário com ${totalGames} jogo(s) distribuídos em aproximadamente ${estimatedDays} dia(s) de competição.`
    }

    return NextResponse.json({
      viable,
      issues,
      summary: {
        totalTeams: teamsPerCategory.reduce((a, c) => a + c.count, 0),
        totalCategories: championship.categories.length,
        totalGames,
        estimatedDays,
        periodDays,
        gamesPerDay,
        turns: championship.turns || 1,
        format: championship.format || 'todos_contra_todos',
        hasPlayoffs: championship.hasPlayoffs || false
      },
      aiMessage
    } as ValidationResult)

  } catch (error: any) {
    console.error('[Scheduling Validate Error]', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
