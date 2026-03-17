import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// Generate category name from code e.g. SUB12M -> "Sub 12 Masculino"
function codeToName(code: string): string {
  const match = code.match(/^SUB(\d+)(M|F)$/)
  if (!match) return code
  const age = match[1]
  const sex = match[2] === 'M' ? 'Masculino' : 'Feminino'
  return `Sub ${age} ${sex}`
}

export async function GET() {
  try {
    const championships = await prisma.championship.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        categories: true,
        _count: { select: { registrations: true } },
      },
    })
    return NextResponse.json(championships)
  } catch (error) {
    console.error('Error fetching championships:', error)
    return NextResponse.json({ error: 'Erro ao buscar campeonatos' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      name, year, sex, minTeamsPerCat, categories: selectedCodes,
      format, turns, phases, fieldControl, tiebreakers,
      hasRelegation, relegationDown, promotionUp,
      hasPlayoffs, playoffTeams, playoffFormat, hasThirdPlace,
      hasBlocks,
      regDeadline, startDate, endDate,
    } = body

    if (!name?.trim()) return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 })
    if (!selectedCodes || selectedCodes.length === 0) return NextResponse.json({ error: 'Selecione ao menos uma categoria' }, { status: 400 })

    const championship = await prisma.$transaction(async (tx) => {
      const c = await tx.championship.create({
        data: {
          name: name.trim(),
          year: Number(year) || new Date().getFullYear(),
          sex: sex || 'masculino',
          format: format || 'todos_contra_todos',
          turns: Number(turns) || 1,
          phases: Number(phases) || 1,
          fieldControl: fieldControl || 'alternado',
          tiebreakers: Array.isArray(tiebreakers) ? tiebreakers.join(',') : (tiebreakers || 'pontos,saldo,confronto_direto,pontos_marcados'),
          hasRelegation: Boolean(hasRelegation),
          relegationDown: Number(relegationDown) || 0,
          promotionUp: Number(promotionUp) || 0,
          hasPlayoffs: Boolean(hasPlayoffs),
          playoffTeams: Number(playoffTeams) || 4,
          playoffFormat: playoffFormat || 'melhor_de_1',
          hasThirdPlace: hasThirdPlace !== false,
          hasBlocks: Boolean(hasBlocks),
          minTeamsPerCat: Number(minTeamsPerCat) || 3,
          regDeadline: regDeadline ? new Date(regDeadline) : new Date(),
          startDate: startDate ? new Date(startDate) : null,
          endDate: endDate ? new Date(endDate) : null,
          status: 'DRAFT',
        },
      })

      await tx.championshipCategory.createMany({
        data: (selectedCodes as string[]).map((code: string) => ({
          name: codeToName(code),
          championshipId: c.id,
        })),
      })

      return tx.championship.findUnique({
        where: { id: c.id },
        include: { categories: true, _count: { select: { registrations: true } } },
      })
    })

    return NextResponse.json(championship, { status: 201 })
  } catch (error) {
    console.error('Error creating championship:', error)
    return NextResponse.json({ error: 'Erro ao criar campeonato' }, { status: 500 })
  }
}
