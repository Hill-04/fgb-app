import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting simulation seed...')

  // 1. Ensure a Supreme Admin exists
  const admin = await prisma.user.upsert({
    where: { email: 'brayanalexguarnieri@gmail.com' },
    update: {},
    create: {
      email: 'brayanalexguarnieri@gmail.com',
      name: 'Brayan Admin',
      password: 'password123', // In real app, this should be hashed
      isAdmin: true,
    },
  })
  console.log('✅ Admin ensured:', admin.email)

  // 2. Create Teams
  const teamsData = [
    { name: 'Porto Alegre Hornets', city: 'Porto Alegre', sex: 'masculino' },
    { name: 'Caxias Basketball', city: 'Caxias do Sul', sex: 'masculino' },
    { name: 'Santa Maria Soldiers', city: 'Santa Maria', sex: 'masculino' },
    { name: 'Pelotas Sharks', city: 'Pelotas', sex: 'masculino' },
    { name: 'Gramado Queens', city: 'Gramado', sex: 'feminino' },
    { name: 'Bento Stars', city: 'Bento Gonçalves', sex: 'feminino' },
    { name: 'Lajeado Valkyries', city: 'Lajeado', sex: 'feminino' },
    { name: 'Passo Fundo Phoenix', city: 'Passo Fundo', sex: 'feminino' },
  ]

  const teams = []
  for (const t of teamsData) {
    const team = await prisma.team.upsert({
      where: { name: t.name },
      update: {},
      create: t,
    })
    teams.push(team)
  }
  console.log('✅ Teams ensured:', teams.length)

  // 3. Create Championship (Estadual 2026)
  const champ = await prisma.championship.create({
    data: {
      name: 'Campeonato Estadual FGB 2026',
      year: 2026,
      sex: 'misto',
      description: 'O maior campeonato de basquete do Rio Grande do Sul.',
      status: 'ONGOING',
      regDeadline: new Date('2026-03-01'),
      categories: {
        create: [
          { name: 'Adulto Masculino', isViable: true },
          { name: 'Adulto Feminino', isViable: true },
        ]
      }
    },
    include: { categories: true }
  })
  console.log('✅ Championship created:', champ.name)

  const catMasculino = champ.categories.find(c => c.name === 'Adulto Masculino')!
  const catFeminino = champ.categories.find(c => c.name === 'Adulto Feminino')!

  // 4. Register Teams and Generate Games
  const maleTeams = teams.filter(t => t.sex === 'masculino')
  const femaleTeams = teams.filter(t => t.sex === 'feminino')

  // Helper to generate a simple round robin
  async function seedCategory(category: any, teams: any[]) {
    // Register teams
    for (const team of teams) {
      const reg = await prisma.registration.create({
        data: {
          championshipId: champ.id,
          teamId: team.id,
          status: 'CONFIRMED',
          categories: {
            create: { categoryId: category.id }
          }
        }
      })

      // Create initial standing
      await prisma.standing.upsert({
        where: { teamId_categoryId: { teamId: team.id, categoryId: category.id } },
        update: {},
        create: {
          teamId: team.id,
          categoryId: category.id,
        }
      })
    }

    // Create some games
    const games = []
    for (let i = 0; i < teams.length; i++) {
      for (let j = i + 1; j < teams.length; j++) {
        const isCompleted = Math.random() > 0.4
        const game = await prisma.game.create({
          data: {
            championshipId: champ.id,
            categoryId: category.id,
            homeTeamId: teams[i].id,
            awayTeamId: teams[j].id,
            phase: 1,
            dateTime: new Date(2026, 3, 15 + i + j, 19, 0),
            location: `Ginasio ${teams[i].city}`,
            city: teams[i].city!,
            status: isCompleted ? 'COMPLETED' : 'SCHEDULED',
            homeScore: isCompleted ? Math.floor(Math.random() * 40) + 60 : null,
            awayScore: isCompleted ? Math.floor(Math.random() * 40) + 60 : null,
          }
        })
        games.push(game)
      }
    }
    console.log(`✅ Seeded ${games.length} games for ${category.name}`)
  }

  await seedCategory(catMasculino, maleTeams)
  await seedCategory(catFeminino, femaleTeams)

  console.log('✨ Simulation seed completed!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
