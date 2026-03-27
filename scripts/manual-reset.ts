import { PrismaClient } from '@prisma/client'
import { PrismaLibSQL } from '@prisma/adapter-libsql'
import { createClient } from '@libsql/client'
import bcrypt from 'bcryptjs'
import * as dotenv from 'dotenv'

dotenv.config()

async function main() {
  const url = process.env.DATABASE_URL
  const authToken = process.env.DATABASE_AUTH_TOKEN

  if (!url) throw new Error('DATABASE_URL is missing')

  const libsql = createClient({ url, authToken })
  const adapter = new PrismaLibSQL(libsql)
  const prisma = new PrismaClient({ adapter } as any)

  console.log('🔄 Iniciando reset manual de senhas no Banco de Dados...')
  
  const users = await prisma.user.findMany()
  console.log(`📊 Encontrados ${users.length} usuários.`)

  const adminHash = await bcrypt.hash('admin123', 10)
  const userHash = await bcrypt.hash('senha123', 10)

  for (const user of users) {
    const isSupremeAdmin = user.email === 'brayanalexguarnieri@gmail.com'
    const isOtherAdmin = user.isAdmin === true
    
    const newPassword = (isSupremeAdmin || isOtherAdmin) ? adminHash : userHash
    
    await prisma.user.update({
      where: { id: user.id },
      data: { password: newPassword }
    })
    
    console.log(`✅ Senha resetada para: ${user.email} (Admin: ${isSupremeAdmin || isOtherAdmin})`)
  }

  console.log('🎉 Reset concluído!')
  await prisma.$disconnect()
}

main().catch(console.error)
