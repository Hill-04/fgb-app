import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, password, defaultRole } = body;

    // Validação básica
    if (!name || !email || !password || !defaultRole) {
      return NextResponse.json({ error: 'Todos os campos são obrigatórios' }, { status: 400 });
    }

    // Verificar se o email já existe
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ error: 'E-mail já está em uso' }, { status: 400 });
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(password, 10);

    // Criar apenas o usuário (não mais Team/Gym)
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        defaultRole,
        isAdmin: false
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Conta criada com sucesso!',
      userId: newUser.id
    });

  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json({ error: 'Erro ao registrar usuário' }, { status: 500 });
  }
}
