import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

async function isAuthorized(req: Request): Promise<boolean> {
  const expectedToken = process.env.MIGRATE_TOKEN
  const headerToken = req.headers.get('x-migrate-token')
  if (expectedToken && headerToken && headerToken === expectedToken) return true
  const session = await getServerSession(authOptions)
  const userId = (session?.user as { id?: string } | undefined)?.id
  if (!userId) return false
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { isFederationSuperAdmin: true },
  })
  return Boolean(user?.isFederationSuperAdmin)
}

function normalizeName(s: string | null | undefined): string {
  if (!s) return ''
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
}

function normalizeCnpj(s: string | null | undefined): string {
  if (!s) return ''
  return s.replace(/\D/g, '')
}

function detectDelimiter(headerLine: string): string {
  const candidates = [',', ';', '\t', '|']
  let best = ','
  let bestCount = -1
  for (const d of candidates) {
    const count = headerLine.split(d).length - 1
    if (count > bestCount) {
      best = d
      bestCount = count
    }
  }
  return best
}

function parseCsvLine(line: string, delimiter: string): string[] {
  const out: string[] = []
  let cur = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const c = line[i]
    if (c === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (c === delimiter && !inQuotes) {
      out.push(cur)
      cur = ''
    } else {
      cur += c
    }
  }
  out.push(cur)
  return out.map((v) => v.trim())
}

function parseCsv(text: string): { headers: string[]; rows: string[][] } {
  // strip BOM if present
  const cleaned = text.replace(/^﻿/, '')
  const rawLines = cleaned.split(/\r?\n/).filter((l) => l.trim() !== '')
  if (rawLines.length === 0) return { headers: [], rows: [] }
  const delimiter = detectDelimiter(rawLines[0])
  const headers = parseCsvLine(rawLines[0], delimiter)
  const rows = rawLines.slice(1).map((l) => parseCsvLine(l, delimiter))
  return { headers, rows }
}

function findColumnIndex(headers: string[], candidates: string[]): number {
  const norm = headers.map((h) => normalizeName(h))
  for (const cand of candidates) {
    const target = normalizeName(cand)
    const idx = norm.indexOf(target)
    if (idx !== -1) return idx
  }
  return -1
}

export async function POST(req: Request) {
  if (!(await isAuthorized(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  let formData: FormData
  try {
    formData = await req.formData()
  } catch {
    return NextResponse.json(
      { ok: false, error: 'Invalid multipart/form-data body' },
      { status: 400 }
    )
  }

  const file = formData.get('csv')
  if (!(file instanceof File)) {
    return NextResponse.json(
      { ok: false, error: 'Missing form field "csv" (expected file upload)' },
      { status: 400 }
    )
  }

  let csvText: string
  try {
    const buf = Buffer.from(await file.arrayBuffer())
    csvText = buf.toString('latin1')
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return NextResponse.json(
      { ok: false, error: `Failed to read CSV: ${message}` },
      { status: 400 }
    )
  }

  const { headers, rows } = parseCsv(csvText)
  if (headers.length === 0) {
    return NextResponse.json({ ok: false, error: 'CSV has no header row' }, { status: 400 })
  }

  const nameIdx = findColumnIndex(headers, ['Nome', 'Name', 'Clube', 'Team'])
  const cnpjIdx = findColumnIndex(headers, ['CNPJ', 'Cnpj'])
  if (nameIdx === -1 || cnpjIdx === -1) {
    return NextResponse.json(
      {
        ok: false,
        error: 'CSV must contain columns "Nome" and "CNPJ"',
        headersDetected: headers,
      },
      { status: 400 }
    )
  }

  try {
    const teams = await prisma.team.findMany({
      select: { id: true, name: true, cnpj: true },
    })

    const dbByName = new Map<string, (typeof teams)[number]>()
    for (const t of teams) dbByName.set(normalizeName(t.name), t)

    const results = rows.map((row) => {
      const csvName = row[nameIdx] ?? ''
      const csvCnpjRaw = row[cnpjIdx] ?? ''
      const csvCnpjNorm = normalizeCnpj(csvCnpjRaw)
      const cnpjPresentInCsv = csvCnpjNorm.length > 0

      const team = dbByName.get(normalizeName(csvName))
      const matched = Boolean(team)
      const dbCnpjNorm = normalizeCnpj(team?.cnpj ?? '')
      const cnpjPresentInDb = dbCnpjNorm.length > 0
      const cnpjMatches =
        matched && cnpjPresentInCsv && cnpjPresentInDb
          ? csvCnpjNorm === dbCnpjNorm
          : null

      return {
        csvName,
        dbId: team?.id ?? null,
        dbName: team?.name ?? null,
        matched,
        cnpjPresentInCsv,
        cnpjPresentInDb,
        cnpjMatches,
      }
    })

    const matchedCount = results.filter((r) => r.matched).length
    const cnpjMatchCount = results.filter((r) => r.cnpjMatches === true).length
    const cnpjMismatchCount = results.filter((r) => r.cnpjMatches === false).length

    return NextResponse.json({
      ok: true,
      summary: {
        csvRows: rows.length,
        dbTeams: teams.length,
        matchedByName: matchedCount,
        unmatchedByName: rows.length - matchedCount,
        cnpjMatches: cnpjMatchCount,
        cnpjMismatches: cnpjMismatchCount,
      },
      results,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}
