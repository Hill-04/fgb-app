import { PrismaClient } from '@prisma/client'
import { PrismaLibSQL } from '@prisma/adapter-libsql'
import { createClient } from '@libsql/client'
import bcrypt from 'bcryptjs'
import * as dotenv from 'dotenv'
import { addDays, startOfWeek, nextSaturday, nextSunday } from 'date-fns'

dotenv.config()

async function main() {
  let url = process.env.DATABASE_URL
  const fs = await import('fs')
  if (fs.existsSync('.env.local')) {
    const envContent = fs.readFileSync('.env.local', 'utf-8')
    const match = envContent.match(/DATABASE_URL="(.+)"/)
    if (match) url = match[1]
  }

  if (!url) throw new Error('DATABASE_URL não definida')

  const isRemote = url.startsWith('libsql://')
  const authToken = isRemote ? process.env.DATABASE_AUTH_TOKEN : undefined
  const libsql = createClient({ url, authToken })
  const adapter = new PrismaLibSQL(libsql)
  const prisma = new PrismaClient({ adapter } as any)

  console.log('🧪 Iniciando SEED de TESTE DE FLUXO (Corrigido)...')

  // 1. Limpeza total
  console.log('🗑️  Limpando banco de dados...')
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

  const defaultPassword = await bcrypt.hash('senha123', 10)

  // 2. Criar Admin
  const admin = await prisma.user.create({
    data: {
      name: 'Admin FGB',
      email: 'admin@fgb.com.br',
      password: await bcrypt.hash('admin123', 10),
      defaultRole: 'ADMIN',
      isAdmin: true,
    }
  })

  // 3. Criar Equipes (12 equipes)
  const teamNames = [
    "Grêmio Naútico União", "Sogipa", "Caxias do Sul Basquete", "Corinthians de Santa Cruz",
    "Cruzeiro", "Flyboys", "Richmond", "Sinodal", "Recreio da Juventude", "Dunk Basquete",
    "Ceat Lajeado", "Apaebask"
  ]
  
  const cities = ["Porto Alegre", "Porto Alegre", "Caxias do Sul", "Santa Cruz do Sul", "Porto Alegre", "Candelária", "Novo Hamburgo", "São Leopoldo", "Caxias do Sul", "Gravataí", "Lajeado", "Bento Gonçalves"]

  const teams = []
  for (let i = 0; i < teamNames.length; i++) {
    const coach = await prisma.user.create({
      data: {
        name: `Coach ${teamNames[i]}`,
        email: `coach${i}@fgb.com.br`,
        password: defaultPassword,
        defaultRole: 'HEAD_COACH',
      }
    })

    const team = await prisma.team.create({
      data: {
        name: teamNames[i],
        city: cities[i],
        state: 'RS',
        sex: 'masculino',
      }
    })

    await prisma.teamMembership.create({
      data: { userId: coach.id, teamId: team.id, role: 'HEAD_COACH', status: 'ACTIVE', approvedAt: new Date() }
    })

    // Ginásio da equipe
    await prisma.gym.create({
      data: {
        name: `Ginásio ${teamNames[i]}`,
        address: `Rua das Cestas, ${100 + i}`,
        city: cities[i],
        capacity: 500,
        availability: 'Sábados e Domingos',
        canHost: i % 3 === 0,
        teamId: team.id,
      }
    })

    teams.push(team)
  }

  // 4. Criar Campeonato
  const championship = await prisma.championship.create({
    data: {
      name: 'Copa RS 2026 - Teste de Fluxo',
      description: 'Campeonato simulado para teste de todas as funcionalidades.',
      sex: 'masculino',
      format: 'grupos_e_eliminatorias',
      minTeamsPerCat: 4,
      startDate: new Date('2026-06-01'),
      endDate: new Date('2026-12-15'),
      regDeadline: new Date('2026-05-15'),
      status: 'REGISTRATION_OPEN',
    }
  })

  const sub15 = await prisma.championshipCategory.create({
    data: { name: 'Sub 15', championshipId: championship.id, isViable: false }
  })
  const sub17 = await prisma.championshipCategory.create({
    data: { name: 'Sub 17', championshipId: championship.id, isViable: false }
  })

  // 5. Inscrições Manuais
  console.log('📝 Criando inscrições...')
  for (let i = 0; i < 12; i++) {
    const catId = i < 6 ? sub15.id : sub17.id
    const reg = await prisma.registration.create({
      data: {
        championshipId: championship.id,
        teamId: teams[i].id,
        status: i < 5 ? 'CONFIRMED' : 'PENDING',
        canHost: i % 4 === 0,
        gymName: i % 4 === 0 ? `Ginásio Central ${teams[i].name}` : null,
        observations: i === 0 ? 'Equipe principal, solicita jogos aos sábados.' : null,
        categories: { create: { categoryId: catId } }
      }
    })
    
    if (i < 3) {
      await prisma.blockedDate.create({
        data: {
          registrationId: reg.id,
          startDate: nextSaturday(new Date('2026-06-01')),
          endDate: nextSunday(new Date('2026-06-01')),
          reason: 'Viagem Federativa'
        }
      })
    }
  }

  // 6. Atualizar viabilidade
  const confirmedSub15 = await prisma.registration.count({
    where: { championshipId: championship.id, status: 'CONFIRMED', categories: { some: { categoryId: sub15.id } } }
  })
  const confirmedSub17 = await prisma.registration.count({
    where: { championshipId: championship.id, status: 'CONFIRMED', categories: { some: { categoryId: sub17.id } } }
  })

  await prisma.championshipCategory.update({ where: { id: sub15.id }, data: { isViable: confirmedSub15 >= 4 } })
  await prisma.championshipCategory.update({ where: { id: sub17.id }, data: { isViable: confirmedSub17 >= 4 } })

  // 7. Simular uma Fase de Grupos
  console.log('📅 Criando jogos e blocos...')
  const block = await prisma.block.create({
    data: {
      name: 'Bloco 1 - Abertura',
      championshipId: championship.id,
      categories: 'Sub 15, Sub 17'
    }
  })

  const homeTeam = teams[0]
  const awayTeam = teams[1]
  await prisma.game.create({
    data: {
      championshipId: championship.id,
      categoryId: sub15.id,
      blockId: block.id,
      homeTeamId: homeTeam.id,
      awayTeamId: awayTeam.id,
      phase: 1,
      dateTime: new Date('2026-06-06T14:00:00Z'),
      location: `Ginásio ${homeTeam.name}`,
      city: homeTeam.city || 'POA',
      status: 'FINISHED',
      homeScore: 78,
      awayScore: 72
    }
  })

  // 8. Criar Classificações Iniciais
  console.log('📊 Gerando classificações...')
  const teamsInSub15 = [teams[0], teams[1], teams[2], teams[3]]
  for (const team of teamsInSub15) {
    await prisma.standing.create({
      data: {
        categoryId: sub15.id,
        teamId: team.id,
        played: team.id === homeTeam.id || team.id === awayTeam.id ? 1 : 0,
        wins: team.id === homeTeam.id ? 1 : 0,
        losses: team.id === awayTeam.id ? 1 : 0,
        points: team.id === homeTeam.id ? 2 : (team.id === awayTeam.id ? 1 : 0),
        pointsFor: team.id === homeTeam.id ? 78 : (team.id === awayTeam.id ? 72 : 0),
        pointsAg: team.id === homeTeam.id ? 72 : (team.id === awayTeam.id ? 78 : 0),
      }
    })
  }

  console.log('✅ TEST FLOW SEED FINALIZADO!')
  await prisma.$disconnect()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
