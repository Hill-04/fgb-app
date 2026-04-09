import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { athleteName, athleteDoc, categoryIds } = await request.json()

  const athlete = await prisma.athleteCategory.create({
    data: {
      registrationId: id,
      athleteName,
      athleteDoc,
      categoryIds: JSON.stringify(categoryIds),
    },
  })

  return NextResponse.json(athlete)
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const athletes = await prisma.athleteCategory.findMany({
    where: { registrationId: id },
    orderBy: { createdAt: 'asc' },
  })

  return NextResponse.json(athletes)
}
