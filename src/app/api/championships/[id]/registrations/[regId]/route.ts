import { prisma } from '@/lib/db'
import { NextResponse } from 'next/server'
import { ensureDatabaseSchema } from '@/lib/db-patch'
import { syncTeamTotalFeesOwed } from '@/lib/fees-server'
import {
  assertRegistrationHasBillableFees,
  createInvoiceFromRegistration,
  RegistrationInvoiceGenerationError,
} from '@/lib/finance-invoice-service'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; regId: string }> }
) {
  const { regId } = await params
  await ensureDatabaseSchema()
  const body = await request.json()
  const {
    teamId,
    categoryIds,
    status,
    observations,
    coachName,
    coachPhone,
    coachEmail,
    coachMultiTeam,
    blockedDates,
    athletePlayers
  } = body
  
  try {
    if (status === 'CONFIRMED') {
      await assertRegistrationHasBillableFees(regId)
    }

    const updateData: any = {}

    if (status) updateData.status = status
    if ('observations' in body) updateData.observations = observations || null
    if ('coachName' in body) updateData.coachName = coachName || null
    if ('coachPhone' in body) updateData.coachPhone = coachPhone || null
    if ('coachEmail' in body) updateData.coachEmail = coachEmail || null
    if ('coachMultiTeam' in body) updateData.coachMultiTeam = coachMultiTeam ?? false

    if (teamId) {
      updateData.teamId = teamId
    }

    if (Array.isArray(blockedDates)) {
      updateData.blockedDates = {
        deleteMany: {},
        create: blockedDates.map((blockedDate: any) => ({
          startDate: new Date(blockedDate.startDate),
          endDate: new Date(blockedDate.endDate || blockedDate.startDate),
          reason: blockedDate.reason || null,
          affectsAllCats: blockedDate.affectsAllCats ?? false,
        }))
      }
    }

    if (Array.isArray(athletePlayers)) {
      updateData.athletePlayers = {
        deleteMany: {},
        create: athletePlayers.map((athlete: any) => ({
          athleteName: athlete.athleteName,
          athleteDoc: athlete.athleteDoc || null,
          categoryIds: JSON.stringify(athlete.categoryIds || []),
        }))
      }
    }

    if (Array.isArray(categoryIds)) {
      updateData.categories = {
        deleteMany: {},
        create: categoryIds.map((cid: string) => ({ categoryId: cid }))
      }
    }

    const registration = await prisma.registration.update({
      where: { id: regId },
      data: updateData,
      include: {
        team: true,
        financialInvoices: {
          where: { status: { not: 'VOID' } },
          select: { id: true, number: true, status: true, totalCents: true, balanceCents: true },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        blockedDates: { orderBy: { startDate: 'asc' } },
        athletePlayers: { orderBy: { createdAt: 'asc' } },
        categories: {
          include: {
            category: true
          }
        }
      }
    })

    const financialInvoiceGeneration =
      status === 'CONFIRMED'
        ? await createInvoiceFromRegistration(regId, { context: 'REGISTRATION_PATCH_CONFIRMATION' })
        : null

    const formatted = {
      ...registration,
      categories: registration.categories.map(rc => rc.category),
      financialInvoice: financialInvoiceGeneration?.invoice || registration.financialInvoices[0] || null,
      financialInvoiceGeneration,
    }

    return NextResponse.json(formatted)
  } catch (error: any) {
    console.error('API Error:', error)
    const status = error instanceof RegistrationInvoiceGenerationError ? error.status : 500
    return NextResponse.json({ error: error.message || 'Failed to update registration' }, { status })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; regId: string }> }
) {
  const { regId } = await params
  await ensureDatabaseSchema()
  
  try {
    const registration = await prisma.registration.findUnique({
      where: { id: regId },
      select: { teamId: true },
    })

    if (!registration) {
      return NextResponse.json({ error: 'Registration not found' }, { status: 404 })
    }

    await prisma.athleteCategory.deleteMany({ where: { registrationId: regId } })
    await prisma.blockedDate.deleteMany({ where: { registrationId: regId } })
    await prisma.registrationFee.deleteMany({ where: { registrationId: regId } })
    await prisma.registration.delete({
      where: { id: regId }
    })

    await syncTeamTotalFeesOwed(registration.teamId)

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete registration' }, { status: 500 })
  }
}
