-- Fase 6.B — Registration lifecycle + audit fields
-- Data: 2026-05-11
-- Documentado em: docs/fase-6-registrations-audit.md
--
-- Aplicado em produção via:
--   1. Runtime: src/lib/db-patch.ts (idempotente, roda em startup)
--   2. Manual (Turso CLI / dump): este SQL flat (mesmo formato dos outros migrations)
--
-- Backfill associado: scripts/backfill-fase6.ts

-- ============================================================================
-- Registration.lifecycleState + lifecycleVersion (state machine)
-- ============================================================================
ALTER TABLE Registration ADD COLUMN lifecycleState TEXT NOT NULL DEFAULT 'SUBMITTED';
ALTER TABLE Registration ADD COLUMN lifecycleVersion INTEGER NOT NULL DEFAULT 0;
CREATE INDEX IF NOT EXISTS "Registration_lifecycleState_idx" ON "Registration"("lifecycleState");

-- ============================================================================
-- Registration audit timeline fields (quem confirmou/rejeitou, quando, por quê)
-- ============================================================================
ALTER TABLE Registration ADD COLUMN submittedAt DATETIME;
ALTER TABLE Registration ADD COLUMN confirmedAt DATETIME;
ALTER TABLE Registration ADD COLUMN confirmedByUserId TEXT;
ALTER TABLE Registration ADD COLUMN rejectedAt DATETIME;
ALTER TABLE Registration ADD COLUMN rejectedByUserId TEXT;
ALTER TABLE Registration ADD COLUMN rejectionReason TEXT;
