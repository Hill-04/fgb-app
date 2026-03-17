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

  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      function emit(data: object) {
        controller.enqueue(encoder.encode(JSON.stringify(data) + '\n'))
      }

      try {
        // ─── STEP 1: Create Championship ───────────────────────────────
        emit({ step: 1, label: 'Criar Campeonato', status: 'loading' })

        // Clean any previous simulation first
        const existing = await prisma.championship.findFirst({ where: { name: SIM_NAME } })
        if (existing) {
          await prisma.standing.deleteMany({ where: { category: { championshipId: existing.id } } })
          await prisma.game.deleteMany({ where: { championshipId: existing.id } })
          await prisma.blockedDate.deleteMany({ where: { registration: { championshipId: existing.id } } })
          await prisma.registrationCategory.deleteMany({ where: { registration: { championshipId: existing.id } } })
          await prisma.registration.deleteMany({ where: { championshipId: existing.id } })
          await prisma.championshipCategory.deleteMany({ where: { championshipId: existing.id } })
          await prisma.championship.delete({ where: { id: existing.id } })
        }

        const championship = await prisma.championship.create({
          data: {
            name: SIM_NAME,
            description: 'Campeonato de simulação para demonstração do sistema',
            sex: 'masculino',
            format: 'todos_contra_todos',
            phases: 3,
            minTeamsPerCat: 3,
            startDate: new Date('2026-05-01'),
            endDate: new Date('2026-10-31'),
            regDeadline: new Date('2026-04-15'),
            status: 'REGISTRATION_OPEN',
          }
        })

        const catSub13 = await prisma.championshipCategory.create({ data: { name: 'Sub 13', championshipId: championship.id } })
        const catSub15 = await prisma.championshipCategory.create({ data: { name: 'Sub 15', championshipId: championship.id } })
        const catSub17 = await prisma.championshipCategory.create({ data: { name: 'Sub 17', championshipId: championship.id } })

        emit({ step: 1, label: 'Criar Campeonato', status: 'done', detail: `ID: ${championship.id.slice(0, 8)}...` })

        // ─── STEP 2: Register Teams ────────────────────────────────────
        emit({ step: 2, label: 'Inscrever Equipes', status: 'loading' })

        const teamConfig: { name: string; categories: string[] }[] = [
          { name: 'Flyboys', categories: ['Sub 17', 'Sub 15', 'Sub 13'] },
          { name: 'Sogipa', categories: ['Sub 17'] },
          { name: 'Amb', categories: ['Sub 17', 'Sub 13'] },
          { name: 'Sinodal', categories: ['Sub 17', 'Sub 15'] },
          { name: 'Recreio', categories: ['Sub 15'] },
          { name: 'Richmond', categories: ['Sub 15', 'Sub 13'] },
          { name: 'Sojao', categories: ['Sub 15'] },
          { name: 'Dunk', categories: ['Sub 15'] },
          { name: 'Juvenil', categories: ['Sub 13'] },
        ]

        const catMap: Record<string, any> = { 'Sub 13': catSub13, 'Sub 15': catSub15, 'Sub 17': catSub17 }
        const hostTeams = ['Flyboys', 'Recreio', 'Sinodal']

        const weekends = getWeekends(new Date('2026-05-01'), new Date('2026-10-31'))

        for (const tc of teamConfig) {
          const team = await prisma.team.findFirst({ where: { name: { contains: tc.name } } })
          if (!team) continue

          const gym = await prisma.gym.findFirst({ where: { teamId: team.id } })
          const canHost = hostTeams.includes(tc.name)

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
                create: tc.categories.map(catName => ({ categoryId: catMap[catName].id }))
              }
            }
          })

          // Add 2-3 random blocked weekends
          const numBlocked = rand(2, 3)
          const pickedWeekends = weekends.sort(() => Math.random() - 0.5).slice(0, numBlocked)
          for (const sat of pickedWeekends) {
            await prisma.blockedDate.create({
              data: {
                registrationId: reg.id,
                startDate: sat,
                endDate: new Date(sat.getTime() + 86400000),
                reason: 'Indisponibilidade da equipe'
              }
            })
          }
        }

        emit({ step: 2, label: 'Inscrever Equipes', status: 'done', detail: `${teamConfig.length} equipes inscritas em Sub 13, Sub 15 e Sub 17` })

        // ─── STEP 3: Validate Categories ───────────────────────────────
        emit({ step: 3, label: 'Validar Categorias', status: 'loading' })

        const sub17teams = await prisma.registrationCategory.count({ where: { categoryId: catSub17.id, registration: { status: 'CONFIRMED' } } })
        const sub15teams = await prisma.registrationCategory.count({ where: { categoryId: catSub15.id, registration: { status: 'CONFIRMED' } } })
        const sub13teams = await prisma.registrationCategory.count({ where: { categoryId: catSub13.id, registration: { status: 'CONFIRMED' } } })

        await prisma.championshipCategory.update({ where: { id: catSub17.id }, data: { isViable: true } })
        await prisma.championshipCategory.update({ where: { id: catSub15.id }, data: { isViable: true } })
        await prisma.championshipCategory.update({ where: { id: catSub13.id }, data: { isViable: true } })

        await prisma.championship.update({ where: { id: championship.id }, data: { status: 'ONGOING' } })

        emit({ step: 3, label: 'Validar Categorias', status: 'done', detail: `Sub 17: ${sub17teams} equipes ✅ | Sub 15: ${sub15teams} equipes ✅ | Sub 13: ${sub13teams} equipes ✅` })

        // ─── STEP 4: Generate Fixtures ─────────────────────────────────
        emit({ step: 4, label: 'Gerar Confrontos da Fase 1', status: 'loading' })

        const getTeamsForCat = async (catId: string) => {
          const regs = await prisma.registrationCategory.findMany({
            where: { categoryId: catId, registration: { status: 'CONFIRMED' } },
            include: { registration: { include: { team: true } } }
          })
          return regs.map(r => r.registration.team)
        }

        const sub17all = await getTeamsForCat(catSub17.id)
        const sub15all = await getTeamsForCat(catSub15.id)
        const sub13all = await getTeamsForCat(catSub13.id)

        type GameDef = { homeTeamId: string; awayTeamId: string; categoryId: string }
        const allFixtures: GameDef[] = []

        for (const [h, a] of roundRobin(sub17all.map(t => t.id))) allFixtures.push({ homeTeamId: h, awayTeamId: a, categoryId: catSub17.id })
        for (const [h, a] of roundRobin(sub15all.map(t => t.id))) allFixtures.push({ homeTeamId: h, awayTeamId: a, categoryId: catSub15.id })
        for (const [h, a] of roundRobin(sub13all.map(t => t.id))) allFixtures.push({ homeTeamId: h, awayTeamId: a, categoryId: catSub13.id })

        const totalGames = allFixtures.length
        emit({ step: 4, label: 'Gerar Confrontos da Fase 1', status: 'done', detail: `${totalGames} jogos criados (Sub 17: ${roundRobin(sub17all.map(t=>t.id)).length} | Sub 15: ${roundRobin(sub15all.map(t=>t.id)).length} | Sub 13: ${roundRobin(sub13all.map(t=>t.id)).length})` })

        // ─── STEP 5: Schedule Dates ────────────────────────────────────
        emit({ step: 5, label: 'Definir Datas e Locais', status: 'loading' })

        const hostTeamDefs = [
          { name: 'Flyboys', city: 'Porto Alegre' },
          { name: 'Recreio', city: 'Caxias do Sul' },
          { name: 'Sinodal', city: 'São Leopoldo' },
        ]

        const locations = await Promise.all(hostTeamDefs.map(async (ht) => {
          const t = await prisma.team.findFirst({ where: { name: { contains: ht.name } } })
          const g = t ? await prisma.gym.findFirst({ where: { teamId: t.id } }) : null
          return {
            city: g?.city || ht.city,
            gymName: g?.name || `Ginásio ${ht.name}`,
            teamId: t?.id
          }
        }))

        const createdGames: any[] = []
        let weekendIdx = 0

        for (const fix of allFixtures) {
          const loc = locations[weekendIdx % locations.length]
          const sat = weekends[weekendIdx % weekends.length]
          const gameDate = new Date(sat)
          gameDate.setHours(rand(9, 18), 0, 0, 0)

          const altDate = new Date(gameDate)
          altDate.setDate(altDate.getDate() + 7)

          const g = await prisma.game.create({
            data: {
              championshipId: championship.id,
              categoryId: fix.categoryId,
              homeTeamId: fix.homeTeamId,
              awayTeamId: fix.awayTeamId,
              dateTime: gameDate,
              altDateTime: altDate,
              location: loc.gymName,
              city: loc.city,
              phase: 1,
              status: 'SCHEDULED'
            }
          })
          createdGames.push(g)
          weekendIdx++
        }

        emit({ step: 5, label: 'Definir Datas e Locais', status: 'done', detail: `${createdGames.length} jogos distribuídos em ${Math.min(weekendIdx, weekends.length)} fins de semana (maio–outubro 2026)` })

        // ─── STEP 6: Simulate Results ──────────────────────────────────
        emit({ step: 6, label: 'Simular Resultados', status: 'loading' })

        for (const game of createdGames) {
          const homeScore = rand(50, 95)
          let awayScore = rand(50, 95)
          if (homeScore === awayScore) awayScore = awayScore > 50 ? awayScore - 1 : awayScore + 1

          await prisma.game.update({
            where: { id: game.id },
            data: { homeScore, awayScore, status: 'COMPLETED' }
          })
        }

        // Recalculate standings for all categories
        for (const catId of [catSub17.id, catSub15.id, catSub13.id]) {
          const games = await prisma.game.findMany({
            where: { categoryId: catId, status: 'COMPLETED', homeScore: { not: null }, awayScore: { not: null } }
          })
          const regs = await prisma.registrationCategory.findMany({
            where: { categoryId: catId },
            include: { registration: { select: { teamId: true } } }
          })
          const teamIds = Array.from(new Set(regs.map(r => r.registration.teamId)))
          await prisma.standing.deleteMany({ where: { categoryId: catId } })

          const stats: Record<string, any> = {}
          teamIds.forEach(id => { stats[id] = { teamId: id, categoryId: catId, played: 0, wins: 0, losses: 0, points: 0, pointsFor: 0, pointsAg: 0 } })

          for (const g of games) {
            if (g.homeScore === null || g.awayScore === null) continue
            stats[g.homeTeamId].played++; stats[g.awayTeamId].played++
            stats[g.homeTeamId].pointsFor += g.homeScore; stats[g.homeTeamId].pointsAg += g.awayScore
            stats[g.awayTeamId].pointsFor += g.awayScore; stats[g.awayTeamId].pointsAg += g.homeScore
            if (g.homeScore > g.awayScore) { stats[g.homeTeamId].wins++; stats[g.homeTeamId].points += 2; stats[g.awayTeamId].losses++; stats[g.awayTeamId].points += 1 }
            else { stats[g.awayTeamId].wins++; stats[g.awayTeamId].points += 2; stats[g.homeTeamId].losses++; stats[g.homeTeamId].points += 1 }
          }

          for (const teamId of Object.keys(stats)) {
            await prisma.standing.create({ data: stats[teamId] })
          }
        }

        const sampleGames = createdGames.slice(0, 3)
        const sampleScores = await prisma.game.findMany({
          where: { id: { in: sampleGames.map(g => g.id) } },
          include: { homeTeam: true, awayTeam: true }
        })

        const sampleDetail = sampleScores.map(g => `${g.homeTeam.name} ${g.homeScore}x${g.awayScore} ${g.awayTeam.name}`).join(' | ')
        emit({ step: 6, label: 'Simular Resultados', status: 'done', detail: `${createdGames.length} jogos concluídos. Ex: ${sampleDetail}` })

        // ─── STEP 7: Summary ───────────────────────────────────────────
        emit({ step: 7, label: 'Resumo Final', status: 'loading' })

        const getLeader = async (catId: string) => {
          const top = await prisma.standing.findFirst({
            where: { categoryId: catId },
            orderBy: [{ points: 'desc' }, { wins: 'desc' }],
            include: { team: true }
          })
          return top ? `${top.team.name} (${top.points}pts)` : '—'
        }

        const [leader17, leader15, leader13] = await Promise.all([
          getLeader(catSub17.id), getLeader(catSub15.id), getLeader(catSub13.id)
        ])

        emit({
          step: 7, label: 'Resumo Final', status: 'done',
          detail: 'Simulação concluída',
          summary: {
            championshipId: championship.id,
            championshipName: championship.name,
            totalGames: createdGames.length,
            gamesCompleted: createdGames.length,
            leaders: { sub17: leader17, sub15: leader15, sub13: leader13 }
          }
        })

      } catch (err: any) {
        controller.enqueue(encoder.encode(JSON.stringify({ step: -1, label: 'Erro', status: 'error', detail: err.message }) + '\n'))
      } finally {
        controller.close()
      }
    }
  })

  return new Response(stream, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Transfer-Encoding': 'chunked' }
  })
}
