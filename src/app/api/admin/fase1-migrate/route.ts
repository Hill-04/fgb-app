import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

type Result = { name: string; status: 'ok' | 'skip' | 'error'; msg?: string }

async function tryExec(name: string, sql: string): Promise<Result> {
  try {
    await prisma.$executeRawUnsafe(sql)
    return { name, status: 'ok' }
  } catch (e: any) {
    const msg = String(e?.message || e)
    if (msg.includes('already exists') || msg.includes('duplicate column')) {
      return { name, status: 'skip', msg }
    }
    return { name, status: 'error', msg }
  }
}

export async function POST() {
  const results: Result[] = []

  // ── Team: novos campos ───────────────────────────────────────────
  for (const col of [
    ['presidentName', 'TEXT'],
    ['presidentPhone', 'TEXT'],
    ['presidentMobile', 'TEXT'],
    ['presidentEmail', 'TEXT'],
    ['secretaryName', 'TEXT'],
    ['secretaryPhone', 'TEXT'],
    ['secretaryMobile', 'TEXT'],
    ['secretaryEmail', 'TEXT'],
    ['financialName', 'TEXT'],
    ['financialPhone', 'TEXT'],
    ['financialMobile', 'TEXT'],
    ['financialEmail', 'TEXT'],
    ['cnpj', 'TEXT'],
    ['website', 'TEXT'],
    ['instagram', 'TEXT'],
    ['whatsapp', 'TEXT'],
    ['observations', 'TEXT'],
    ['isActive', 'INTEGER NOT NULL DEFAULT 1'],
  ]) {
    results.push(await tryExec(`Team.${col[0]}`, `ALTER TABLE "Team" ADD COLUMN "${col[0]}" ${col[1]}`))
  }

  // ── Gym: novos campos + tornar teamId opcional ───────────────────
  for (const col of [
    ['state', 'TEXT NOT NULL DEFAULT "RS"'],
    ['courts', 'INTEGER NOT NULL DEFAULT 1'],
    ['phone', 'TEXT'],
    ['lat', 'REAL'],
    ['lng', 'REAL'],
    ['observations', 'TEXT'],
    ['isActive', 'INTEGER NOT NULL DEFAULT 1'],
    ['createdAt', 'DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP'],
  ]) {
    results.push(await tryExec(`Gym.${col[0]}`, `ALTER TABLE "Gym" ADD COLUMN "${col[0]}" ${col[1]}`))
  }
  // Tornar address e capacity opcionais não é possível via ALTER TABLE no SQLite
  // mas o Prisma schema marca como opcionais; registros existentes ficam com valores

  // ── Athlete: novos campos ────────────────────────────────────────
  for (const col of [
    ['registrationNumber', 'INTEGER'],
    ['registrationCBB', 'TEXT'],
    ['registrationPrev', 'TEXT'],
    ['filiationDate', 'DATETIME'],
    ['birthCity', 'TEXT'],
    ['nationality', 'TEXT DEFAULT "Brasileira"'],
    ['education', 'TEXT'],
    ['maritalStatus', 'TEXT'],
    ['rg', 'TEXT'],
    ['rgOrgan', 'TEXT'],
    ['rgDate', 'DATETIME'],
    ['cpf', 'TEXT'],
    ['cep', 'TEXT'],
    ['state', 'TEXT'],
    ['city', 'TEXT'],
    ['address', 'TEXT'],
    ['addressNum', 'TEXT'],
    ['addressComp', 'TEXT'],
    ['fatherName', 'TEXT'],
    ['motherName', 'TEXT'],
    ['phone', 'TEXT'],
    ['mobile', 'TEXT'],
    ['height', 'REAL'],
    ['weight', 'REAL'],
    ['shirtNumber', 'INTEGER'],
    ['situation', 'TEXT NOT NULL DEFAULT "PENDING"'],
    ['activatedAt', 'DATETIME'],
    ['activatedBy', 'TEXT'],
    ['docCPFUrl', 'TEXT'],
    ['docRGFrontUrl', 'TEXT'],
    ['docRGBackUrl', 'TEXT'],
    ['docBirthCertUrl', 'TEXT'],
    ['docOtherUrl', 'TEXT'],
    ['notes', 'TEXT'],
    ['saveWithoutValidation', 'INTEGER NOT NULL DEFAULT 0'],
  ]) {
    results.push(await tryExec(`Athlete.${col[0]}`, `ALTER TABLE "Athlete" ADD COLUMN "${col[0]}" ${col[1]}`))
  }

  // ── Referee: novos campos ────────────────────────────────────────
  for (const col of [
    ['registrationNumber', 'INTEGER'],
    ['sex', 'TEXT'],
    ['birthDate', 'DATETIME'],
    ['rg', 'TEXT'],
    ['cpf', 'TEXT'],
    ['cep', 'TEXT'],
    ['address', 'TEXT'],
    ['motherName', 'TEXT'],
    ['mobile', 'TEXT'],
    ['notes', 'TEXT'],
    ['photoUrl', 'TEXT'],
    ['isActive', 'INTEGER NOT NULL DEFAULT 1'],
    ['categoryId', 'TEXT'],
  ]) {
    results.push(await tryExec(`Referee.${col[0]}`, `ALTER TABLE "Referee" ADD COLUMN "${col[0]}" ${col[1]}`))
  }

  // ── CoachStaff (nova tabela) ─────────────────────────────────────
  results.push(await tryExec('CREATE CoachStaff', `
    CREATE TABLE IF NOT EXISTS "CoachStaff" (
      "id"          TEXT NOT NULL PRIMARY KEY,
      "teamId"      TEXT NOT NULL,
      "name"        TEXT NOT NULL,
      "email"       TEXT,
      "role"        TEXT NOT NULL,
      "crefi"       TEXT,
      "sex"         TEXT,
      "birthDate"   DATETIME,
      "rg"          TEXT,
      "cpf"         TEXT,
      "cep"         TEXT,
      "state"       TEXT,
      "city"        TEXT,
      "address"     TEXT,
      "addressNum"  TEXT,
      "addressComp" TEXT,
      "fatherName"  TEXT,
      "motherName"  TEXT,
      "phone"       TEXT,
      "phone2"      TEXT,
      "mobile"      TEXT,
      "notes"       TEXT,
      "photoUrl"    TEXT,
      "isActive"    INTEGER NOT NULL DEFAULT 1,
      "situation"   TEXT NOT NULL DEFAULT 'ACTIVE',
      "activatedAt" DATETIME,
      "createdAt"   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt"   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "CoachStaff_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE
    )
  `))
  results.push(await tryExec('INDEX CoachStaff.teamId', `CREATE INDEX IF NOT EXISTS "CoachStaff_teamId_idx" ON "CoachStaff"("teamId")`))

  // ── RefereeCategory (nova tabela) ────────────────────────────────
  results.push(await tryExec('CREATE RefereeCategory', `
    CREATE TABLE IF NOT EXISTS "RefereeCategory" (
      "id"           TEXT NOT NULL PRIMARY KEY,
      "name"         TEXT NOT NULL,
      "remuneration" REAL NOT NULL DEFAULT 0,
      "isActive"     INTEGER NOT NULL DEFAULT 1,
      "createdAt"    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `))

  // ── OfficialRoster (nova tabela) ─────────────────────────────────
  results.push(await tryExec('CREATE OfficialRoster', `
    CREATE TABLE IF NOT EXISTS "OfficialRoster" (
      "id"              TEXT NOT NULL PRIMARY KEY,
      "teamId"          TEXT NOT NULL,
      "championshipId"  TEXT NOT NULL,
      "categoryId"      TEXT,
      "season"          INTEGER NOT NULL DEFAULT 2026,
      "coachId"         TEXT,
      "authorized1Id"   TEXT,
      "authorized2Id"   TEXT,
      "authorized3Id"   TEXT,
      "status"          TEXT NOT NULL DEFAULT 'DRAFT',
      "submittedAt"     DATETIME,
      "approvedAt"      DATETIME,
      "approvedBy"      TEXT,
      "rejectionReason" TEXT,
      "pdfUrl"          TEXT,
      "createdAt"       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt"       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "OfficialRoster_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id"),
      CONSTRAINT "OfficialRoster_championshipId_fkey" FOREIGN KEY ("championshipId") REFERENCES "Championship"("id")
    )
  `))
  results.push(await tryExec('INDEX OfficialRoster.teamId', `CREATE INDEX IF NOT EXISTS "OfficialRoster_teamId_idx" ON "OfficialRoster"("teamId")`))
  results.push(await tryExec('INDEX OfficialRoster.championshipId', `CREATE INDEX IF NOT EXISTS "OfficialRoster_championshipId_idx" ON "OfficialRoster"("championshipId")`))

  // ── OfficialRosterAthlete (nova tabela) ──────────────────────────
  results.push(await tryExec('CREATE OfficialRosterAthlete', `
    CREATE TABLE IF NOT EXISTS "OfficialRosterAthlete" (
      "id"          TEXT NOT NULL PRIMARY KEY,
      "rosterId"    TEXT NOT NULL,
      "athleteId"   TEXT NOT NULL,
      "shirtNumber" INTEGER,
      "position"    TEXT,
      "order"       INTEGER NOT NULL DEFAULT 0,
      CONSTRAINT "OfficialRosterAthlete_rosterId_fkey" FOREIGN KEY ("rosterId") REFERENCES "OfficialRoster"("id") ON DELETE CASCADE,
      CONSTRAINT "OfficialRosterAthlete_athleteId_fkey" FOREIGN KEY ("athleteId") REFERENCES "Athlete"("id") ON DELETE CASCADE
    )
  `))
  results.push(await tryExec('UNIQUE OfficialRosterAthlete', `CREATE UNIQUE INDEX IF NOT EXISTS "OfficialRosterAthlete_rosterId_athleteId_key" ON "OfficialRosterAthlete"("rosterId","athleteId")`))
  results.push(await tryExec('INDEX OfficialRosterAthlete.rosterId', `CREATE INDEX IF NOT EXISTS "OfficialRosterAthlete_rosterId_idx" ON "OfficialRosterAthlete"("rosterId")`))

  // ── TeamFee (nova tabela) ────────────────────────────────────────
  results.push(await tryExec('CREATE TeamFee', `
    CREATE TABLE IF NOT EXISTS "TeamFee" (
      "id"           TEXT NOT NULL PRIMARY KEY,
      "teamId"       TEXT NOT NULL,
      "type"         TEXT NOT NULL,
      "description"  TEXT NOT NULL,
      "amount"       REAL NOT NULL,
      "dueDate"      DATETIME NOT NULL,
      "paidAt"       DATETIME,
      "paidAmount"   REAL,
      "paymentProof" TEXT,
      "status"       TEXT NOT NULL DEFAULT 'PENDING',
      "season"       INTEGER NOT NULL DEFAULT 2026,
      "notes"        TEXT,
      "createdAt"    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt"    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "TeamFee_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id")
    )
  `))
  results.push(await tryExec('INDEX TeamFee.teamId_status', `CREATE INDEX IF NOT EXISTS "TeamFee_teamId_status_idx" ON "TeamFee"("teamId","status")`))
  results.push(await tryExec('INDEX TeamFee.season_status', `CREATE INDEX IF NOT EXISTS "TeamFee_season_status_idx" ON "TeamFee"("season","status")`))

  const errors = results.filter(r => r.status === 'error')
  return NextResponse.json({
    message: errors.length === 0 ? 'Fase 1 migração OK' : `${errors.length} erro(s)`,
    results,
  }, { status: errors.length === 0 ? 200 : 207 })
}
