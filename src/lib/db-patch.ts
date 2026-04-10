import { prisma } from '@/lib/db'

type PatchResult = {
  target: string
  sql?: string
  status: 'SUCCESS' | 'SKIPPED_EXISTS' | 'ERROR'
  error?: string
}

type ColumnPatch = {
  kind: 'column'
  table: string
  column: string
  sql: string
  fallbackSql?: string[]
  critical?: boolean
}

type TablePatch = {
  kind: 'table'
  table: string
  sql: string
  critical?: boolean
}

type SqlPatch = {
  kind: 'sql'
  name: string
  sql: string
  critical?: boolean
}

type SchemaPatch = ColumnPatch | TablePatch | SqlPatch

const schemaPatches: SchemaPatch[] = [
  {
    kind: 'table',
    table: 'Standing',
    sql: `CREATE TABLE IF NOT EXISTS Standing (
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
    critical: true,
  },
  {
    kind: 'table',
    table: 'AthleteCategory',
    sql: `CREATE TABLE IF NOT EXISTS AthleteCategory (
      id TEXT PRIMARY KEY,
      registrationId TEXT NOT NULL,
      athleteName TEXT NOT NULL,
      athleteDoc TEXT,
      categoryIds TEXT NOT NULL,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );`,
    critical: true,
  },
  {
    kind: 'table',
    table: 'Athlete',
    sql: `CREATE TABLE IF NOT EXISTS Athlete (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      birthDate DATETIME,
      document TEXT,
      sex TEXT,
      photoUrl TEXT,
      status TEXT DEFAULT 'ACTIVE',
      teamId TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );`,
  },
  {
    kind: 'table',
    table: 'AthleteIdCard',
    sql: `CREATE TABLE IF NOT EXISTS AthleteIdCard (
      id TEXT PRIMARY KEY,
      athleteId TEXT NOT NULL,
      cardNumber TEXT UNIQUE,
      qrToken TEXT UNIQUE,
      issuedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      expiresAt DATETIME,
      status TEXT DEFAULT 'ACTIVE',
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );`,
  },
  {
    kind: 'table',
    table: 'AthleteBidEntry',
    sql: `CREATE TABLE IF NOT EXISTS AthleteBidEntry (
      id TEXT PRIMARY KEY,
      athleteId TEXT NOT NULL,
      championshipId TEXT,
      teamFromId TEXT,
      teamToId TEXT,
      type TEXT DEFAULT 'REGISTRATION',
      status TEXT DEFAULT 'PENDING',
      reason TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );`,
  },
  {
    kind: 'table',
    table: 'Referee',
    sql: `CREATE TABLE IF NOT EXISTS Referee (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      licenseNumber TEXT,
      phone TEXT,
      email TEXT,
      city TEXT,
      status TEXT DEFAULT 'ACTIVE',
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );`,
  },
  {
    kind: 'table',
    table: 'RefereeAssignment',
    sql: `CREATE TABLE IF NOT EXISTS RefereeAssignment (
      id TEXT PRIMARY KEY,
      gameId TEXT NOT NULL,
      refereeId TEXT NOT NULL,
      role TEXT DEFAULT 'MAIN',
      status TEXT DEFAULT 'ASSIGNED',
      notes TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );`,
  },
  {
    kind: 'table',
    table: 'Sponsor',
    sql: `CREATE TABLE IF NOT EXISTS Sponsor (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      logoUrl TEXT,
      websiteUrl TEXT,
      isActive INTEGER DEFAULT 1,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );`,
  },
  {
    kind: 'table',
    table: 'SponsorClick',
    sql: `CREATE TABLE IF NOT EXISTS SponsorClick (
      id TEXT PRIMARY KEY,
      sponsorId TEXT NOT NULL,
      source TEXT,
      referrer TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );`,
  },
  {
    kind: 'table',
    table: 'NewsPost',
    sql: `CREATE TABLE IF NOT EXISTS NewsPost (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      slug TEXT UNIQUE,
      excerpt TEXT,
      content TEXT NOT NULL,
      coverUrl TEXT,
      status TEXT DEFAULT 'DRAFT',
      publishedAt DATETIME,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );`,
  },
  {
    kind: 'table',
    table: 'VideoPost',
    sql: `CREATE TABLE IF NOT EXISTS VideoPost (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      slug TEXT UNIQUE,
      description TEXT,
      videoUrl TEXT NOT NULL,
      coverUrl TEXT,
      status TEXT DEFAULT 'DRAFT',
      publishedAt DATETIME,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );`,
  },
  {
    kind: 'table',
    table: 'SeasonRanking',
    sql: `CREATE TABLE IF NOT EXISTS SeasonRanking (
      id TEXT PRIMARY KEY,
      teamId TEXT NOT NULL,
      season INTEGER NOT NULL,
      points INTEGER DEFAULT 0,
      wins INTEGER DEFAULT 0,
      losses INTEGER DEFAULT 0,
      games INTEGER DEFAULT 0,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );`,
  },

  { kind: 'column', table: 'Game', column: 'court', sql: 'ALTER TABLE Game ADD COLUMN court TEXT;', critical: true },
  { kind: 'column', table: 'Game', column: 'round', sql: 'ALTER TABLE Game ADD COLUMN round INTEGER DEFAULT 1;', critical: true },
  { kind: 'column', table: 'Game', column: 'blockId', sql: 'ALTER TABLE Game ADD COLUMN blockId TEXT;', critical: true },
  { kind: 'column', table: 'Game', column: 'isReturn', sql: 'ALTER TABLE Game ADD COLUMN isReturn INTEGER DEFAULT 0;', critical: true },
  { kind: 'column', table: 'Game', column: 'period', sql: 'ALTER TABLE Game ADD COLUMN period TEXT;', critical: true },
  { kind: 'column', table: 'Game', column: 'venue', sql: 'ALTER TABLE Game ADD COLUMN venue TEXT;', critical: true },
  { kind: 'column', table: 'Game', column: 'wasRescheduled', sql: 'ALTER TABLE Game ADD COLUMN wasRescheduled INTEGER DEFAULT 0;', critical: true },
  { kind: 'column', table: 'Game', column: 'rescheduleReason', sql: 'ALTER TABLE Game ADD COLUMN rescheduleReason TEXT;', critical: true },
  { kind: 'column', table: 'Game', column: 'blockedByTeamId', sql: 'ALTER TABLE Game ADD COLUMN blockedByTeamId TEXT;', critical: true },

  { kind: 'column', table: 'Registration', column: 'canHost', sql: 'ALTER TABLE Registration ADD COLUMN canHost INTEGER DEFAULT 0;', critical: true },
  { kind: 'column', table: 'Registration', column: 'gymName', sql: 'ALTER TABLE Registration ADD COLUMN gymName TEXT;', critical: true },
  { kind: 'column', table: 'Registration', column: 'gymAddress', sql: 'ALTER TABLE Registration ADD COLUMN gymAddress TEXT;', critical: true },
  { kind: 'column', table: 'Registration', column: 'gymCity', sql: 'ALTER TABLE Registration ADD COLUMN gymCity TEXT;', critical: true },
  { kind: 'column', table: 'Registration', column: 'gymMapsLink', sql: 'ALTER TABLE Registration ADD COLUMN gymMapsLink TEXT;', critical: true },
  { kind: 'column', table: 'Registration', column: 'coachName', sql: 'ALTER TABLE Registration ADD COLUMN coachName TEXT;', critical: true },
  { kind: 'column', table: 'Registration', column: 'coachPhone', sql: 'ALTER TABLE Registration ADD COLUMN coachPhone TEXT;', critical: true },
  { kind: 'column', table: 'Registration', column: 'coachEmail', sql: 'ALTER TABLE Registration ADD COLUMN coachEmail TEXT;', critical: true },
  { kind: 'column', table: 'Registration', column: 'coachMultiTeam', sql: 'ALTER TABLE Registration ADD COLUMN coachMultiTeam INTEGER DEFAULT 0;', critical: true },
  { kind: 'column', table: 'Registration', column: 'observations', sql: 'ALTER TABLE Registration ADD COLUMN observations TEXT;', critical: true },

  { kind: 'column', table: 'BlockedDate', column: 'affectsAllCats', sql: 'ALTER TABLE BlockedDate ADD COLUMN affectsAllCats INTEGER DEFAULT 0;', critical: true },
  {
    kind: 'column',
    table: 'BlockedDate',
    column: 'createdAt',
    sql: 'ALTER TABLE BlockedDate ADD COLUMN createdAt DATETIME;',
    fallbackSql: ['ALTER TABLE BlockedDate ADD COLUMN createdAt TEXT;'],
    critical: true,
  },

  { kind: 'column', table: 'Championship', column: 'minTeamsPerCat', sql: 'ALTER TABLE Championship ADD COLUMN minTeamsPerCat INTEGER DEFAULT 3;', critical: true },
  { kind: 'column', table: 'Championship', column: 'isSimulation', sql: 'ALTER TABLE Championship ADD COLUMN isSimulation INTEGER DEFAULT 0;', critical: true },
  { kind: 'column', table: 'Championship', column: 'relegationDown', sql: 'ALTER TABLE Championship ADD COLUMN relegationDown INTEGER DEFAULT 0;', critical: true },
  { kind: 'column', table: 'Championship', column: 'promotionUp', sql: 'ALTER TABLE Championship ADD COLUMN promotionUp INTEGER DEFAULT 0;', critical: true },
  { kind: 'column', table: 'Championship', column: 'hasRelegation', sql: 'ALTER TABLE Championship ADD COLUMN hasRelegation INTEGER DEFAULT 0;', critical: true },

  { kind: 'column', table: 'ChampionshipCategory', column: 'isViable', sql: 'ALTER TABLE ChampionshipCategory ADD COLUMN isViable INTEGER DEFAULT 0;', critical: true },

  { kind: 'column', table: 'Standing', column: 'draws', sql: 'ALTER TABLE Standing ADD COLUMN draws INTEGER DEFAULT 0;', critical: true },
  { kind: 'column', table: 'Standing', column: 'pointsAgainst', sql: 'ALTER TABLE Standing ADD COLUMN pointsAgainst INTEGER DEFAULT 0;', critical: true },
  { kind: 'column', table: 'Standing', column: 'diff', sql: 'ALTER TABLE Standing ADD COLUMN diff INTEGER DEFAULT 0;', critical: true },
  { kind: 'column', table: 'Standing', column: 'updatedAt', sql: 'ALTER TABLE Standing ADD COLUMN updatedAt DATETIME;', critical: true },

  { kind: 'sql', name: 'BlockedDate_registrationId_idx', sql: 'CREATE INDEX IF NOT EXISTS BlockedDate_registrationId_idx ON BlockedDate(registrationId);' },
  { kind: 'sql', name: 'BlockedDate_startDate_endDate_idx', sql: 'CREATE INDEX IF NOT EXISTS BlockedDate_startDate_endDate_idx ON BlockedDate(startDate, endDate);' },
  { kind: 'sql', name: 'Standing_teamId_categoryId_key', sql: 'CREATE UNIQUE INDEX IF NOT EXISTS Standing_teamId_categoryId_key ON Standing(teamId, categoryId);' },
  { kind: 'sql', name: 'AthleteCategory_registrationId_idx', sql: 'CREATE INDEX IF NOT EXISTS AthleteCategory_registrationId_idx ON AthleteCategory(registrationId);' },

  { kind: 'sql', name: 'Standing_pointsAgainst_backfill', sql: 'UPDATE Standing SET pointsAgainst = COALESCE(pointsAg, 0) WHERE pointsAgainst IS NULL OR pointsAgainst = 0;' },
  { kind: 'sql', name: 'Standing_diff_backfill', sql: 'UPDATE Standing SET diff = COALESCE(pointsFor, 0) - COALESCE(pointsAg, 0) WHERE diff IS NULL OR diff = 0;' },
  { kind: 'sql', name: 'Standing_updatedAt_backfill', sql: "UPDATE Standing SET updatedAt = CURRENT_TIMESTAMP WHERE updatedAt IS NULL OR updatedAt = '';" },
  { kind: 'sql', name: 'BlockedDate_endDate_backfill', sql: 'UPDATE BlockedDate SET endDate = startDate WHERE endDate IS NULL;' },
  { kind: 'sql', name: 'BlockedDate_createdAt_backfill', sql: "UPDATE BlockedDate SET createdAt = COALESCE(createdAt, CURRENT_TIMESTAMP) WHERE createdAt IS NULL OR createdAt = '';" },
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

async function tableExists(table: string) {
  const rows = await (prisma as any).$queryRawUnsafe(
    `SELECT name FROM sqlite_master WHERE type='table' AND name='${table}' LIMIT 1;`
  )
  return Array.isArray(rows) && rows.length > 0
}

async function columnExists(table: string, column: string) {
  const rows = await (prisma as any).$queryRawUnsafe(`PRAGMA table_info("${table}");`)
  return Array.isArray(rows) && rows.some((row: any) => row?.name === column)
}

async function runColumnPatch(patch: ColumnPatch) {
  const target = `${patch.table}.${patch.column}`

  if (await columnExists(patch.table, patch.column)) {
    return { target, sql: patch.sql, status: 'SKIPPED_EXISTS' as const }
  }

  let lastError = ''

  for (const sql of [patch.sql, ...(patch.fallbackSql ?? [])]) {
    try {
      await (prisma as any).$executeRawUnsafe(sql)

      if (await columnExists(patch.table, patch.column)) {
        return { target, sql, status: 'SUCCESS' as const }
      }
    } catch (error: any) {
      const message = error?.message || 'Erro desconhecido'
      lastError = message

      if (isIgnorablePatchError(message) && (await columnExists(patch.table, patch.column))) {
        return { target, sql, status: 'SKIPPED_EXISTS' as const }
      }
    }
  }

  return {
    target,
    sql: patch.sql,
    status: 'ERROR' as const,
    error: lastError || `Coluna ${target} nao foi criada.`,
  }
}

async function runTablePatch(patch: TablePatch) {
  const target = patch.table

  if (await tableExists(patch.table)) {
    return { target, sql: patch.sql, status: 'SKIPPED_EXISTS' as const }
  }

  try {
    await (prisma as any).$executeRawUnsafe(patch.sql)

    if (await tableExists(patch.table)) {
      return { target, sql: patch.sql, status: 'SUCCESS' as const }
    }
  } catch (error: any) {
    const message = error?.message || 'Erro desconhecido'
    if (isIgnorablePatchError(message) && (await tableExists(patch.table))) {
      return { target, sql: patch.sql, status: 'SKIPPED_EXISTS' as const }
    }

    return { target, sql: patch.sql, status: 'ERROR' as const, error: message }
  }

  return { target, sql: patch.sql, status: 'ERROR' as const, error: `Tabela ${patch.table} nao foi criada.` }
}

async function runSqlPatch(patch: SqlPatch) {
  try {
    await (prisma as any).$executeRawUnsafe(patch.sql)
    return { target: patch.name, sql: patch.sql, status: 'SUCCESS' as const }
  } catch (error: any) {
    const message = error?.message || 'Erro desconhecido'
    if (isIgnorablePatchError(message)) {
      return { target: patch.name, sql: patch.sql, status: 'SKIPPED_EXISTS' as const }
    }

    return { target: patch.name, sql: patch.sql, status: 'ERROR' as const, error: message }
  }
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
  const results: PatchResult[] = []

  for (const patch of schemaPatches) {
    if (patch.kind === 'column') {
      results.push(await runColumnPatch(patch))
      continue
    }

    if (patch.kind === 'table') {
      results.push(await runTablePatch(patch))
      continue
    }

    results.push(await runSqlPatch(patch))
  }

  return results
}

export async function ensureDatabaseSchema(force = false) {
  if (schemaEnsured && !force) {
    return
  }

  if (!schemaEnsurePromise || force) {
    schemaEnsurePromise = (async () => {
      const results = await runDatabasePatch()
      const criticalErrors = results.filter((result) => {
        if (result.status !== 'ERROR') return false

        return schemaPatches.some((patch) => {
          if ('table' in patch && patch.kind === 'table') return patch.table === result.target && patch.critical
          if ('column' in patch && patch.kind === 'column') return `${patch.table}.${patch.column}` === result.target && patch.critical
          return false
        })
      })

      if (criticalErrors.length > 0) {
        console.error('[DB_PATCH] Critical schema patch errors:', criticalErrors)
        throw new Error(
          criticalErrors.map((error) => `${error.target}: ${error.error || 'erro desconhecido'}`).join(' | ')
        )
      }

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
