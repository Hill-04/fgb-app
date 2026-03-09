import { PrismaClient } from '@prisma/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'
import bcrypt from 'bcryptjs'
import * as dotenv from 'dotenv'

dotenv.config()

async function main() {
  const url = process.env.DATABASE_URL
  if (!url) throw new Error('DATABASE_URL não definida')

  const isRemote = url.startsWith('libsql://')
  const authToken = isRemote ? process.env.DATABASE_AUTH_TOKEN : undefined

  const adapter = new PrismaLibSql({ url, authToken })
  const prisma = new PrismaClient({ adapter } as any)

  console.log('🌱 Iniciando seed...')

  // Tenant
  const tenant = await prisma.tenant.upsert({
    where: { domain: 'fgb.rs.gov.br' },
    update: {},
    create: {
      name: 'Federação Gaúcha de Basquete',
      domain: 'fgb.rs.gov.br',
    },
  })
  console.log('✓ Tenant criado:', tenant.name)

  // Admin user
  const adminPassword = await bcrypt.hash('admin123', 10)
  const admin = await prisma.user.upsert({
    where: { email: 'brayanalexguarnieri@gmail.com' },
    update: {},
    create: {
      name: 'Brayan Alex Guarnieri',
      email: 'brayanalexguarnieri@gmail.com',
      password: adminPassword,
      role: 'ADMIN',
      tenantId: tenant.id,
    },
  })
  console.log('✓ Admin criado:', admin.email)

  // Campeonato de exemplo
  const championship = await prisma.championship.upsert({
    where: { id: 'champ-2026-estadual' },
    update: {},
    create: {
      id: 'champ-2026-estadual',
      name: 'Campeonato Estadual de Basquete 2026',
      year: 2026,
      status: 'REGISTRATION_OPEN',
      minTeamsPerCategory: 4,
      tenantId: tenant.id,
    },
  })
  console.log('✓ Campeonato criado:', championship.name)

  // Categorias
  const categorias = [
    { name: 'Sub-12 Masculino', code: 'SUB12M' },
    { name: 'Sub-14 Masculino', code: 'SUB14M' },
    { name: 'Sub-16 Masculino', code: 'SUB16M' },
    { name: 'Sub-12 Feminino',  code: 'SUB12F' },
    { name: 'Sub-14 Feminino',  code: 'SUB14F' },
  ]

  for (const cat of categorias) {
    await prisma.category.upsert({
      where: { id: `cat-${cat.code}-2026` },
      update: {},
      create: {
        id: `cat-${cat.code}-2026`,
        name: cat.name,
        code: cat.code,
        championshipId: championship.id,
      },
    })
  }
  console.log('✓ Categorias criadas:', categorias.length)

  console.log('\n✅ Seed concluído!')
  console.log('\nCredenciais de acesso:')
  console.log('  Email: brayanalexguarnieri@gmail.com')
  console.log('  Senha: admin123')

  await prisma.$disconnect()
}

main().catch((e) => {
  console.error('Erro no seed:', e)
  process.exit(1)
})
