-- Fix Missing Columns in Turso/SQLite Database
-- Applies the schema changes from schema.prisma that might be missing in production

-- CHAMPIONSHIP TABLE
ALTER TABLE Championship ADD COLUMN minTeamsPerCat INTEGER DEFAULT 3;
ALTER TABLE Championship ADD COLUMN isSimulation INTEGER DEFAULT 0; -- Boolean
ALTER TABLE Championship ADD COLUMN relegationDown INTEGER DEFAULT 0;
ALTER TABLE Championship ADD COLUMN promotionUp INTEGER DEFAULT 0;

-- REGISTRATION TABLE
ALTER TABLE Registration ADD COLUMN canHost INTEGER DEFAULT 0; -- Boolean
ALTER TABLE Registration ADD COLUMN gymName TEXT;
ALTER TABLE Registration ADD COLUMN gymAddress TEXT;
ALTER TABLE Registration ADD COLUMN gymCity TEXT;
ALTER TABLE Registration ADD COLUMN gymMapsLink TEXT;

-- GAME TABLE
ALTER TABLE Game ADD COLUMN court TEXT;
ALTER TABLE Game ADD COLUMN round INTEGER DEFAULT 1;
ALTER TABLE Game ADD COLUMN blockId TEXT;

-- NOTE: If columns already exist, Turso will return an error but the rest of the script will proceed.
-- To run this on Turso:
-- turso db shell <your-db-name> < prisma/migrations/20260329_fix_schema.sql
