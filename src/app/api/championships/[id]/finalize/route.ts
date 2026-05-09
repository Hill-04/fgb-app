import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { ensureDatabaseSchema } from '@/lib/db-patch'
import { finalizeChampionship, validateChampionshipFinalize } from '@/lib/championship/finalize'
import { notifyChampionshipTeams } from '@/lib/championship/notifications'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await ensureDatabaseSchema()
    const { id } = await params
    const validation = await validateChampionshipFinalize(id)
    return NextResponse.json(validation)
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Erro' }, { status: 500 })
  }
}

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await ensureDatabaseSchema()
    const session = await getServerSession(authOptions)
    if (!session?.user || !(session.user as any).isAdmin) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }

    const { id } = await params
    const userId = (session.user as any).id as string | undefined

    const result = await finalizeChampionship(id, userId)
    if (!result.ok) {
      return NextResponse.json({ ok: false, issues: result.issues }, { status: 400 })
    }

    await notifyChampionshipTeams(id, {
      type: 'CHAMPIONSHIP_FINISHED',
      title: 'Campeonato encerrado',
      message: 'O campeonato foi oficialmente encerrado. Confira a classificação final.',
    }).catch(() => {})

    return NextResponse.json({
      ok: true,
      finalStandingsByCategory: result.finalStandingsByCategory,
    })
  } catch (error: any) {
    console.error('Error finalizing:', error)
    return NextResponse.json({ error: error?.message || 'Erro' }, { status: 500 })
  }
}
