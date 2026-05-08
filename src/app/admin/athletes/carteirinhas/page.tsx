import { prisma } from '@/lib/db'
import CarteirinhasClient from './CarteirinhasClient'

export const dynamic = 'force-dynamic'

export default async function CarteirinhasPage() {
  const [athletes, teams] = await Promise.all([
    prisma.athlete.findMany({
      where: { situation: 'ACTIVE' },
      orderBy: { name: 'asc' },
      include: {
        team: { select: { id: true, name: true } },
        cards: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
    }).catch(() => []),
    prisma.team.findMany({ orderBy: { name: 'asc' }, select: { id: true, name: true } }).catch(() => []),
  ])

  return <CarteirinhasClient athletes={athletes} teams={teams} />
}
