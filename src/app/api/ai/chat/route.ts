import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { geminiModel } from "@/lib/gemini";

export async function POST(req: NextRequest) {
  try {
    // Verificar autenticação admin
    const session = await getServerSession(authOptions);
    if (!session || !(session.user as any)?.isAdmin) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { message, history, championshipId } = await req.json();

    // Buscar TODOS os dados do campeonato ativo
    const championship = await prisma.championship.findFirst({
      where: championshipId ? { id: championshipId } : { status: { not: "COMPLETED" } },
      include: {
        categories: {
          include: {
            registrations: {
              include: {
                registration: {
                  include: {
                    team: { include: { gym: true } },
                    blockedDates: true,
                  }
                }
              }
            }
          }
        },
        games: {
          include: {
            homeTeam: true,
            awayTeam: true,
            category: true,
          }
        },
        blocks: true,
      }
    });

    // Buscar feriados
    const holidays = await prisma.holiday.findMany({
      where: { year: new Date().getFullYear() }
    });

    // Buscar todas as equipes
    const allTeams = await prisma.team.findMany({
      include: { gym: true }
    });

    // Montar contexto para o Gemini
    const systemPrompt = buildSystemPrompt(championship, holidays, allTeams);

    // Montar histórico de conversa
    const chatHistory = history?.map((msg: any) => ({
      role: msg.role === "user" ? "user" : "model",
      parts: [{ text: msg.content }],
    })) || [];

    if (!geminiModel) {
      return NextResponse.json({ error: "Serviço de IA não configurado. Verifique a GEMINI_API_KEY." }, { status: 503 });
    }

    const chat = geminiModel.startChat({
      history: chatHistory,
      systemInstruction: systemPrompt,
    });

    const result = await chat.sendMessage(message);
    const responseText = result.response.text();

    // Detectar e executar ações se houver
    const actions = detectActions(responseText);
    let actionResults = null;
    if (actions.length > 0) {
      actionResults = await executeActions(actions, championship?.id);
    }

    return NextResponse.json({
      response: responseText,
      actions: actionResults,
    });
  } catch (error: any) {
    console.error("Erro Gemini:", error);
    return NextResponse.json({ error: error.message || "Erro interno na IA" }, { status: 500 });
  }
}

function buildSystemPrompt(championship: any, holidays: any[], allTeams: any[]) {
  let context = `
# VOCÊ É O ASSISTENTE DE IA DA FEDERAÇÃO GAÚCHA DE BASQUETE (FGB)

## SEU PAPEL
Você é um agente especializado em organização de campeonatos de basquete. Você ajuda os administradores da FGB a:
- Organizar datas de jogos
- Criar tabelas de confrontos
- Agrupar categorias em blocos para economizar viagens
- Simular cenários ("e se uma equipe desistir?")
- Sugerir as melhores datas considerando restrições
- Responder dúvidas sobre equipes, categorias e regras

## REGRAS DE COMPORTAMENTO
- Responda SEMPRE em português brasileiro
- Seja direto e objetivo
- Quando sugerir datas ou confrontos, mostre em formato de tabela organizada em Markdown.
- Considere SEMPRE os feriados e datas bloqueadas ao sugerir calendários.
- Se o admin pedir para executar uma ação (criar jogos, gerar calendário, criar blocos), você DEVE incluir no final da resposta um bloco de ação exatamente neste formato:
  [AÇÃO: TIPO_DA_AÇÃO]
  {dados em JSON}
  [/AÇÃO]

## TIPOS DE AÇÃO DISPONÍVEIS
- GERAR_CONFRONTOS: Requer "categoryId" e opcionalmente "phase".
- CRIAR_BLOCOS: Requer "name" e "categories" (array de IDs ou nomes).
- INFO: Para apenas informar algo sem mutação no banco.

## DADOS ATUAIS DO SISTEMA
`;

  if (championship) {
    context += `
### CAMPEONATO ATIVO
- ID: ${championship.id}
- Nome: ${championship.name}
- Sexo: ${championship.sex}
- Formato: ${championship.format}
- Fases: ${championship.phases}
- Mínimo equipes por categoria: ${championship.minTeamsPerCat}
- Status: ${championship.status}
- Prazo inscrição: ${championship.regDeadline}

### CATEGORIAS E EQUIPES INSCRITAS
`;
    championship.categories?.forEach((cat: any) => {
      const teams = cat.registrations?.map((r: any) => r.registration?.team);
      const viable = (teams?.length || 0) >= (championship.minTeamsPerCat || 3);
      context += `\n**${cat.name}** (ID: ${cat.id}) [${teams?.length || 0} equipes] ${viable ? '✅ Viável' : '❌ Insuficiente'}:\n`;
      context += teams?.map((t: any) => t?.name).join(", ") || "Nenhuma equipe inscrita";
      context += "\n";

      cat.registrations?.forEach((r: any) => {
        const blocked = r.registration?.blockedDates?.map((d: any) => {
          const start = d.startDate.toISOString().split('T')[0];
          const end = d.endDate ? ` até ${d.endDate.toISOString().split('T')[0]}` : '';
          const reason = d.reason ? ` (${d.reason})` : '';
          return `${start}${end}${reason}`;
        }).join(", ");
        if (blocked) {
          context += `  - ${r.registration?.team?.name} bloqueou: ${blocked}\n`;
        }
      });
    });

    if (championship.games?.length > 0) {
      context += `\n### JOGOS JÁ AGENDADOS (${championship.games.length})\n`;
      championship.games.slice(0, 20).forEach((g: any) => {
        context += `- ${g.homeTeam?.name} vs ${g.awayTeam?.name} (${g.category?.name}) - Fase ${g.phase} - ${g.dateTime}\n`;
      });
      if (championship.games.length > 20) context += "... (mais jogos omitidos para brevidade)\n";
    }

    if (championship.blocks?.length > 0) {
      context += `\n### BLOCOS DEFINIDOS\n`;
      championship.blocks.forEach((b: any) => {
        context += `- ${b.name}: ${b.categories}\n`;
      });
    }
  }

  context += `\n### FERIADOS\n`;
  holidays.forEach((h: any) => {
    context += `- ${h.date.toISOString().split('T')[0]}: ${h.name}${h.isFamilyHoliday ? ' (Familiar)' : ''}${h.reason ? ` - Motivo: ${h.reason}` : ''}\n`;
  });

  context += `\n### GINÁSIOS E EQUIPES\n`;
  allTeams.forEach((t: any) => {
    if (t.gym) {
      context += `- ${t.name} (${t.city}): ${t.gym.name} - Cap: ${t.gym.capacity} - Disponível: ${t.gym.availability} - Sede: ${t.gym.canHost ? 'Sim' : 'Não'}\n`;
    } else {
      context += `- ${t.name} (${t.city})\n`;
    }
  });

  return context;
}

function detectActions(response: string): any[] {
  const actions: any[] = [];
  const regex = /\[AÇÃO: (\w+)\]\n([\s\S]*?)\[\/AÇÃO\]/g;
  let match;
  while ((match = regex.exec(response)) !== null) {
    try {
      const data = JSON.parse(match[2].trim());
      actions.push({ type: match[1], data });
    } catch (e) {
      console.error("Erro ao parsear ação da IA:", e);
    }
  }
  return actions;
}

async function executeActions(actions: any[], championshipId?: string) {
  if (!championshipId) return null;
  const results: any[] = [];

  for (const action of actions) {
    try {
      switch (action.type) {
        case "GERAR_CONFRONTOS": {
          const { categoryId, phase = 1 } = action.data;
          if (!categoryId) throw new Error("categoryId é obrigatório para GERAR_CONFRONTOS");

          const category = await prisma.championshipCategory.findUnique({
            where: { id: categoryId },
            include: { registrations: { include: { registration: { include: { team: true } } } } }
          });

          if (!category) throw new Error("Categoria não encontrada");
          const teamIds = category.registrations.map(r => r.registration.team.id);
          
          const gamesCreated = [];
          for (let i = 0; i < teamIds.length; i++) {
            for (let j = i + 1; j < teamIds.length; j++) {
              const game = await prisma.game.create({
                data: {
                  championshipId,
                  categoryId,
                  homeTeamId: teamIds[i],
                  awayTeamId: teamIds[j],
                  phase: Number(phase),
                  dateTime: new Date(), // Placeholder, IA ou Admin devem ajustar depois
                  location: "A definir",
                  city: "A definir",
                  status: "SCHEDULED"
                }
              });
              gamesCreated.push(game);
            }
          }

          results.push({ 
            type: "GERAR_CONFRONTOS", 
            status: "success", 
            message: `${gamesCreated.length} confrontos gerados para ${category.name}.` 
          });
          break;
        }

        case "CRIAR_BLOCOS": {
          const { name, categories } = action.data;
          const block = await prisma.block.create({
            data: {
              name,
              championshipId,
              categories: Array.isArray(categories) ? categories.join(', ') : categories
            }
          });
          results.push({ 
            type: "CRIAR_BLOCOS", 
            status: "success", 
            message: `Bloco "${block.name}" criado com sucesso.` 
          });
          break;
        }

        default:
          results.push({ type: action.type, status: "info", message: "Ação processada informativamente." });
      }
    } catch (err: any) {
      results.push({ type: action.type, status: "error", message: err.message });
    }
  }

  return results;
}
