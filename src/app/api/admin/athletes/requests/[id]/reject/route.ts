import { NextResponse } from 'next/server'

import { AthleteRegistrationError, rejectAthleteRegistrationRequest } from '@/lib/athlete-registration'
import { requireAdminSession } from '@/lib/athlete-registration-server'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAdminSession()
  if (!session) {
    return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })
  }

  try {
    const { id } = await params
    const body = await request.json()
    const result = await rejectAthleteRegistrationRequest(
      id,
      String(body.rejectionReason || ''),
      (session.user as any)?.id || null
    )
    return NextResponse.json(result)
  } catch (error: any) {
    const status = error instanceof AthleteRegistrationError ? error.status : 500
    return NextResponse.json({ error: error.message || 'Erro ao rejeitar solicitacao.' }, { status })
  }
}
