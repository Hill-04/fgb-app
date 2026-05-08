import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { ensureDatabaseSchema } from '@/lib/db-patch'

export async function GET(req: NextRequest) {
  try {
    await ensureDatabaseSchema()
    const { searchParams } = new URL(req.url)
    const search = searchParams.get('search')
    const status = searchParams.get('status')
    const referees = await prisma.referee.findMany({
      where: {
        ...(status ? { status } : {}),
        ...(search ? { name: { contains: search } } : {}),
      },
      include: { category: { select: { id: true, name: true } } },
      orderBy: { name: 'asc' },
    })
    return NextResponse.json(referees)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const referee = await prisma.referee.create({
      data: {
        name: body.name,
        licenseNumber: body.licenseNumber || null,
        phone: body.phone || null,
        email: body.email || null,
        city: body.city || null,
        state: body.state || null,
        status: body.status || 'ACTIVE',
        registrationNumber: body.registrationNumber ? Number(body.registrationNumber) : null,
        sex: body.sex || null,
        birthDate: body.birthDate ? new Date(body.birthDate) : null,
        rg: body.rg || null,
        cpf: body.cpf || null,
        cep: body.cep || null,
        address: body.address || null,
        motherName: body.motherName || null,
        mobile: body.mobile || null,
        notes: body.notes || null,
        photoUrl: body.photoUrl || null,
        isActive: body.isActive ?? true,
        categoryId: body.categoryId || null,
      },
    })
    return NextResponse.json(referee, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
