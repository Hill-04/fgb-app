import { prisma } from '@/lib/db'

export type TiebreakerType =
  | 'h2h_record'
  | 'h2h_diff'
  | 'h2h_for'
  | 'all_diff'
  | 'all_for'
  | 'all_against'
  | 'wins'
  | 'draw'

export const TIEBREAKER_LABELS: Record<TiebreakerType, string> = {
  h2h_record: 'Confronto direto (vitórias)',
  h2h_diff: 'Saldo no confronto direto',
  h2h_for: 'Pontos pró no confronto direto',
  all_diff: 'Saldo de pontos (todos os jogos)',
  all_for: 'Pontos pró (todos os jogos)',
  all_against: 'Pontos contra (menor melhor)',
  wins: 'Número de vitórias',
  draw: 'Sorteio',
}

export const FIBA_DEFAULT_CHAIN: TiebreakerType[] = [
  'h2h_record',
  'h2h_diff',
  'h2h_for',
  'all_diff',
  'all_for',
  'draw',
]

export const LEGACY_KEYS_TO_TYPE: Record<string, TiebreakerType> = {
  pontos: 'wins',
  saldo: 'all_diff',
  confronto_direto: 'h2h_record',
  pontos_marcados: 'all_for',
}

export async function getChampionshipTiebreakers(
  championshipId: string,
): Promise<TiebreakerType[]> {
  const rules = await prisma.tiebreakerRule.findMany({
    where: { championshipId },
    orderBy: { order: 'asc' },
  }).catch(() => [])

  if (rules.length > 0) {
    return rules.map((r) => r.type as TiebreakerType)
  }

  const champ = await prisma.championship.findUnique({
    where: { id: championshipId },
    select: { tiebreakers: true },
  }).catch(() => null)

  if (champ?.tiebreakers) {
    const csv = champ.tiebreakers.split(',').map((s) => s.trim()).filter(Boolean)
    const mapped = csv
      .map((k) => LEGACY_KEYS_TO_TYPE[k] ?? (k as TiebreakerType))
      .filter((t) => t in TIEBREAKER_LABELS)
    if (mapped.length > 0) return mapped
  }

  return FIBA_DEFAULT_CHAIN
}

export async function setChampionshipTiebreakers(
  championshipId: string,
  types: TiebreakerType[],
): Promise<void> {
  await prisma.$transaction(async (tx) => {
    await tx.tiebreakerRule.deleteMany({ where: { championshipId } })
    for (let i = 0; i < types.length; i++) {
      await tx.tiebreakerRule.create({
        data: {
          championshipId,
          order: i,
          type: types[i],
        },
      })
    }
  })
}
