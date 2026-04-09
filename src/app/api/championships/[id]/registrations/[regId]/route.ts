import { prisma } from '@/lib/db'
import { NextResponse } from 'next/server'
import { ensureDatabaseSchema } from '@/lib/db-patch'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; regId: string }> }
) {
  const { regId } = await params
  await ensureDatabaseSchema()
  const {
    teamId,
    categoryIds,
    status,
    observations,
    coachName,
    coachPhone,
    coachEmail,
    coachMultiTeam,
    blockedDates = [],
    athletePlayers = []
  } = await request.json()
  
  try {
    const registration = await prisma.registration.update({
      where: { id: regId },
      data: {
        teamId,
        status,
        observations: observations || null,
        coachName: coachName || null,
        coachPhone: coachPhone || null,
        coachEmail: coachEmail || null,
        coachMultiTeam: coachMultiTeam ?? false,
        blockedDates: {
          deleteMany: {},
          create: blockedDates.map((blockedDate: any) => ({
            startDate: new Date(blockedDate.startDate),
            endDate: new Date(blockedDate.endDate || blockedDate.startDate),
            reason: blockedDate.reason || null,
            affectsAllCats: blockedDate.affectsAllCats ?? false,
          }))
        },
        athletePlayers: {
          deleteMany: {},
          create: athletePlayers.map((athlete: any) => ({
            athleteName: athlete.athleteName,
            athleteDoc: athlete.athleteDoc || null,
            categoryIds: JSON.stringify(athlete.categoryIds || []),
          }))
        },
        categories: {
          deleteMany: {},
          create: categoryIds.map((cid: string) => ({ categoryId: cid }))
        }
      },
      include: {
        team: true,
        blockedDates: { orderBy: { startDate: 'asc' } },
        athletePlayers: { orderBy: { createdAt: 'asc' } },
        categories: {
          include: {
            category: true
          }
        }
      }
    })

    const formatted = {
      ...registration,
      categories: registration.categories.map(rc => rc.category)
    }

    return NextResponse.json(formatted)
  } catch (error: any) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Failed to update registration' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; regId: string }> }
) {
  const { regId } = await params
  await ensureDatabaseSchema()
  
  try {
    await prisma.athleteCategory.deleteMany({ where: { registrationId: regId } })
    await prisma.blockedDate.deleteMany({ where: { registrationId: regId } })
    await prisma.registration.delete({
      where: { id: regId }
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete registration' }, { status: 500 })
  }
}
