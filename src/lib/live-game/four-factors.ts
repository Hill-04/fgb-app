/**
 * Dean Oliver's Four Factors — métricas de eficiência ofensiva e defensiva.
 *
 * Pesos sugeridos:
 * - eFG%  (Effective Field Goal Percentage): 40%
 * - TOV%  (Turnover Percentage):              25%
 * - ORB%  (Offensive Rebound Percentage):     20%
 * - FTR   (Free Throw Rate):                  15%
 */

export type FourFactorsInput = {
  fgMade: number
  fgAttempted: number
  threePtMade: number
  ftMade: number
  ftAttempted: number
  turnovers: number
  offRebounds: number
  oppDefRebounds: number
}

export type FourFactors = {
  eFGPercent: number
  tovPercent: number
  orbPercent: number
  ftRate: number
}

export function calculateFourFactors(team: FourFactorsInput): FourFactors {
  const eFGPercent = team.fgAttempted > 0
    ? ((team.fgMade + 0.5 * team.threePtMade) / team.fgAttempted) * 100
    : 0

  const possessions = team.fgAttempted + 0.44 * team.ftAttempted + team.turnovers
  const tovPercent = possessions > 0 ? (team.turnovers / possessions) * 100 : 0

  const orbPercent = (team.offRebounds + team.oppDefRebounds) > 0
    ? (team.offRebounds / (team.offRebounds + team.oppDefRebounds)) * 100
    : 0

  const ftRate = team.fgAttempted > 0 ? (team.ftAttempted / team.fgAttempted) * 100 : 0

  return {
    eFGPercent: round(eFGPercent),
    tovPercent: round(tovPercent),
    orbPercent: round(orbPercent),
    ftRate: round(ftRate),
  }
}

function round(n: number): number {
  return Math.round(n * 10) / 10
}

export function fourFactorsFromEvents(
  events: { eventType: string; teamId: string; payloadJson?: string | null }[],
  teamId: string,
  oppTeamId: string,
): FourFactors {
  let fgMade = 0, fgAttempted = 0, threePtMade = 0
  let ftMade = 0, ftAttempted = 0
  let turnovers = 0, offRebounds = 0, oppDefRebounds = 0

  for (const e of events) {
    const isOurs = e.teamId === teamId
    const isOpp = e.teamId === oppTeamId

    if (isOurs) {
      if (e.eventType === 'SHOT_MADE_2') { fgMade++; fgAttempted++ }
      if (e.eventType === 'SHOT_MISSED_2') { fgAttempted++ }
      if (e.eventType === 'SHOT_MADE_3') { fgMade++; fgAttempted++; threePtMade++ }
      if (e.eventType === 'SHOT_MISSED_3') { fgAttempted++ }
      if (e.eventType === 'FREE_THROW_MADE') { ftMade++; ftAttempted++ }
      if (e.eventType === 'FREE_THROW_MISSED') { ftAttempted++ }
      if (e.eventType === 'TURNOVER') { turnovers++ }
      if (e.eventType === 'REBOUND_OFFENSIVE') { offRebounds++ }
    }
    if (isOpp && e.eventType === 'REBOUND_DEFENSIVE') { oppDefRebounds++ }
  }

  return calculateFourFactors({
    fgMade, fgAttempted, threePtMade,
    ftMade, ftAttempted,
    turnovers, offRebounds, oppDefRebounds,
  })
}
