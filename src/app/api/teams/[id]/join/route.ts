import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const teamId = params.id;

    // Verificar se a equipe existe
    const team = await prisma.team.findUnique({
      where: { id: teamId }
    });

    if (!team) {
      return NextResponse.json({ error: 'Equipe não encontrada' }, { status: 404 });
    }

    // Verificar se usuário já tem membership ativa
    const existingActiveMembership = await prisma.teamMembership.findFirst({
      where: {
        userId: session.user.id,
        status: 'ACTIVE'
      }
    });

    if (existingActiveMembership) {
      return NextResponse.json(
        { error: 'Você já pertence a uma equipe. Saia da equipe atual antes de solicitar entrada em outra.' },
        { status: 400 }
      );
    }

    // Verificar se já existe solicitação pendente para esta equipe
    const existingPendingRequest = await prisma.teamMembership.findFirst({
      where: {
        userId: session.user.id,
        teamId: teamId,
        status: 'PENDING'
      }
    });

    if (existingPendingRequest) {
      return NextResponse.json(
        { error: 'Você já possui uma solicitação pendente para esta equipe' },
        { status: 400 }
      );
    }

    // Criar solicitação de entrada
    const membership = await prisma.teamMembership.create({
      data: {
        userId: session.user.id,
        teamId: teamId,
        role: 'AUXILIAR', // Papel padrão, pode ser alterado pelo HEAD_COACH na aprovação
        status: 'PENDING'
      },
      include: {
        team: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      membership
    });

  } catch (error) {
    console.error('Erro ao solicitar entrada na equipe:', error);
    return NextResponse.json(
      { error: 'Erro ao solicitar entrada na equipe' },
      { status: 500 }
    );
  }
}
