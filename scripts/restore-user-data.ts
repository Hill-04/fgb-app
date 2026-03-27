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

  console.log('🔄 Iniciando RESTAURAÇÃO de dados de teste...')

  // 1. Recriar "Teste Estadual"
  console.log('🏆 Recriando: Teste Estadual')
  const championship = await prisma.championship.upsert({
    where: { id: 'test-estadual-id' },
    update: { status: 'REGISTRATION_OPEN' },
    create: {
      id: 'test-estadual-id',
      name: 'Teste Estadual',
      year: 2026,
      sex: 'masculino',
      format: 'todos_contra_todos',
      phases: 1,
      minTeamsPerCat: 3,
      startDate: new Date('2026-06-01'),
      endDate: new Date('2026-06-30'),
      regDeadline: new Date('2026-05-30'),
      status: 'REGISTRATION_OPEN'
    }
  })

  // 2. Categorias
  const categories = ['Sub-12', 'Sub-13', 'Sub-14']
  const catIds: string[] = []
  
  for (const catName of categories) {
    const cat = await prisma.championshipCategory.upsert({
      where: { championshipId_name: { championshipId: championship.id, name: catName } },
      update: { isViable: true },
      create: {
        name: catName,
        championshipId: championship.id,
        isViable: true
      }
    })
    catIds.push(cat.id)
    console.log(`✅ Categoria criada: ${catName}`)
  }

  // 3. Equipes e Inscrições (3 por categoria)
  console.log('👥 Inscrevendo equipes...')
  const teamsResult = await prisma.team.findMany({ take: 10 })
  
  if (teamsResult.length < 9) {
    console.warn('⚠️ Menos de 9 equipes no banco. Recomendado rodar o seed-robust antes.')
  }

  for (let i = 0; i < catIds.length; i++) {
    const catId = catIds[i]
    const catTeams = teamsResult.slice(i * 3, (i * 3) + 3)

    for (const team of catTeams) {
      // Inscrição Geral
      const reg = await prisma.registration.upsert({
        where: { championshipId_teamId: { championshipId: championship.id, teamId: team.id } },
        update: { status: 'CONFIRMED' },
        create: {
          championshipId: championship.id,
          teamId: team.id,
          status: 'CONFIRMED'
        }
      })

      // Inscrição na Categoria
      await prisma.registrationCategory.upsert({
        where: { registrationId_categoryId: { registrationId: reg.id, categoryId: catId } },
        update: {},
        create: {
          registrationId: reg.id,
          categoryId: catId
        }
      })
    }
    console.log(`✅ Categoria ${categories[i]} preenchida com 3 equipes.`)
  }

  // 4. Outros campeonatos de teste solicitados
  console.log('🏆 Recriando outros testes...')
  await prisma.championship.upsert({
    where: { id: 'test-extra-1' },
    update: {},
    create: {
      id: 'test-extra-1',
      name: 'Copa Verão — Validação',
      year: 2026,
      status: 'DRAFT',
      regDeadline: new Date()
    }
  })

  await prisma.championship.upsert({
    where: { id: 'test-extra-2' },
    update: {},
    create: {
      id: 'test-extra-2',
      name: 'Torneio Aberto',
      year: 2026,
      status: 'DRAFT',
      regDeadline: new Date()
    }
  })

  console.log('✨ Restauração concluída com sucesso!')
  await prisma.$disconnect()
}

main().catch(console.error)
