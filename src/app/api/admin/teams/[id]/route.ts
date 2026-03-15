import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session || !(session.user as any).isAdmin) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  try {
    const { id } = await params
    const team = await prisma.team.findUnique({
      where: { id },
      include: {
        gym: true,
        members: {
          include: { user: { select: { name: true, email: true } } }
        }
      }
    })
    
    if (!team) return NextResponse.json({ error: 'Equipe não encontrada' }, { status: 404 })
    return NextResponse.json(team)
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao buscar equipe' }, { status: 500 })
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session || !(session.user as any).isAdmin) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  try {
    const { id } = await params
    const body = await request.json()
    const { name, logoUrl, city, state, phone, sex } = body

    const team = await prisma.team.update({
      where: { id },
      data: {
        name: name?.trim(),
        logoUrl,
        city,
        state,
        phone,
        sex
      }
    })

    return NextResponse.json(team)
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao atualizar equipe' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session || !(session.user as any).isAdmin) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  try {
    const { id } = await params

    // Check pre-requirements: Can't delete if has registrations or games
    const registrations = await prisma.registration.count({ where: { teamId: id } })
    if (registrations > 0) {
      return NextResponse.json({ error: 'Não é possível excluir uma equipe com inscrições ativas.' }, { status: 400 })
    }

    await prisma.$transaction(async (tx) => {
      // Delete memberships
      await tx.teamMembership.deleteMany({ where: { teamId: id } })
      // Delete gym
      await tx.gym.deleteMany({ where: { teamId: id } })
      // Delete team
      await tx.team.delete({ where: { id } })
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao excluir equipe' }, { status: 500 })
  }
}
