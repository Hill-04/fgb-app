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

  console.log('🌱 Iniciando seed ROBUSTO do banco de dados...')

  // 1. Criar/Atualizar Admins
  console.log('👤 Configurando administradores...')
  const adminHash = await bcrypt.hash('admin123', 10)
  
  const adminsToCreate = [
    { name: 'Brayan Alex Guarnieri', email: 'brayanalexguarnieri@gmail.com' },
    { name: 'Pedro Santos', email: 'richmond@fgb.com.br' }
  ]

  for (const adminData of adminsToCreate) {
    await prisma.user.upsert({
      where: { email: adminData.email },
      update: { password: adminHash, isAdmin: true, defaultRole: 'ADMIN' },
      create: { 
        ...adminData, 
        password: adminHash, 
        isAdmin: true, 
        defaultRole: 'ADMIN' 
      }
    })
    console.log('✅ Admin configurado:', adminData.email)
  }

  // 2. Criar/Atualizar Equipes e Treinadores
  console.log('🏀 Configurando equipes...')
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

  const userHash = await bcrypt.hash('senha123', 10)

  for (const teamData of teams) {
    const coachEmail = `${teamData.name.toLowerCase()}@fgb.com.br`
    
    // Upsert Coach User
    const coach = await prisma.user.upsert({
      where: { email: coachEmail },
      update: { password: userHash, isAdmin: false, defaultRole: 'HEAD_COACH' },
      create: {
        name: teamData.headCoach,
        email: coachEmail,
        password: userHash,
        defaultRole: 'HEAD_COACH',
        isAdmin: false
      }
    })

    // Upsert Team
    const team = await prisma.team.upsert({
      where: { name: teamData.name },
      update: { city: teamData.city, phone: teamData.phone },
      create: {
        name: teamData.name,
        city: teamData.city,
        state: 'RS',
        phone: teamData.phone,
        sex: 'masculino'
      }
    })

    // Ensure Membership
    await prisma.teamMembership.upsert({
      where: { userId: coach.id },
      update: { teamId: team.id, role: 'HEAD_COACH', status: 'ACTIVE' },
      create: {
        userId: coach.id,
        teamId: team.id,
        role: 'HEAD_COACH',
        status: 'ACTIVE',
        approvedAt: new Date()
      }
    })

    console.log(`✅ Equipe configurada: ${team.name}`)
  }

  // 3. Feriados (Opcional simplificado para garantir deploy rápido)
  console.log('📅 Criando campeonato base se não existir...')
  await prisma.championship.upsert({
    where: { id: 'fixed-championship-id' },
    update: { status: 'REGISTRATION_OPEN' },
    create: {
      id: 'fixed-championship-id',
      name: 'Estadual 2026 — Masculino',
      sex: 'masculino',
      format: 'todos_contra_todos',
      phases: 3,
      minTeamsPerCat: 3,
      startDate: new Date('2026-05-01'),
      endDate: new Date('2026-11-30'),
      regDeadline: new Date('2026-04-15'),
      status: 'REGISTRATION_OPEN'
    }
  })

  console.log('🎉 Seed Robusto finalizado!')
  await prisma.$disconnect()
}

main().catch(console.error)
