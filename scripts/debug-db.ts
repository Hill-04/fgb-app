import { createClient } from '@libsql/client'
import * as dotenv from 'dotenv'

dotenv.config()

async function main() {
  const url = process.env.DATABASE_URL
  const authToken = process.env.DATABASE_AUTH_TOKEN
  
  if (!url) throw new Error('DATABASE_URL missing')
  
  const client = createClient({ url, authToken })
  
  console.log('--- USER TABLE DATA ---')
  const users = await client.execute('SELECT id, email, isAdmin FROM User')
  console.log(JSON.stringify(users.rows, null, 2))
  
  console.log('--- TABLE NAMES ---')
  const tables = await client.execute("SELECT name FROM sqlite_master WHERE type='table'")
  console.log(tables.rows.map(r => r.name))
}

main().catch(console.error)
