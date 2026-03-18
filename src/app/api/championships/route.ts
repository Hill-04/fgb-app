import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

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
    const session = await getServerSession(authOptions)
    const isAdmin = (session?.user as any)?.isAdmin

    const championships = await (prisma.championship.findMany({
      where: (isAdmin ? {} : { isSimulation: false }) as any,
      orderBy: { createdAt: 'desc' },
      include: {
        categories: true,
        _count: { select: { registrations: true } },
      },
    }) as any)
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

    const isValidDate = (d: any) => d && !isNaN(new Date(d).getTime())

    const championship = await prisma.$transaction(async (tx) => {
      const c = await tx.championship.create({
        data: {
          name: name.trim(),
          year: Number(year) || new Date().getFullYear(),
          sex: sex || 'masculino',
          format: format || 'todos_contra_todos',
          turns: Number(turns) || 1,
          phases: phases !== undefined ? Number(phases) : 1,
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
          regDeadline: isValidDate(regDeadline) ? new Date(regDeadline) : new Date(),
          startDate: isValidDate(startDate) ? new Date(startDate) : null,
          endDate: isValidDate(endDate) ? new Date(endDate) : null,
          status: 'DRAFT',
        },
      })

      // Fix for SQLite: individual creates because createMany doesn't handle @default(uuid()) for PKs
      for (const code of (selectedCodes as string[])) {
        await tx.championshipCategory.create({
          data: {
            name: codeToName(code),
            championshipId: c.id,
          },
        })
      }

      return tx.championship.findUnique({
        where: { id: c.id },
        include: { categories: true, _count: { select: { registrations: true } } },
      })
    })

    return NextResponse.json(championship, { status: 201 })
  } catch (error: any) {
    console.error('Error creating championship:', error)
    // Return more specific error if possible to help user debug
    const message = error?.message || 'Erro interno ao criar campeonato'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
