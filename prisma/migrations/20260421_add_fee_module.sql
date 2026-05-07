-- Migration: Fee management module
-- Adds configurable fee rows, registration fee snapshots, and team pending total.
--
-- SQLite/Turso:
--   turso db shell <your-db-name> < prisma/migrations/20260421_add_fee_module.sql

CREATE TABLE IF NOT EXISTS FeeConfig (
  id          TEXT PRIMARY KEY,
  key         TEXT NOT NULL UNIQUE,
  label       TEXT NOT NULL,
  value       REAL NOT NULL,
  category    TEXT NOT NULL,
  description TEXT,
  isActive    INTEGER NOT NULL DEFAULT 1,
  appliesFrom DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  createdAt   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS RegistrationFee (
  id             TEXT PRIMARY KEY,
  registrationId TEXT NOT NULL,
  feeKey         TEXT NOT NULL,
  feeLabel       TEXT NOT NULL,
  quantity       INTEGER NOT NULL DEFAULT 1,
  unitValue      REAL NOT NULL,
  totalValue     REAL NOT NULL,
  notes          TEXT,
  status         TEXT NOT NULL DEFAULT 'PENDING',
  paidAt         DATETIME,
  createdAt      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (registrationId) REFERENCES Registration(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS RegistrationFee_registrationId_idx ON RegistrationFee(registrationId);
CREATE UNIQUE INDEX IF NOT EXISTS FeeConfig_key_key ON FeeConfig(key);

ALTER TABLE Team ADD COLUMN totalFeesOwed REAL NOT NULL DEFAULT 0;
