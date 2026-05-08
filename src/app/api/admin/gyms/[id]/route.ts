import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const gym = await prisma.gym.findUnique({
      where: { id },
      include: { team: { select: { id: true, name: true } } },
    })
    if (!gym) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(gym)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()
    const gym = await prisma.gym.update({
      where: { id },
      data: {
        ...(body.name !== undefined && { name: body.name }),
        ...(body.city !== undefined && { city: body.city }),
        ...(body.state !== undefined && { state: body.state }),
        ...(body.address !== undefined && { address: body.address || null }),
        ...(body.capacity !== undefined && { capacity: body.capacity ? Number(body.capacity) : null }),
        ...(body.courts !== undefined && { courts: Number(body.courts) }),
        ...(body.phone !== undefined && { phone: body.phone || null }),
        ...(body.lat !== undefined && { lat: body.lat ? Number(body.lat) : null }),
        ...(body.lng !== undefined && { lng: body.lng ? Number(body.lng) : null }),
        ...(body.observations !== undefined && { observations: body.observations || null }),
        ...(body.canHost !== undefined && { canHost: body.canHost }),
        ...(body.isActive !== undefined && { isActive: body.isActive }),
        ...(body.teamId !== undefined && { teamId: body.teamId || null }),
      },
    })
    return NextResponse.json(gym)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await prisma.gym.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
