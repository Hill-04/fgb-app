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

    // Get messages sent to/from this team
    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { fromTeamId: teamId },
          { fromAdmin: true }
        ]
      },
      orderBy: { createdAt: 'asc' },
      take: 100
    })

    return NextResponse.json(messages)
  } catch (error) {
    return NextResponse.json([])
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const teamId = (session.user as any).teamId
    if (!teamId) return NextResponse.json({ error: 'No team' }, { status: 400 })

    const { content } = await req.json()
    if (!content?.trim()) return NextResponse.json({ error: 'Content required' }, { status: 400 })

    const message = await prisma.message.create({
      data: {
        content: content.trim(),
        fromTeamId: teamId,
        fromAdmin: false
      }
    })

    return NextResponse.json(message)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 })
  }
}
