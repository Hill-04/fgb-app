import { NextResponse } from 'next/server'
import { runDatabasePatch } from '@/lib/db-patch'

export async function POST() {
  const results = await runDatabasePatch()
  const hasErrors = results.some((result) => result.status === 'ERROR')

  return NextResponse.json({ 
    message: 'Database patch process completed', 
    results 
  }, { status: hasErrors ? 500 : 200 })
}
