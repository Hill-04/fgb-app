import { NextResponse } from 'next/server'
import { ensureDatabaseSchema } from '@/lib/db-patch'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { liftRegistrationBlock } from '@/lib/competition-eligibility'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await ensureDatabaseSchema()
    const session = await getServerSession(authOptions)
    if (!session?.user || !(session.user as any).isAdmin) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }

    const { id } = await params
    const { reason } = await request.json()
    if (!reason?.trim()) {
      return NextResponse.json({ error: 'Justificativa é obrigatória' }, { status: 400 })
    }

    const userId = (session.user as any).id as string
    await liftRegistrationBlock(id, userId, reason.trim())

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error lifting block:', error)
    return NextResponse.json({ error: error?.message || 'Erro ao levantar bloqueio' }, { status: 500 })
  }
}
