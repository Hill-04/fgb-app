import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { ensureDatabaseSchema } from '@/lib/db-patch'
import bcrypt from 'bcryptjs'
import { cnpj as cnpjValidator } from 'cpf-cnpj-validator'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

const rateLimitMap = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT_MAX = 5
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(ip)

  if (!entry || entry.resetAt < now) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS })
    return true
  }

  if (entry.count >= RATE_LIMIT_MAX) return false

  entry.count++
  return true
}

function generatePassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
  let result = ''
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

export async function POST(req: NextRequest) {
  await ensureDatabaseSchema()

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown'
  if (!checkRateLimit(ip)) {
    return NextResponse.json({ ok: false, error: 'Muitas tentativas. Tente novamente em 1 hora.' }, { status: 429 })
  }

  let body: {
    name?: string
    cnpj?: string
    city?: string
    state?: string
    responsibleName?: string
    responsibleEmail?: string
    responsiblePhone?: string
  }

  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ ok: false, error: 'Body inválido' }, { status: 400 })
  }

  const { name, cnpj, city, state, responsibleName, responsibleEmail, responsiblePhone } = body

  if (
    !name?.trim() ||
    !cnpj?.trim() ||
    !city?.trim() ||
    !state?.trim() ||
    !responsibleName?.trim() ||
    !responsibleEmail?.trim() ||
    !responsiblePhone?.trim()
  ) {
    return NextResponse.json({ ok: false, error: 'Campos obrigatórios não preenchidos' }, { status: 400 })
  }

  const email = responsibleEmail.trim().toLowerCase()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ ok: false, error: 'Email inválido' }, { status: 400 })
  }

  const cnpjRaw = cnpj.trim().toUpperCase()
  if (!cnpjValidator.isValid(cnpjRaw)) {
    return NextResponse.json({ ok: false, error: 'CNPJ inválido' }, { status: 400 })
  }
  const cnpjNormalized = cnpjValidator.strip(cnpjRaw).toUpperCase()

  const normalizedName = name.trim()

  const existingTeam = await prisma.team.findUnique({ where: { name: normalizedName } })
  if (existingTeam) {
    return NextResponse.json({ ok: false, error: 'Nome de time já cadastrado' }, { status: 409 })
  }

  const existingUser = await prisma.user.findUnique({ where: { email } })
  if (existingUser) {
    return NextResponse.json({ ok: false, error: 'Email já cadastrado' }, { status: 409 })
  }

  const existingCnpj = await prisma.team.findFirst({ where: { cnpj: cnpjNormalized } })
  if (existingCnpj) {
    return NextResponse.json({ ok: false, error: 'CNPJ já cadastrado' }, { status: 409 })
  }

  const password = generatePassword()
  const passwordHash = await bcrypt.hash(password, 10)

  try {
    const result = await prisma.$transaction(async (tx) => {
      const team = await tx.team.create({
        data: {
          name: normalizedName,
          cnpj: cnpjNormalized,
          city: city.trim(),
          state: state.trim().toUpperCase(),
          institutionalEmail: email,
          isFederated: false,
          verificationStatus: 'PENDING_VERIFICATION',
        } as any,
        select: { id: true },
      })

      const user = await tx.user.create({
        data: {
          name: responsibleName.trim(),
          email,
          password: passwordHash,
          defaultRole: 'ADMIN',
          isAdmin: false,
          isFederationSuperAdmin: false,
        },
        select: { id: true },
      })

      await tx.teamMembership.create({
        data: {
          userId: user.id,
          teamId: team.id,
          role: 'ADMIN',
          status: 'ACTIVE',
        },
      })

      return { teamId: team.id, userId: user.id }
    })

    return NextResponse.json({
      ok: true,
      teamId: result.teamId,
      userId: result.userId,
      message:
        'Cadastro recebido. Aguarde aprovação da federação. As credenciais serão enviadas por email após aprovação.',
      _tempPassword: password,
    })
  } catch {
    return NextResponse.json({ ok: false, error: 'Erro ao criar time guest' }, { status: 500 })
  }
}
