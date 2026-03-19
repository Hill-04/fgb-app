import 'dotenv/config'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  try {
    const users = await prisma.user.findMany({
      take: 15,
      select: {
        email: true,
        name: true,
        isAdmin: true
      }
    })
    console.log('USERS_FOUND:', JSON.stringify(users, null, 2))
    console.log('COUNT:', users.length)
  } catch (error) {
    console.error('DIAGNOSTIC_ERROR:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()
