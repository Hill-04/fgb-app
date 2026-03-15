import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !(session.user as any).isAdmin) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { id } = await params
    const { isAdmin } = await request.json()

    // Proteção do Admin Supremo
    const supremeEmail = process.env.SUPREME_ADMIN_EMAIL
    const targetUser = await prisma.user.findUnique({ where: { id } })
    
    if (!targetUser) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }

    if (supremeEmail && targetUser.email === supremeEmail) {
      return NextResponse.json({ error: 'Não é possível alterar o cargo do Administrador Supremo' }, { status: 403 })
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { isAdmin }
    })

    return NextResponse.json({ success: true, user: updatedUser })
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao atualizar privilégios' }, { status: 500 })
  }
}
