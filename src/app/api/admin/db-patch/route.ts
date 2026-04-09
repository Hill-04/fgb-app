import { NextResponse } from 'next/server'
import { runDatabasePatch } from '@/lib/db-patch'

export async function POST() {
  const results = await runDatabasePatch()

  return NextResponse.json({ 
    message: 'Database patch process completed', 
    results 
  })
}
