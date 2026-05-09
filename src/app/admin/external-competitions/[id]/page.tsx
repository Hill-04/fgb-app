import { prisma } from '@/lib/db'
import { ensureDatabaseSchema } from '@/lib/db-patch'
import { notFound } from 'next/navigation'
import { ExternalCompetitionForm } from '../ExternalCompetitionForm'
import { ExternalRegistrationsList } from '../ExternalRegistrationsList'

export const dynamic = 'force-dynamic'

export default async function EditExternalCompetitionPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await ensureDatabaseSchema()
  const { id } = await params

  const [competition, championships] = await Promise.all([
    prisma.externalCompetition.findUnique({
      where: { id },
      include: {
        blocks: { include: { championship: true } },
        registrations: { orderBy: { createdAt: 'desc' } },
      },
    }).catch(() => null),
    prisma.championship.findMany({
      where: { isSimulation: false, status: { not: 'ARCHIVED' } },
      orderBy: { name: 'asc' },
      include: { categories: { select: { id: true, name: true } } },
    }).catch(() => []),
  ])

  if (!competition) notFound()

  const enrichedRegistrations = await Promise.all(
    competition.registrations.map(async (r) => {
      const athlete = r.athleteId
        ? await prisma.athlete.findUnique({
            where: { id: r.athleteId },
            select: { id: true, name: true, team: { select: { name: true } } },
          })
        : null
      return {
        id: r.id,
        athleteId: r.athleteId,
        athleteName: athlete?.name ?? '—',
        teamName: athlete?.team?.name ?? '—',
        status: r.status,
        createdAt: r.createdAt.toISOString(),
      }
    }),
  )

  let categoriesArr: string[] = []
  try {
    categoriesArr = JSON.parse(competition.categoriesJson)
  } catch {
    categoriesArr = []
  }

  return (
    <div className="space-y-6">
      <ExternalCompetitionForm
        championships={championships.map((c) => ({
          id: c.id,
          name: c.name,
          year: c.year,
          categories: c.categories,
        }))}
        initial={{
          id: competition.id,
          name: competition.name,
          organizer: competition.organizer,
          city: competition.city,
          state: competition.state,
          startDate: competition.startDate.toISOString().slice(0, 10),
          endDate: competition.endDate.toISOString().slice(0, 10),
          categories: categoriesArr,
          gender: competition.gender,
          description: competition.description,
          websiteUrl: competition.websiteUrl,
          logoUrl: competition.logoUrl,
          isPublished: competition.isPublished,
          season: competition.season,
          blocks: competition.blocks.map((b) => ({
            championshipId: b.championshipId,
            categoryId: b.categoryId,
          })),
        }}
      />

      <ExternalRegistrationsList
        registrations={enrichedRegistrations}
      />
    </div>
  )
}
