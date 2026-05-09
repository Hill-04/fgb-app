import { prisma } from '@/lib/db'
import { ensureDatabaseSchema } from '@/lib/db-patch'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { DeclarationsClient } from './DeclarationsClient'

export const dynamic = 'force-dynamic'

export default async function TeamDeclarationsPage() {
  await ensureDatabaseSchema()
  const session = await getServerSession(authOptions)
  const teamId = (session?.user as any)?.teamId as string | undefined
  if (!teamId) redirect('/team/dashboard')

  const declarations = await prisma.externalRegistration.findMany({
    where: { teamId },
    orderBy: { createdAt: 'desc' },
    include: {
      externalCompetition: { select: { id: true, name: true, organizer: true } },
      blocksGenerated: {
        include: { championship: { select: { name: true } } },
      },
    },
  }).catch(() => [])

  const enriched = await Promise.all(
    declarations.map(async (d) => {
      const athlete = d.athleteId
        ? await prisma.athlete.findUnique({
            where: { id: d.athleteId },
            select: { id: true, name: true },
          })
        : null
      return {
        id: d.id,
        athleteName: athlete?.name ?? '—',
        competitionId: d.externalCompetition.id,
        competitionName: d.externalCompetition.name,
        organizer: d.externalCompetition.organizer,
        status: d.status,
        createdAt: d.createdAt.toISOString(),
        blockedChampionships: d.blocksGenerated
          .filter((b) => b.isActive)
          .map((b) => b.championship.name),
      }
    }),
  )

  return (
    <div className="space-y-6">
      <Link
        href="/team/competitions"
        className="flex items-center gap-2 text-[var(--gray)] hover:text-[var(--verde)]"
      >
        <ArrowLeft size={16} /> Voltar
      </Link>
      <div>
        <h1 className="fgb-display text-[24px] text-[var(--black)]">Minhas Declarações</h1>
        <p className="text-sm text-[var(--gray)] mt-1">
          Declarações de participação em competições externas. Retirar uma declaração libera a
          atleta para as competições da FGB.
        </p>
      </div>

      <DeclarationsClient declarations={enriched} />
    </div>
  )
}
