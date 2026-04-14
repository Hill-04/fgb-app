-- Migration: Remove UNIQUE constraint from TeamMembership.userId
-- and add new required fields to Team
--
-- SQLite does not support DROP CONSTRAINT directly.
-- We recreate the table without the unique constraint on userId.
--
-- ⚠️  For Turso/SQLite, run this script manually:
--   turso db shell <your-db-name> < prisma/migrations/20260414_membership_and_team_fields.sql
--
-- ⚠️  For PostgreSQL/Supabase, run the ALTER TABLE versions at the bottom.

-- ────────────────────────────────────────────────────────────────
-- SQLITE: Recreate TeamMembership without @unique on userId
-- ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS TeamMembership_new (
  id          TEXT PRIMARY KEY,
  userId      TEXT NOT NULL,
  teamId      TEXT NOT NULL,
  role        TEXT NOT NULL,
  number      INTEGER,
  status      TEXT NOT NULL DEFAULT 'PENDING',
  requestedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  approvedAt  DATETIME,
  updatedAt   DATETIME NOT NULL,
  FOREIGN KEY (userId) REFERENCES User(id),
  FOREIGN KEY (teamId) REFERENCES Team(id)
);

INSERT INTO TeamMembership_new
  SELECT id, userId, teamId, role, number, status, requestedAt, approvedAt, updatedAt
  FROM TeamMembership;

DROP TABLE TeamMembership;
ALTER TABLE TeamMembership_new RENAME TO TeamMembership;

-- Recreate indexes
CREATE INDEX IF NOT EXISTS idx_membership_userId       ON TeamMembership(userId);
CREATE INDEX IF NOT EXISTS idx_membership_teamId       ON TeamMembership(teamId);
CREATE INDEX IF NOT EXISTS idx_membership_userId_status ON TeamMembership(userId, status);

-- ────────────────────────────────────────────────────────────────
-- TEAM: Add new required fields (nullable for backward compat)
-- ────────────────────────────────────────────────────────────────
ALTER TABLE Team ADD COLUMN responsible TEXT;

-- ────────────────────────────────────────────────────────────────
-- PostgreSQL/Supabase equivalent (comment out SQLite section and
-- run these instead):
-- ────────────────────────────────────────────────────────────────
-- ALTER TABLE "TeamMembership" DROP CONSTRAINT IF EXISTS "TeamMembership_userId_key";
-- CREATE INDEX IF NOT EXISTS idx_membership_userId        ON "TeamMembership"("userId");
-- CREATE INDEX IF NOT EXISTS idx_membership_teamId        ON "TeamMembership"("teamId");
-- CREATE INDEX IF NOT EXISTS idx_membership_userId_status ON "TeamMembership"("userId", "status");
-- ALTER TABLE "Team" ADD COLUMN IF NOT EXISTS responsible TEXT;
