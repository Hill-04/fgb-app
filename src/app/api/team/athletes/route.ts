import { NextResponse } from 'next/server'

import { prisma } from '@/lib/db'
import { requireTeamSession } from '@/lib/athlete-registration-server'

export async function GET() {
  const sessionData = await requireTeamSession()
  if (!sessionData) {
    return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 })
  }

  const { teamId } = sessionData

  const [athletes, requestSummary, recentRequests] = await Promise.all([
    prisma.athlete.findMany({
      where: { teamId },
      include: {
        registrationRequests: {
          where: { status: 'APPROVED' },
          orderBy: { approvedAt: 'desc' },
          take: 1,
          select: {
            id: true,
            requestedCategoryLabel: true,
            approvedAt: true,
          },
        },
      },
      orderBy: [{ status: 'asc' }, { name: 'asc' }],
    }),
    prisma.athleteRegistrationRequest.groupBy({
      by: ['status'],
      where: { teamId },
      _count: { _all: true },
    }),
    prisma.athleteRegistrationRequest.findMany({
      where: { teamId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        status: true,
        fullName: true,
        requestedCategoryLabel: true,
        createdAt: true,
        submittedAt: true,
        rejectionReason: true,
      },
    }),
  ])

  return NextResponse.json({
    athletes: athletes.map((athlete) => ({
      ...athlete,
      categoryLabel: athlete.registrationRequests[0]?.requestedCategoryLabel || null,
      latestApprovedRequestId: athlete.registrationRequests[0]?.id || null,
    })),
    requestSummary,
    recentRequests,
  })
}
