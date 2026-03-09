import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      email,
      password,
      teamName,
      city,
      responsible,
      phone,
      sex,
      categories,
      gym
    } = body;

    // Validação básica
    if (!email || !password || !teamName || !city || !responsible || !phone || !sex) {
      return NextResponse.json({ error: 'Todos os campos obrigatórios devem ser preenchidos' }, { status: 400 });
    }

    if (!gym || !gym.name || !gym.address || !gym.city || !gym.capacity || !gym.availability) {
      return NextResponse.json({ error: 'Dados do ginásio incompletos' }, { status: 400 });
    }

    // Verificar se o email já existe
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ error: 'E-mail já está em uso' }, { status: 400 });
    }

    // Verificar se o nome da equipe já existe
    const existingTeam = await prisma.team.findUnique({ where: { name: teamName } });
    if (existingTeam) {
      return NextResponse.json({ error: 'Já existe uma equipe com este nome' }, { status: 400 });
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(password, 10);

    // Criar User + Team + Gym em uma transação
    const result = await prisma.$transaction(async (tx) => {
      // 1. Criar usuário
      const newUser = await tx.user.create({
        data: {
          email,
          password: hashedPassword,
          role: 'TEAM',
        }
      });

      // 2. Criar equipe vinculada ao usuário
      const newTeam = await tx.team.create({
        data: {
          name: teamName,
          city,
          state: 'RS',
          responsible,
          phone,
          sex,
          userId: newUser.id,
        }
      });

      // 3. Criar ginásio da equipe
      const newGym = await tx.gym.create({
        data: {
          name: gym.name,
          address: gym.address,
          city: gym.city,
          capacity: gym.capacity,
          availability: gym.availability,
          canHost: gym.canHost !== undefined ? gym.canHost : true,
          teamId: newTeam.id,
        }
      });

      return { user: newUser, team: newTeam, gym: newGym };
    });

    return NextResponse.json({
      success: true,
      message: 'Equipe cadastrada com sucesso!',
      teamId: result.team.id
    });

  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json({ error: 'Erro ao registrar equipe' }, { status: 500 });
  }
}
