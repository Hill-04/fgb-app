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

    const game = await prisma.game.findUnique({
      where: { id },
      include: {
        championship: {
          select: { name: true, year: true }
        },
        category: {
          select: { name: true }
        },
        homeTeam: {
          include: {
            members: {
              where: { status: 'APPROVED' },
              include: { 
                user: { select: { name: true } } 
              },
              orderBy: [
                { role: 'asc' }, // Coaches first, then players
                { number: 'asc' }
              ]
            }
          }
        },
        awayTeam: {
          include: {
            members: {
              where: { status: 'APPROVED' },
              include: { 
                user: { select: { name: true } } 
              },
              orderBy: [
                { role: 'asc' },
                { number: 'asc' }
              ]
            }
          }
        }
      }
    })

    if (!game) {
      return NextResponse.json({ error: 'Jogo não encontrado' }, { status: 404 })
    }

    return NextResponse.json(game)
  } catch (error) {
    console.error('[Sumula API Error]', error)
    return NextResponse.json({ error: 'Erro ao buscar dados da súmula' }, { status: 500 })
  }
}
