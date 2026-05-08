import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const athlete = await prisma.athlete.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        registrationNumber: true,
        situation: true,
        photoUrl: true,
        position: true,
        team: { select: { name: true } },
        registrationRequests: {
          where: { status: 'APPROVED' },
          select: { requestedCategoryLabel: true },
          orderBy: { approvedAt: 'desc' },
          take: 1,
        },
        cards: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { cardNumber: true, qrToken: true, status: true },
        },
      },
    })
    if (!athlete) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    return NextResponse.json({
      id: athlete.id,
      name: athlete.name,
      registrationNumber: athlete.registrationNumber,
      teamName: athlete.team?.name || '',
      categoryName: athlete.registrationRequests[0]?.requestedCategoryLabel || '',
      situation: athlete.situation,
      photoUrl: athlete.photoUrl || null,
      position: athlete.position || null,
      season: 2026,
      validUntil: '31/12/2026',
      card: athlete.cards[0] || null,
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
