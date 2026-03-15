import { createClient } from '@libsql/client'
import fs from 'fs'
import path from 'path'
import * as dotenv from 'dotenv'

dotenv.config()

async function main() {
  const url = process.env.DATABASE_URL
  const authToken = process.env.DATABASE_AUTH_TOKEN

  if (!url || !authToken) throw new Error('DATABASE_URL or DATABASE_AUTH_TOKEN missing')

  console.log('Connecting to Turso:', url)
  const client = createClient({ url, authToken })

  // Obter todas as tabelas
  console.log('Fetching existing tables...')
  const result = await client.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")
  const tables = result.rows.map(r => r.name)

  // Dropar tabelas se existirem (com FK checks desabilitados)
  if (tables.length > 0) {
    console.log(`Dropping ${tables.length} tables...`)
    await client.execute('PRAGMA foreign_keys = OFF;')
    for (const table of tables) {
      await client.execute(`DROP TABLE IF EXISTS "${table}"`)
    }
    await client.execute('PRAGMA foreign_keys = ON;')
  }

  // Ler e executar schema.sql
  console.log('Applying new schema...')
  const schemaSql = fs.readFileSync(path.join(process.cwd(), 'schema.sql'), 'utf-8')
  
  // Separar os comandos e remover strings vazias
  const statements = schemaSql
    .split(';')
    .map(stmt => stmt.trim())
    .filter(stmt => stmt.length > 0)

  console.log(`Executing ${statements.length} SQL statements...`)
  for (const stmt of statements) {
    try {
      await client.execute(stmt)
    } catch (e: any) {
      console.error(`Failed to execute: ${stmt.substring(0, 100)}...`)
      console.error(e.message)
      throw e
    }
  }

  console.log('Schema applied successfully!')
}

main().catch(console.error)
