import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()
    const { approved, reason } = body

    const roster = await prisma.officialRoster.update({
      where: { id },
      data: {
        status: approved ? 'APPROVED' : 'REJECTED',
        approvedAt: approved ? new Date() : null,
        rejectionReason: approved ? null : (reason || null),
      },
    })
    return NextResponse.json(roster)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
