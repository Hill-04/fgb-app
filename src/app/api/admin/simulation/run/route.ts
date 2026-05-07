import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

const SIM_NAME = 'Simulação Estadual 2026 — Masculino'

function rand(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function roundRobin(teams: string[]): [string, string][] {
  const fixtures: [string, string][] = []
  for (let i = 0; i < teams.length - 1; i++) {
    for (let j = i + 1; j < teams.length; j++) {
      fixtures.push([teams[i], teams[j]])
    }
  }
  return fixtures
}

function getWeekends(start: Date, end: Date): Date[] {
  const saturdays: Date[] = []
  const d = new Date(start)
  while (d <= end) {
    if (d.getDay() === 6) saturdays.push(new Date(d))
    d.setDate(d.getDate() + 1)
  }
  return saturdays
}

function distributePoints(total: number, n: number): number[] {
  const weights = Array.from({ length: n }, (_, i) => Math.pow(0.65, i) + Math.random() * 0.3)
  const wSum = weights.reduce((a, b) => a + b, 0)
  const pts = weights.map(w => Math.floor(w / wSum * total))
  let diff = total - pts.reduce((a, b) => a + b, 0)
  let i = 0
  while (diff > 0) { pts[i % n]++; diff--; i++ }
  return pts
}

function splitIntoQuarters(total: number): number[] {
  const weights = Array.from({ length: 4 }, () => 0.5 + Math.random())
  const wSum = weights.reduce((a, b) => a + b, 0)
  const pts = weights.map(w => Math.floor(w / wSum * total))
  let diff = total - pts.reduce((a, b) => a + b, 0)
  let i = 0
  while (diff > 0) { pts[i % 4]++; diff--; i++ }
  return pts
}

function simulateShots(pts: number) {
  if (pts === 0) {
    return { twoPtMade: 0, twoPtAttempted: rand(0, 4), threePtMade: 0, threePtAttempted: rand(0, 3), freeThrowsMade: 0, freeThrowsAttempted: 0 }
  }
  const maxThrees = Math.min(Math.floor(pts / 3), 5)
  const threePtMade = rand(0, maxThrees)
  const remaining = pts - threePtMade * 3
  const maxFT = Math.min(remaining, 8)
  const ftCap = maxFT % 2 === remaining % 2 ? maxFT : maxFT - 1
  const ftParityMax = Math.floor(ftCap / 2)
  const freeThrowsMade = rand(0, Math.max(0, ftParityMax)) * 2 + (remaining % 2)
  const twoPtMade = (remaining - freeThrowsMade) / 2
  return {
    twoPtMade,
    twoPtAttempted: twoPtMade + rand(0, Math.max(1, Math.round(twoPtMade * 0.8) + 1)),
    threePtMade,
    threePtAttempted: threePtMade + rand(0, Math.max(1, Math.round(threePtMade * 2) + 2)),
    freeThrowsMade,
    freeThrowsAttempted: freeThrowsMade + rand(0, Math.max(0, Math.ceil(freeThrowsMade * 0.3))),
  }
}

const FIRST_NAMES = [
  'Lucas', 'Gabriel', 'Matheus', 'Rafael', 'Felipe', 'Pedro', 'Bruno', 'Diego', 'Thiago', 'Guilherme',
  'André', 'Carlos', 'Eduardo', 'Fernando', 'Gustavo', 'Henrique', 'João', 'Leonardo', 'Marcelo', 'Nicolas',
  'Paulo', 'Ricardo', 'Rodrigo', 'Samuel', 'Vitor', 'Alexandre', 'Caio', 'Daniel', 'Enzo', 'Fábio',
]
const LAST_NAMES = [
  'Silva', 'Santos', 'Oliveira', 'Souza', 'Lima', 'Costa', 'Ferreira', 'Rodrigues', 'Almeida', 'Nascimento',
  'Carvalho', 'Pereira', 'Nunes', 'Gomes', 'Martins', 'Barbosa', 'Araújo', 'Moraes', 'Melo', 'Castro',
  'Campos', 'Cardoso', 'Correia', 'Dias', 'Figueiredo', 'Freitas', 'Gonçalves', 'Lopes', 'Machado', 'Mendes',
]
const COACH_FIRST = ['Roberto', 'Marcelo', 'Paulo', 'Carlos', 'Sérgio', 'Fábio', 'Alexandre', 'Renato', 'Wilson', 'Márcio']
const COACH_LAST  = ['Rodrigues', 'Costa', 'Pereira', 'Silva', 'Santos', 'Oliveira', 'Lima', 'Ferreira', 'Nunes', 'Braga']
const OFFICIAL_NAMES = [
  'Antônio Alves', 'José Ribeiro', 'Francisco Sousa', 'João Carvalho', 'Pedro Menezes',
  'Marcos Lima', 'Luis Figueira', 'Paulo Braga', 'Sandro Neves', 'Valter Cruz',
  'Eduardo Pinto', 'Renato Lopes', 'Cláudio Ramos', 'Wilson Freitas', 'Márcio Duarte',
]
const POSITIONS_POOL = [
  'POINT_GUARD', 'POINT_GUARD',
  'SHOOTING_GUARD', 'SHOOTING_GUARD',
  'SMALL_FORWARD', 'SMALL_FORWARD',
  'POWER_FORWARD', 'POWER_FORWARD',
  'CENTER', 'CENTER',
]

function randomName() { return `${FIRST_NAMES[rand(0, FIRST_NAMES.length - 1)]} ${LAST_NAMES[rand(0, LAST_NAMES.length - 1)]}` }
function randomCoach() { return `${COACH_FIRST[rand(0, COACH_FIRST.length - 1)]} ${COACH_LAST[rand(0, COACH_LAST.length - 1)]}` }
function randomOfficial() { return OFFICIAL_NAMES[rand(0, OFFICIAL_NAMES.length - 1)] }

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
    teamIds = []
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

        emit({ step: 4, label: 'Gerar Confrontos da Fase 1', status: 'done', detail: `${totalCreatedCount} jogos em ${createdCategories.length} categorias` })

        // ─── STEP 5: Schedule Dates ────────────────────────────────────
        emit({ step: 5, label: 'Definir Datas e Locais', status: 'loading' })

        const locations = teamsToRegister.filter(t => hostTeams.includes(t.name)).map(t => ({
          city: t.city || 'Sede',
          gymName: `Ginásio ${t.name}`,
        }))
        if (locations.length === 0) {
          locations.push({ city: 'Porto Alegre', gymName: 'Ginásio Tesourinha' })
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
          game.homeScore = homeScore
          game.awayScore = awayScore
        }

        for (const cat of createdCategories) {
          const games = await prisma.game.findMany({ where: { categoryId: cat.id, status: 'FINISHED' } })
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
              stats[g.homeTeamId].wins++; stats[g.homeTeamId].points += 2
              stats[g.awayTeamId].losses++; stats[g.awayTeamId].points += 1
            } else {
              stats[g.awayTeamId].wins++; stats[g.awayTeamId].points += 2
              stats[g.homeTeamId].losses++; stats[g.homeTeamId].points += 1
            }
          }
          for (const teamId of Object.keys(stats)) {
            await prisma.standing.create({ data: stats[teamId] })
          }
        }

        emit({ step: 6, label: 'Simular Resultados', status: 'done', detail: `${createdGames.length} jogos concluídos + classificação gerada` })

        // ─── STEP 7: Create Simulation Athletes ───────────────────────
        emit({ step: 7, label: 'Criar Atletas Simulados', status: 'loading' })

        const teamAthletes = new Map<string, string[]>()
        let totalAthletes = 0

        for (const team of teamsToRegister) {
          const usedJerseys = new Set<number>()
          const positions = [...POSITIONS_POOL].sort(() => Math.random() - 0.5)
          const athleteIds: string[] = []

          for (let i = 0; i < 10; i++) {
            let jersey: number
            do { jersey = rand(4, 99) } while (usedJerseys.has(jersey))
            usedJerseys.add(jersey)

            const athlete = await prisma.athlete.create({
              data: {
                name: randomName(),
                position: positions[i],
                jerseyNumber: jersey,
                sex,
                status: 'ACTIVE',
                federationStatus: 'SIMULATION',
                teamId: team.id,
              }
            })
            athleteIds.push(athlete.id)
            totalAthletes++
          }
          teamAthletes.set(team.id, athleteIds)
        }

        emit({ step: 7, label: 'Criar Atletas Simulados', status: 'done', detail: `${totalAthletes} atletas (${teamsToRegister.length} equipes × 10)` })

        // ─── STEP 8: Generate Súmulas ──────────────────────────────────
        emit({ step: 8, label: 'Gerar Súmulas Completas', status: 'loading' })

        let totalStatLines = 0

        for (const game of createdGames) {
          if (game.homeScore === null || game.awayScore === null) continue

          const homeAthleteIds = teamAthletes.get(game.homeTeamId) ?? []
          const awayAthleteIds = teamAthletes.get(game.awayTeamId) ?? []
          if (homeAthleteIds.length === 0 || awayAthleteIds.length === 0) continue

          // Rosters
          const homeRoster = await prisma.gameRoster.create({
            data: { gameId: game.id, teamId: game.homeTeamId, coachName: randomCoach(), assistantCoachName: randomCoach() }
          })
          const awayRoster = await prisma.gameRoster.create({
            data: { gameId: game.id, teamId: game.awayTeamId, coachName: randomCoach(), assistantCoachName: randomCoach() }
          })

          // Roster players
          await prisma.gameRosterPlayer.createMany({
            data: homeAthleteIds.map((athleteId, i) => ({ gameRosterId: homeRoster.id, athleteId, isStarter: i < 5 }))
          })
          await prisma.gameRosterPlayer.createMany({
            data: awayAthleteIds.map((athleteId, i) => ({ gameRosterId: awayRoster.id, athleteId, isStarter: i < 5 }))
          })

          // Player stat lines
          const homePts = distributePoints(game.homeScore, homeAthleteIds.length)
          const awayPts = distributePoints(game.awayScore, awayAthleteIds.length)

          const buildStatRow = (athleteId: string, teamId: string, pts: number, i: number) => {
            const shots = simulateShots(pts)
            const rebDef = rand(0, 7)
            const rebOff = rand(0, 3)
            return {
              gameId: game.id, athleteId, teamId,
              points: pts, minutesPlayed: rand(8, 38), fouls: rand(0, 4),
              assists: rand(0, 6), steals: rand(0, 3), blocks: rand(0, 2), turnovers: rand(0, 4),
              reboundsDefensive: rebDef, reboundsOffensive: rebOff, reboundsTotal: rebDef + rebOff,
              isStarter: i < 5, ...shots,
            }
          }

          const homeStats = homeAthleteIds.map((id, i) => buildStatRow(id, game.homeTeamId, homePts[i] ?? 0, i))
          const awayStats = awayAthleteIds.map((id, i) => buildStatRow(id, game.awayTeamId, awayPts[i] ?? 0, i))

          await prisma.gamePlayerStatLine.createMany({ data: homeStats })
          await prisma.gamePlayerStatLine.createMany({ data: awayStats })
          totalStatLines += homeStats.length + awayStats.length

          // Period scores
          const homeQ = splitIntoQuarters(game.homeScore)
          const awayQ = splitIntoQuarters(game.awayScore)
          await prisma.gamePeriodScore.createMany({
            data: [1, 2, 3, 4].map(period => ({
              gameId: game.id, period,
              homePoints: homeQ[period - 1],
              awayPoints: awayQ[period - 1],
            }))
          })

          // Officials
          await prisma.gameOfficial.createMany({
            data: [
              { gameId: game.id, officialType: 'REFEREE',    name: randomOfficial(), role: 'MAIN' },
              { gameId: game.id, officialType: 'REFEREE',    name: randomOfficial(), role: 'ASSISTANT' },
              { gameId: game.id, officialType: 'SCORER',     name: randomOfficial(), role: 'SCORER' },
              { gameId: game.id, officialType: 'TIMEKEEPER', name: randomOfficial(), role: 'TABLE_OFFICIAL' },
            ]
          })
        }

        emit({ step: 8, label: 'Gerar Súmulas Completas', status: 'done', detail: `${createdGames.length} súmulas · ${totalStatLines} linhas de stats` })

        // ─── STEP 9: Summary ───────────────────────────────────────────
        emit({ step: 9, label: 'Resumo Final', status: 'loading' })
        emit({
          step: 9, label: 'Resumo Final', status: 'done',
          detail: 'Simulação completa! Dados prontos para validação.',
          summary: {
            championshipId: championship.id,
            championshipName: championship.name,
            totalGames: createdGames.length,
            totalAthletes,
            totalStatLines,
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
