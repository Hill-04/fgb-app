import { createClient } from '@libsql/client'
import bcrypt from 'bcryptjs'
import * as dotenv from 'dotenv'

dotenv.config()

async function main() {
  const url = process.env.DATABASE_URL
  const authToken = process.env.DATABASE_AUTH_TOKEN
  
  if (!url) throw new Error('DATABASE_URL missing')
  
  const client = createClient({ url, authToken })
  
  const adminHash = await bcrypt.hash('admin123', 10)
  const userHash = await bcrypt.hash('senha123', 10)
  
  console.log('--- FORCING PASSWORD UPDATE ---')
  
  // Update Admins
  const supremeAdminEmail = 'brayanalexguarnieri@gmail.com'
  const r1 = await client.execute({
    sql: 'UPDATE User SET password = ? WHERE isAdmin = 1 OR email = ?',
    args: [adminHash, supremeAdminEmail]
  })
  console.log(`Updated ${r1.rowsAffected} admins to admin123`)
  
  // Update Others
  const r2 = await client.execute({
    sql: 'UPDATE User SET password = ? WHERE isAdmin = 0 AND email != ?',
    args: [userHash, supremeAdminEmail]
  })
  console.log(`Updated ${r2.rowsAffected} teams to senha123`)
  
  console.log('✅ Update completed successfully!')
}

main().catch(console.error)
