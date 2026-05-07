import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'

import { authOptions } from '@/lib/auth'
import { ensureDatabaseSchema } from '@/lib/db-patch'
import { getRegistrationFeesSnapshot } from '@/lib/fees-server'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await ensureDatabaseSchema()

  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })
  }

  const { id } = await params
  const snapshot = await getRegistrationFeesSnapshot(id)

  if (!snapshot) {
    return NextResponse.json({ error: 'Inscricao nao encontrada.' }, { status: 404 })
  }

  const isAdmin = Boolean((session.user as any)?.isAdmin)
  const teamId = (session.user as any)?.teamId

  if (!isAdmin && snapshot.registration.team.id !== teamId) {
    return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 })
  }

  return NextResponse.json(snapshot)
}
