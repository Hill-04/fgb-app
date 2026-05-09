import type { SchedulingBriefing } from './scheduling-briefing'
import { isWeekdayAllowed, isDateInBlackout } from '@/lib/championship/scheduling-config'

export type ProposedGame = {
  phaseId?: string
  categoryId: string
  homeTeamId: string
  awayTeamId: string
  venueId?: string | null
  dateTime: string
  court?: string | null
  rationale?: string
}

export type ValidationIssue = {
  severity: 'error' | 'warning'
  code: string
  message: string
  gameIndex?: number
  data?: Record<string, unknown>
}

export type ValidationResult = {
  valid: boolean
  errors: ValidationIssue[]
  warnings: ValidationIssue[]
}

function parseDate(d: string): Date | null {
  const date = new Date(d)
  return Number.isNaN(date.getTime()) ? null : date
}

function hoursDiff(a: Date, b: Date): number {
  return Math.abs(a.getTime() - b.getTime()) / 3_600_000
}

function ymd(d: Date): string {
  return d.toISOString().slice(0, 10)
}

export function validateProposedSchedule(
  proposal: ProposedGame[],
  briefing: SchedulingBriefing,
): ValidationResult {
  const errors: ValidationIssue[] = []
  const warnings: ValidationIssue[] = []

  const config = briefing.championship.schedulingConfig
  const teamMap = new Map(briefing.teams.map((t) => [t.id, t]))
  const categoryMap = new Map(briefing.categories.map((c) => [c.id, c]))

  const teamGameSlots: Record<string, Date[]> = {}
  const venueSlotMap = new Map<string, number>()

  proposal.forEach((g, idx) => {
    const date = parseDate(g.dateTime)
    if (!date) {
      errors.push({ severity: 'error', code: 'INVALID_DATETIME', message: `Jogo ${idx}: dateTime inválido`, gameIndex: idx })
      return
    }

    if (g.homeTeamId === g.awayTeamId) {
      errors.push({ severity: 'error', code: 'SAME_TEAM', message: `Jogo ${idx}: equipe não pode jogar contra si mesma`, gameIndex: idx })
    }

    if (!teamMap.has(g.homeTeamId)) {
      errors.push({ severity: 'error', code: 'UNKNOWN_HOME_TEAM', message: `Jogo ${idx}: homeTeamId desconhecido`, gameIndex: idx, data: { homeTeamId: g.homeTeamId } })
    }
    if (!teamMap.has(g.awayTeamId)) {
      errors.push({ severity: 'error', code: 'UNKNOWN_AWAY_TEAM', message: `Jogo ${idx}: awayTeamId desconhecido`, gameIndex: idx, data: { awayTeamId: g.awayTeamId } })
    }

    if (!categoryMap.has(g.categoryId)) {
      errors.push({ severity: 'error', code: 'UNKNOWN_CATEGORY', message: `Jogo ${idx}: categoryId desconhecido`, gameIndex: idx, data: { categoryId: g.categoryId } })
    }

    if (!isWeekdayAllowed(date, config)) {
      errors.push({
        severity: 'error',
        code: 'WEEKDAY_NOT_ALLOWED',
        message: `Jogo ${idx}: ${ymd(date)} cai em dia da semana não permitido (${date.getDay()})`,
        gameIndex: idx,
      })
    }

    if (isDateInBlackout(date, config)) {
      errors.push({
        severity: 'error',
        code: 'BLACKOUT_DATE',
        message: `Jogo ${idx}: ${ymd(date)} está em data de blackout`,
        gameIndex: idx,
      })
    }

    if (config.timeSlots.length > 0) {
      const hh = String(date.getUTCHours()).padStart(2, '0')
      const mm = String(date.getUTCMinutes()).padStart(2, '0')
      const time = `${hh}:${mm}`
      const inSlot = config.timeSlots.some((s) => time >= s.start && time <= s.end)
      if (!inSlot) {
        warnings.push({
          severity: 'warning',
          code: 'OUTSIDE_TIME_SLOT',
          message: `Jogo ${idx}: ${time} fora das janelas de horário configuradas`,
          gameIndex: idx,
        })
      }
    }

    for (const teamId of [g.homeTeamId, g.awayTeamId]) {
      const team = teamMap.get(teamId)
      if (!team) continue
      for (const block of team.blockedDates) {
        const start = parseDate(block.start)
        const end = parseDate(block.end)
        if (start && end && date >= start && date <= end) {
          errors.push({
            severity: 'error',
            code: 'TEAM_BLOCKED_DATE',
            message: `Jogo ${idx}: equipe ${team.name} indicou bloqueio em ${ymd(date)} (${block.reason ?? 'sem motivo'})`,
            gameIndex: idx,
          })
        }
      }
    }

    for (const teamId of [g.homeTeamId, g.awayTeamId]) {
      teamGameSlots[teamId] = teamGameSlots[teamId] ?? []
      teamGameSlots[teamId].push(date)
    }

    if (g.venueId) {
      const slotKey = `${g.venueId}::${g.court ?? 'default'}::${date.toISOString()}`
      venueSlotMap.set(slotKey, (venueSlotMap.get(slotKey) ?? 0) + 1)
    }
  })

  for (const [slotKey, count] of venueSlotMap) {
    if (count > 1) {
      errors.push({
        severity: 'error',
        code: 'VENUE_DOUBLE_BOOKED',
        message: `Local com mais de um jogo no mesmo horário: ${slotKey}`,
      })
    }
  }

  for (const [teamId, dates] of Object.entries(teamGameSlots)) {
    const sorted = [...dates].sort((a, b) => a.getTime() - b.getTime())
    for (let i = 1; i < sorted.length; i++) {
      const diff = hoursDiff(sorted[i - 1], sorted[i])
      if (diff < config.minRestHoursBetweenGames) {
        const team = teamMap.get(teamId)
        errors.push({
          severity: 'error',
          code: 'INSUFFICIENT_REST',
          message: `Equipe ${team?.name ?? teamId}: descanso de ${diff.toFixed(1)}h entre jogos (mínimo ${config.minRestHoursBetweenGames}h)`,
        })
      }
    }

    const dayCounts: Record<string, number> = {}
    for (const d of sorted) {
      const k = ymd(d)
      dayCounts[k] = (dayCounts[k] ?? 0) + 1
    }
    for (const [day, count] of Object.entries(dayCounts)) {
      if (count > config.maxGamesPerTeamPerDay) {
        const team = teamMap.get(teamId)
        errors.push({
          severity: 'error',
          code: 'TOO_MANY_GAMES_PER_DAY',
          message: `Equipe ${team?.name ?? teamId}: ${count} jogos em ${day} (máximo ${config.maxGamesPerTeamPerDay})`,
        })
      }
    }

    const weekCounts: Record<string, number> = {}
    for (const d of sorted) {
      const monday = new Date(d)
      const day = monday.getDay()
      const diff = (day + 6) % 7
      monday.setDate(monday.getDate() - diff)
      const k = ymd(monday)
      weekCounts[k] = (weekCounts[k] ?? 0) + 1
    }
    for (const [week, count] of Object.entries(weekCounts)) {
      if (count > config.maxGamesPerTeamPerWeek) {
        const team = teamMap.get(teamId)
        warnings.push({
          severity: 'warning',
          code: 'TOO_MANY_GAMES_PER_WEEK',
          message: `Equipe ${team?.name ?? teamId}: ${count} jogos na semana de ${week} (limite ${config.maxGamesPerTeamPerWeek})`,
        })
      }
    }
  }

  proposal.forEach((g, idx) => {
    const home = teamMap.get(g.homeTeamId)
    const away = teamMap.get(g.awayTeamId)
    if (home?.hasOverdueFees) {
      warnings.push({
        severity: 'warning',
        code: 'OVERDUE_FEES_HOME',
        message: `Jogo ${idx}: ${home.name} tem taxas em aberto (${home.totalFeesOwed.toFixed(2)})`,
        gameIndex: idx,
      })
    }
    if (away?.hasOverdueFees) {
      warnings.push({
        severity: 'warning',
        code: 'OVERDUE_FEES_AWAY',
        message: `Jogo ${idx}: ${away.name} tem taxas em aberto (${away.totalFeesOwed.toFixed(2)})`,
        gameIndex: idx,
      })
    }
  })

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  }
}

export function validateRoundRobinCompleteness(
  proposal: ProposedGame[],
  briefing: SchedulingBriefing,
): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  const turns = briefing.championship.turns

  for (const cat of briefing.categories) {
    if (cat.registeredTeamIds.length < 2) continue
    const expected = (cat.registeredTeamIds.length * (cat.registeredTeamIds.length - 1)) / 2 * turns
    const actual = proposal.filter((g) => g.categoryId === cat.id).length
    if (actual !== expected) {
      issues.push({
        severity: 'error',
        code: 'ROUND_ROBIN_INCOMPLETE',
        message: `Categoria ${cat.name}: ${actual} jogos gerados (esperado ${expected})`,
        data: { expected, actual, categoryId: cat.id },
      })
    }

    const matchupKey = (a: string, b: string) => [a, b].sort().join('::')
    const matchupCount = new Map<string, number>()
    for (const g of proposal.filter((p) => p.categoryId === cat.id)) {
      const k = matchupKey(g.homeTeamId, g.awayTeamId)
      matchupCount.set(k, (matchupCount.get(k) ?? 0) + 1)
    }
    for (let i = 0; i < cat.registeredTeamIds.length; i++) {
      for (let j = i + 1; j < cat.registeredTeamIds.length; j++) {
        const k = matchupKey(cat.registeredTeamIds[i], cat.registeredTeamIds[j])
        const got = matchupCount.get(k) ?? 0
        if (got !== turns) {
          issues.push({
            severity: 'error',
            code: 'MATCHUP_COUNT_MISMATCH',
            message: `Categoria ${cat.name}: confronto ${cat.registeredTeamIds[i]} × ${cat.registeredTeamIds[j]} aparece ${got}x (esperado ${turns}x)`,
          })
        }
      }
    }
  }

  return issues
}
