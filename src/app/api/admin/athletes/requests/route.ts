import { NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'

import { ATHLETE_REQUEST_INCLUDE } from '@/lib/athlete-registration'
import { prisma } from '@/lib/db'
import { requireAdminSession } from '@/lib/athlete-registration-server'

export async function GET(request: Request) {
  const session = await requireAdminSession()
  if (!session) {
    return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const search = searchParams.get('search')?.trim()
  const status = searchParams.get('status')?.trim()
  const teamId = searchParams.get('teamId')?.trim()
  const cbbCheckStatus = searchParams.get('cbbCheckStatus')?.trim()

  const where: Prisma.AthleteRegistrationRequestWhereInput = {
    ...(status ? { status } : {}),
    ...(teamId ? { teamId } : {}),
    ...(cbbCheckStatus ? { cbbCheckStatus } : {}),
    ...(search
      ? {
          OR: [
            { fullName: { contains: search } },
            { documentNumber: { contains: search } },
            { requestedCategoryLabel: { contains: search } },
            { team: { name: { contains: search } } },
          ],
        }
      : {}),
  }

  const requests = await prisma.athleteRegistrationRequest.findMany({
    where,
    include: ATHLETE_REQUEST_INCLUDE,
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(requests)
}
