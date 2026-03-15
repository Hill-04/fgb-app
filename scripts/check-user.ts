import { PrismaClient } from '@prisma/client'
import { PrismaLibSQL } from '@prisma/adapter-libsql'
import { createClient } from '@libsql/client'
import * as dotenv from 'dotenv'

dotenv.config()

async function main() {
  const url = process.env.DATABASE_URL
  const authToken = process.env.DATABASE_AUTH_TOKEN

  if (!url) throw new Error('DATABASE_URL missing')

  const libsql = createClient({ url, authToken })
  const adapter = new PrismaLibSQL(libsql)
  const prisma = new PrismaClient({ adapter } as any)

  const user = await prisma.user.findUnique({
    where: { email: 'brayanalexguarnieri@gmail.com' }
  })

  console.log('User found:', user)
}

main().catch(console.error)
