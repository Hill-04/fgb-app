import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const ref = await prisma.referee.findUnique({
      where: { id },
      include: { category: true },
    })
    if (!ref) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(ref)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()
    const ref = await prisma.referee.update({
      where: { id },
      data: {
        ...(body.name !== undefined && { name: body.name }),
        ...(body.licenseNumber !== undefined && { licenseNumber: body.licenseNumber || null }),
        ...(body.phone !== undefined && { phone: body.phone || null }),
        ...(body.mobile !== undefined && { mobile: body.mobile || null }),
        ...(body.email !== undefined && { email: body.email || null }),
        ...(body.city !== undefined && { city: body.city || null }),
        ...(body.state !== undefined && { state: body.state || null }),
        ...(body.status !== undefined && { status: body.status }),
        ...(body.registrationNumber !== undefined && { registrationNumber: body.registrationNumber ? Number(body.registrationNumber) : null }),
        ...(body.sex !== undefined && { sex: body.sex || null }),
        ...(body.birthDate !== undefined && { birthDate: body.birthDate ? new Date(body.birthDate) : null }),
        ...(body.rg !== undefined && { rg: body.rg || null }),
        ...(body.cpf !== undefined && { cpf: body.cpf || null }),
        ...(body.cep !== undefined && { cep: body.cep || null }),
        ...(body.address !== undefined && { address: body.address || null }),
        ...(body.motherName !== undefined && { motherName: body.motherName || null }),
        ...(body.notes !== undefined && { notes: body.notes || null }),
        ...(body.photoUrl !== undefined && { photoUrl: body.photoUrl || null }),
        ...(body.isActive !== undefined && { isActive: body.isActive }),
        ...(body.categoryId !== undefined && { categoryId: body.categoryId || null }),
      },
    })
    return NextResponse.json(ref)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await prisma.referee.update({ where: { id }, data: { status: 'INACTIVE', isActive: false } })
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
