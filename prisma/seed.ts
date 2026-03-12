import { PrismaClient, ChampionshipStatus, TeamRole, MembershipStatus } from '@prisma/client'
import { PrismaLibSQL } from '@prisma/adapter-libsql'
import { createClient } from '@libsql/client'
import bcrypt from 'bcryptjs'
import * as dotenv from 'dotenv'

dotenv.config()

async function main() {
  // Tentar carregar do .env.local primeiro (desenvolvimento)
  let url = process.env.DATABASE_URL

  // Se DATABASE_URL for libsql (produção) mas houver .env.local, usar o local
  const fs = await import('fs')
  if (fs.existsSync('.env.local')) {
    const envContent = fs.readFileSync('.env.local', 'utf-8')
    const match = envContent.match(/DATABASE_URL="(.+)"/)
    if (match) {
      url = match[1]
    }
  }

  if (!url) throw new Error('DATABASE_URL não definida')

  const isRemote = url.startsWith('libsql://')
  const authToken = isRemote ? process.env.DATABASE_AUTH_TOKEN : undefined

  const libsql = createClient({ url, authToken })
  const adapter = new PrismaLibSQL(libsql)
  const prisma = new PrismaClient({ adapter } as any)

  console.log('🌱 Iniciando seed do banco de dados...')

  // Limpar dados existentes
  console.log('🗑️  Limpando dados existentes...')
  await prisma.message.deleteMany()
  await prisma.notification.deleteMany()
  await prisma.document.deleteMany()
  await prisma.standing.deleteMany()
  await prisma.game.deleteMany()
  await prisma.block.deleteMany()
  await prisma.blockedDate.deleteMany()
  await prisma.registrationCategory.deleteMany()
  await prisma.registration.deleteMany()
  await prisma.championshipCategory.deleteMany()
  await prisma.championship.deleteMany()
  await prisma.gym.deleteMany()
  await prisma.teamMembership.deleteMany()
  await prisma.team.deleteMany()
  await prisma.user.deleteMany()
  await prisma.holiday.deleteMany()

  // 1. Criar admin
  console.log('👤 Criando administrador...')
  const adminPassword = await bcrypt.hash('admin123', 10)
  const admin = await prisma.user.create({
    data: {
      name: 'Brayan Alex Guarnieri',
      email: 'brayanalexguarnieri@gmail.com',
      password: adminPassword,
      defaultRole: TeamRole.ADMIN,
      isAdmin: true,
    }
  })
  console.log('✅ Admin criado:', admin.email)

  // 2. Criar equipes reais do basquete gaúcho (masculino)
  console.log('🏀 Criando equipes...')

  const teams = [
    { name: "Flyboys", city: "Porto Alegre", headCoach: "João Silva", phone: "(51) 99999-0001" },
    { name: "Richmond", city: "Novo Hamburgo", headCoach: "Pedro Santos", phone: "(51) 99999-0002" },
    { name: "Amb", city: "Canoas", headCoach: "Carlos Oliveira", phone: "(51) 99999-0003" },
    { name: "Sinodal", city: "São Leopoldo", headCoach: "Rafael Costa", phone: "(51) 99999-0004" },
    { name: "Sogipa", city: "Porto Alegre", headCoach: "Lucas Ferreira", phone: "(51) 99999-0005" },
    { name: "Dunk", city: "Gravataí", headCoach: "Marcelo Alves", phone: "(51) 99999-0006" },
    { name: "Recreio", city: "Caxias do Sul", headCoach: "Fernando Lima", phone: "(54) 99999-0007" },
    { name: "Sojao", city: "Esteio", headCoach: "Gabriel Souza", phone: "(51) 99999-0008" },
    { name: "Juvenil", city: "Gravataí", headCoach: "André Martins", phone: "(51) 99999-0009" },
    { name: "Apacobas", city: "Sapucaia", headCoach: "Ricardo Rocha", phone: "(51) 99999-0010" },
  ]

  const defaultPassword = await bcrypt.hash('senha123', 10)

  for (const teamData of teams) {
    // Criar HEAD_COACH user
    const headCoachUser = await prisma.user.create({
      data: {
        name: teamData.headCoach,
        email: `${teamData.name.toLowerCase()}@fgb.com.br`,
        password: defaultPassword,
        defaultRole: TeamRole.HEAD_COACH,
        isAdmin: false,
      }
    })

    // Criar equipe
    const team = await prisma.team.create({
      data: {
        name: teamData.name,
        city: teamData.city,
        state: 'RS',
        phone: teamData.phone,
        sex: 'masculino',
      }
    })

    // Criar TeamMembership para o HEAD_COACH
    await prisma.teamMembership.create({
      data: {
        userId: headCoachUser.id,
        teamId: team.id,
        role: TeamRole.HEAD_COACH,
        status: MembershipStatus.ACTIVE,
        approvedAt: new Date(),
      }
    })

    // Criar ginásio
    await prisma.gym.create({
      data: {
        name: `Ginásio ${teamData.name}`,
        address: `Rua Principal, 123 - ${teamData.city}`,
        city: teamData.city,
        capacity: 500,
        availability: 'sabado_domingo',
        canHost: true,
        teamId: team.id,
      }
    })

    console.log(`✅ Equipe criada: ${team.name} (HEAD_COACH: ${teamData.headCoach})`)
  }

  // 3. Criar feriados 2026
  console.log('📅 Criando feriados...')
  const holidays = [
    { date: new Date('2026-02-16'), name: 'Carnaval', year: 2026 },
    { date: new Date('2026-02-17'), name: 'Carnaval', year: 2026 },
    { date: new Date('2026-04-03'), name: 'Sexta-feira Santa', year: 2026 },
    { date: new Date('2026-04-05'), name: 'Páscoa', year: 2026 },
    { date: new Date('2026-04-21'), name: 'Tiradentes', year: 2026 },
    { date: new Date('2026-05-01'), name: 'Dia do Trabalho', year: 2026 },
    { date: new Date('2026-05-10'), name: 'Dia das Mães', year: 2026 },
    { date: new Date('2026-06-04'), name: 'Corpus Christi', year: 2026 },
    { date: new Date('2026-06-13'), name: 'Festa Junina Santo Antônio', year: 2026 },
    { date: new Date('2026-06-24'), name: 'Festa Junina São João', year: 2026 },
    { date: new Date('2026-08-09'), name: 'Dia dos Pais', year: 2026 },
    { date: new Date('2026-09-07'), name: 'Independência', year: 2026 },
    { date: new Date('2026-09-20'), name: 'Revolução Farroupilha', year: 2026 },
    { date: new Date('2026-10-12'), name: 'Dia das Crianças', year: 2026 },
    { date: new Date('2026-11-02'), name: 'Finados', year: 2026 },
    { date: new Date('2026-11-15'), name: 'Proclamação da República', year: 2026 },
    { date: new Date('2026-12-25'), name: 'Natal', year: 2026 },
  ]

  for (const holiday of holidays) {
    await prisma.holiday.create({ data: holiday })
  }
  console.log(`✅ ${holidays.length} feriados criados`)

  // 4. Criar campeonato de exemplo
  console.log('🏆 Criando campeonato de exemplo...')
  const championship = await prisma.championship.create({
    data: {
      name: 'Estadual 2026 — Masculino',
      description: 'Campeonato Estadual de Basquete Masculino do Rio Grande do Sul',
      sex: 'masculino',
      format: 'todos_contra_todos',
      phases: 3,
      minTeamsPerCat: 3,
      startDate: new Date('2026-05-01'),
      endDate: new Date('2026-11-30'),
      regDeadline: new Date('2026-04-15'),
      status: ChampionshipStatus.REGISTRATION_OPEN,
    }
  })

  // Criar categorias do campeonato
  const categories = ['Sub 12', 'Sub 13', 'Sub 15', 'Sub 17']
  for (const catName of categories) {
    await prisma.championshipCategory.create({
      data: {
        name: catName,
        championshipId: championship.id,
        isViable: false,
      }
    })
  }
  console.log(`✅ Campeonato criado: ${championship.name} com ${categories.length} categorias`)

  console.log('')
  console.log('🎉 Seed concluído com sucesso!')
  console.log('')
  console.log('📊 Dados criados:')
  console.log(`   - 1 administrador (${admin.email} / senha: admin123)`)
  console.log(`   - ${teams.length} equipes (senha padrão: senha123)`)
  console.log(`   - ${holidays.length} feriados`)
  console.log(`   - 1 campeonato com ${categories.length} categorias`)
  console.log('')

  await prisma.$disconnect()
}

main().catch((e) => {
  console.error('❌ Erro no seed:', e)
  process.exit(1)
})
