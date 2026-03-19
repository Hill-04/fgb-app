import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

const SIM_NAME = 'Simulação Estadual 2026 — Masculino'

function rand(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

// Round-robin fixture generator
function roundRobin(teams: string[]): [string, string][] {
  const fixtures: [string, string][] = []
  for (let i = 0; i < teams.length - 1; i++) {
    for (let j = i + 1; j < teams.length; j++) {
      fixtures.push([teams[i], teams[j]])
    }
  }
  return fixtures
}

// Get weekends between two dates
function getWeekends(start: Date, end: Date): Date[] {
  const saturdays: Date[] = []
  const d = new Date(start)
  while (d <= end) {
    if (d.getDay() === 6) saturdays.push(new Date(d))
    d.setDate(d.getDate() + 1)
  }
  return saturdays
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session || !(session.user as any).isAdmin) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const { config } = await request.json()
  const { 
    name = SIM_NAME, 
    sex = 'masculino', 
    categories = ['Sub 13', 'Sub 15', 'Sub 17'],
    teamIds = [] // List of specific team IDs to include
  } = config || {}

  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      function emit(data: object) {
        controller.enqueue(encoder.encode(JSON.stringify(data) + '\n'))
      }

      try {
        // ─── STEP 1: Create Championship ───────────────────────────────
        emit({ step: 1, label: 'Criar Campeonato', status: 'loading' })

        const championship = await prisma.championship.create({
          data: {
            name: `${name} (Simulação)`,
            description: 'Campeonato de simulação para demonstração do sistema',
            sex,
            format: 'todos_contra_todos',
            phases: 1,
            minTeamsPerCat: 2,
            startDate: new Date('2026-05-01'),
            endDate: new Date('2026-10-31'),
            regDeadline: new Date('2026-04-15'),
            status: 'REGISTRATION_OPEN',
            isSimulation: true,
          } as any
        })

        // Create categories
        const createdCategories: any[] = []
        for (const catName of categories) {
          const cat = await prisma.championshipCategory.create({ 
            data: { name: catName, championshipId: championship.id } 
          })
          createdCategories.push(cat)
        }

        emit({ step: 1, label: 'Criar Campeonato', status: 'done', detail: `ID: ${championship.id.slice(0, 8)}...` })

        // ─── STEP 2: Register Teams ────────────────────────────────────
        emit({ step: 2, label: 'Inscrever Equipes', status: 'loading' })

        let teamsToRegister: any[] = []
        if (teamIds.length > 0) {
          teamsToRegister = await prisma.team.findMany({ where: { id: { in: teamIds } } })
        } else {
          const defaultTeamNames = ['Flyboys', 'Sogipa', 'Amb', 'Sinodal', 'Recreio', 'Richmond', 'Sojao', 'Dunk', 'Juvenil']
          teamsToRegister = await prisma.team.findMany({ 
            where: { name: { in: defaultTeamNames } },
            take: 9
          })
        }

        const catMap: Record<string, any> = {}
        createdCategories.forEach(c => { catMap[c.name] = c })

        const hostTeams = teamsToRegister.slice(0, 3).map(t => t.name)
        const weekends = getWeekends(new Date('2026-05-01'), new Date('2026-10-31'))

        for (const team of teamsToRegister) {
          const gym = await prisma.gym.findFirst({ where: { teamId: team.id } })
          const canHost = hostTeams.includes(team.name)

          const pickedCats = (categories as string[])
            .sort(() => Math.random() - 0.5)
            .slice(0, rand(1, categories.length))

          const reg = await prisma.registration.create({
            data: {
              championshipId: championship.id,
              teamId: team.id,
              status: 'CONFIRMED',
              canHost,
              gymName: canHost && gym ? gym.name : null,
              gymAddress: canHost && gym ? gym.address : null,
              gymCity: canHost && gym ? gym.city : null,
              categories: {
                create: pickedCats.map(catName => ({ categoryId: catMap[catName].id }))
              }
            }
          })

          const numBlocked = rand(1, 2)
          const pickedWeekends = [...weekends].sort(() => Math.random() - 0.5).slice(0, numBlocked)
          for (const sat of pickedWeekends) {
            await prisma.blockedDate.create({
              data: {
                registrationId: reg.id,
                startDate: sat,
                endDate: new Date(sat.getTime() + 86400000),
                reason: 'Indisponibilidade simulada'
              }
            })
          }
        }

        emit({ step: 2, label: 'Inscrever Equipes', status: 'done', detail: `${teamsToRegister.length} equipes inscritas` })

        // ─── STEP 3: Validate Categories ───────────────────────────────
        emit({ step: 3, label: 'Validar Categorias', status: 'loading' })

        for (const cat of createdCategories) {
          const count = await prisma.registrationCategory.count({ where: { categoryId: cat.id } })
          if (count >= 2) {
            await prisma.championshipCategory.update({ where: { id: cat.id }, data: { isViable: true } })
          }
        }

        await prisma.championship.update({ where: { id: championship.id }, data: { status: 'ONGOING' } })

        emit({ step: 3, label: 'Validar Categorias', status: 'done', detail: `${createdCategories.length} categorias validadas` })

        // ─── STEP 4: Generate Fixtures ─────────────────────────────────
        emit({ step: 4, label: 'Gerar Confrontos da Fase 1', status: 'loading' })

        type GameDef = { homeTeamId: string; awayTeamId: string; categoryId: string }
        const allFixtures: GameDef[] = []
        let totalCreatedCount = 0

        for (const cat of createdCategories) {
          const regs = await prisma.registrationCategory.findMany({
            where: { categoryId: cat.id },
            include: { registration: { include: { team: true } } }
          })
          const teams = regs.map(r => r.registration.team)
          const fixtures = roundRobin(teams.map(t => t.id))

          for (const [h, a] of fixtures) {
            allFixtures.push({ homeTeamId: h, awayTeamId: a, categoryId: cat.id })
          }
          totalCreatedCount += fixtures.length
        }

        emit({ step: 4, label: 'Gerar Confrontos da Fase 1', status: 'done', detail: `${totalCreatedCount} jogos criados em ${createdCategories.length} categorias` })

        // ─── STEP 5: Schedule Dates ────────────────────────────────────
        emit({ step: 5, label: 'Definir Datas e Locais', status: 'loading' })

        const locations = teamsToRegister.filter(t => hostTeams.includes(t.name)).map(t => ({
          city: t.city || 'Sede',
          gymName: `Ginásio ${t.name}`,
          teamId: t.id
        }))

        if (locations.length === 0) {
          locations.push({ city: 'Porto Alegre', gymName: 'Ginásio Tesourinha', teamId: null as any })
        }

        const createdGames: any[] = []
        let weekendIdx = 0
        for (const fix of allFixtures) {
          const loc = locations[weekendIdx % locations.length]
          const sat = weekends[weekendIdx % weekends.length]
          const gameDate = new Date(sat)
          gameDate.setHours(rand(9, 18), 0, 0, 0)

          const g = await prisma.game.create({
            data: {
              championshipId: championship.id,
              categoryId: fix.categoryId,
              homeTeamId: fix.homeTeamId,
              awayTeamId: fix.awayTeamId,
              dateTime: gameDate,
              location: loc.gymName,
              city: loc.city,
              phase: 1,
              status: 'SCHEDULED'
            }
          })
          createdGames.push(g)
          weekendIdx++
        }

        emit({ step: 5, label: 'Definir Datas e Locais', status: 'done', detail: `${createdGames.length} jogos agendados` })

        // ─── STEP 6: Simulate Results ──────────────────────────────────
        emit({ step: 6, label: 'Simular Resultados', status: 'loading' })

        for (const game of createdGames) {
          const homeScore = rand(50, 95)
          let awayScore = rand(50, 95)
          if (homeScore === awayScore) awayScore = awayScore > 50 ? awayScore - 1 : awayScore + 1

          await prisma.game.update({
            where: { id: game.id },
            data: { homeScore, awayScore, status: 'FINISHED' }
          })
        }

        for (const cat of createdCategories) {
          const games = await prisma.game.findMany({
            where: { categoryId: cat.id, status: 'FINISHED' }
          })
          const regs = await prisma.registrationCategory.findMany({
            where: { categoryId: cat.id },
            include: { registration: true }
          })
          const teamIdsArr = regs.map(r => r.registration.teamId)
          
          const stats: Record<string, any> = {}
          teamIdsArr.forEach(id => { 
            stats[id] = { teamId: id, categoryId: cat.id, played: 0, wins: 0, losses: 0, points: 0, pointsFor: 0, pointsAg: 0 } 
          })

          for (const g of games) {
            if (g.homeScore === null || g.awayScore === null) continue
            stats[g.homeTeamId].played++; stats[g.awayTeamId].played++
            stats[g.homeTeamId].pointsFor += g.homeScore; stats[g.homeTeamId].pointsAg += g.awayScore
            stats[g.awayTeamId].pointsFor += g.awayScore; stats[g.awayTeamId].pointsAg += g.homeScore
            if (g.homeScore > g.awayScore) { 
              stats[g.homeTeamId].wins++; stats[g.homeTeamId].points += 2; 
              stats[g.awayTeamId].losses++; stats[g.awayTeamId].points += 1 
            } else { 
              stats[g.awayTeamId].wins++; stats[g.awayTeamId].points += 2; 
              stats[g.homeTeamId].losses++; stats[g.homeTeamId].points += 1 
            }
          }

          for (const teamId of Object.keys(stats)) {
            await prisma.standing.create({ data: stats[teamId] })
          }
        }

        emit({ step: 6, label: 'Simular Resultados', status: 'done', detail: `${createdGames.length} jogos concluídos` })

        // ─── STEP 7: Summary ───────────────────────────────────────────
        emit({ step: 7, label: 'Resumo Final', status: 'loading' })

        emit({
          step: 7, label: 'Resumo Final', status: 'done',
          detail: 'Simulação concluída e salva com sucesso!',
          summary: {
            championshipId: championship.id,
            championshipName: championship.name,
            totalGames: createdGames.length,
            isSimulation: true
          }
        })

      } catch (err: any) {
        emit({ step: -1, label: 'Erro', status: 'error', detail: err.message })
      } finally {
        controller.close()
      }
    }
  })

  return new Response(stream, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Transfer-Encoding': 'chunked' }
  })
}
