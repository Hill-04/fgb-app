import type { SchedulingBriefing } from './scheduling-briefing'
import type { ProposedGame } from './scheduling-validator'
import { isWeekdayAllowed, isDateInBlackout } from '@/lib/championship/scheduling-config'

function bergerRoundRobin(teamIds: string[]): Array<Array<[string, string]>> {
  const teams = [...teamIds]
  if (teams.length % 2 === 1) teams.push('__BYE__')
  const n = teams.length
  const rounds: Array<Array<[string, string]>> = []
  for (let r = 0; r < n - 1; r++) {
    const round: Array<[string, string]> = []
    for (let i = 0; i < n / 2; i++) {
      const home = teams[i]
      const away = teams[n - 1 - i]
      if (home !== '__BYE__' && away !== '__BYE__') {
        if (i === 0 && r % 2 === 1) {
          round.push([away, home])
        } else {
          round.push([home, away])
        }
      }
    }
    rounds.push(round)
    const fixed = teams[0]
    const rest = teams.slice(1)
    rest.unshift(rest.pop()!)
    teams.splice(0, teams.length, fixed, ...rest)
  }
  return rounds
}

function nextAllowedDate(from: Date, briefing: SchedulingBriefing): Date | null {
  const config = briefing.championship.schedulingConfig
  const limit = briefing.championship.endDate
    ? new Date(briefing.championship.endDate)
    : new Date(from.getFullYear() + 1, from.getMonth(), from.getDate())

  const cur = new Date(from)
  for (let i = 0; i < 365; i++) {
    if (cur > limit) return null
    if (isWeekdayAllowed(cur, config) && !isDateInBlackout(cur, config)) {
      return new Date(cur)
    }
    cur.setDate(cur.getDate() + 1)
  }
  return null
}

function isTeamBlocked(teamId: string, date: Date, briefing: SchedulingBriefing): boolean {
  const team = briefing.teams.find((t) => t.id === teamId)
  if (!team) return false
  for (const block of team.blockedDates) {
    const start = new Date(block.start)
    const end = new Date(block.end)
    if (date >= start && date <= end) return true
  }
  return false
}

function applyTime(date: Date, hhmm: string): Date {
  const [h, m] = hhmm.split(':').map((n) => Number(n))
  const result = new Date(date)
  result.setUTCHours(h, m, 0, 0)
  return result
}

export function generateDeterministicSchedule(briefing: SchedulingBriefing): ProposedGame[] {
  const proposed: ProposedGame[] = []
  const config = briefing.championship.schedulingConfig

  const slots = config.timeSlots.length > 0
    ? config.timeSlots
    : [{ start: '09:00', end: '12:00' }, { start: '14:00', end: '18:00' }]

  const teamHomeCounts: Record<string, number> = {}

  const startBase = briefing.championship.startDate
    ? new Date(briefing.championship.startDate)
    : new Date()

  for (const cat of briefing.categories) {
    if (cat.registeredTeamIds.length < 2) continue

    const turnsToGen: Array<Array<[string, string]>> = []
    for (let t = 0; t < briefing.championship.turns; t++) {
      const rounds = bergerRoundRobin(cat.registeredTeamIds)
      for (const round of rounds) {
        const adjusted: Array<[string, string]> = round.map(([home, away]) => {
          if (t % 2 === 1) return [away, home]
          return [home, away]
        })
        turnsToGen.push(adjusted)
      }
    }

    let cursor = nextAllowedDate(startBase, briefing) ?? new Date(startBase)

    for (const round of turnsToGen) {
      const teamsUsedInRound = new Set<string>()
      let slotIdx = 0

      for (const [home, away] of round) {
        let attempts = 0
        let scheduled = false
        let tryDate = new Date(cursor)

        while (attempts < 60 && !scheduled) {
          const date = nextAllowedDate(tryDate, briefing)
          if (!date) break

          if (isTeamBlocked(home, date, briefing) || isTeamBlocked(away, date, briefing)) {
            tryDate.setDate(tryDate.getDate() + 1)
            attempts++
            continue
          }

          if (teamsUsedInRound.has(home) || teamsUsedInRound.has(away)) {
            tryDate.setDate(tryDate.getDate() + 1)
            attempts++
            continue
          }

          const slot = slots[slotIdx % slots.length]
          const dateTime = applyTime(date, slot.start)

          let actualHome = home
          let actualAway = away
          const homeBalance = (teamHomeCounts[home] ?? 0)
          const awayBalance = (teamHomeCounts[away] ?? 0)
          if (homeBalance > awayBalance + 1) {
            actualHome = away
            actualAway = home
          }
          teamHomeCounts[actualHome] = (teamHomeCounts[actualHome] ?? 0) + 1

          const team = briefing.teams.find((t) => t.id === actualHome)
          proposed.push({
            categoryId: cat.id,
            homeTeamId: actualHome,
            awayTeamId: actualAway,
            venueId: team?.homeVenue?.id ?? null,
            dateTime: dateTime.toISOString(),
            court: team?.homeVenue?.courts && team.homeVenue.courts > 1 ? '1' : null,
            rationale: 'Round-robin Berger + greedy slot allocator',
          })
          teamsUsedInRound.add(home)
          teamsUsedInRound.add(away)
          slotIdx++
          scheduled = true
        }
      }

      cursor.setDate(cursor.getDate() + 7)
    }
  }

  return proposed
}
