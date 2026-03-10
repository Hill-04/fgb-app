import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';

    const teams = await prisma.team.findMany({
      where: {
        name: {
          contains: search,
          mode: 'insensitive'
        }
      },
      select: {
        id: true,
        name: true,
        logoUrl: true,
        city: true,
        state: true,
        _count: {
          select: {
            members: {
              where: {
                status: 'ACTIVE'
              }
            }
          }
        }
      },
      orderBy: {
        name: 'asc'
      },
      take: 50
    });

    return NextResponse.json({ teams });

  } catch (error) {
    console.error('Erro ao listar equipes:', error);
    return NextResponse.json(
      { error: 'Erro ao listar equipes' },
      { status: 500 }
    );
  }
}
