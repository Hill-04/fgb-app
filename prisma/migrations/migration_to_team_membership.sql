-- Migration Script: From Old Schema to Team Membership System
-- WARNING: This script is destructive. Backup your database before running!
-- Applies to: Turso/SQLite production database
-- Date: 2026-03-10

-- STEP 1: Create new tables and columns
-- ============================================

-- Add new columns to User table
ALTER TABLE User ADD COLUMN name TEXT;
ALTER TABLE User ADD COLUMN defaultRole TEXT DEFAULT 'AUXILIAR';
ALTER TABLE User ADD COLUMN isAdmin INTEGER DEFAULT 0;

-- Create TeamMembership table
CREATE TABLE IF NOT EXISTS TeamMembership (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL UNIQUE,
    teamId TEXT NOT NULL,
    role TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'PENDING',
    requestedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    approvedAt DATETIME,
    updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES User(id) ON DELETE CASCADE,
    FOREIGN KEY (teamId) REFERENCES Team(id) ON DELETE CASCADE
);

-- Add logoUrl to Team table
ALTER TABLE Team ADD COLUMN logoUrl TEXT;

-- STEP 2: Migrate existing data
-- ============================================

-- Update User.name from Team.responsible (if exists)
UPDATE User
SET name = (
    SELECT responsible
    FROM Team
    WHERE Team.userId = User.id
)
WHERE EXISTS (
    SELECT 1
    FROM Team
    WHERE Team.userId = User.id
);

-- Set name for users without teams (fallback to email prefix)
UPDATE User
SET name = SUBSTR(email, 1, INSTR(email, '@') - 1)
WHERE name IS NULL;

-- Update defaultRole based on old role field
UPDATE User SET defaultRole = 'HEAD_COACH' WHERE role = 'TEAM';
UPDATE User SET defaultRole = 'ADMIN', isAdmin = 1 WHERE role = 'ADMIN';

-- Create TeamMembership entries for existing Team-User relationships
INSERT INTO TeamMembership (id, userId, teamId, role, status, requestedAt, approvedAt)
SELECT
    lower(hex(randomblob(16))),  -- Generate UUID-like ID
    userId,
    id as teamId,
    'HEAD_COACH',
    'ACTIVE',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM Team
WHERE userId IS NOT NULL;

-- STEP 3: Drop old columns (CAUTION!)
-- ============================================

-- Note: SQLite doesn't support DROP COLUMN directly
-- You would need to recreate tables without these columns
-- For now, we just mark them as deprecated

-- The following columns should be manually removed by recreating tables:
-- - User.role (replaced by User.defaultRole and User.isAdmin)
-- - Team.userId (replaced by TeamMembership relation)
-- - Team.responsible (moved to User.name)

-- STEP 4: Verify migration
-- ============================================

-- Check all users have names
SELECT COUNT(*) as users_without_name FROM User WHERE name IS NULL;

-- Check all teams have at least one HEAD_COACH member
SELECT
    t.id,
    t.name,
    COUNT(tm.id) as head_coach_count
FROM Team t
LEFT JOIN TeamMembership tm ON tm.teamId = t.id AND tm.role = 'HEAD_COACH' AND tm.status = 'ACTIVE'
GROUP BY t.id, t.name
HAVING head_coach_count = 0;

-- STEP 5: Update indexes (optional, for performance)
-- ============================================

CREATE INDEX IF NOT EXISTS idx_team_membership_userId ON TeamMembership(userId);
CREATE INDEX IF NOT EXISTS idx_team_membership_teamId ON TeamMembership(teamId);
CREATE INDEX IF NOT EXISTS idx_team_membership_status ON TeamMembership(status);

-- END OF MIGRATION
-- ============================================

-- To apply this migration on Turso:
-- 1. Download this file
-- 2. Run: turso db shell <your-db-name> < migration_to_team_membership.sql
-- 3. Verify the migration with the SELECT queries above
-- 4. Test login/registration flows
-- 5. If successful, deploy the new app version
