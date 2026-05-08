import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { ensureDatabaseSchema } from '@/lib/db-patch'

export async function GET(req: NextRequest) {
  try {
    await ensureDatabaseSchema()
    const { searchParams } = new URL(req.url)
    const teamId = searchParams.get('teamId')
    const search = searchParams.get('search')
    const coaches = await prisma.coachStaff.findMany({
      where: {
        ...(teamId ? { teamId } : {}),
        ...(search ? { name: { contains: search } } : {}),
      },
      include: { team: { select: { id: true, name: true } } },
      orderBy: { name: 'asc' },
    })
    return NextResponse.json(coaches)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const coach = await prisma.coachStaff.create({
      data: {
        teamId: body.teamId,
        name: body.name,
        email: body.email || null,
        role: body.role,
        crefi: body.crefi || null,
        sex: body.sex || null,
        birthDate: body.birthDate ? new Date(body.birthDate) : null,
        rg: body.rg || null,
        cpf: body.cpf || null,
        cep: body.cep || null,
        state: body.state || null,
        city: body.city || null,
        address: body.address || null,
        addressNum: body.addressNum || null,
        addressComp: body.addressComp || null,
        fatherName: body.fatherName || null,
        motherName: body.motherName || null,
        phone: body.phone || null,
        phone2: body.phone2 || null,
        mobile: body.mobile || null,
        notes: body.notes || null,
        photoUrl: body.photoUrl || null,
        isActive: body.isActive ?? true,
        situation: body.situation || 'ACTIVE',
      },
    })
    return NextResponse.json(coach, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
