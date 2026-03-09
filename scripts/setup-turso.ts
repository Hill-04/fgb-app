import { createClient } from '@libsql/client'
import * as fs from 'fs'
import * as path from 'path'
import * as dotenv from 'dotenv'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config()

async function main() {
  console.log('DATABASE_URL:', process.env.DATABASE_URL)

  const client = createClient({
    url: process.env.DATABASE_URL!,
    authToken: process.env.DATABASE_AUTH_TOKEN!,
  })

  console.log('🔗 Conectado ao Turso')

  // Ler o SQL da migration mais recente
  const migrationsDir = path.join(__dirname, '../prisma/migrations')
  const migrations = fs.readdirSync(migrationsDir).filter(f => !f.endsWith('.lock'))

  if (migrations.length === 0) {
    console.log('⚠️  Nenhuma migration encontrada')
    return
  }

  const latestMigration = migrations[migrations.length - 1]
  const migrationSQL = fs.readFileSync(
    path.join(migrationsDir, latestMigration, 'migration.sql'),
    'utf-8'
  )

  console.log(`📄 Executando migration: ${latestMigration}`)

  // Dividir em statements individuais e executar
  const statements = migrationSQL
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0)

  for (const statement of statements) {
    try {
      await client.execute(statement)
      console.log('✅', statement.substring(0, 50) + '...')
    } catch (error: any) {
      if (error.message?.includes('already exists')) {
        console.log('⏭️  Tabela já existe, pulando...')
      } else {
        console.error('❌ Erro:', error.message)
      }
    }
  }

  console.log('✅ Migrations executadas com sucesso!')
  await client.close()
}

main().catch(console.error)
