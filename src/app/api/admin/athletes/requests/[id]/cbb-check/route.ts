import { NextResponse } from 'next/server'

import {
  AthleteRegistrationError,
  assertCbbCheckStatus,
  markAthleteRequestCbbCheck,
} from '@/lib/athlete-registration'
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
    const cbbCheckStatus = String(body.cbbCheckStatus || '').trim().toUpperCase()
    assertCbbCheckStatus(cbbCheckStatus)

    const result = await markAthleteRequestCbbCheck(
      id,
      {
        cbbCheckStatus,
        cbbNotes: body.cbbNotes,
        cbbReference: body.cbbReference,
        cbbDocumentMatch:
          typeof body.cbbDocumentMatch === 'boolean' ? body.cbbDocumentMatch : null,
        cbbNameMatch: typeof body.cbbNameMatch === 'boolean' ? body.cbbNameMatch : null,
        cbbBirthDateMatch:
          typeof body.cbbBirthDateMatch === 'boolean' ? body.cbbBirthDateMatch : null,
      },
      (session.user as any)?.id || null
    )

    return NextResponse.json(result)
  } catch (error: any) {
    const status = error instanceof AthleteRegistrationError ? error.status : 500
    return NextResponse.json({ error: error.message || 'Erro ao atualizar conferencia CBB.' }, { status })
  }
}
