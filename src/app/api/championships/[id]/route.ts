import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const championship = await prisma.championship.findUnique({
      where: { id },
      include: {
        categories: true,
        _count: {
          select: { registrations: true }
        }
      }
    })

    if (!championship) {
      return NextResponse.json({ error: 'Campeonato nao encontrado' }, { status: 404 })
    }

    return NextResponse.json(championship)
  } catch (error) {
    console.error('Error fetching championship:', error)
    return NextResponse.json({ error: 'Erro ao buscar campeonato' }, { status: 500 })
  }
}
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { name, year, minTeamsPerCat, description, categories: selectedCodes } = body

    const updatedChampionship = await prisma.$transaction(async (tx) => {
      // 1. Update basic fields
      const championship = await tx.championship.update({
        where: { id },
        data: {
          name: name?.trim(),
          year: year ? Number(year) : undefined,
          minTeamsPerCat: minTeamsPerCat ? Number(minTeamsPerCat) : undefined,
          description: description || undefined,
        }
      })

      // 2. If categories are provided, replace them
      if (selectedCodes) {
        // Delete existing categories
        await tx.championshipCategory.deleteMany({
          where: { championshipId: id }
        })

        const CATEGORY_NAMES: Record<string, string> = {
          SUB12M: 'Sub 12 Masculino',
          SUB12F: 'Sub 12 Feminino',
          SUB13M: 'Sub 13 Masculino',
          SUB13F: 'Sub 13 Feminino',
          SUB15M: 'Sub 15 Masculino',
          SUB15F: 'Sub 15 Feminino',
          SUB17M: 'Sub 17 Masculino',
          SUB17F: 'Sub 17 Feminino',
        }

        // Create new ones
        await tx.championshipCategory.createMany({
          data: (selectedCodes as string[]).map((code: string) => ({
            name: CATEGORY_NAMES[code] || code,
            championshipId: id,
          }))
        })
      }

      return tx.championship.findUnique({
        where: { id },
        include: { categories: true }
      })
    })

    return NextResponse.json(updatedChampionship)
  } catch (error) {
    console.error('Error updating championship:', error)
    return NextResponse.json({ error: 'Erro ao atualizar campeonato' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Requisito: Não permitir deletar se houver inscrições (para segurança de dados)
    const registrations = await prisma.registration.count({
      where: { championshipId: id }
    })

    if (registrations > 0) {
      return NextResponse.json({ error: 'Não é possível excluir um campeonato com inscrições ativas.' }, { status: 400 })
    }

    await prisma.$transaction(async (tx) => {
      // Delete categories first
      await tx.championshipCategory.deleteMany({
        where: { championshipId: id }
      })
      // Delete championship
      await tx.championship.delete({
        where: { id }
      })
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting championship:', error)
    return NextResponse.json({ error: 'Erro ao excluir campeonato' }, { status: 500 })
  }
}
