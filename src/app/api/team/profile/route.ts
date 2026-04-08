import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'TEAM') {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const teamId = (session.user as any).teamId
  if (!teamId) {
    return NextResponse.json({ error: 'Equipe não encontrada' }, { status: 404 })
  }

  try {
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: { gym: true },
    })
    if (!team) return NextResponse.json({ error: 'Equipe não encontrada' }, { status: 404 })
    return NextResponse.json(team)
  } catch {
    return NextResponse.json({ error: 'Erro ao buscar dados' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'TEAM') {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const teamId = (session.user as any).teamId
  if (!teamId) {
    return NextResponse.json({ error: 'Equipe não encontrada' }, { status: 404 })
  }

  try {
    const body = await request.json()
    const { name, logoUrl, city, state, phone, sex, gym } = body

    const team = await prisma.team.update({
      where: { id: teamId },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(logoUrl !== undefined && { logoUrl }),
        ...(city !== undefined && { city }),
        ...(state !== undefined && { state }),
        ...(phone !== undefined && { phone }),
        ...(sex !== undefined && { sex }),
        ...(gym && {
          gym: {
            upsert: {
              create: {
                name: gym.name,
                address: gym.address,
                city: gym.city,
                capacity: Number(gym.capacity) || 0,
                availability: gym.availability || '',
                canHost: gym.canHost ?? true,
              },
              update: {
                name: gym.name,
                address: gym.address,
                city: gym.city,
                capacity: Number(gym.capacity) || 0,
                availability: gym.availability || '',
                canHost: gym.canHost ?? true,
              },
            },
          },
        }),
      },
      include: { gym: true },
    })

    return NextResponse.json(team)
  } catch (error: any) {
    if (error?.code === 'P2002') {
      return NextResponse.json({ error: 'Este nome de equipe já está em uso.' }, { status: 409 })
    }
    return NextResponse.json({ error: 'Erro ao atualizar perfil' }, { status: 500 })
  }
}
