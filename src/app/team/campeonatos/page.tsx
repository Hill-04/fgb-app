import { prisma } from '@/lib/db'
import { ensureDatabaseSchema } from '@/lib/db-patch'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { Trophy } from 'lucide-react'
import { TeamPageHeader } from '@/components/team/team-page-header'
import { CampeonatosTabs } from './CampeonatosTabs'

export const dynamic = 'force-dynamic'

type SearchParams = { tab?: string }

export default async function TeamCampeonatosPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  await ensureDatabaseSchema()
  const session = await getServerSession(authOptions)
  const teamId = (session?.user as any)?.teamId as string | undefined
  if (!teamId) redirect('/team/dashboard')

  const { tab } = await searchParams
  const initialTab: 'fgb' | 'externos' = tab === 'externos' ? 'externos' : 'fgb'

  const fgbChampionshipsRaw = (await prisma.championship.findMany({
    where: {
      status: { in: ['REGISTRATION_OPEN', 'ONGOING'] },
      isSimulation: false,
    } as any,
    orderBy: { createdAt: 'desc' },
    include: {
      categories: { include: { _count: { select: { registrations: true } } } },
      _count: { select: { registrations: true } },
      registrations: teamId ? { where: { teamId } } : false,
    } as any,
  }).catch(() => [])) as any[]

  const [externals, myDeclarations, myAthletes, blocks] = await Promise.all([
    prisma.externalCompetition.findMany({
      where: { isPublished: true },
      orderBy: { startDate: 'asc' },
      include: {
        blocks: { include: { championship: { select: { id: true, name: true } } } },
      },
    }).catch(() => []),
    prisma.externalRegistration.findMany({
      where: { teamId, status: { not: 'WITHDRAWN' } },
      select: { id: true, externalCompetitionId: true, athleteId: true },
    }).catch(() => []),
    prisma.athlete.findMany({
      where: { teamId },
      select: { id: true, name: true, sex: true, birthDate: true },
      orderBy: { name: 'asc' },
    }).catch(() => []),
    prisma.fGBRegistrationBlock.findMany({
      where: { teamId, isActive: true },
      include: {
        championship: { select: { id: true, name: true } },
        externalRegistration: {
          include: { externalCompetition: { select: { name: true } } },
        },
      },
    }).catch(() => []),
  ])

  const blockedChampionshipIds = new Set(blocks.map((b) => b.championshipId))
  const declaredCountByExternal = new Map<string, number>()
  for (const d of myDeclarations) {
    declaredCountByExternal.set(
      d.externalCompetitionId,
      (declaredCountByExternal.get(d.externalCompetitionId) ?? 0) + 1,
    )
  }

  const fgbChampionships = fgbChampionshipsRaw.map((c: any) => ({
    id: c.id,
    name: c.name,
    description: c.description ?? null,
    sex: c.sex,
    status: c.status,
    regDeadline: c.regDeadline?.toISOString() ?? null,
    minTeamsPerCat: c.minTeamsPerCat,
    registrationsCount: c._count?.registrations ?? 0,
    categories: c.categories.map((cat: any) => ({
      id: cat.id,
      name: cat.name,
      registrationsCount: cat._count?.registrations ?? 0,
    })),
    isRegistered: (c.registrations?.length ?? 0) > 0,
    isBlocked: blockedChampionshipIds.has(c.id),
    blocksCount: blocks.filter((b) => b.championshipId === c.id).length,
  }))

  const externalCompetitions = externals.map((e) => ({
    id: e.id,
    name: e.name,
    organizer: e.organizer,
    city: e.city,
    state: e.state,
    startDate: e.startDate.toISOString(),
    endDate: e.endDate.toISOString(),
    websiteUrl: e.websiteUrl,
    categories: (() => {
      try {
        return JSON.parse(e.categoriesJson)
      } catch {
        return []
      }
    })(),
    blocks: e.blocks.map((b) => ({
      championshipId: b.championshipId,
      championshipName: b.championship.name,
    })),
    declaredCount: declaredCountByExternal.get(e.id) ?? 0,
  }))

  const athletes = myAthletes.map((a) => ({
    id: a.id,
    name: a.name,
    sex: a.sex,
    birthDate: a.birthDate?.toISOString() ?? null,
  }))

  return (
    <div className="space-y-10 max-w-5xl mx-auto font-sans px-4 sm:px-6">
      <TeamPageHeader
        eyebrow="Inscrições Disponíveis"
        title="Campeonatos"
        description="Campeonatos FGB com inscrições abertas e competições externas para sua equipe."
        icon={<Trophy className="w-4 h-4" />}
      />
      <CampeonatosTabs
        initialTab={initialTab}
        fgbChampionships={fgbChampionships}
        externalCompetitions={externalCompetitions}
        athletes={athletes}
        teamId={teamId}
      />
    </div>
  )
}
