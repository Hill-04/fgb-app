/**
 * Smoke PM-02 Task 1 — verifica que as 6 colunas novas foram criadas.
 * Run: npx tsx scripts/smoke-pm02-task1.ts
 */
import { prisma } from '../src/lib/db'
import { ensureDatabaseSchema } from '../src/lib/db-patch'

const NEW_COLUMNS = [
  'maxCategoriesPerDay',
  'minAgeGapBetweenGames',
  'lunchBreakMinutes',
  'afternoonStartTime',
  'fridayEnabled',
  'sharedGymHandlingMode',
]

async function main() {
  console.log('1. Aplicando ensureDatabaseSchema...')
  await ensureDatabaseSchema(true)

  console.log('2. Conferindo colunas no Championship via PRAGMA table_info...')
  const info = await (prisma as any).$queryRawUnsafe(
    `PRAGMA table_info("Championship")`
  ) as Array<{ name: string; type: string; dflt_value: any }>

  const present = new Set(info.map((c) => c.name))
  let allOk = true
  for (const col of NEW_COLUMNS) {
    const ok = present.has(col)
    console.log(`   ${ok ? 'OK ' : 'FAIL'} ${col}`)
    if (!ok) allOk = false
  }

  if (!allOk) {
    process.exitCode = 1
    return
  }

  console.log('\nTodas as 6 colunas presentes.')
}

main()
  .catch((err) => { console.error(err); process.exitCode = 1 })
  .finally(() => prisma.$disconnect())
