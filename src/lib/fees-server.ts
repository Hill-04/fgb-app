import { Prisma, PrismaClient } from '@prisma/client'

import { prisma } from '@/lib/db'
import { roundCurrency, summarizeRegistrationFees } from '@/lib/fees'

type PrismaLike = PrismaClient | Prisma.TransactionClient

export async function syncTeamTotalFeesOwed(teamId: string, db: PrismaLike = prisma) {
  const registrations = await db.registration.findMany({
    where: { teamId },
    select: {
      fees: {
        select: {
          totalValue: true,
          status: true,
        },
      },
    },
  })

  const totalFeesOwed = roundCurrency(
    registrations
      .flatMap((registration) => registration.fees)
      .filter((fee) => fee.status === 'PENDING')
      .reduce((sum, fee) => sum + fee.totalValue, 0)
  )

  await db.team.update({
    where: { id: teamId },
    data: { totalFeesOwed },
  })

  return totalFeesOwed
}

export async function syncRegistrationTeamTotalFeesOwed(registrationId: string, db: PrismaLike = prisma) {
  const registration = await db.registration.findUnique({
    where: { id: registrationId },
    select: { teamId: true },
  })

  if (!registration?.teamId) {
    return 0
  }

  return syncTeamTotalFeesOwed(registration.teamId, db)
}

export async function getRegistrationFeesSnapshot(registrationId: string, db: PrismaLike = prisma) {
  const registration = await db.registration.findUnique({
    where: { id: registrationId },
    include: {
      team: {
        select: {
          id: true,
          name: true,
          totalFeesOwed: true,
        },
      },
      championship: {
        select: {
          id: true,
          name: true,
        },
      },
      fees: {
        orderBy: [{ createdAt: 'asc' }, { feeLabel: 'asc' }],
      },
    },
  })

  if (!registration) {
    return null
  }

  const summary = summarizeRegistrationFees(registration.fees)

  return {
    registration: {
      id: registration.id,
      status: registration.status,
      registeredAt: registration.registeredAt,
      team: registration.team,
      championship: registration.championship,
    },
    fees: registration.fees,
    summary,
  }
}
