import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

function codeToName(code: string): string {
  const match = code.match(/^SUB(\d+)(M|F)$/)
  if (!match) return code
  return `Sub ${match[1]} ${match[2] === 'M' ? 'Masculino' : 'Feminino'}`
}

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
        _count: { select: { registrations: true } },
      },
    })
    if (!championship) return NextResponse.json({ error: 'Campeonato não encontrado' }, { status: 404 })
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
    const {
      name, year, sex, minTeamsPerCat, categories: selectedCodes,
      format, turns, phases, fieldControl, tiebreakers,
      hasRelegation, relegationDown, promotionUp,
      hasPlayoffs, playoffTeams, playoffFormat, hasThirdPlace,
      hasBlocks, regDeadline, startDate, endDate,
    } = body

    const updated = await prisma.$transaction(async (tx) => {
      await tx.championship.update({
        where: { id },
        data: {
          ...(name && { name: name.trim() }),
          ...(year && { year: Number(year) }),
          ...(sex && { sex }),
          ...(minTeamsPerCat !== undefined && { minTeamsPerCat: Number(minTeamsPerCat) }),
          ...(format && { format }),
          ...(turns !== undefined && { turns: Number(turns) }),
          ...(phases !== undefined && { phases: Number(phases) }),
          ...(fieldControl && { fieldControl }),
          ...(tiebreakers && { tiebreakers: Array.isArray(tiebreakers) ? tiebreakers.join(',') : tiebreakers }),
          ...(hasRelegation !== undefined && { hasRelegation: Boolean(hasRelegation) }),
          ...(relegationDown !== undefined && { relegationDown: Number(relegationDown) }),
          ...(promotionUp !== undefined && { promotionUp: Number(promotionUp) }),
          ...(hasPlayoffs !== undefined && { hasPlayoffs: Boolean(hasPlayoffs) }),
          ...(playoffTeams !== undefined && { playoffTeams: Number(playoffTeams) }),
          ...(playoffFormat && { playoffFormat }),
          ...(hasThirdPlace !== undefined && { hasThirdPlace: Boolean(hasThirdPlace) }),
          ...(hasBlocks !== undefined && { hasBlocks: Boolean(hasBlocks) }),
          ...(regDeadline && { regDeadline: new Date(regDeadline) }),
          ...(startDate && { startDate: new Date(startDate) }),
          ...(endDate && { endDate: new Date(endDate) }),
        },
      })

      if (selectedCodes) {
        await tx.championshipCategory.deleteMany({ where: { championshipId: id } })
        
        // Fix for SQLite: individual creates because createMany doesn't handle @default(uuid()) for PKs
        for (const code of (selectedCodes as string[])) {
          await tx.championshipCategory.create({
            data: {
              name: codeToName(code),
              championshipId: id,
            },
          })
        }
      }

      return tx.championship.findUnique({
        where: { id },
        include: { categories: true, _count: { select: { registrations: true } } },
      })
    })

    return NextResponse.json(updated)
  } catch (error: any) {
    console.error('Error updating championship:', error)
    return NextResponse.json({ error: error?.message || 'Erro ao atualizar campeonato' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const registrations = await prisma.registration.count({ where: { championshipId: id } })
    if (registrations > 0) {
      return NextResponse.json({ error: 'Não é possível excluir um campeonato com inscrições ativas.' }, { status: 400 })
    }

    await prisma.$transaction(async (tx) => {
      await tx.championshipCategory.deleteMany({ where: { championshipId: id } })
      await tx.championship.delete({ where: { id } })
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting championship:', error)
    return NextResponse.json({ error: 'Erro ao excluir campeonato' }, { status: 500 })
  }
}
