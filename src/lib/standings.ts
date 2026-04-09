import { prisma } from '@/lib/db'

type StandingAccumulator = {
  teamId: string
  teamName: string
  played: number
  wins: number
  losses: number
  draws: number
  points: number
  pointsFor: number
  pointsAgainst: number
  diff: number
}

export async function recalculateStandings(categoryId: string) {
  const [games, registrations] = await Promise.all([
    prisma.game.findMany({
      where: {
        categoryId,
        status: 'FINISHED',
        homeScore: { not: null },
        awayScore: { not: null },
      },
      include: {
        homeTeam: true,
        awayTeam: true,
      },
    }),
    prisma.registrationCategory.findMany({
      where: { categoryId },
      include: {
        registration: {
          include: {
            team: true,
          },
        },
      },
    }),
  ])

  const standings = new Map<string, StandingAccumulator>()

  const ensureTeam = (teamId: string, teamName: string) => {
    if (!standings.has(teamId)) {
      standings.set(teamId, {
        teamId,
        teamName,
        played: 0,
        wins: 0,
        losses: 0,
        draws: 0,
        points: 0,
        pointsFor: 0,
        pointsAgainst: 0,
        diff: 0,
      })
    }

    return standings.get(teamId)!
  }

  for (const registration of registrations) {
    ensureTeam(registration.registration.teamId, registration.registration.team.name)
  }

  for (const game of games) {
    const home = ensureTeam(game.homeTeamId, game.homeTeam.name)
    const away = ensureTeam(game.awayTeamId, game.awayTeam.name)
    const homeScore = game.homeScore ?? 0
    const awayScore = game.awayScore ?? 0

    home.played += 1
    away.played += 1
    home.pointsFor += homeScore
    home.pointsAgainst += awayScore
    away.pointsFor += awayScore
    away.pointsAgainst += homeScore

    if (homeScore > awayScore) {
      home.wins += 1
      home.points += 2
      away.losses += 1
      away.points += 1
    } else if (homeScore < awayScore) {
      away.wins += 1
      away.points += 2
      home.losses += 1
      home.points += 1
    } else {
      home.draws += 1
      home.points += 1
      away.draws += 1
      away.points += 1
    }

    home.diff = home.pointsFor - home.pointsAgainst
    away.diff = away.pointsFor - away.pointsAgainst
  }

  const registeredTeamIds = registrations.map((registration) => registration.registration.teamId)

  await prisma.standing.deleteMany({
    where: {
      categoryId,
      teamId: {
        notIn: registeredTeamIds,
      },
    },
  })

  for (const [teamId, data] of standings) {
    await prisma.standing.upsert({
      where: {
        teamId_categoryId: {
          teamId,
          categoryId,
        },
      },
      update: {
        played: data.played,
        wins: data.wins,
        losses: data.losses,
        draws: data.draws,
        points: data.points,
        pointsFor: data.pointsFor,
        pointsAg: data.pointsAgainst,
        pointsAgainst: data.pointsAgainst,
        diff: data.diff,
      },
      create: {
        teamId,
        categoryId,
        played: data.played,
        wins: data.wins,
        losses: data.losses,
        draws: data.draws,
        points: data.points,
        pointsFor: data.pointsFor,
        pointsAg: data.pointsAgainst,
        pointsAgainst: data.pointsAgainst,
        diff: data.diff,
      },
    })
  }
}
