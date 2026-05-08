import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const roster = await prisma.officialRoster.update({
      where: { id },
      data: { status: 'SUBMITTED', submittedAt: new Date() },
    })
    return NextResponse.json(roster)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
