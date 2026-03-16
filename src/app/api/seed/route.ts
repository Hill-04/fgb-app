import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'

// Secret key to protect this endpoint
const SEED_SECRET = process.env.SEED_SECRET || 'fgb-seed-2026'

export async function POST(req: Request) {
  try {
    const { secret } = await req.json()
    if (secret !== SEED_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('🌱 Starting production seed...')

    // 1. Admin user
    const adminEmail = process.env.SUPREME_ADMIN_EMAIL || 'brayanalexguarnieri@gmail.com'
    const hashedPassword = await bcrypt.hash('fgb@2026admin', 10)
    const admin = await prisma.user.upsert({
      where: { email: adminEmail },
      update: {},
      create: { name: 'Admin FGB', email: adminEmail, password: hashedPassword, isAdmin: true }
    })

    // 2. Create teams
    const teamDefs = [
      { name: 'Pinheiros Basquete', city: 'Porto Alegre' },
      { name: 'SOGIPA Júnior', city: 'Porto Alegre' },
      { name: 'Caxias Basketball', city: 'Caxias do Sul' },
      { name: 'Pelotas Esporte', city: 'Pelotas' },
      { name: 'Serra Gaúcha BC', city: 'Bento Gonçalves' },
      { name: 'FGU Basquete', city: 'Santa Maria' },
      { name: 'Vale do Sinos', city: 'Novo Hamburgo' },
      { name: 'FSul Atletismo', city: 'Pelotas' },
    ]

    const teams: any[] = []
    for (const def of teamDefs) {
      const userEmail = `${def.name.toLowerCase().replace(/\s+/g, '.')}@fgb.test`
      const user = await prisma.user.upsert({
        where: { email: userEmail },
        update: {},
        create: {
          name: `Responsável — ${def.name}`,
          email: userEmail,
          password: await bcrypt.hash('fgb@2026', 10),
          isAdmin: false
        }
      })
      
      const team = await prisma.team.upsert({
        where: { name: def.name },
        update: {},
        create: { 
          name: def.name, 
          city: def.city,
          gym: {
            create: {
              name: `Ginásio ${def.name}`,
              address: `Rua das Flores, 100`,
              city: def.city,
              capacity: 500,
              availability: 'sabado_domingo'
            }
          }
        }
      })

      await prisma.teamMembership.upsert({
        where: { userId: user.id },
        update: {},
        create: { userId: user.id, teamId: team.id, role: 'ADMIN', status: 'ACTIVE' }
      })
      teams.push(team)
    }

    // 3. Championship
    const regDeadline = new Date()
    regDeadline.setDate(regDeadline.getDate() - 30)
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - 20)
    const endDate = new Date()
    endDate.setDate(endDate.getDate() + 60)

    // Using findFirst because name is not unique in schema
    let championship = await prisma.championship.findFirst({
      where: { name: 'Campeonato Estadual FGB 2026' }
    })

    if (!championship) {
      championship = await prisma.championship.create({
        data: {
          name: 'Campeonato Estadual FGB 2026',
          description: 'Campeonato oficial estadual da Federação Gaúcha de Basquete - Temporada 2026',
          sex: 'misto',
          minTeamsPerCat: 4,
          regDeadline,
          startDate,
          endDate,
          status: 'ONGOING',
        }
      })
    }

    // 4. Categories
    const catMasc = await prisma.championshipCategory.upsert({
      where: { championshipId_name: { championshipId: championship.id, name: 'Adulto Masculino' } },
      update: {},
      create: { championshipId: championship.id, name: 'Adulto Masculino' }
    })
    const catFem = await prisma.championshipCategory.upsert({
      where: { championshipId_name: { championshipId: championship.id, name: 'Adulto Feminino' } },
      update: {},
      create: { championshipId: championship.id, name: 'Adulto Feminino' }
    })

    // 5. Registrations
    const mascTeams = teams.slice(0, 4)
    const femTeams = teams.slice(4, 8)

    for (const team of mascTeams) {
      await prisma.registration.upsert({
        where: { championshipId_teamId: { teamId: team.id, championshipId: championship.id } },
        update: {},
        create: { 
          teamId: team.id, 
          championshipId: championship.id, 
          status: 'CONFIRMED',
          categories: {
            create: { categoryId: catMasc.id }
          }
        }
      })
    }
    for (const team of femTeams) {
      await prisma.registration.upsert({
        where: { championshipId_teamId: { teamId: team.id, championshipId: championship.id } },
        update: {},
        create: { 
          teamId: team.id, 
          championshipId: championship.id, 
          status: 'CONFIRMED',
          categories: {
            create: { categoryId: catFem.id }
          }
        }
      })
    }

    // 6. Games with completed results
    const gameData = [
      { homeIdx: 0, awayIdx: 1, catId: catMasc.id, homeScore: 82, awayScore: 71, daysAgo: 15, status: 'COMPLETED' as const },
      { homeIdx: 2, awayIdx: 3, catId: catMasc.id, homeScore: 65, awayScore: 79, daysAgo: 15, status: 'COMPLETED' as const },
      { homeIdx: 0, awayIdx: 2, catId: catMasc.id, homeScore: 90, awayScore: 88, daysAgo: 8, status: 'COMPLETED' as const },
      { homeIdx: 1, awayIdx: 3, catId: catMasc.id, homeScore: 74, awayScore: 68, daysAgo: 8, status: 'COMPLETED' as const },
      { homeIdx: 0, awayIdx: 3, catId: catMasc.id, homeScore: null, awayScore: null, daysAgo: -7, status: 'SCHEDULED' as const },
      { homeIdx: 1, awayIdx: 2, catId: catMasc.id, homeScore: null, awayScore: null, daysAgo: -7, status: 'SCHEDULED' as const },
      { homeIdx: 4, awayIdx: 5, catId: catFem.id, homeScore: 58, awayScore: 63, daysAgo: 14, status: 'COMPLETED' as const },
      { homeIdx: 6, awayIdx: 7, catId: catFem.id, homeScore: 71, awayScore: 59, daysAgo: 14, status: 'COMPLETED' as const },
      { homeIdx: 4, awayIdx: 6, catId: catFem.id, homeScore: 67, awayScore: 72, daysAgo: 7, status: 'COMPLETED' as const },
      { homeIdx: 5, awayIdx: 7, catId: catFem.id, homeScore: 80, awayScore: 75, daysAgo: 7, status: 'COMPLETED' as const },
      { homeIdx: 5, awayIdx: 6, catId: catFem.id, homeScore: null, awayScore: null, daysAgo: -8, status: 'SCHEDULED' as const },
      { homeIdx: 4, awayIdx: 7, catId: catFem.id, homeScore: null, awayScore: null, daysAgo: -8, status: 'SCHEDULED' as const },
    ]

    await prisma.game.deleteMany({ where: { championshipId: championship.id } })

    for (const g of gameData) {
      const gameDate = new Date()
      gameDate.setDate(gameDate.getDate() - g.daysAgo)
      await prisma.game.create({
        data: {
          championshipId: championship.id!,
          categoryId: g.catId,
          homeTeamId: teams[g.homeIdx].id,
          awayTeamId: teams[g.awayIdx].id,
          homeScore: g.homeScore,
          awayScore: g.awayScore,
          dateTime: gameDate,
          location: `Arena ${teams[g.homeIdx].name}`,
          city: teams[g.homeIdx].city,
          status: g.status,
          phase: 1
        }
      })
    }

    return NextResponse.json({
      success: true,
      data: {
        championship: championship.name,
        teams: teams.length,
        games: gameData.length
      }
    })
  } catch (error: any) {
    console.error('Seed error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ message: 'Use POST with secret' })
}
