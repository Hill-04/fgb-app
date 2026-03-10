import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    // Verificar se usuário já tem equipe ativa
    const existingMembership = await prisma.teamMembership.findFirst({
      where: {
        userId: session.user.id,
        status: 'ACTIVE'
      }
    });

    if (existingMembership) {
      return NextResponse.json(
        { error: 'Você já pertence a uma equipe. Saia da equipe atual antes de criar uma nova.' },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { name, logoUrl, hasGym, gym } = body;

    if (!name) {
      return NextResponse.json({ error: 'Nome da equipe é obrigatório' }, { status: 400 });
    }

    // Verificar se nome já existe
    const existingTeam = await prisma.team.findUnique({
      where: { name }
    });

    if (existingTeam) {
      return NextResponse.json({ error: 'Já existe uma equipe com este nome' }, { status: 400 });
    }

    // Criar equipe + membership do HEAD_COACH em transação
    const result = await prisma.$transaction(async (tx) => {
      // 1. Criar equipe
      const team = await tx.team.create({
        data: {
          name,
          logoUrl: logoUrl || null,
          city: gym?.city || null,
          state: 'RS',
          phone: null,
          sex: null
        }
      });

      // 2. Criar ginásio se fornecido
      if (hasGym && gym) {
        await tx.gym.create({
          data: {
            name: gym.name,
            address: gym.address,
            city: gym.city,
            capacity: parseInt(gym.capacity),
            availability: gym.availability,
            canHost: true,
            teamId: team.id
          }
        });
      }

      // 3. Criar membership como HEAD_COACH
      const membership = await tx.teamMembership.create({
        data: {
          userId: session.user.id,
          teamId: team.id,
          role: 'HEAD_COACH',
          status: 'ACTIVE',
          approvedAt: new Date()
        }
      });

      return { team, membership };
    });

    return NextResponse.json({
      success: true,
      team: result.team,
      membership: result.membership
    });

  } catch (error) {
    console.error('Erro ao criar equipe:', error);
    return NextResponse.json(
      { error: 'Erro ao criar equipe' },
      { status: 500 }
    );
  }
}
