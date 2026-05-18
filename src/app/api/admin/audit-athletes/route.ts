import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { ensureDatabaseSchema } from '@/lib/db-patch'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { auditAthlete, type AthleteAuditResult } from '@/lib/audit-athletes'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const t0 = Date.now()
  await ensureDatabaseSchema()

  // ============ AUTH ============
  const session = await getServerSession(authOptions)
  const isSuperAdmin =
    (session?.user as { isFederationSuperAdmin?: boolean } | undefined)?.isFederationSuperAdmin === true

  const migrateToken = req.headers.get('x-migrate-token')
  const expectedToken = process.env.MIGRATE_TOKEN
  const hasValidToken = !!migrateToken && !!expectedToken && migrateToken === expectedToken

  if (!isSuperAdmin && !hasValidToken) {
    return NextResponse.json({ ok: false, error: 'Não autorizado' }, { status: 401 })
  }

  // ============ FETCH DATA ============
  const athletes = await prisma.athlete.findMany({
    include: {
      team: {
        select: { id: true, name: true },
      },
    },
    orderBy: [{ team: { name: 'asc' } }, { name: 'asc' }],
  })

  // ============ AUDIT ============
  const results: AthleteAuditResult[] = athletes.map((a) => auditAthlete(a))

  // ============ AGREGADOS POR TEAM ============
  const byTeamMap = new Map<
    string,
    {
      teamId: string
      teamName: string
      total: number
      complete: number
      incomplete: number
      incompleteAthletes: Array<{
        athleteId: string
        registrationNumber: number | null
        missingFields: string[]
        totalProblems: number
        isMinor: boolean
        age: number | null
      }>
    }
  >()

  // Bucket pra atletas sem team
  byTeamMap.set('__no_team__', {
    teamId: '__no_team__',
    teamName: 'Sem clube vinculado',
    total: 0,
    complete: 0,
    incomplete: 0,
    incompleteAthletes: [],
  })

  for (const r of results) {
    const key = r.teamId ?? '__no_team__'
    const teamName = r.teamName ?? 'Sem clube vinculado'

    if (!byTeamMap.has(key)) {
      byTeamMap.set(key, {
        teamId: key,
        teamName,
        total: 0,
        complete: 0,
        incomplete: 0,
        incompleteAthletes: [],
      })
    }
    const bucket = byTeamMap.get(key)!
    bucket.total++
    if (r.isComplete) {
      bucket.complete++
    } else {
      bucket.incomplete++
      bucket.incompleteAthletes.push({
        athleteId: r.athleteId,
        registrationNumber: r.registrationNumber,
        missingFields: r.missingFields,
        totalProblems: r.totalProblems,
        isMinor: r.isMinor,
        age: r.age,
      })
    }
  }

  // Remove bucket "sem team" se vazio
  const noTeam = byTeamMap.get('__no_team__')
  if (noTeam && noTeam.total === 0) {
    byTeamMap.delete('__no_team__')
  }

  const byTeam = Array.from(byTeamMap.values()).sort(
    (a, b) => b.incomplete - a.incomplete // teams com mais incompletos primeiro
  )

  // ============ AGREGADOS GERAIS ============
  const total = results.length
  const complete = results.filter((r) => r.isComplete).length
  const incomplete = total - complete

  // Contagem por tipo de problema
  const missingByType: Record<string, number> = {}
  for (const r of results) {
    for (const m of r.missingFields) {
      missingByType[m] = (missingByType[m] || 0) + 1
    }
  }

  return NextResponse.json({
    ok: true,
    elapsedMs: Date.now() - t0,
    summary: {
      total,
      complete,
      incomplete,
      completePct: total > 0 ? Math.round((complete / total) * 1000) / 10 : 0,
    },
    missingByType,
    byTeam,
    timestamp: new Date().toISOString(),
  })
}
