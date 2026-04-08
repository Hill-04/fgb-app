import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const game = await prisma.game.findUnique({
      where: { id },
      include: {
        homeTeam: {
          include: {
            members: {
              where: { status: 'APPROVED', role: 'PLAYER' },
              include: { user: { select: { id: true, name: true } } }
            }
          }
        },
        awayTeam: {
          include: {
            members: {
              where: { status: 'APPROVED', role: 'PLAYER' },
              include: { user: { select: { id: true, name: true } } }
            }
          }
        }
      }
    })

    if (!game) {
      return NextResponse.json({ error: 'Jogo não encontrado' }, { status: 404 })
    }

    return NextResponse.json({
      homeTeam: {
        id: game.homeTeam.id,
        name: game.homeTeam.name,
        players: game.homeTeam.members.map(m => ({
          id: m.userId,
          name: m.user.name,
          number: m.number
        }))
      },
      awayTeam: {
        id: game.awayTeam.id,
        name: game.awayTeam.name,
        players: game.awayTeam.members.map(m => ({
          id: m.userId,
          name: m.user.name,
          number: m.number
        }))
      }
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
