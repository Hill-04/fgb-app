import { prisma } from '@/lib/db'
import { notFound } from 'next/navigation'
import CockpitClient from './CockpitClient'

export const dynamic = 'force-dynamic'

export default async function CockpitPage({ params, searchParams }: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ category?: string; status?: string; payment?: string; search?: string }>
}) {
  const { id: championshipId } = await params
  const filters = await searchParams

  const championship = await prisma.championship.findUnique({
    where: { id: championshipId },
    include: {
      categories: {
        orderBy: { name: 'asc' },
        include: {
          registrations: {
            include: {
              registration: {
                include: {
                  team: { select: { id: true, name: true } },
                  athletePlayers: true,
                  blockedDates: true,
                  fees: true,
                  financialInvoices: {
                    where: { status: { in: ['PENDING', 'PAID', 'OVERDUE'] } },
                    orderBy: { createdAt: 'desc' },
                    take: 1,
                  },
                },
              },
            },
          },
        },
      },
    },
  })

  if (!championship) notFound()

  const allRegs = championship.categories.flatMap(c => c.registrations.map(r => r.registration))
  const uniqueRegs = Array.from(new Map(allRegs.map(r => [r.id, r])).values())
  const totalTeams = uniqueRegs.length
  const confirmed = uniqueRegs.filter(r => r.status === 'CONFIRMED').length
  const pending = totalTeams - confirmed
  const blockedCount = uniqueRegs.reduce((sum, r) => sum + r.blockedDates.length, 0)
  const overdueInvoices = uniqueRegs.flatMap(r => r.financialInvoices).filter(i => i.status === 'OVERDUE').length

  return (
    <CockpitClient
      championshipId={championshipId}
      championship={championship}
      kpis={{ totalTeams, confirmed, pending, blockedCount, overdueInvoices }}
      filters={filters}
    />
  )
}
