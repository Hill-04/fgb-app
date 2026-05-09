import { prisma } from '@/lib/db'

export type BidEligibilityIssue = {
  athleteId: string
  athleteName: string
  reason: 'NO_BID' | 'BID_AFTER_GAME' | 'EXTERNAL_BLOCK'
  message: string
}

export async function checkBidEligibilityForGame(
  gameId: string,
): Promise<{ eligible: boolean; issues: BidEligibilityIssue[] }> {
  const game = await prisma.game.findUnique({
    where: { id: gameId },
    include: {
      championship: { select: { countsForBidEligibility: true, sanctioning: true } },
      rosters: { include: { players: { include: { athlete: true } } } },
    },
  })

  if (!game) return { eligible: false, issues: [] }

  if (!(game.championship as any).countsForBidEligibility) {
    return { eligible: true, issues: [] }
  }

  const issues: BidEligibilityIssue[] = []
  const gameDate = game.dateTime

  for (const roster of game.rosters) {
    for (const rp of roster.players) {
      const a = rp.athlete as any
      if (!a) continue

      if (!a.bidPublishedAt) {
        issues.push({
          athleteId: a.id,
          athleteName: a.name,
          reason: 'NO_BID',
          message: `${a.name} não tem BID publicado`,
        })
        continue
      }

      const bidDate = new Date(a.bidPublishedAt)
      if (bidDate > gameDate) {
        issues.push({
          athleteId: a.id,
          athleteName: a.name,
          reason: 'BID_AFTER_GAME',
          message: `${a.name}: BID publicado em ${bidDate.toLocaleDateString('pt-BR')} (após o jogo)`,
        })
      }
    }
  }

  const externalBlocks = await prisma.fGBRegistrationBlock.findMany({
    where: {
      championshipId: game.championshipId,
      isActive: true,
      athleteId: { in: game.rosters.flatMap((r) => r.players.map((p) => p.athleteId)) },
    },
    select: { athleteId: true, reason: true },
  }).catch(() => [])

  for (const b of externalBlocks) {
    if (!b.athleteId) continue
    const athlete = game.rosters
      .flatMap((r) => r.players)
      .find((p) => p.athleteId === b.athleteId)?.athlete as any
    if (!athlete) continue
    issues.push({
      athleteId: b.athleteId,
      athleteName: athlete.name,
      reason: 'EXTERNAL_BLOCK',
      message: `${athlete.name}: ${b.reason}`,
    })
  }

  return { eligible: issues.length === 0, issues }
}
