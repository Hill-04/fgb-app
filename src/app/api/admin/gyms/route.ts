import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { ensureDatabaseSchema } from '@/lib/db-patch'

export async function GET(req: NextRequest) {
  try {
    await ensureDatabaseSchema()
    const { searchParams } = new URL(req.url)
    const teamId = searchParams.get('teamId')
    const city = searchParams.get('city')
    const gyms = await prisma.gym.findMany({
      where: {
        ...(teamId ? { teamId } : {}),
        ...(city ? { city: { contains: city } } : {}),
      },
      include: { team: { select: { id: true, name: true } } },
      orderBy: { name: 'asc' },
    })
    return NextResponse.json(gyms)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const gym = await prisma.gym.create({
      data: {
        name: body.name,
        city: body.city,
        state: body.state || 'RS',
        address: body.address || null,
        capacity: body.capacity ? Number(body.capacity) : null,
        courts: body.courts ? Number(body.courts) : 1,
        phone: body.phone || null,
        lat: body.lat ? Number(body.lat) : null,
        lng: body.lng ? Number(body.lng) : null,
        observations: body.observations || null,
        availability: body.availability || null,
        canHost: body.canHost ?? true,
        isActive: body.isActive ?? true,
        teamId: body.teamId || null,
      },
    })
    return NextResponse.json(gym, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
