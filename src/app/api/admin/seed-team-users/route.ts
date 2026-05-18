import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { ensureDatabaseSchema } from '@/lib/db-patch'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import bcrypt from 'bcryptjs'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

const PROTECTED_EMAILS = [
  'brayanalexguarnieri@gmail.com',
  'teste@bgcompany.dev'
]

const INITIAL_PASSWORD = 'mudar123'

interface SeedRequest {
  dryRun?: boolean
}

function sanitizeEmail(raw: string): string {
  const trimmed = raw.trim().toLowerCase()
  const atIdx = trimmed.indexOf('@')
  if (atIdx < 0) return trimmed
  const local = trimmed.slice(0, atIdx)
  const domain = trimmed.slice(atIdx + 1)
  const cleanDomain = domain
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
  return `${local}@${cleanDomain}`
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export async function POST(req: NextRequest) {
  const t0 = Date.now()
  await ensureDatabaseSchema()

  // ============ AUTH ============
  const session = await getServerSession(authOptions)
  const sessionUserId = (session?.user as { id?: string } | undefined)?.id
  let isSuperAdmin = false
  if (sessionUserId) {
    const u = await prisma.user.findUnique({
      where: { id: sessionUserId },
      select: { isFederationSuperAdmin: true }
    })
    isSuperAdmin = Boolean(u?.isFederationSuperAdmin)
  }

  const migrateToken = req.headers.get('x-migrate-token')
  const expectedToken = process.env.MIGRATE_TOKEN
  const hasValidToken = !!migrateToken && !!expectedToken && migrateToken === expectedToken

  if (!isSuperAdmin && !hasValidToken) {
    return NextResponse.json({ ok: false, error: 'Não autorizado' }, { status: 401 })
  }

  // ============ BODY ============
  let body: SeedRequest = {}
  try {
    body = await req.json()
  } catch {
    // body opcional
  }
  const dryRun = body.dryRun === true

  // ============ FETCH TEAMS ============
  const teams = await prisma.team.findMany({
    where: {
      institutionalEmail: { not: null }
    },
    select: {
      id: true,
      name: true,
      institutionalEmail: true
    },
    orderBy: { name: 'asc' }
  })

  // ============ HASH SENHA (1x só) ============
  const passwordHash = await bcrypt.hash(INITIAL_PASSWORD, 10)

  // ============ PROCESS EACH TEAM ============
  type Result = {
    teamId: string
    teamName: string
    emailOriginal: string | null
    emailSanitized: string | null
    action: 'created' | 'skipped_already_exists' | 'skipped_invalid_email' | 'skipped_protected_email' | 'skipped_no_email' | 'error_dryrun_only' | 'error'
    userId?: string
    membershipId?: string
    error?: string
  }

  const results: Result[] = []

  for (const team of teams) {
    const original = team.institutionalEmail

    if (!original || original.trim() === '') {
      results.push({
        teamId: team.id,
        teamName: team.name,
        emailOriginal: null,
        emailSanitized: null,
        action: 'skipped_no_email'
      })
      continue
    }

    const sanitized = sanitizeEmail(original)

    if (!isValidEmail(sanitized)) {
      results.push({
        teamId: team.id,
        teamName: team.name,
        emailOriginal: original,
        emailSanitized: sanitized,
        action: 'skipped_invalid_email'
      })
      continue
    }

    if (PROTECTED_EMAILS.includes(sanitized)) {
      results.push({
        teamId: team.id,
        teamName: team.name,
        emailOriginal: original,
        emailSanitized: sanitized,
        action: 'skipped_protected_email'
      })
      continue
    }

    // Checa se user já existe
    const existing = await prisma.user.findUnique({
      where: { email: sanitized },
      select: { id: true }
    })

    if (existing) {
      // Verifica se já tem TeamMembership pra esse team
      const membership = await prisma.teamMembership.findFirst({
        where: { userId: existing.id, teamId: team.id },
        select: { id: true }
      })

      if (membership) {
        results.push({
          teamId: team.id,
          teamName: team.name,
          emailOriginal: original,
          emailSanitized: sanitized,
          action: 'skipped_already_exists',
          userId: existing.id,
          membershipId: membership.id
        })
        continue
      }

      // User existe mas sem membership pra esse team → cria só membership
      if (dryRun) {
        results.push({
          teamId: team.id,
          teamName: team.name,
          emailOriginal: original,
          emailSanitized: sanitized,
          action: 'error_dryrun_only',
          userId: existing.id
        })
        continue
      }

      try {
        const m = await prisma.teamMembership.create({
          data: {
            userId: existing.id,
            teamId: team.id,
            role: 'ADMIN',
            status: 'ACTIVE'
          },
          select: { id: true }
        })

        results.push({
          teamId: team.id,
          teamName: team.name,
          emailOriginal: original,
          emailSanitized: sanitized,
          action: 'created',
          userId: existing.id,
          membershipId: m.id
        })
      } catch (err) {
        results.push({
          teamId: team.id,
          teamName: team.name,
          emailOriginal: original,
          emailSanitized: sanitized,
          action: 'error',
          error: err instanceof Error ? err.message : String(err)
        })
      }
      continue
    }

    // User não existe → cria User + TeamMembership em transação
    if (dryRun) {
      results.push({
        teamId: team.id,
        teamName: team.name,
        emailOriginal: original,
        emailSanitized: sanitized,
        action: 'error_dryrun_only'
      })
      continue
    }

    try {
      const created = await prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            name: team.name,
            email: sanitized,
            password: passwordHash,
            defaultRole: 'ADMIN',
            isAdmin: false,
            isFederationSuperAdmin: false
          },
          select: { id: true }
        })

        const membership = await tx.teamMembership.create({
          data: {
            userId: user.id,
            teamId: team.id,
            role: 'ADMIN',
            status: 'ACTIVE'
          },
          select: { id: true }
        })

        return { user, membership }
      })

      results.push({
        teamId: team.id,
        teamName: team.name,
        emailOriginal: original,
        emailSanitized: sanitized,
        action: 'created',
        userId: created.user.id,
        membershipId: created.membership.id
      })
    } catch (err) {
      results.push({
        teamId: team.id,
        teamName: team.name,
        emailOriginal: original,
        emailSanitized: sanitized,
        action: 'error',
        error: err instanceof Error ? err.message : String(err)
      })
    }
  }

  // ============ SUMMARY ============
  const summary = {
    totalTeams: teams.length,
    created: results.filter(r => r.action === 'created').length,
    skippedAlreadyExists: results.filter(r => r.action === 'skipped_already_exists').length,
    skippedInvalidEmail: results.filter(r => r.action === 'skipped_invalid_email').length,
    skippedProtectedEmail: results.filter(r => r.action === 'skipped_protected_email').length,
    skippedNoEmail: results.filter(r => r.action === 'skipped_no_email').length,
    errors: results.filter(r => r.action === 'error').length,
    dryRunOnly: results.filter(r => r.action === 'error_dryrun_only').length
  }

  // Lista de emails sanitized != original (pra Brayan saber)
  const sanitizationDiffs = results
    .filter(r => r.emailOriginal && r.emailSanitized && r.emailOriginal !== r.emailSanitized)
    .map(r => ({
      teamName: r.teamName,
      original: r.emailOriginal,
      sanitized: r.emailSanitized
    }))

  return NextResponse.json({
    ok: true,
    dryRun,
    elapsedMs: Date.now() - t0,
    summary,
    sanitizationDiffs,
    results,
    timestamp: new Date().toISOString()
  })
}
