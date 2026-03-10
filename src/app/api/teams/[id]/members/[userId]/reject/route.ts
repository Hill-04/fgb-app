import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string; userId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const { id: teamId, userId } = params;

    // Verificar se o usuário logado é HEAD_COACH ou ADMIN da equipe
    const requesterMembership = await prisma.teamMembership.findFirst({
      where: {
        userId: session.user.id,
        teamId: teamId,
        status: 'ACTIVE',
        role: {
          in: ['HEAD_COACH', 'ADMIN']
        }
      }
    });

    if (!requesterMembership) {
      return NextResponse.json(
        { error: 'Apenas HEAD_COACH ou ADMIN podem recusar membros' },
        { status: 403 }
      );
    }

    // Buscar a solicitação pendente
    const membership = await prisma.teamMembership.findFirst({
      where: {
        userId: userId,
        teamId: teamId,
        status: 'PENDING'
      }
    });

    if (!membership) {
      return NextResponse.json(
        { error: 'Solicitação não encontrada' },
        { status: 404 }
      );
    }

    // Recusar solicitação
    const updatedMembership = await prisma.teamMembership.update({
      where: { id: membership.id },
      data: {
        status: 'REJECTED'
      }
    });

    return NextResponse.json({
      success: true,
      membership: updatedMembership
    });

  } catch (error) {
    console.error('Erro ao recusar membro:', error);
    return NextResponse.json(
      { error: 'Erro ao recusar membro' },
      { status: 500 }
    );
  }
}
