'use server'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/db'

const OFFICIAL_DEFS = [
  { key: 'mainReferee',  role: 'Árbitro Principal', type: 'MAIN_REFEREE' },
  { key: 'auxReferee',   role: 'Árbitro Auxiliar',  type: 'AUX_REFEREE' },
  { key: 'scorer',       role: 'Anotador',           type: 'SCORER' },
  { key: 'timekeeper',   role: 'Cronometrista',      type: 'TIMEKEEPER' },
  { key: 'commissioner', role: 'Comissário',         type: 'COMMISSIONER' },
]

export async function saveSumulaData(formData: FormData) {
  const gameId     = String(formData.get('gameId')     || '').trim()
  const homeTeamId = String(formData.get('homeTeamId') || '').trim()
  const awayTeamId = String(formData.get('awayTeamId') || '').trim()
  if (!gameId) return

  const homeScore  = Math.max(0, Number(formData.get('homeScore')  || 0))
  const awayScore  = Math.max(0, Number(formData.get('awayScore')  || 0))
  const attendRaw  = formData.get('attendance')
  const attendance = attendRaw ? Math.max(0, Number(attendRaw)) : null

  const homeCoach     = String(formData.get('homeCoach')     || '').trim()
  const homeAsstCoach = String(formData.get('homeAsstCoach') || '').trim()
  const awayCoach     = String(formData.get('awayCoach')     || '').trim()
  const awayAsstCoach = String(formData.get('awayAsstCoach') || '').trim()

  await prisma.$transaction(async (tx) => {
    await tx.game.update({
      where: { id: gameId },
      data: { homeScore, awayScore, attendance },
    })

    for (let i = 1; i <= 6; i++) {
      const h = Math.max(0, Number(formData.get(`q${i}Home`) || 0))
      const a = Math.max(0, Number(formData.get(`q${i}Away`) || 0))
      await tx.gamePeriodScore.upsert({
        where: { gameId_period: { gameId, period: i } },
        create: { gameId, period: i, homePoints: h, awayPoints: a },
        update: { homePoints: h, awayPoints: a },
      })
    }

    if (homeTeamId) {
      await tx.gameRoster.updateMany({
        where: { gameId, teamId: homeTeamId },
        data: { coachName: homeCoach || null, assistantCoachName: homeAsstCoach || null },
      })
    }
    if (awayTeamId) {
      await tx.gameRoster.updateMany({
        where: { gameId, teamId: awayTeamId },
        data: { coachName: awayCoach || null, assistantCoachName: awayAsstCoach || null },
      })
    }

    await tx.gameOfficial.deleteMany({ where: { gameId } })
    const toCreate = OFFICIAL_DEFS
      .map(def => {
        const name = String(formData.get(def.key) || '').trim()
        return name ? { gameId, officialType: def.type, name, role: def.role } : null
      })
      .filter((x): x is NonNullable<typeof x> => x !== null)

    if (toCreate.length > 0) {
      await tx.gameOfficial.createMany({ data: toCreate })
    }
  })

  revalidatePath(`/sumula/${gameId}`)
}

type StatInput = {
  athleteId: string
  teamId: string
  twoPtMade: number
  twoPtAttempted: number
  threePtMade: number
  threePtAttempted: number
  freeThrowsMade: number
  freeThrowsAttempted: number
  reboundsOffensive: number
  reboundsDefensive: number
  assists: number
  turnovers: number
  fouls: number
  steals: number
  blocks: number
  minutesPlayed: number
}

export async function savePlayerStats(gameId: string, stats: StatInput[]) {
  if (!gameId || !stats.length) return

  await prisma.$transaction(
    stats.map(s => {
      const pts =
        s.twoPtMade * 2 + s.threePtMade * 3 + s.freeThrowsMade
      return prisma.gamePlayerStatLine.upsert({
        where: { gameId_athleteId: { gameId, athleteId: s.athleteId } },
        create: {
          gameId,
          athleteId: s.athleteId,
          teamId: s.teamId,
          points: pts,
          twoPtMade: s.twoPtMade,
          twoPtAttempted: s.twoPtAttempted,
          threePtMade: s.threePtMade,
          threePtAttempted: s.threePtAttempted,
          freeThrowsMade: s.freeThrowsMade,
          freeThrowsAttempted: s.freeThrowsAttempted,
          reboundsOffensive: s.reboundsOffensive,
          reboundsDefensive: s.reboundsDefensive,
          reboundsTotal: s.reboundsOffensive + s.reboundsDefensive,
          assists: s.assists,
          turnovers: s.turnovers,
          fouls: s.fouls,
          steals: s.steals,
          blocks: s.blocks,
          minutesPlayed: s.minutesPlayed,
        },
        update: {
          points: pts,
          twoPtMade: s.twoPtMade,
          twoPtAttempted: s.twoPtAttempted,
          threePtMade: s.threePtMade,
          threePtAttempted: s.threePtAttempted,
          freeThrowsMade: s.freeThrowsMade,
          freeThrowsAttempted: s.freeThrowsAttempted,
          reboundsOffensive: s.reboundsOffensive,
          reboundsDefensive: s.reboundsDefensive,
          reboundsTotal: s.reboundsOffensive + s.reboundsDefensive,
          assists: s.assists,
          turnovers: s.turnovers,
          fouls: s.fouls,
          steals: s.steals,
          blocks: s.blocks,
          minutesPlayed: s.minutesPlayed,
        },
      })
    })
  )

  revalidatePath(`/sumula/${gameId}`)
}
