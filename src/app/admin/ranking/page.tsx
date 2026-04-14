import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export default async function AdminRankingPage() {
  try {
    const standings = await prisma.standing.findMany({
      include: {
        team: {
          select: {
            id: true,
            name: true,
            logoUrl: true,
          }
        }
      }
    })

    const aggregate = new Map<string, { teamId: string; teamName: string; points: number; wins: number; losses: number; games: number }>()

    for (const row of standings) {
      if (!aggregate.has(row.teamId)) {
        aggregate.set(row.teamId, {
          teamId: row.teamId,
          teamName: row.team.name,
          points: 0,
          wins: 0,
          losses: 0,
          games: 0,
        })
      }
      const entry = aggregate.get(row.teamId)!
      entry.points += row.points
      entry.wins += row.wins
      entry.losses += row.losses
      entry.games += row.played
    }

    const ranking = Array.from(aggregate.values()).sort((a, b) => b.points - a.points)

    return (
      <div className="space-y-6 pb-12">
        <div>
          <h1 className="fgb-display text-3xl text-[var(--black)]">Ranking Geral</h1>
          <p className="fgb-label text-[var(--gray)] mt-1" style={{ textTransform: 'none', letterSpacing: 0 }}>
            Pontuação acumulada entre campeonatos.
          </p>
        </div>

        <div className="fgb-card overflow-hidden">
          <div className="px-6 py-4 border-b border-[var(--border)] bg-[var(--gray-l)]">
            <p className="fgb-label text-[var(--gray)]" style={{ fontSize: 10 }}>Ranking acumulado</p>
          </div>
          <div className="divide-y divide-[var(--border)] bg-white">
            {ranking.length === 0 ? (
              <div className="p-10 text-center text-sm text-[var(--gray)]">Ranking ainda não disponível.</div>
            ) : (
              ranking.slice(0, 50).map((team, index) => (
                <div key={team.teamId} className="p-5 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <span className="text-xs font-black text-[var(--gray)] w-6">{index + 1}</span>
                    <span className="text-sm font-black text-[var(--black)]">{team.teamName}</span>
                  </div>
                  <div className="text-xs text-[var(--gray)]">
                    {team.points} pts · {team.wins}V · {team.losses}D · {team.games}J
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    )
  } catch (error) {
    console.error('[ADMIN RANKING ERROR]', error)
    return (
      <div className="fgb-card p-10 text-center">
        <p className="fgb-label text-[var(--red)]" style={{ textTransform: 'none', letterSpacing: 0 }}>
          Erro ao carregar ranking.
        </p>
      </div>
    )
  }
}
