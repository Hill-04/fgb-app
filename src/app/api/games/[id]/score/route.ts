import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { homeScore, awayScore, status, playerStats } = await request.json()

    const game = await prisma.game.findUnique({ where: { id } })
    if (!game) return NextResponse.json({ error: 'Jogo não encontrado' }, { status: 404 })

    // 1. Atualizar Placar do Jogo
    await prisma.game.update({
      where: { id },
      data: { 
        homeScore, 
        awayScore, 
        status: status || 'FINISHED' 
      }
    })

    // 2. Salvar Estatísticas dos Jogadores (Cestinhas)
    if (playerStats && Array.isArray(playerStats)) {
      // Limpar estatísticas anteriores do jogo para evitar duplicatas se houver re-edição
      await prisma.playerStat.deleteMany({
        where: { gameId: id }
      })

      // Criar novas estatísticas
      if (playerStats.length > 0) {
        await prisma.playerStat.createMany({
          data: playerStats.map((ps: any) => ({
            gameId: id,
            teamId: ps.teamId,
            userId: ps.userId,
            points: ps.points || 0,
            fouls: ps.fouls || 0
          }))
        })
      }
    }

    // 3. Recalcular standings se o jogo foi finalizado
    if (status === 'FINISHED' || !status) {
      await recalculateStandings(game.categoryId)
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('[Score API Error]', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

async function recalculateStandings(categoryId: string) {
  // 1. Buscar todos os jogos finalizados da categoria
  const games = await prisma.game.findMany({
    where: { categoryId, status: 'FINISHED' }
  })

  // 2. Map para acumular estatísticas
  const stats = new Map<string, {
    played: number; wins: number; losses: number;
    points: number; pointsFor: number; pointsAg: number
  }>()

  for (const game of games) {
    const initTeam = (id: string) => {
      if (!stats.has(id)) stats.set(id, {
        played: 0, wins: 0, losses: 0, points: 0, pointsFor: 0, pointsAg: 0
      })
    }
    initTeam(game.homeTeamId)
    initTeam(game.awayTeamId)

    const home = stats.get(game.homeTeamId)!
    const away = stats.get(game.awayTeamId)!
    
    const hScore = game.homeScore || 0
    const aScore = game.awayScore || 0

    home.played++
    away.played++
    home.pointsFor += hScore
    home.pointsAg += aScore
    away.pointsFor += aScore
    away.pointsAg += hScore

    if (hScore > aScore) {
      home.wins++
      home.points += 2
      away.losses++
      away.points += 1
    } else if (aScore > hScore) {
      away.wins++
      away.points += 2
      home.losses++
      home.points += 1
    } else {
      // Empate (opcional no basquete, mas tratamos)
      home.points += 1
      away.points += 1
    }
  }

  // 3. Atualizar ou criar Standings no banco
  // Primeiro, resetar standings da categoria que não estão no map (times sem jogos finalizados)
  // Ou melhor, apenas iterar sobre todos os times inscritos na categoria
  const categoryRegistrations = await prisma.registrationCategory.findMany({
    where: { categoryId },
    include: { registration: true }
  })

  for (const reg of categoryRegistrations) {
    const teamId = reg.registration.teamId
    const s = stats.get(teamId) || {
      played: 0, wins: 0, losses: 0, points: 0, pointsFor: 0, pointsAg: 0
    }

    await prisma.standing.upsert({
      where: { 
        teamId_categoryId: { teamId, categoryId } 
      },
      update: s,
      create: { 
        teamId, 
        categoryId, 
        ...s 
      }
    })
  }
}
