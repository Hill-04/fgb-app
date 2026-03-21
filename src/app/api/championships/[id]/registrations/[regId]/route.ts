import { prisma } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; regId: string }> }
) {
  const { regId } = await params
  const { teamId, categoryIds, status } = await request.json()
  
  try {
    const registration = await prisma.registration.update({
      where: { id: regId },
      data: {
        teamId,
        status,
        categories: {
          deleteMany: {},
          create: categoryIds.map((cid: string) => ({ categoryId: cid }))
        }
      },
      include: {
        team: true,
        categories: {
          include: {
            category: true
          }
        }
      }
    })

    const formatted = {
      ...registration,
      categories: registration.categories.map(rc => rc.category)
    }

    return NextResponse.json(formatted)
  } catch (error: any) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Failed to update registration' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; regId: string }> }
) {
  const { regId } = await params
  
  try {
    await prisma.registration.delete({
      where: { id: regId }
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete registration' }, { status: 500 })
  }
}
