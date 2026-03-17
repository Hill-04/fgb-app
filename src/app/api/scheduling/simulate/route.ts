import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
})

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !(session.user as any).isAdmin) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { championshipId } = await request.json()
    if (!championshipId) {
      return NextResponse.json({ error: 'championshipId é obrigatório' }, { status: 400 })
    }

    // 1. Coletar dados do campeonato específico
    const championship = await prisma.championship.findUnique({
      where: { id: championshipId },
      include: {
        categories: {
          include: {
            registrations: {
              include: {
                registration: {
                  include: {
                    team: { include: { gym: true } },
                    blockedDates: true
                  }
                }
              }
            }
          }
        }
      }
    }) as any

    if (!championship) {
      return NextResponse.json({ error: 'Campeonato não encontrado' }, { status: 404 })
    }

    // 2. Preparar dados para a IA
    const promptData = {
      championship: {
        name: championship.name,
        format: championship.format,
        phases: championship.phases,
        turns: championship.turns,
        fieldControl: championship.fieldControl,
        startDate: championship.startDate,
        endDate: championship.endDate,
        minTeamsPerCat: championship.minTeamsPerCat
      },
      categories: championship.categories.map((cat: any) => ({
        id: cat.id,
        name: cat.name,
        teams: cat.registrations.map((regMatch: any) => {
          const reg = regMatch.registration
          return {
            id: reg.team.id,
            name: reg.team.name,
            city: reg.team.city,
            gym: reg.team.gym?.name || 'Não informado',
            blockedDates: reg.blockedDates.map((bd: any) => ({
              date: bd.date,
              reason: bd.reason
            }))
          }
        })
      }))
    }

    const prompt = `
Você é um especialista em logística de basquete. Sua tarefa é criar um cronograma otimizado para o campeonato "${championship.name}".

REGRAS DO CAMPEONATO:
- Formato: ${championship.format}
- Turnos: ${championship.turns}
- Fases: ${championship.phases}
- Controle de Campo: ${championship.fieldControl}
- Período: ${championship.startDate?.toISOString() || 'Não definido'} até ${championship.endDate?.toISOString() || 'Não definido'}

OBJETIVOS:
1. Validar viabilidade: Apenas categorias com pelo menos ${championship.minTeamsPerCat} equipes são viáveis.
2. Agrupamento (Blocks): Agrupe categorias que possuam as mesmas equipes ou cidades próximas para reduzir viagens.
3. Sedes: Sugira ginásios baseados nas equipes locais.
4. Datas: Evite os "blockedDates" informados pelas equipes.

RETORNE APENAS UM JSON VÁLIDO:
{
  "viableCategories": [
    { "id": "uuid", "title": "Nome da Categoria", "teamsCount": 5 }
  ],
  "blocks": [
    {
      "id": "B1",
      "title": "Bloco 1 (Ex: Sub 15 e Sub 17)",
      "reason": "Explicação logistica aqui",
      "categories": ["Nome Cat 1", "Nome Cat 2"],
      "phases": [
        {
          "name": "Fase 1 - Sede X",
          "date": "ISO_DATE_STRING",
          "location": "Nome do Ginásio",
          "city": "Cidade",
          "matches": [
            { "homeTeamId": "uuid", "awayTeamId": "uuid", "categoryId": "uuid", "phase": 1 }
          ]
        }
      ]
    }
  ],
  "summary": {
    "totalMatches": 20,
    "totalTravelSaved": "Explicação curta"
  }
}

DADOS DAS CATEGORIAS E EQUIPES:
${JSON.stringify(promptData.categories, null, 2)}
`

    if (!process.env.ANTHROPIC_API_KEY) {
      // Retorna Mock se offline
      return NextResponse.json({
        viableCategories: (championship.categories as any[]).map((c: any) => ({
          id: c.id,
          title: c.name,
          teamsCount: c.registrations.length
        })),
        blocks: [
          {
            id: 'mock-b1',
            title: 'Bloco Simulado (IA Offline)',
            reason: 'Chave API Anthropic não configurada.',
            categories: (championship.categories as any[]).slice(0, 2).map((c: any) => c.name),
            phases: [
              {
                name: 'Eliminatória - Sede POA',
                date: new Date().toISOString(),
                location: 'Ginásio Teste',
                city: 'Porto Alegre',
                matches: []
              }
            ]
          }
        ],
        summary: { totalMatches: 0, totalTravelSaved: "N/A" }
      })
    }

    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20240620',
      max_tokens: 4000,
      system: 'Você é um assistente logístico que retorna apenas JSON puro.',
      messages: [{ role: 'user', content: prompt }]
    });

    const responseContent = message.content[0].type === 'text' ? message.content[0].text : '{}'
    const cleanedJSON = responseContent.replace(/```json/g, '').replace(/```/g, '').trim()
    
    return NextResponse.json(JSON.parse(cleanedJSON))
  } catch (error) {
    console.error('AI Scheduling Error:', error)
    return NextResponse.json({ error: 'Erro ao gerar agendamento IA' }, { status: 500 })
  }
}
