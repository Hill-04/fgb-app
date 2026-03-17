import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

const SIM_NAME = 'Simulação Estadual 2026 — Masculino'

export async function DELETE() {
  const session = await getServerSession(authOptions)
  if (!session || !(session.user as any).isAdmin) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  try {
    const championship = await prisma.championship.findFirst({ where: { name: SIM_NAME } })

    if (!championship) {
      return NextResponse.json({ success: true, message: 'Nenhuma simulação encontrada para limpar.' })
    }

    // Cascade delete in correct order
    await prisma.standing.deleteMany({ where: { category: { championshipId: championship.id } } })
    await prisma.game.deleteMany({ where: { championshipId: championship.id } })
    await prisma.blockedDate.deleteMany({ where: { registration: { championshipId: championship.id } } })
    await prisma.registrationCategory.deleteMany({ where: { registration: { championshipId: championship.id } } })
    await prisma.registration.deleteMany({ where: { championshipId: championship.id } })
    await prisma.championshipCategory.deleteMany({ where: { championshipId: championship.id } })
    await prisma.championship.delete({ where: { id: championship.id } })

    return NextResponse.json({ success: true, message: 'Simulação limpa com sucesso.' })
  } catch (error: any) {
    console.error('Error cleaning simulation:', error)
    return NextResponse.json({ error: error.message || 'Erro ao limpar simulação' }, { status: 500 })
  }
}
