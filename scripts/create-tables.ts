import { createClient } from '@libsql/client'
import * as dotenv from 'dotenv'

dotenv.config()

const createTablesSQL = `
CREATE TABLE IF NOT EXISTS Tenant (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  domain TEXT UNIQUE,
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS User (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'TEAM',
  tenantId TEXT NOT NULL,
  teamId TEXT,
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  updatedAt TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (tenantId) REFERENCES Tenant(id),
  FOREIGN KEY (teamId) REFERENCES Team(id)
);

CREATE TABLE IF NOT EXISTS Team (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  city TEXT NOT NULL,
  contactName TEXT NOT NULL,
  contactPhone TEXT,
  contactEmail TEXT,
  tenantId TEXT NOT NULL,
  gymName TEXT,
  gymAddress TEXT,
  gymCapacity INTEGER,
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  updatedAt TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (tenantId) REFERENCES Tenant(id)
);

CREATE TABLE IF NOT EXISTS Championship (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  year INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'DRAFT',
  minTeamsPerCategory INTEGER NOT NULL DEFAULT 3,
  tenantId TEXT NOT NULL,
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  updatedAt TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (tenantId) REFERENCES Tenant(id)
);

CREATE TABLE IF NOT EXISTS Category (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  championshipId TEXT NOT NULL,
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  updatedAt TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (championshipId) REFERENCES Championship(id)
);

CREATE TABLE IF NOT EXISTS Registration (
  id TEXT PRIMARY KEY,
  status TEXT NOT NULL DEFAULT 'PENDING',
  teamId TEXT NOT NULL,
  categoryId TEXT NOT NULL,
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  updatedAt TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (teamId) REFERENCES Team(id),
  FOREIGN KEY (categoryId) REFERENCES Category(id),
  UNIQUE(teamId, categoryId)
);

CREATE TABLE IF NOT EXISTS BlockedDate (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL,
  reason TEXT,
  teamId TEXT NOT NULL,
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (teamId) REFERENCES Team(id)
);

CREATE TABLE IF NOT EXISTS Phase (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  championshipId TEXT NOT NULL,
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (championshipId) REFERENCES Championship(id)
);

CREATE TABLE IF NOT EXISTS Venue (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  capacity INTEGER,
  isTeamGym INTEGER NOT NULL DEFAULT 0,
  teamId TEXT,
  FOREIGN KEY (teamId) REFERENCES Team(id)
);

CREATE TABLE IF NOT EXISTS Match (
  id TEXT PRIMARY KEY,
  homeTeamId TEXT NOT NULL,
  awayTeamId TEXT NOT NULL,
  categoryId TEXT NOT NULL,
  phaseId TEXT NOT NULL,
  venueId TEXT,
  status TEXT NOT NULL DEFAULT 'SCHEDULED',
  scheduledTime TEXT,
  homeScore INTEGER,
  awayScore INTEGER,
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  updatedAt TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (homeTeamId) REFERENCES Team(id),
  FOREIGN KEY (awayTeamId) REFERENCES Team(id),
  FOREIGN KEY (categoryId) REFERENCES Category(id),
  FOREIGN KEY (phaseId) REFERENCES Phase(id),
  FOREIGN KEY (venueId) REFERENCES Venue(id)
);
`

async function main() {
  console.log('🔗 Conectando ao Turso...')

  const client = createClient({
    url: process.env.DATABASE_URL!,
    authToken: process.env.DATABASE_AUTH_TOKEN!,
  })

  console.log('📋 Criando tabelas...')

  const statements = createTablesSQL
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0)

  for (const statement of statements) {
    try {
      await client.execute(statement)
      const tableName = statement.match(/CREATE TABLE IF NOT EXISTS (\w+)/)?.[1]
      console.log(`✅ Tabela ${tableName} criada/verificada`)
    } catch (error: any) {
      console.error('❌ Erro:', error.message)
    }
  }

  console.log('✅ Todas as tabelas foram criadas!')
  await client.close()
}

main().catch(console.error)
