import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    const cats = await prisma.refereeCategory.findMany({ orderBy: { name: 'asc' } })
    return NextResponse.json(cats)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const cat = await prisma.refereeCategory.create({
      data: {
        name: body.name,
        remuneration: body.remuneration ? Number(body.remuneration) : 0,
        isActive: body.isActive ?? true,
      },
    })
    return NextResponse.json(cat, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
