import { getServerSession } from 'next-auth'

import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { ATHLETE_REQUEST_INCLUDE } from '@/lib/athlete-registration'

export async function requireTeamSession() {
  const session = await getServerSession(authOptions)
  const teamId = (session?.user as any)?.teamId
  if (!session || !teamId) return null
  return { session, teamId }
}

export async function requireAdminSession() {
  const session = await getServerSession(authOptions)
  if (!session || !(session.user as any)?.isAdmin) return null
  return session
}

export async function getTeamAthleteRequestById(teamId: string, id: string) {
  return prisma.athleteRegistrationRequest.findFirst({
    where: { id, teamId },
    include: ATHLETE_REQUEST_INCLUDE,
  })
}

export async function getAdminAthleteRequestById(id: string) {
  return prisma.athleteRegistrationRequest.findUnique({
    where: { id },
    include: ATHLETE_REQUEST_INCLUDE,
  })
}
