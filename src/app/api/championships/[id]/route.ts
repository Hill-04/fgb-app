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
    const [championship, counts] = await prisma.$transaction(async (tx) => {
      const catIds = await tx.championshipCategory.findMany({ where: { championshipId: id }, select: { id: true } })
      const regIds = await tx.registration.findMany({ where: { championshipId: id }, select: { id: true } })
      const cIds = catIds.map(c => c.id)
      const rIds = regIds.map(r => r.id)

      const champ = await tx.championship.findUnique({
        where: { id },
        include: { categories: true }
      })

      const safeCount = async (model: any, where: any) => {
        try { return await model.count({ where }) } 
        catch (e) { return 0 }
      }

      return [
        champ,
        {
          games: await safeCount(tx.game, { championshipId: id }),
          registrations: await safeCount(tx.registration, { championshipId: id }),
          categories: await safeCount(tx.championshipCategory, { championshipId: id }),
          standings: await safeCount(tx.standing, { categoryId: { in: cIds } }),
          documents: await safeCount(tx.document, { championshipId: id }),
          blocks: await safeCount(tx.block, { championshipId: id }),
        }
      ] as const
    })

    if (!championship) {
      return NextResponse.json({ error: 'Nao encontrado' }, { status: 404 })
    }

    return NextResponse.json({ ...championship, deletionCounts: counts })
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
      numberOfCourts, dayStartTime, regularDayEndTime, extendedDayEndTime,
      slotDurationMinutes, minRestSlotsPerTeam, blockFormat,
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
          ...(numberOfCourts !== undefined && { numberOfCourts: Number(numberOfCourts) }),
          ...(dayStartTime && { dayStartTime }),
          ...(regularDayEndTime && { regularDayEndTime }),
          ...(extendedDayEndTime && { extendedDayEndTime }),
          ...(slotDurationMinutes !== undefined && { slotDurationMinutes: Number(slotDurationMinutes) }),
          ...(minRestSlotsPerTeam !== undefined && { minRestSlotsPerTeam: Number(minRestSlotsPerTeam) }),
          ...(blockFormat && { blockFormat }),
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

    await prisma.$transaction(async (tx) => {
      // 1. Get dependent IDs
      const catIds = await tx.championshipCategory.findMany({ 
        where: { championshipId: id }, 
        select: { id: true } 
      })
      const regIds = await tx.registration.findMany({ 
        where: { championshipId: id }, 
        select: { id: true } 
      })

      const categoryIds = catIds.map(c => c.id)
      const registrationIds = regIds.map(r => r.id)

      // 2. Delete in order (Children first)
      await tx.document.deleteMany({ where: { championshipId: id } })
      await tx.standing.deleteMany({ where: { categoryId: { in: categoryIds } } })
      await tx.game.deleteMany({ where: { championshipId: id } })
      await tx.athleteCategory.deleteMany({ where: { registrationId: { in: registrationIds } } })
      await tx.blockedDate.deleteMany({ where: { registrationId: { in: registrationIds } } })
      await tx.registrationCategory.deleteMany({ where: { registrationId: { in: registrationIds } } })
      await tx.registration.deleteMany({ where: { championshipId: id } })
      await tx.block.deleteMany({ where: { championshipId: id } })
      await tx.championshipCategory.deleteMany({ where: { championshipId: id } })
      
      // 3. Delete the championship itself
      await tx.championship.delete({ where: { id } })
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting championship:', error)
    return NextResponse.json({ error: 'Erro ao excluir campeonato' }, { status: 500 })
  }
}
