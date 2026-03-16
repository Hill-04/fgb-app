import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { createClient } from '@libsql/client'

const SEED_SECRET = process.env.SEED_SECRET || 'fgb-seed-2026'

export async function POST(req: Request) {
  try {
    const { secret } = await req.json()
    if (secret !== SEED_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const DATABASE_URL = process.env.DATABASE_URL!
    const DATABASE_AUTH_TOKEN = process.env.DATABASE_AUTH_TOKEN

    // Use raw libsql to run ALTER TABLE migrations
    const client = createClient({
      url: DATABASE_URL,
      authToken: DATABASE_AUTH_TOKEN,
    })

    const results: string[] = []

    // Get current columns
    const tableInfo = await client.execute('PRAGMA table_info(Championship)')
    const existingCols = tableInfo.rows.map((r: any) => r[1] as string)
    results.push(`Existing columns: ${existingCols.join(', ')}`)

    // Add missing columns
    const migrations: { col: string; sql: string }[] = [
      { col: 'year', sql: `ALTER TABLE "Championship" ADD COLUMN "year" INTEGER NOT NULL DEFAULT 2026` },
      { col: 'format', sql: `ALTER TABLE "Championship" ADD COLUMN "format" TEXT NOT NULL DEFAULT 'todos_contra_todos'` },
      { col: 'phases', sql: `ALTER TABLE "Championship" ADD COLUMN "phases" INTEGER NOT NULL DEFAULT 3` },
      { col: 'startDate', sql: `ALTER TABLE "Championship" ADD COLUMN "startDate" DATETIME` },
      { col: 'endDate', sql: `ALTER TABLE "Championship" ADD COLUMN "endDate" DATETIME` },
    ]

    for (const m of migrations) {
      if (!existingCols.includes(m.col)) {
        await client.execute(m.sql)
        results.push(`✅ Added column: ${m.col}`)
      } else {
        results.push(`⏭️  Column already exists: ${m.col}`)
      }
    }

    await client.close()

    return NextResponse.json({ success: true, migrations: results })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ message: 'Use POST with secret to run migrations' })
}
