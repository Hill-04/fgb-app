import { prisma } from '@/lib/db'

const schemaPatchCommands = [
  `CREATE TABLE IF NOT EXISTS Standing (
    id TEXT PRIMARY KEY,
    teamId TEXT NOT NULL,
    categoryId TEXT NOT NULL,
    played INTEGER DEFAULT 0,
    wins INTEGER DEFAULT 0,
    losses INTEGER DEFAULT 0,
    draws INTEGER DEFAULT 0,
    points INTEGER DEFAULT 0,
    pointsFor INTEGER DEFAULT 0,
    pointsAgainst INTEGER DEFAULT 0,
    diff INTEGER DEFAULT 0,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
  );`,

  'ALTER TABLE Game ADD COLUMN court TEXT;',
  'ALTER TABLE Game ADD COLUMN round INTEGER DEFAULT 1;',
  'ALTER TABLE Game ADD COLUMN blockId TEXT;',
  'ALTER TABLE Game ADD COLUMN isReturn INTEGER DEFAULT 0;',
  'ALTER TABLE Game ADD COLUMN period TEXT;',
  'ALTER TABLE Game ADD COLUMN venue TEXT;',
  'ALTER TABLE Game ADD COLUMN wasRescheduled INTEGER DEFAULT 0;',
  'ALTER TABLE Game ADD COLUMN rescheduleReason TEXT;',
  'ALTER TABLE Game ADD COLUMN blockedByTeamId TEXT;',

  'ALTER TABLE Registration ADD COLUMN canHost INTEGER DEFAULT 0;',
  'ALTER TABLE Registration ADD COLUMN gymName TEXT;',
  'ALTER TABLE Registration ADD COLUMN gymAddress TEXT;',
  'ALTER TABLE Registration ADD COLUMN gymCity TEXT;',
  'ALTER TABLE Registration ADD COLUMN gymMapsLink TEXT;',
  'ALTER TABLE Registration ADD COLUMN coachName TEXT;',
  'ALTER TABLE Registration ADD COLUMN coachPhone TEXT;',
  'ALTER TABLE Registration ADD COLUMN coachEmail TEXT;',
  'ALTER TABLE Registration ADD COLUMN coachMultiTeam INTEGER DEFAULT 0;',
  'ALTER TABLE Registration ADD COLUMN observations TEXT;',

  'ALTER TABLE BlockedDate ADD COLUMN affectsAllCats INTEGER DEFAULT 0;',
  'ALTER TABLE BlockedDate ADD COLUMN createdAt DATETIME DEFAULT CURRENT_TIMESTAMP;',

  'ALTER TABLE Championship ADD COLUMN minTeamsPerCat INTEGER DEFAULT 3;',
  'ALTER TABLE Championship ADD COLUMN isSimulation INTEGER DEFAULT 0;',
  'ALTER TABLE Championship ADD COLUMN relegationDown INTEGER DEFAULT 0;',
  'ALTER TABLE Championship ADD COLUMN promotionUp INTEGER DEFAULT 0;',
  'ALTER TABLE Championship ADD COLUMN hasRelegation INTEGER DEFAULT 0;',

  'ALTER TABLE ChampionshipCategory ADD COLUMN isViable INTEGER DEFAULT 0;',

  'ALTER TABLE Standing ADD COLUMN draws INTEGER DEFAULT 0;',
  'ALTER TABLE Standing ADD COLUMN pointsAgainst INTEGER DEFAULT 0;',
  'ALTER TABLE Standing ADD COLUMN diff INTEGER DEFAULT 0;',
  'ALTER TABLE Standing ADD COLUMN updatedAt DATETIME;',

  `CREATE TABLE IF NOT EXISTS AthleteCategory (
    id TEXT PRIMARY KEY,
    registrationId TEXT NOT NULL,
    athleteName TEXT NOT NULL,
    athleteDoc TEXT,
    categoryIds TEXT NOT NULL,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
  );`,

  'CREATE INDEX IF NOT EXISTS BlockedDate_registrationId_idx ON BlockedDate(registrationId);',
  'CREATE INDEX IF NOT EXISTS BlockedDate_startDate_endDate_idx ON BlockedDate(startDate, endDate);',
  'CREATE UNIQUE INDEX IF NOT EXISTS Standing_teamId_categoryId_key ON Standing(teamId, categoryId);',
  'CREATE INDEX IF NOT EXISTS AthleteCategory_registrationId_idx ON AthleteCategory(registrationId);',

  'UPDATE Standing SET pointsAgainst = COALESCE(pointsAg, 0) WHERE pointsAgainst IS NULL OR pointsAgainst = 0;',
  'UPDATE Standing SET diff = COALESCE(pointsFor, 0) - COALESCE(pointsAg, 0) WHERE diff IS NULL OR diff = 0;',
  'UPDATE Standing SET updatedAt = CURRENT_TIMESTAMP WHERE updatedAt IS NULL;',
  'UPDATE BlockedDate SET endDate = startDate WHERE endDate IS NULL;',
]

let schemaEnsured = false
let schemaEnsurePromise: Promise<void> | null = null

function isIgnorablePatchError(message: string) {
  const normalized = message.toLowerCase()
  return (
    normalized.includes('duplicate column name') ||
    normalized.includes('already exists') ||
    normalized.includes('duplicate index name')
  )
}

export function isDatabaseSchemaError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error)
  const normalized = message.toLowerCase()
  return (
    normalized.includes('sql_input_error') ||
    normalized.includes('no such column') ||
    normalized.includes('no such table') ||
    normalized.includes('duplicate column name')
  )
}

export async function runDatabasePatch() {
  const results: Array<{ sql: string; status: string; error?: string }> = []

  for (const sql of schemaPatchCommands) {
    try {
      await (prisma as any).$executeRawUnsafe(sql)
      results.push({ sql, status: 'SUCCESS' })
    } catch (error: any) {
      if (isIgnorablePatchError(error?.message || '')) {
        results.push({ sql, status: 'SKIPPED_EXISTS' })
      } else {
        results.push({ sql, status: 'ERROR', error: error?.message || 'Erro desconhecido' })
      }
    }
  }

  return results
}

export async function ensureDatabaseSchema(force = false) {
  if (schemaEnsured && !force) {
    return
  }

  if (!schemaEnsurePromise || force) {
    schemaEnsurePromise = (async () => {
      await runDatabasePatch()
      schemaEnsured = true
    })()
  }

  await schemaEnsurePromise
}

export async function withDatabaseSchemaRetry<T>(operation: () => Promise<T>) {
  try {
    return await operation()
  } catch (error) {
    if (!isDatabaseSchemaError(error)) {
      throw error
    }

    await ensureDatabaseSchema(true)
    return operation()
  }
}
