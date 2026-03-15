import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || 'dummy_key',
})

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // 1. Coletar dados do BD para enviar ao Claude
    // Vamos coletar campeonatos abertos/agendados e as equipes inscritas neles
    const championships = await prisma.championship.findMany({
      where: {
        status: { in: ['REGISTRATION_OPEN', 'SCHEDULED'] }
      },
      include: {
        categories: true,
        registrations: {
          include: {
            team: {
              include: { gym: true }
            },
            categories: { include: { category: true } },
            blockedDates: true
          }
        }
      }
    })

    if (championships.length === 0) {
      return NextResponse.json({ error: 'Nenhum campeonato válido para escalonamento encontrado.' }, { status: 400 })
    }

    // Montar o prompt
    const promptData = (championships as any[]).map(c => {
      const teams = c.registrations.map(r => ({
        name: r.team.name,
        city: r.team.city,
        gym: r.team.gym ? r.team.gym.name : null,
        categories: r.categories.map(cat => cat.category.name),
        blockedDates: r.blockedDates.map(bd => ({
          date: bd.date,
          reason: bd.reason
        }))
      }))

      return {
        championshipName: c.name,
        minTeamsPerCat: c.minTeamsPerCat,
        format: c.format,
        phases: c.phases,
        teams
      }
    })

    const prompt = `
Você é um especialista em logística e escalonamento de campeonatos de basquete.
Sua tarefa é analisar os dados de inscrições de equipes, cruzar informações geográficas e datas bloqueadas,
e retornar um cronograma otimizado no formato JSON.

As metas são:
1. Agrupar categorias que possuam as mesmas equipes para reduzir custos de viagem (ex: Sub 15 e Sub 17 juntas).
2. Determinar as "viableCategories" (categorias viáveis): só ocorrem se tiverem o mínimo de equipes exigido pelo campeonato.
3. Definir blocos (blocks) de jogos por fases, sugerindo sedes apropriadas (cidades das equipes com ginásios).
4. Evitar conflito de datas com "blockedDates" informadas pelas equipes. Forneça uma data primária e uma secundária.

Abaixo os dados dos campeonatos vigentes:
${JSON.stringify(promptData, null, 2)}

Você DEVE retornar APENAS UM JSON válido na seguinte estrutura, sem nenhum outro texto, usando as chaves exatas:
{
  "viableCategories": [
    { "id": "uuid-or-slug", "title": "Sub 17", "teams": 4 }
  ],
  "blocks": [
    {
      "id": "B1",
      "title": "Bloco 1 (Sub 15 + Sub 17)",
      "reason": "Explicação do agrupamento para economizar viagens",
      "phases": [
        { "name": "Sede 1: Porto Alegre", "date": "A Definir", "matches": 10 }
      ]
    }
  ],
  "dates": [
    { "phase": "Bloco 1 - 1ª Fase", "primary": "10 a 11 Maio 2026", "alternate": "17 a 18 Maio 2026", "conflictRemoved": "Justificativa..." }
  ]
}
`

    if (!process.env.ANTHROPIC_API_KEY) {
      // Retorna dado mock se a chave não estiver presente para n quebrar o fluxo MVP na demonstração
      return NextResponse.json({
        mocked: true,
        viableCategories: [
          { id: 'sub17', title: 'Sub 17 (Mock)', teams: 5 },
          { id: 'sub15', title: 'Sub 15 (Mock)', teams: 7 }
        ],
        blocks: [
          {
            id: 'B1',
            title: 'Bloco Exemplo (IA offline)',
            reason: 'Chave API não configurada. Mostrando dados exemplo.',
            phases: [{ name: 'Sede Caxias do Sul', date: 'A Definir', matches: 8 }]
          }
        ],
        dates: [
          { phase: 'Bloco Único', primary: '08 Maio', alternate: '15 Maio', conflictRemoved: 'Mocks' }
        ]
      }, { status: 200 })
    }

    const message = await anthropic.messages.create({
      model: 'claude-3-opus-20240229',
      max_tokens: 3000,
      system: 'Você deve retornar somente JSON estritamente formatado. Sem markdown backticks envolta do json se puder, ou somente JSON válido.',
      messages: [{ role: 'user', content: prompt }]
    });

    const responseContent = message.content[0].type === 'text' ? message.content[0].text : '{}';
    let jsonData = {};
    
    try {
      const cleanedJSON = responseContent.replace(/```json/g, '').replace(/```/g, '').trim();
      jsonData = JSON.parse(cleanedJSON);
    } catch (e) {
      console.error('Failed to parse Claude JSON', responseContent);
      return NextResponse.json({ error: 'Falha ao processar simulação. O formato retornado não é válido.' }, { status: 500 });
    }

    return NextResponse.json(jsonData, { status: 200 })
  } catch (error) {
    console.error('Error simulating schedule:', error)
    return NextResponse.json({ error: 'Erro ao executar a IA' }, { status: 500 })
  }
}
