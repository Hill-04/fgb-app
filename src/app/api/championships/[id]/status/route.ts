import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { status } = body

    const validStatuses = ['DRAFT', 'REGISTRATION_OPEN', 'SCHEDULED', 'IN_PROGRESS', 'FINISHED']
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Status inválido' }, { status: 400 })
    }

    const championship = await prisma.championship.update({
      where: { id },
      data: { status },
      include: { categories: true }
    })

    return NextResponse.json(championship)
  } catch (error) {
    console.error('Error updating championship status:', error)
    return NextResponse.json({ error: 'Erro ao atualizar status do campeonato' }, { status: 500 })
  }
}
