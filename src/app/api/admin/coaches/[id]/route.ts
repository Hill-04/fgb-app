import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const coach = await prisma.coachStaff.findUnique({
      where: { id },
      include: { team: { select: { id: true, name: true } } },
    })
    if (!coach) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(coach)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()
    const coach = await prisma.coachStaff.update({
      where: { id },
      data: {
        ...(body.teamId !== undefined && { teamId: body.teamId }),
        ...(body.name !== undefined && { name: body.name }),
        ...(body.email !== undefined && { email: body.email || null }),
        ...(body.role !== undefined && { role: body.role }),
        ...(body.crefi !== undefined && { crefi: body.crefi || null }),
        ...(body.sex !== undefined && { sex: body.sex || null }),
        ...(body.birthDate !== undefined && { birthDate: body.birthDate ? new Date(body.birthDate) : null }),
        ...(body.rg !== undefined && { rg: body.rg || null }),
        ...(body.cpf !== undefined && { cpf: body.cpf || null }),
        ...(body.cep !== undefined && { cep: body.cep || null }),
        ...(body.state !== undefined && { state: body.state || null }),
        ...(body.city !== undefined && { city: body.city || null }),
        ...(body.address !== undefined && { address: body.address || null }),
        ...(body.addressNum !== undefined && { addressNum: body.addressNum || null }),
        ...(body.addressComp !== undefined && { addressComp: body.addressComp || null }),
        ...(body.fatherName !== undefined && { fatherName: body.fatherName || null }),
        ...(body.motherName !== undefined && { motherName: body.motherName || null }),
        ...(body.phone !== undefined && { phone: body.phone || null }),
        ...(body.phone2 !== undefined && { phone2: body.phone2 || null }),
        ...(body.mobile !== undefined && { mobile: body.mobile || null }),
        ...(body.notes !== undefined && { notes: body.notes || null }),
        ...(body.photoUrl !== undefined && { photoUrl: body.photoUrl || null }),
        ...(body.isActive !== undefined && { isActive: body.isActive }),
        ...(body.situation !== undefined && { situation: body.situation }),
      },
    })
    return NextResponse.json(coach)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await prisma.coachStaff.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
