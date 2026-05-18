import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { ensureDatabaseSchema } from '@/lib/db-patch'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await ensureDatabaseSchema()

  const session = await getServerSession(authOptions)
  const userId = (session?.user as { id?: string } | undefined)?.id

  if (!userId) {
    return NextResponse.json({ ok: false, error: 'Não autorizado' }, { status: 401 })
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { isFederationSuperAdmin: true, isAdmin: true },
  })

  if (!user?.isAdmin && !user?.isFederationSuperAdmin) {
    return NextResponse.json(
      { ok: false, error: 'Apenas admin pode aprovar/rejeitar' },
      { status: 403 }
    )
  }

  const body = (await req.json().catch(() => ({}))) as {
    action?: 'approve' | 'reject'
    reason?: string
  }

  if (body.action !== 'approve' && body.action !== 'reject') {
    return NextResponse.json(
      { ok: false, error: 'action deve ser approve ou reject' },
      { status: 400 }
    )
  }

  const { id } = await params

  const team = await prisma.team.findUnique({
    where: { id },
    select: { id: true, verificationStatus: true } as any,
  })

  if (!team) {
    return NextResponse.json({ ok: false, error: 'Team não encontrado' }, { status: 404 })
  }

  if ((team as any).verificationStatus !== 'PENDING_VERIFICATION') {
    return NextResponse.json(
      { ok: false, error: 'Team não está pendente de verificação' },
      { status: 400 }
    )
  }

  const newStatus = body.action === 'approve' ? 'VERIFIED' : 'REJECTED'

  await prisma.team.update({
    where: { id },
    data: { verificationStatus: newStatus } as any,
  })

  return NextResponse.json({
    ok: true,
    teamId: id,
    newStatus,
    reason: body.reason || null,
  })
}
