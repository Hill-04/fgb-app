import { prisma } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  
  try {
    const registrations = await prisma.registration.findMany({
      where: { championshipId: id },
      include: {
        team: { select: { id: true, name: true } },
        categories: {
          include: {
            category: { select: { id: true, name: true } }
          }
        }
      },
      orderBy: { registeredAt: 'desc' }
    })

    // Map to flatten categories for the frontend
    const formatted = registrations.map(reg => ({
      ...reg,
      categories: reg.categories.map(rc => rc.category)
    }))

    return NextResponse.json(formatted)
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Failed to fetch registrations' }, { status: 500 })
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { teamId, categoryIds, status } = await request.json()
  
  try {
    // Check if registration already exists
    const existingRegistration = await prisma.registration.findUnique({
      where: {
        championshipId_teamId: {
          championshipId: id,
          teamId
        }
      },
      include: { categories: true }
    })

    let registration

    if (existingRegistration) {
      // Update existing registration status and add NEW categories only
      const existingCatIds = existingRegistration.categories.map(c => c.categoryId)
      const newCatIds = categoryIds.filter((cid: string) => !existingCatIds.includes(cid))

      registration = await prisma.registration.update({
        where: { id: existingRegistration.id },
        data: {
          status: status || existingRegistration.status,
          categories: {
            create: newCatIds.map((cid: string) => ({ categoryId: cid }))
          }
        },
        include: {
          team: true,
          categories: { include: { category: true } }
        }
      })
    } else {
      // Create new registration
      registration = await prisma.registration.create({
        data: {
          championshipId: id,
          teamId,
          status: status || 'PENDING',
          categories: {
            create: categoryIds.map((cid: string) => ({ categoryId: cid }))
          }
        },
        include: {
          team: true,
          categories: { include: { category: true } }
        }
      })
    }

    const formatted = {
      ...registration,
      categories: registration.categories.map(rc => rc.category)
    }

    return NextResponse.json(formatted)
  } catch (error: any) {
    console.error('API Error (Registration Create):', error)
    
    if (error.code === 'P2002') {
      return NextResponse.json({ 
        error: 'Esta equipe já está inscrita neste campeonato.' 
      }, { status: 400 })
    }

    return NextResponse.json({ 
      error: error.message || 'Erro ao criar inscrição. Verifique os dados e tente novamente.' 
    }, { status: 500 })
  }
}
