import { prisma } from '@/lib/db'

export type EligibilityBlock = {
  reason: string
  externalCompetitionName: string
  externalCompetitionOrganizer: string
  blockId: string
  canRequest: boolean
}

export type AthleteEligibility = {
  eligible: boolean
  blocks: EligibilityBlock[]
}

export type TeamEligibility = {
  eligible: boolean
  blockedAthletes: Array<{
    athleteId: string
    athleteName: string
    reason: string
    externalCompetitionName: string
  }>
}

export async function checkAthleteEligibility(
  athleteId: string,
  championshipId: string,
  categoryId?: string,
): Promise<AthleteEligibility> {
  const activeBlocks = await prisma.fGBRegistrationBlock.findMany({
    where: {
      athleteId,
      championshipId,
      isActive: true,
      ...(categoryId ? { OR: [{ categoryId }, { categoryId: null }] } : {}),
    },
    include: {
      externalRegistration: {
        include: { externalCompetition: true },
      },
    },
  })

  if (activeBlocks.length === 0) {
    return { eligible: true, blocks: [] }
  }

  return {
    eligible: false,
    blocks: activeBlocks.map((b) => ({
      reason: b.reason,
      externalCompetitionName: b.externalRegistration.externalCompetition.name,
      externalCompetitionOrganizer: b.externalRegistration.externalCompetition.organizer,
      blockId: b.id,
      canRequest: true,
    })),
  }
}

export async function checkTeamEligibility(
  teamId: string,
  championshipId: string,
  categoryId?: string,
): Promise<TeamEligibility> {
  const athletes = await prisma.athlete.findMany({
    where: { teamId },
    select: { id: true, name: true },
  })

  if (athletes.length === 0) {
    return { eligible: true, blockedAthletes: [] }
  }

  const blocked: TeamEligibility['blockedAthletes'] = []

  for (const a of athletes) {
    const result = await checkAthleteEligibility(a.id, championshipId, categoryId)
    if (!result.eligible) {
      for (const b of result.blocks) {
        blocked.push({
          athleteId: a.id,
          athleteName: a.name,
          reason: b.reason,
          externalCompetitionName: b.externalCompetitionName,
        })
      }
    }
  }

  return {
    eligible: blocked.length === 0,
    blockedAthletes: blocked,
  }
}

export async function createExternalRegistrationWithBlocks(
  externalCompetitionId: string,
  athleteIds: string[],
  teamId: string,
  categoryId: string | undefined,
  declaredBy: string,
): Promise<{ registered: number; blocksCreated: number }> {
  let registered = 0
  let blocksCreated = 0

  await prisma.$transaction(async (tx) => {
    const competition = await tx.externalCompetition.findUnique({
      where: { id: externalCompetitionId },
      include: { blocks: true },
    })
    if (!competition) throw new Error('Competição externa não encontrada')

    const noteDate = new Date().toLocaleDateString('pt-BR')

    for (const athleteId of athleteIds) {
      const reg = await tx.externalRegistration.create({
        data: {
          externalCompetitionId,
          athleteId,
          teamId,
          categoryId: categoryId ?? null,
          declaredBy,
          status: 'DECLARED',
          notes: `Declarado em ${noteDate}`,
        },
      })
      registered += 1

      for (const block of competition.blocks) {
        await tx.fGBRegistrationBlock.create({
          data: {
            athleteId,
            teamId,
            championshipId: block.championshipId,
            categoryId: block.categoryId ?? categoryId ?? null,
            reason: `Inscrita em "${competition.name}" (${competition.organizer})`,
            externalRegistrationId: reg.id,
            isActive: true,
          },
        })
        blocksCreated += 1
      }
    }
  })

  return { registered, blocksCreated }
}

export async function withdrawExternalRegistration(
  registrationId: string,
): Promise<void> {
  await prisma.$transaction(async (tx) => {
    await tx.externalRegistration.update({
      where: { id: registrationId },
      data: { status: 'WITHDRAWN' },
    })

    await tx.fGBRegistrationBlock.updateMany({
      where: { externalRegistrationId: registrationId, isActive: true },
      data: {
        isActive: false,
        liftedAt: new Date(),
        liftReason: 'Declaração retirada pelo clube',
      },
    })
  })
}

export async function liftRegistrationBlock(
  blockId: string,
  liftedBy: string,
  reason: string,
): Promise<void> {
  await prisma.fGBRegistrationBlock.update({
    where: { id: blockId },
    data: {
      isActive: false,
      liftedAt: new Date(),
      liftedBy,
      liftReason: reason,
    },
  })
}
