import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { ensureDatabaseSchema } from '@/lib/db-patch'
import {
  transitionChampionship,
  getAllowedTransitions,
  type ChampionshipStatus,
  STATUS_LABELS,
} from '@/lib/championship/lifecycle'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await ensureDatabaseSchema()
    const { id } = await params

    const champ = await prisma.championship.findUnique({
      where: { id },
      select: { id: true, status: true, name: true },
    })
    if (!champ) {
      return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })
    }

    const transitions = await prisma.championshipStatusTransition.findMany({
      where: { championshipId: id },
      orderBy: { createdAt: 'desc' },
      take: 20,
    }).catch(() => [])

    return NextResponse.json({
      currentStatus: champ.status,
      currentLabel: STATUS_LABELS[champ.status] ?? champ.status,
      allowedTransitions: getAllowedTransitions(champ.status).map((s) => ({
        status: s,
        label: STATUS_LABELS[s] ?? s,
      })),
      history: transitions.map((t) => ({
        id: t.id,
        from: t.fromStatus,
        fromLabel: STATUS_LABELS[t.fromStatus] ?? t.fromStatus,
        to: t.toStatus,
        toLabel: STATUS_LABELS[t.toStatus] ?? t.toStatus,
        reason: t.reason,
        performedBy: t.performedBy,
        createdAt: t.createdAt.toISOString(),
      })),
    })
  } catch (error: any) {
    console.error('Error fetching transitions:', error)
    return NextResponse.json({ error: error?.message || 'Erro' }, { status: 500 })
  }
}

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
    const { toStatus, reason, force } = await request.json() as {
      toStatus: ChampionshipStatus
      reason?: string
      force?: boolean
    }

    if (!toStatus) {
      return NextResponse.json({ error: 'toStatus é obrigatório' }, { status: 400 })
    }

    const userId = (session.user as any).id as string | undefined

    const result = await transitionChampionship(id, toStatus, {
      performedBy: userId,
      reason,
      force: Boolean(force),
    })

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({
      ok: true,
      status: result.status,
      label: STATUS_LABELS[result.status] ?? result.status,
    })
  } catch (error: any) {
    console.error('Error transitioning championship:', error)
    return NextResponse.json({ error: error?.message || 'Erro' }, { status: 500 })
  }
}
