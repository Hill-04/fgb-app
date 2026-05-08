import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const teamId = searchParams.get('teamId')
    const status = searchParams.get('status')
    const season = searchParams.get('season')
    const fees = await prisma.teamFee.findMany({
      where: {
        ...(teamId ? { teamId } : {}),
        ...(status ? { status } : {}),
        ...(season ? { season: Number(season) } : {}),
      },
      include: { team: { select: { id: true, name: true } } },
      orderBy: { dueDate: 'asc' },
    })
    return NextResponse.json(fees)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const fee = await prisma.teamFee.create({
      data: {
        teamId: body.teamId,
        type: body.type,
        description: body.description,
        amount: Number(body.amount),
        dueDate: new Date(body.dueDate),
        status: body.status || 'PENDING',
        season: body.season ? Number(body.season) : 2026,
        notes: body.notes || null,
      },
    })
    return NextResponse.json(fee, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
