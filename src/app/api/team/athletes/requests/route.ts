import { NextResponse } from 'next/server'

import {
  ATHLETE_REQUEST_INCLUDE,
  AthleteRegistrationError,
  assertAthleteRequestStatus,
  createTeamAthleteRequest,
} from '@/lib/athlete-registration'
import { prisma } from '@/lib/db'
import { requireTeamSession } from '@/lib/athlete-registration-server'

export async function GET(request: Request) {
  const sessionData = await requireTeamSession()
  if (!sessionData) {
    return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 })
  }

  const { teamId } = sessionData
  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')?.trim()

  const requests = await prisma.athleteRegistrationRequest.findMany({
    where: {
      teamId,
      ...(status ? { status } : {}),
    },
    include: ATHLETE_REQUEST_INCLUDE,
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(requests)
}

export async function POST(request: Request) {
  const sessionData = await requireTeamSession()
  if (!sessionData) {
    return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const initialStatus = String(body.status || 'DRAFT').trim().toUpperCase()
    assertAthleteRequestStatus(initialStatus)

    if (!['DRAFT', 'SUBMITTED'].includes(initialStatus)) {
      throw new AthleteRegistrationError('A equipe so pode criar solicitacoes como rascunho ou enviadas.', 400)
    }

    const created = await createTeamAthleteRequest(
      sessionData.teamId,
      {
        fullName: body.fullName,
        birthDate: body.birthDate,
        documentNumber: body.documentNumber,
        motherName: body.motherName,
        phone: body.phone,
        email: body.email,
        requestedCategoryLabel: body.requestedCategoryLabel,
        cbbRegistrationNumber: body.cbbRegistrationNumber,
        initialStatus,
      },
      (sessionData.session.user as any)?.id || null
    )

    return NextResponse.json(created, { status: 201 })
  } catch (error: any) {
    const status = error instanceof AthleteRegistrationError ? error.status : 500
    return NextResponse.json({ error: error.message || 'Erro ao criar solicitacao.' }, { status })
  }
}
