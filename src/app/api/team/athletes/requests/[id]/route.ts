import { NextResponse } from 'next/server'

import {
  AthleteRegistrationError,
  updateTeamAthleteRequestDraft,
} from '@/lib/athlete-registration'
import { getTeamAthleteRequestById, requireTeamSession } from '@/lib/athlete-registration-server'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const sessionData = await requireTeamSession()
  if (!sessionData) {
    return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 })
  }

  const { id } = await params
  const athleteRequest = await getTeamAthleteRequestById(sessionData.teamId, id)

  if (!athleteRequest) {
    return NextResponse.json({ error: 'Solicitacao nao encontrada.' }, { status: 404 })
  }

  return NextResponse.json(athleteRequest)
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const sessionData = await requireTeamSession()
  if (!sessionData) {
    return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 })
  }

  try {
    const { id } = await params
    const body = await request.json()
    const updated = await updateTeamAthleteRequestDraft(
      sessionData.teamId,
      id,
      {
        fullName: body.fullName,
        birthDate: body.birthDate,
        documentNumber: body.documentNumber,
        motherName: body.motherName,
        phone: body.phone,
        email: body.email,
        requestedCategoryLabel: body.requestedCategoryLabel,
        cbbRegistrationNumber: body.cbbRegistrationNumber,
      },
      (sessionData.session.user as any)?.id || null
    )

    return NextResponse.json(updated)
  } catch (error: any) {
    const status = error instanceof AthleteRegistrationError ? error.status : 500
    return NextResponse.json({ error: error.message || 'Erro ao atualizar solicitacao.' }, { status })
  }
}
