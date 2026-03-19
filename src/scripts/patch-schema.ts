import 'dotenv/config'
import { createClient } from '@libsql/client'

async function main() {
  const url = process.env.DATABASE_URL
  const authToken = process.env.DATABASE_AUTH_TOKEN

  if (!url) throw new Error('DATABASE_URL not found')

  const client = createClient({ url, authToken })

  try {
    console.log('Adding isSimulation column to Championship...')
    await client.execute("ALTER TABLE Championship ADD COLUMN isSimulation BOOLEAN DEFAULT 0;")
    console.log('✅ Column added successfully or already exists.')
  } catch (error: any) {
    if (error.message.includes('duplicate column name')) {
      console.log('ℹ️ Column isSimulation already exists.')
    } else {
      console.error('❌ Error adding column:', error)
    }
  }

  try {
    console.log('Adding isSimulation check to Standing (if needed)...')
    // Check if Standing needs any other fields from the new schema
  } catch {}
}

main()
