import { PrismaClient } from '@prisma/client'
import { PrismaLibSQL } from '@prisma/adapter-libsql'
import { createClient } from '@libsql/client'
import bcrypt from 'bcryptjs'
import * as dotenv from 'dotenv'

dotenv.config()

async function main() {
  const url = process.env.DATABASE_URL
  const authToken = process.env.DATABASE_AUTH_TOKEN

  if (!url) throw new Error('DATABASE_URL missing')

  const libsql = createClient({ url, authToken })
  const adapter = new PrismaLibSQL(libsql)
  const prisma = new PrismaClient({ adapter } as any)

  const email = 'brayanalexguarnieri@gmail.com'
  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      memberships: {
        include: { team: true },
        take: 1,
      }
    }
  })

  if (!user) {
    console.log('User not found in DB:', email)
    return
  }

  console.log('User found:', user.email, 'isAdmin:', user.isAdmin)
  
  const match = await bcrypt.compare('admin123', user.password)
  console.log('Password match for admin123:', match)

  const teamEmail = 'flyboys@fgb.com.br'
  const teamUser = await prisma.user.findUnique({ where: { email: teamEmail } })
  if (teamUser) {
    const pMatch = await bcrypt.compare('senha123', teamUser.password)
    console.log('Team password match for senha123:', pMatch)
  }
}

main().catch(console.error)
