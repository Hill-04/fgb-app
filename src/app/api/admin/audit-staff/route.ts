import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { ensureDatabaseSchema } from '@/lib/db-patch'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { auditCoachStaff, type CoachStaffAuditResult } from '@/lib/audit-coachstaff'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

// Helper: normalize string for matching (CSV vs DB)
function normalizeForMatch(s: string | null | undefined): string {
  if (!s) return ''
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')  // remove acentos
    .replace(/[^a-z0-9]/g, '')         // só alphanumeric
    .trim()
}

// Helper: extract CPF digits only
function cpfDigits(s: string | null | undefined): string {
  if (!s) return ''
  return s.replace(/\D/g, '')
}

interface CsvRow {
  rowIndex: number
  rawData: Record<string, string>
  name: string
  cpf: string
  role: string
  teamName: string
}

// Parse CSV (Comissão_Técnica.csv) — latin-1, separator can be ; or ,
function parseCSV(content: string): CsvRow[] {
  const firstLine = content.split('\n')[0] ?? ''
  const sep = firstLine.includes(';') ? ';' : ','

  const lines = content.split(/\r?\n/).filter(l => l.trim().length > 0)
  if (lines.length === 0) return []

  const headers = lines[0].split(sep).map(h => h.trim())
  const rows: CsvRow[] = []

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(sep).map(c => c.trim())
    if (cols.every(c => c === '')) continue

    const rawData: Record<string, string> = {}
    headers.forEach((h, idx) => {
      rawData[h] = cols[idx] ?? ''
    })

    const findField = (...candidates: string[]): string => {
      for (const candidate of candidates) {
        const key = headers.find(h =>
          normalizeForMatch(h) === normalizeForMatch(candidate)
        )
        if (key) return rawData[key] ?? ''
      }
      return ''
    }

    rows.push({
      rowIndex: i + 1,
      rawData,
      name: findField('Nome', 'Nome Completo', 'Nome completo'),
      cpf: findField('CPF', 'Cpf'),
      role: findField('Cargo', 'Função', 'Funcao', 'Role'),
      teamName: findField('Clube', 'Equipe', 'Time', 'Team')
    })
  }

  return rows
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

  // ============ MULTIPART PARSE ============
  let csvRows: CsvRow[] = []
  let csvProvided = false

  try {
    const formData = await req.formData()
    const file = formData.get('csv') as File | null

    if (file && file.size > 0) {
      csvProvided = true
      const buffer = Buffer.from(await file.arrayBuffer())
      let text: string
      try {
        text = buffer.toString('latin1')
        if (text.includes('Ã©') || text.includes('Ã£')) {
          text = buffer.toString('utf-8')
        }
      } catch {
        text = buffer.toString('utf-8')
      }
      csvRows = parseCSV(text)
    }
  } catch {
    // No multipart or no file = OK, só faz audit sem reconciliação
  }

  // ============ AUDIT (DB) ============
  const staffs = await prisma.coachStaff.findMany({
    include: {
      team: {
        select: { id: true, name: true }
      }
    },
    orderBy: [
      { team: { name: 'asc' } },
      { name: 'asc' }
    ]
  })

  const auditResults: CoachStaffAuditResult[] = staffs.map(s => auditCoachStaff(s))

  // Agregados por team
  const byTeamMap = new Map<string, {
    teamId: string
    teamName: string
    total: number
    complete: number
    incomplete: number
    technical: number
    nonTechnical: number
    incompleteStaffs: Array<{
      staffId: string
      role: string
      isTechnical: boolean
      missingFields: string[]
      totalProblems: number
    }>
  }>()

  for (const r of auditResults) {
    if (!byTeamMap.has(r.teamId)) {
      byTeamMap.set(r.teamId, {
        teamId: r.teamId,
        teamName: r.teamName ?? 'Sem clube',
        total: 0,
        complete: 0,
        incomplete: 0,
        technical: 0,
        nonTechnical: 0,
        incompleteStaffs: []
      })
    }
    const bucket = byTeamMap.get(r.teamId)!
    bucket.total++
    if (r.isComplete) bucket.complete++
    else {
      bucket.incomplete++
      bucket.incompleteStaffs.push({
        staffId: r.staffId,
        role: r.role,
        isTechnical: r.isTechnical,
        missingFields: r.missingFields,
        totalProblems: r.totalProblems
      })
    }
    if (r.isTechnical) bucket.technical++
    else bucket.nonTechnical++
  }

  const byTeam = Array.from(byTeamMap.values()).sort((a, b) => b.incomplete - a.incomplete)

  // Contagem por tipo de problema
  const missingByType: Record<string, number> = {}
  for (const r of auditResults) {
    for (const m of r.missingFields) {
      missingByType[m] = (missingByType[m] || 0) + 1
    }
  }

  const summary = {
    total: auditResults.length,
    complete: auditResults.filter(r => r.isComplete).length,
    incomplete: auditResults.filter(r => !r.isComplete).length,
    technical: auditResults.filter(r => r.isTechnical).length,
    nonTechnical: auditResults.filter(r => !r.isTechnical).length
  }

  // ============ RECONCILIAÇÃO CSV vs DB ============
  const reconciliation: {
    csvProvided: boolean
    csvRows: number
    dbRows: number
    delta: number
    matchedCount: number
    csvMissingInDb: Array<{
      rowIndex: number
      name: string
      cpf: string
      role: string
      teamName: string
      matchReason: string
    }>
    dbMissingInCsv: Array<{
      staffId: string
      teamName: string | null
      role: string
    }>
  } = {
    csvProvided,
    csvRows: csvRows.length,
    dbRows: auditResults.length,
    delta: csvRows.length - auditResults.length,
    matchedCount: 0,
    csvMissingInDb: [],
    dbMissingInCsv: []
  }

  if (csvProvided && csvRows.length > 0) {
    const dbByCpf = new Map<string, typeof auditResults[0]>()
    const dbByName = new Map<string, typeof auditResults[0]>()

    for (const r of auditResults) {
      const dbStaff = staffs.find(s => s.id === r.staffId)
      if (dbStaff?.cpf) {
        const cpfKey = cpfDigits(dbStaff.cpf)
        if (cpfKey.length === 11) dbByCpf.set(cpfKey, r)
      }
      const nameKey = normalizeForMatch(r.name)
      if (nameKey) dbByName.set(nameKey, r)
    }

    const matchedDbIds = new Set<string>()

    for (const csvRow of csvRows) {
      const cpfKey = cpfDigits(csvRow.cpf)
      const nameKey = normalizeForMatch(csvRow.name)

      let matched: typeof auditResults[0] | undefined

      if (cpfKey.length === 11 && dbByCpf.has(cpfKey)) {
        matched = dbByCpf.get(cpfKey)
      } else if (nameKey && dbByName.has(nameKey)) {
        matched = dbByName.get(nameKey)
      }

      if (matched) {
        matchedDbIds.add(matched.staffId)
        reconciliation.matchedCount++
      } else {
        reconciliation.csvMissingInDb.push({
          rowIndex: csvRow.rowIndex,
          name: csvRow.name,
          cpf: cpfKey,
          role: csvRow.role,
          teamName: csvRow.teamName,
          matchReason: cpfKey.length === 11 ? 'cpf_not_in_db' : 'name_not_in_db'
        })
      }
    }

    for (const r of auditResults) {
      if (!matchedDbIds.has(r.staffId)) {
        reconciliation.dbMissingInCsv.push({
          staffId: r.staffId,
          teamName: r.teamName,
          role: r.role
        })
      }
    }
  }

  return NextResponse.json({
    ok: true,
    elapsedMs: Date.now() - t0,
    summary,
    missingByType,
    byTeam,
    reconciliation,
    timestamp: new Date().toISOString()
  })
}
