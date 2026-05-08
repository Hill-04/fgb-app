import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const teamId = searchParams.get('teamId')
    const championshipId = searchParams.get('championshipId')
    const rosters = await prisma.officialRoster.findMany({
      where: {
        ...(teamId ? { teamId } : {}),
        ...(championshipId ? { championshipId } : {}),
      },
      include: {
        team: { select: { id: true, name: true } },
        championship: { select: { id: true, name: true, year: true } },
        athletes: {
          include: { athlete: { select: { id: true, name: true, photoUrl: true } } },
          orderBy: { order: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(rosters)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { teamId, championshipId, categoryId, athleteIds = [], coachId, authorized1Id, authorized2Id, authorized3Id, season = 2026 } = body

    const existing = await prisma.officialRoster.findFirst({
      where: { teamId, championshipId, season, ...(categoryId ? { categoryId } : {}) },
    })

    if (existing) {
      await prisma.officialRosterAthlete.deleteMany({ where: { rosterId: existing.id } })
      const roster = await prisma.officialRoster.update({
        where: { id: existing.id },
        data: {
          coachId: coachId || null,
          authorized1Id: authorized1Id || null,
          authorized2Id: authorized2Id || null,
          authorized3Id: authorized3Id || null,
          athletes: {
            create: athleteIds.map((aid: string, i: number) => ({ athleteId: aid, order: i })),
          },
        },
        include: { athletes: true },
      })
      return NextResponse.json(roster)
    }

    const roster = await prisma.officialRoster.create({
      data: {
        teamId,
        championshipId,
        categoryId: categoryId || null,
        season,
        coachId: coachId || null,
        authorized1Id: authorized1Id || null,
        authorized2Id: authorized2Id || null,
        authorized3Id: authorized3Id || null,
        athletes: {
          create: athleteIds.map((aid: string, i: number) => ({ athleteId: aid, order: i })),
        },
      },
      include: { athletes: true },
    })
    return NextResponse.json(roster, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
