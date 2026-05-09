import { NextResponse } from 'next/server'
import { ensureDatabaseSchema } from '@/lib/db-patch'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { withdrawExternalRegistration } from '@/lib/competition-eligibility'

export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await ensureDatabaseSchema()
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const { id } = await params
    await withdrawExternalRegistration(id)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error withdrawing external registration:', error)
    return NextResponse.json({ error: error?.message || 'Erro ao retirar declaração' }, { status: 500 })
  }
}
