import { NextResponse } from 'next/server'

import { AthleteRegistrationError, submitTeamAthleteRequest } from '@/lib/athlete-registration'
import { requireTeamSession } from '@/lib/athlete-registration-server'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const sessionData = await requireTeamSession()
  if (!sessionData) {
    return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 })
  }

  try {
    const { id } = await params
    const result = await submitTeamAthleteRequest(
      sessionData.teamId,
      id,
      (sessionData.session.user as any)?.id || null
    )

    return NextResponse.json(result)
  } catch (error: any) {
    const status = error instanceof AthleteRegistrationError ? error.status : 500
    return NextResponse.json({ error: error.message || 'Erro ao enviar solicitacao.' }, { status })
  }
}
