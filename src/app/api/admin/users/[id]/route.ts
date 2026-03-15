import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { hash } from 'bcryptjs'

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
    const { name, email, password, isAdmin } = body

    const updateData: any = {}
    if (name) updateData.name = name.trim()
    if (email) updateData.email = email.trim()
    if (password) updateData.password = await hash(password, 10)
    if (isAdmin !== undefined) updateData.isAdmin = isAdmin

    const user = await prisma.user.update({
      where: { id },
      data: updateData
    })

    return NextResponse.json(user)
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao atualizar usuário' }, { status: 500 })
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
    const currentUserEmail = session.user?.email

    const userToDelete = await prisma.user.findUnique({ where: { id } })
    if (userToDelete?.email === currentUserEmail) {
      return NextResponse.json({ error: 'Você não pode excluir sua própria conta.' }, { status: 400 })
    }

    if (userToDelete?.email === 'brayanalexguarnieri@gmail.com') {
      return NextResponse.json({ error: 'O Administrador Supremo não pode ser excluído.' }, { status: 400 })
    }

    await prisma.user.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao excluir usuário' }, { status: 500 })
  }
}
