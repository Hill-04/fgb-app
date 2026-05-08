import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const athleteIds: string[] = body.athleteIds || []
    if (!athleteIds.length) return NextResponse.json({ error: 'athleteIds required' }, { status: 400 })

    const now = new Date()
    const errors: string[] = []
    let activated = 0

    for (const id of athleteIds) {
      try {
        await prisma.athlete.update({
          where: { id },
          data: { situation: 'ACTIVE', activatedAt: now },
        })
        activated++
      } catch (e: any) {
        errors.push(`${id}: ${e.message}`)
      }
    }

    return NextResponse.json({ activated, errors })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
