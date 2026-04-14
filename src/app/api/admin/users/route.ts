import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !(session.user as any).isAdmin) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const rawUsers = await prisma.user.findMany({
      include: {
        memberships: {
          include: { team: true },
          where: { status: { in: ['ACTIVE', 'PENDING'] } },
          orderBy: { requestedAt: 'desc' },
          take: 1,
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    // Normaliza para manter compatibilidade com a UI (campo "membership" singular)
    const users = rawUsers.map(u => ({
      ...u,
      membership: u.memberships?.[0] ?? null,
      memberships: undefined,
    }))

    return NextResponse.json(users)
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao buscar usuários' }, { status: 500 })
  }
}
import { hash } from 'bcryptjs'

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session || !(session.user as any).isAdmin) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { name, email, password, isAdmin } = body

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Campos obrigatórios ausentes' }, { status: 400 })
    }

    const existingUser = await prisma.user.findUnique({ where: { email } })
    if (existingUser) {
      return NextResponse.json({ error: 'Email já cadastrado' }, { status: 400 })
    }

    const hashedPassword = await hash(password, 10)
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        isAdmin: !!isAdmin
      }
    })

    return NextResponse.json(user)
  } catch (error) {
    console.error('Error creating user:', error)
    return NextResponse.json({ error: 'Erro ao criar usuário' }, { status: 500 })
  }
}
