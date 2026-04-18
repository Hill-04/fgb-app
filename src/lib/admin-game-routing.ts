import { prisma } from '@/lib/db'

export async function findChampionshipIdByGameId(gameId: string): Promise<string | null> {
  const game = await prisma.game.findUnique({
    where: { id: gameId },
    select: { championshipId: true },
  })

  return game?.championshipId ?? null
}

export function buildChampionshipGamePath(
  championshipId: string,
  gameId: string,
  segment: 'roster' | 'live' | 'encerramento' | 'sumula' | 'auditoria' | 'stats' | ''
) {
  const base = `/admin/championships/${championshipId}/jogos/${gameId}`
  return segment ? `${base}/${segment}` : base
}
