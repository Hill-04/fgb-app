import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const championship = await prisma.championship.findUnique({
      where: { id },
      include: {
        categories: {
          include: {
            _count: { select: { registrations: true } }
          }
        }
      }
    })

    if (!championship) {
      return NextResponse.json({ error: 'Campeonato não encontrado' }, { status: 404 })
    }

    return NextResponse.json(championship)
  } catch (error) {
    console.error('Error fetching championship:', error)
    return NextResponse.json({ error: 'Erro ao buscar campeonato' }, { status: 500 })
  }
}
