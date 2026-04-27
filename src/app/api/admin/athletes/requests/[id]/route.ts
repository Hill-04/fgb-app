import { NextResponse } from 'next/server'

import { getAdminAthleteRequestById, requireAdminSession } from '@/lib/athlete-registration-server'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAdminSession()
  if (!session) {
    return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })
  }

  const { id } = await params
  const athleteRequest = await getAdminAthleteRequestById(id)

  if (!athleteRequest) {
    return NextResponse.json({ error: 'Solicitacao nao encontrada.' }, { status: 404 })
  }

  return NextResponse.json(athleteRequest)
}
