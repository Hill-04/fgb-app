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
  const tables = result.rows.map(r => r.name as string)

  // SEGURANÇA: Verificar se o reset é permitido
  const allowReset = process.env.ALLOW_RESET === 'true'

  // Dropar tabelas se existirem em ordem segura (ou forçar desligamento de FK)
  if (tables.length > 0) {
    if (!allowReset) {
      console.log('⚠️  AVISO: Tabelas existentes encontradas, mas ALLOW_RESET não está como "true".')
      console.log('⚠️  Pulando o DROP das tabelas para proteger os dados de produção.')
      console.log('💡 Para resetar o banco, use: ALLOW_RESET=true npx tsx scripts/push-turso.ts')
    } else {
      console.log(`🧨 RESET ATIVADO: Dropping ${tables.length} tables in safe order...`)
      
      // Ordem de deleção (das folhas para as raízes)
    const safeOrder = [
      'RegistrationCategory', 'BlockedDate', 'Game', 'Standing', 'Document',
      'Notification', 'Message', 'Block', 'RegistrationCategory', 'Registration', 
      'ChampionshipCategory', 'Championship', 'Gym', 'TeamMembership', 'Team', 'User', 'Holiday'
    ]

    // Primeiro tentamos via Batch com PRAGMA OFF
    try {
      const dropStatements = [
        'PRAGMA foreign_keys = OFF;',
        ...safeOrder.map(t => `DROP TABLE IF EXISTS "${t}";`),
        ...tables.filter(t => !safeOrder.includes(t)).map(t => `DROP TABLE IF EXISTS "${t}";`),
        'PRAGMA foreign_keys = ON;'
      ]
      
      console.log('Executing batch drop...')
      await client.batch(dropStatements, 'write')
    } catch (e: any) {
      console.warn('Batch drop failed, trying individual drops...', e.message)
      for (const table of safeOrder) {
        try { await client.execute(`DROP TABLE IF EXISTS "${table}"`) } catch (inner) {}
      }
    }
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
