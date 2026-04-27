import { NextResponse } from 'next/server'

import { prisma } from '@/lib/db'
import { requireAdminSession } from '@/lib/athlete-registration-server'

export async function GET() {
  const session = await requireAdminSession()
  if (!session) {
    return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })
  }

  const [athletes, athleteStatusSummary, requestStatusSummary, pendingRequests] = await Promise.all([
    prisma.athlete.findMany({
      include: {
        team: { select: { id: true, name: true } },
        registrationRequests: {
          where: { status: 'APPROVED' },
          orderBy: { approvedAt: 'desc' },
          take: 1,
          select: { id: true, requestedCategoryLabel: true, approvedAt: true },
        },
      },
      orderBy: [{ status: 'asc' }, { name: 'asc' }],
      take: 50,
    }),
    prisma.athlete.groupBy({
      by: ['status'],
      _count: { _all: true },
    }),
    prisma.athleteRegistrationRequest.groupBy({
      by: ['status'],
      _count: { _all: true },
    }),
    prisma.athleteRegistrationRequest.findMany({
      where: { status: { in: ['SUBMITTED', 'UNDER_REVIEW', 'CBB_CHECK_PENDING', 'CBB_CHECKED'] } },
      include: {
        team: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    }),
  ])

  return NextResponse.json({
    athletes: athletes.map((athlete) => ({
      ...athlete,
      categoryLabel: athlete.registrationRequests[0]?.requestedCategoryLabel || null,
    })),
    athleteStatusSummary,
    requestStatusSummary,
    pendingRequests,
  })
}
