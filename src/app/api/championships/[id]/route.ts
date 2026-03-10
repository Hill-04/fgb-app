import { NextResponse } from 'next/server'
import prisma from '@/lib/db'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const championship = await prisma.championship.findUnique({
      where: { id },
      include: {
        categories: true,
        _count: {
          select: { registrations: true }
        }
      }
    })

    if (!championship) {
      return NextResponse.json({ error: 'Campeonato nao encontrado' }, { status: 404 })
    }

    return NextResponse.json(championship)
  } catch (error) {
    console.error('Error fetching championship:', error)
    return NextResponse.json({ error: 'Erro ao buscar campeonato' }, { status: 500 })
  }
}
