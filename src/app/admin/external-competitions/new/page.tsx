import { prisma } from '@/lib/db'
import { ensureDatabaseSchema } from '@/lib/db-patch'
import { ExternalCompetitionForm } from '../ExternalCompetitionForm'

export const dynamic = 'force-dynamic'

export default async function NewExternalCompetitionPage() {
  await ensureDatabaseSchema()
  const championships = await prisma.championship.findMany({
    where: { isSimulation: false, status: { not: 'ARCHIVED' } },
    orderBy: { name: 'asc' },
    include: { categories: { select: { id: true, name: true } } },
  }).catch(() => [])

  return (
    <ExternalCompetitionForm
      championships={championships.map((c) => ({
        id: c.id,
        name: c.name,
        year: c.year,
        categories: c.categories,
      }))}
    />
  )
}
