import { prisma } from '@/lib/db'

export async function findChampionshipIdByGameId(gameId: string): Promise<string | null> {
  const game = await prisma.game.findUnique({
    where: { id: gameId },
    select: { championshipId: true },
  })

  return game?.championshipId ?? null
}

export type ChampionshipGameSegment =
  | ''
  | 'roster'
  | 'live'
  | 'stats'
  | 'encerramento'
  | 'sumula'
  | 'auditoria'

export function buildChampionshipGamePath(
  championshipId: string,
  gameId: string,
  segment: ChampionshipGameSegment
) {
  const base = `/admin/championships/${championshipId}/jogos/${gameId}`
  return segment ? `${base}/${segment}` : base
}

export function buildAdminGamePath(
  gameId: string,
  segment: ChampionshipGameSegment,
  championshipId?: string
) {
  if (championshipId) {
    return buildChampionshipGamePath(championshipId, gameId, segment)
  }

  if (!segment) return `/admin/jogos/${gameId}`
  if (segment === 'roster') return `/admin/games/${gameId}/pregame`
  if (segment === 'stats') return `/admin/jogos/${gameId}/stats`
  if (segment === 'live') return `/admin/games/${gameId}/live`
  if (segment === 'encerramento') return `/admin/games/${gameId}/review`
  if (segment === 'sumula') return `/admin/games/${gameId}/report`
  return `/admin/games/${gameId}/audit`
}
