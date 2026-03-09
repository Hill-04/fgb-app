import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { firstName, lastName, email, password, teamName, city, gymName } = body;

    // TODO: In a real app, use NextAuth and bcrypt to hash the password
    // Also validate input safely with zod

    // For the MVP, we assume a single Tenant (FGB)
    // Let's create one if it doesn't exist just in case
    let tenant = await prisma.tenant.findFirst();
    if (!tenant) {
      tenant = await prisma.tenant.create({
        data: {
          name: 'Federação Gaúcha de Basquete',
          domain: 'fgb',
        }
      });
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ error: 'E-mail já está em uso' }, { status: 400 });
    }

    // Hash the password before storing
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create the Team and the User in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const newTeam = await tx.team.create({
        data: {
          name: teamName,
          city: city,
          contactName: `${firstName} ${lastName}`,
          contactEmail: email,
          tenantId: tenant.id,
          gymName: gymName || 'Não informado',
        }
      });

      const newUser = await tx.user.create({
        data: {
          name: `${firstName} ${lastName}`,
          email: email,
          password: hashedPassword,
          role: 'TEAM',
          tenantId: tenant.id,
          teamId: newTeam.id
        }
      });

      return { team: newTeam, user: newUser };
    });

    return NextResponse.json({ success: true, teamId: result.team.id });

  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json({ error: 'Erro ao registrar equipe' }, { status: 500 });
  }
}
