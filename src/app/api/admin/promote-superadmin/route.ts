import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { ensureDatabaseSchema } from '@/lib/db-patch'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export const dynamic = 'force-dynamic'

const DEFAULT_REASON =
  'Bootstrap inicial de super-admin para a Federação Gaúcha de Basketball — PM-06.7, executado via MIGRATE_TOKEN'

interface PromoteRequest {
  email?: string
  reason?: string
}

export async function POST(req: NextRequest) {
  const t0 = Date.now()
  await ensureDatabaseSchema()

  // ============ AUTH (dual-path) ============
  const session = await getServerSession(authOptions)
  const sessionUserId = (session?.user as { id?: string } | undefined)?.id

  let isSessionSuperAdmin = false
  if (sessionUserId) {
    const sessionUser = await prisma.user.findUnique({
      where: { id: sessionUserId },
      select: { isFederationSuperAdmin: true }
    })
    isSessionSuperAdmin = Boolean(sessionUser?.isFederationSuperAdmin)
  }

  const migrateToken = req.headers.get('x-migrate-token')
  const expectedToken = process.env.MIGRATE_TOKEN
  const hasValidToken = !!migrateToken && !!expectedToken && migrateToken === expectedToken

  if (!isSessionSuperAdmin && !hasValidToken) {
    return NextResponse.json(
      { ok: false, error: 'Não autorizado' },
      { status: 401 }
    )
  }

  // ============ BODY VALIDATION ============
  let body: PromoteRequest
  try {
    body = await req.json()
  } catch {
    return NextResponse.json(
      { ok: false, error: 'Body inválido (JSON esperado)' },
      { status: 400 }
    )
  }

  const email = body.email?.trim().toLowerCase()
  if (!email) {
    return NextResponse.json(
      { ok: false, error: 'Campo "email" é obrigatório no body' },
      { status: 400 }
    )
  }

  const reason = body.reason?.trim() || DEFAULT_REASON

  // ============ ENCONTRAR USER ============
  const targetUser = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      isFederationSuperAdmin: true
    }
  })

  if (!targetUser) {
    return NextResponse.json(
      { ok: false, error: 'Usuário não encontrado com este email' },
      { status: 404 }
    )
  }

  // ============ IDEMPOTÊNCIA (noop sucesso) ============
  if (targetUser.isFederationSuperAdmin === true) {
    return NextResponse.json({
      ok: true,
      noop: true,
      wasAlreadySuper: true,
      userId: targetUser.id,
      email: targetUser.email,
      message: 'Usuário já era super-admin (nenhuma alteração necessária)',
      elapsedMs: Date.now() - t0
    })
  }

  // ============ PROMOÇÃO + AUDIT (transação atômica) ============
  const result = await prisma.$transaction(async (tx) => {
    const updated = await tx.user.update({
      where: { id: targetUser.id },
      data: { isFederationSuperAdmin: true },
      select: {
        id: true,
        email: true,
        isFederationSuperAdmin: true,
        updatedAt: true
      }
    })

    const auditLog = await tx.historicalDataAuditLog.create({
      data: {
        entityType: 'User',
        entityId: updated.id,
        fieldChanged: 'isFederationSuperAdmin',
        oldValue: 'false',
        newValue: 'true',
        reason,
        performedByUserId: updated.id
      },
      select: {
        id: true,
        performedAt: true
      }
    })

    return { updated, auditLog }
  })

  return NextResponse.json({
    ok: true,
    wasAlreadySuper: false,
    userId: result.updated.id,
    email: result.updated.email,
    auditLogId: result.auditLog.id,
    auditPerformedAt: result.auditLog.performedAt,
    promotedAt: result.updated.updatedAt,
    elapsedMs: Date.now() - t0
  })
}
