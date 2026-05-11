-- Fase 1 — Imutabilidade + State Machine + Verificado FGB
-- Data: 2026-05-11
-- Documentado em: docs/fase-1-migration-plan.md
--
-- Aplicado em produção via:
--   1. Runtime: src/lib/db-patch.ts (idempotente, roda em startup)
--   2. Manual (Turso CLI / dump): este arquivo SQL flat (mesmo formato dos outros migrations da equipe)
--
-- Backfill associado: scripts/backfill-fase1.ts

-- ============================================================================
-- 1. Game.lifecycleState + lifecycleVersion
-- ============================================================================
ALTER TABLE Game ADD COLUMN lifecycleState TEXT NOT NULL DEFAULT 'SCHEDULED';
ALTER TABLE Game ADD COLUMN lifecycleVersion INTEGER NOT NULL DEFAULT 0;
CREATE INDEX IF NOT EXISTS "Game_lifecycleState_idx" ON "Game"("lifecycleState");

-- ============================================================================
-- 2. Athlete.verifiedFgb + verifiedFgbAt + verifiedFgbBy
-- ============================================================================
ALTER TABLE Athlete ADD COLUMN verifiedFgb INTEGER NOT NULL DEFAULT 0;
ALTER TABLE Athlete ADD COLUMN verifiedFgbAt DATETIME;
ALTER TABLE Athlete ADD COLUMN verifiedFgbBy TEXT;
CREATE INDEX IF NOT EXISTS "Athlete_verifiedFgb_idx" ON "Athlete"("verifiedFgb");

-- ============================================================================
-- 3. GameEvent correction chain (correctsEventId + supersededByEventId)
-- ============================================================================
ALTER TABLE GameEvent ADD COLUMN correctsEventId TEXT;
ALTER TABLE GameEvent ADD COLUMN supersededByEventId TEXT;
CREATE INDEX IF NOT EXISTS "GameEvent_correctsEventId_idx" ON "GameEvent"("correctsEventId");
CREATE INDEX IF NOT EXISTS "GameEvent_supersededByEventId_idx" ON "GameEvent"("supersededByEventId");

-- ============================================================================
-- 4. GameOfficialReport.currentVersion + Nova tabela GameOfficialReportVersion
-- ============================================================================
ALTER TABLE GameOfficialReport ADD COLUMN currentVersion INTEGER NOT NULL DEFAULT 1;

CREATE TABLE IF NOT EXISTS "GameOfficialReportVersion" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "reportId" TEXT NOT NULL,
  "version" INTEGER NOT NULL,
  "finalHomeScore" INTEGER NOT NULL DEFAULT 0,
  "finalAwayScore" INTEGER NOT NULL DEFAULT 0,
  "overtimeCount" INTEGER NOT NULL DEFAULT 0,
  "officialPdfUrl" TEXT,
  "boxScoreJson" TEXT,
  "playByPlayJson" TEXT,
  "signedOffByUserId" TEXT,
  "finalizedAt" DATETIME,
  "reason" TEXT,
  "createdByUserId" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("reportId") REFERENCES "GameOfficialReport"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "GameOfficialReportVersion_reportId_version_key" ON "GameOfficialReportVersion"("reportId","version");
CREATE INDEX IF NOT EXISTS "GameOfficialReportVersion_reportId_idx" ON "GameOfficialReportVersion"("reportId");
