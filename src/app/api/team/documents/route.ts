import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const teamId = (session.user as any).teamId
    if (!teamId) return NextResponse.json([])

    // Find championships the team is registered in, then get their documents
    const registrations = await prisma.registration.findMany({
      where: { teamId },
      select: { championshipId: true }
    })

    const championshipIds = registrations.map(r => r.championshipId)
    if (championshipIds.length === 0) return NextResponse.json([])

    const documents = await prisma.document.findMany({
      where: { championshipId: { in: championshipIds } },
      include: { championship: { select: { name: true } } },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(documents)
  } catch (error) {
    return NextResponse.json([])
  }
}
