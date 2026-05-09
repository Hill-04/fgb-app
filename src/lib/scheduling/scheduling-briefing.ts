import { prisma } from '@/lib/db'
import { getSchedulingConfig, type SchedulingConfig } from '@/lib/championship/scheduling-config'

export type BriefingTeam = {
  id: string
  name: string
  city: string | null
  state: string | null
  homeVenue?: { id: string; name: string; city: string; courts: number } | null
  blockedDates: Array<{ start: string; end: string; reason?: string | null }>
  blockedAthleteIds: string[]
  totalFeesOwed: number
  hasOverdueFees: boolean
}

export type BriefingCategory = {
  id: string
  name: string
  modality: string
  minBirthYear: number | null
  maxBirthYear: number | null
  registeredTeamIds: string[]
}

export type BriefingChampionship = {
  id: string
  name: string
  year: number
  format: string
  turns: number
  phases: number
  hasPlayoffs: boolean
  playoffTeams: number
  playoffFormat: string
  startDate: string | null
  endDate: string | null
  sanctioning: string
  modality: string
  schedulingConfig: SchedulingConfig
  numberOfCourts: number
  slotDurationMinutes: number
  optimizationMode: string
}

export type SchedulingBriefing = {
  championship: BriefingChampionship
  categories: BriefingCategory[]
  teams: BriefingTeam[]
  previousScheduleStats: {
    homeAwayBalance: Record<string, { home: number; away: number }>
  }
  preferences: {
    optimizationMode: string
    homePattern: string
  }
}

export async function buildSchedulingBriefing(
  championshipId: string,
): Promise<SchedulingBriefing> {
  const championship = await prisma.championship.findUnique({
    where: { id: championshipId },
    include: {
      categories: true,
      registrations: {
        where: { status: 'CONFIRMED' },
        include: {
          team: { include: { gym: true } },
          blockedDates: true,
          categories: true,
        },
      },
    },
  })

  if (!championship) throw new Error('Campeonato não encontrado')

  const schedulingConfig = getSchedulingConfig(championship as any)

  const teamIds = championship.registrations.map((r) => r.teamId)

  const externalBlocks = await prisma.fGBRegistrationBlock.findMany({
    where: {
      championshipId,
      isActive: true,
      teamId: { in: teamIds.length > 0 ? teamIds : ['__none__'] },
    },
    select: { teamId: true, athleteId: true },
  }).catch(() => [])

  const blockedAthletesByTeam = new Map<string, string[]>()
  for (const b of externalBlocks) {
    if (!b.teamId || !b.athleteId) continue
    const list = blockedAthletesByTeam.get(b.teamId) ?? []
    list.push(b.athleteId)
    blockedAthletesByTeam.set(b.teamId, list)
  }

  const teams: BriefingTeam[] = championship.registrations.map((r) => ({
    id: r.teamId,
    name: r.team.name,
    city: r.team.city ?? null,
    state: r.team.state ?? null,
    homeVenue: r.team.gym
      ? {
          id: r.team.gym.id,
          name: r.team.gym.name,
          city: r.team.gym.city,
          courts: r.team.gym.courts,
        }
      : null,
    blockedDates: r.blockedDates.map((bd) => ({
      start: bd.startDate.toISOString(),
      end: bd.endDate.toISOString(),
      reason: bd.reason,
    })),
    blockedAthleteIds: blockedAthletesByTeam.get(r.teamId) ?? [],
    totalFeesOwed: r.team.totalFeesOwed ?? 0,
    hasOverdueFees: (r.team.totalFeesOwed ?? 0) > 0,
  }))

  const categoryEntries: BriefingCategory[] = championship.categories.map((c: any) => {
    const registeredTeamIds = championship.registrations
      .filter((r) => r.categories.some((rc) => rc.categoryId === c.id))
      .map((r) => r.teamId)
    return {
      id: c.id,
      name: c.name,
      modality: c.modality ?? '5x5',
      minBirthYear: c.minBirthYear ?? null,
      maxBirthYear: c.maxBirthYear ?? null,
      registeredTeamIds,
    }
  })

  const previousGames = await prisma.game.findMany({
    where: { championshipId },
    select: { homeTeamId: true, awayTeamId: true },
  }).catch(() => [])

  const homeAwayBalance: Record<string, { home: number; away: number }> = {}
  for (const g of previousGames) {
    if (!homeAwayBalance[g.homeTeamId]) homeAwayBalance[g.homeTeamId] = { home: 0, away: 0 }
    if (!homeAwayBalance[g.awayTeamId]) homeAwayBalance[g.awayTeamId] = { home: 0, away: 0 }
    homeAwayBalance[g.homeTeamId].home += 1
    homeAwayBalance[g.awayTeamId].away += 1
  }

  return {
    championship: {
      id: championship.id,
      name: championship.name,
      year: championship.year,
      format: championship.format,
      turns: championship.turns,
      phases: championship.phases,
      hasPlayoffs: championship.hasPlayoffs,
      playoffTeams: championship.playoffTeams,
      playoffFormat: championship.playoffFormat,
      startDate: championship.startDate?.toISOString() ?? null,
      endDate: championship.endDate?.toISOString() ?? null,
      sanctioning: (championship as any).sanctioning ?? 'FGB_OFFICIAL',
      modality: (championship as any).modality ?? '5x5',
      schedulingConfig,
      numberOfCourts: championship.numberOfCourts,
      slotDurationMinutes: championship.slotDurationMinutes,
      optimizationMode: championship.scheduleOptimizationMode,
    },
    categories: categoryEntries,
    teams,
    previousScheduleStats: { homeAwayBalance },
    preferences: {
      optimizationMode: championship.scheduleOptimizationMode,
      homePattern: (championship as any).homePattern ?? 'ALTERNATED',
    },
  }
}
