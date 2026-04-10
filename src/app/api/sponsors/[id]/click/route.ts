import { prisma } from '@/lib/db'
import { NextResponse } from 'next/server'
import { ensureDatabaseSchema } from '@/lib/db-patch'

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureDatabaseSchema()
    const { id } = await params
    const body = await req.json().catch(() => ({}))
    const source = body?.source ? String(body.source) : null
    const referrer = body?.referrer ? String(body.referrer) : null

    await prisma.sponsorClick.create({
      data: {
        sponsorId: id,
        source,
        referrer,
      }
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[SPONSOR CLICK ERROR]', error)
    return NextResponse.json({ success: false }, { status: 500 })
  }
}
