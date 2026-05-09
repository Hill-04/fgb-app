import { prisma } from '@/lib/db'
import { ensureDatabaseSchema } from '@/lib/db-patch'
import { Lock } from 'lucide-react'
import { RegistrationBlocksClient } from './RegistrationBlocksClient'

export const dynamic = 'force-dynamic'

export default async function RegistrationBlocksPage() {
  await ensureDatabaseSchema()

  const blocks = await prisma.fGBRegistrationBlock.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      championship: { select: { id: true, name: true } },
      externalRegistration: {
        include: {
          externalCompetition: { select: { name: true, organizer: true } },
        },
      },
    },
  }).catch(() => [])

  const enriched = await Promise.all(
    blocks.map(async (b) => {
      const athlete = b.athleteId
        ? await prisma.athlete.findUnique({
            where: { id: b.athleteId },
            select: { id: true, name: true, team: { select: { name: true } } },
          })
        : null
      return {
        id: b.id,
        athleteId: b.athleteId,
        athleteName: athlete?.name ?? '—',
        teamName: athlete?.team?.name ?? '—',
        championshipName: b.championship.name,
        championshipId: b.championship.id,
        reason: b.reason,
        externalCompetitionName: b.externalRegistration.externalCompetition.name,
        isActive: b.isActive,
        liftedAt: b.liftedAt?.toISOString() ?? null,
        liftReason: b.liftReason,
        createdAt: b.createdAt.toISOString(),
      }
    }),
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="fgb-display text-[28px] text-[var(--black)] flex items-center gap-2">
          <Lock className="text-[var(--red)]" size={26} />
          Bloqueios de Inscrição
        </h1>
        <p className="fgb-label text-[var(--gray)] mt-2 max-w-2xl" style={{ textTransform: 'none', letterSpacing: 0 }}>
          Atletas bloqueadas para inscrição em campeonatos FGB por terem declarado
          participação em competições externas.
        </p>
      </div>

      <RegistrationBlocksClient blocks={enriched} />
    </div>
  )
}
