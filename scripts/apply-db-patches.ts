import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
dotenv.config()

import { runDatabasePatch } from '../src/lib/db-patch'
import { prisma } from '../src/lib/db'

async function main() {
  console.log('[apply-db-patches] running schema patches against Turso...')
  console.log('[apply-db-patches] DB:', (process.env.DATABASE_URL || '').slice(0, 40) + '...')

  const results = await runDatabasePatch()

  const success = results.filter((r) => r.status === 'SUCCESS')
  const skipped = results.filter((r) => r.status === 'SKIPPED_EXISTS')
  const errors = results.filter((r) => r.status === 'ERROR')

  console.log(`\n[apply-db-patches] applied: ${success.length}`)
  for (const r of success) console.log(`  ✓ ${r.target}`)

  console.log(`\n[apply-db-patches] skipped (already exists): ${skipped.length}`)

  if (errors.length > 0) {
    console.log(`\n[apply-db-patches] ERRORS: ${errors.length}`)
    for (const r of errors) console.log(`  ✗ ${r.target}: ${r.error}`)
    process.exitCode = 1
  } else {
    console.log('\n[apply-db-patches] done — no errors')
  }
}

main()
  .catch((err) => {
    console.error('[apply-db-patches] fatal:', err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
