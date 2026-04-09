import { prisma } from '@/lib/db'
import { withDatabaseSchemaRetry } from '@/lib/db-patch'

export async function recalculateIsViable(championshipId: string) {
  // Get the championship with its categories and minTeamsPerCat
  const championship = await withDatabaseSchemaRetry(() =>
    prisma.championship.findUnique({
      where: { id: championshipId },
      include: {
        categories: {
          include: {
            registrations: {
              where: {
                registration: {
                  status: 'CONFIRMED'
                }
              }
            }
          }
        }
      }
    })
  )

  if (!championship) return

  const minTeams = championship.minTeamsPerCat

  // For each category, count confirmed registrations and update isViable
  for (const category of championship.categories) {
    const confirmedCount = category.registrations.length
    const isViable = confirmedCount >= minTeams

    if (category.isViable !== isViable) {
      await prisma.championshipCategory.update({
        where: { id: category.id },
        data: { isViable }
      })
    }
  }
}
