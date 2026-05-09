import type { SchedulingBriefing } from './scheduling-briefing'
import {
  validateProposedSchedule,
  validateRoundRobinCompleteness,
  type ProposedGame,
  type ValidationResult,
} from './scheduling-validator'
import { generateDeterministicSchedule } from './deterministic-scheduler'

export type AIScheduleResult = {
  games: ProposedGame[]
  validation: ValidationResult
  source: 'ai' | 'deterministic_fallback' | 'ai_then_validated'
  provider?: string
  attempts: number
  rationale?: string
}

export async function orchestrateScheduling(
  briefing: SchedulingBriefing,
  options: {
    maxAttempts?: number
    forceDeterministic?: boolean
  } = {},
): Promise<AIScheduleResult> {
  const maxAttempts = options.maxAttempts ?? 3

  if (options.forceDeterministic) {
    const games = generateDeterministicSchedule(briefing)
    const validation = validateProposedSchedule(games, briefing)
    return { games, validation, source: 'deterministic_fallback', attempts: 0 }
  }

  const result = await tryAIScheduling(briefing, maxAttempts)

  if (result && result.validation.valid) {
    return result
  }

  const games = generateDeterministicSchedule(briefing)
  const validation = validateProposedSchedule(games, briefing)
  const completenessIssues = validateRoundRobinCompleteness(games, briefing)
  validation.errors.push(...completenessIssues.filter((i) => i.severity === 'error'))
  validation.warnings.push(...completenessIssues.filter((i) => i.severity === 'warning'))
  validation.valid = validation.errors.length === 0

  return {
    games,
    validation,
    source: 'deterministic_fallback',
    attempts: result?.attempts ?? 0,
  }
}

async function tryAIScheduling(
  briefing: SchedulingBriefing,
  maxAttempts: number,
): Promise<AIScheduleResult | null> {
  let lastErrors: string[] = []
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const aiResponse = await callAIProvider(briefing, lastErrors)
    if (!aiResponse) continue

    const validation = validateProposedSchedule(aiResponse.games, briefing)
    const completeness = validateRoundRobinCompleteness(aiResponse.games, briefing)
    validation.errors.push(...completeness.filter((i) => i.severity === 'error'))
    validation.warnings.push(...completeness.filter((i) => i.severity === 'warning'))
    validation.valid = validation.errors.length === 0

    if (validation.valid) {
      return {
        games: aiResponse.games,
        validation,
        source: 'ai_then_validated',
        provider: aiResponse.provider,
        attempts: attempt,
        rationale: aiResponse.rationale,
      }
    }

    lastErrors = validation.errors.slice(0, 10).map((e) => e.message)
  }

  return null
}

async function callAIProvider(
  briefing: SchedulingBriefing,
  previousErrors: string[],
): Promise<{ games: ProposedGame[]; provider: string; rationale?: string } | null> {
  const prompt = buildPrompt(briefing, previousErrors)

  const claudeKey = process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY
  if (claudeKey) {
    try {
      const result = await callClaude(prompt, claudeKey)
      if (result) return { ...result, provider: 'claude' }
    } catch (e: any) {
      console.warn('[AI Orchestrator] Claude failed:', e.message)
    }
  }

  const openaiKey = process.env.OPENAI_API_KEY
  if (openaiKey) {
    try {
      const result = await callOpenAI(prompt, openaiKey)
      if (result) return { ...result, provider: 'openai' }
    } catch (e: any) {
      console.warn('[AI Orchestrator] OpenAI failed:', e.message)
    }
  }

  const geminiKey = process.env.GEMINI_API_KEY
  if (geminiKey) {
    try {
      const result = await callGemini(prompt, geminiKey)
      if (result) return { ...result, provider: 'gemini' }
    } catch (e: any) {
      console.warn('[AI Orchestrator] Gemini failed:', e.message)
    }
  }

  return null
}

function buildPrompt(briefing: SchedulingBriefing, previousErrors: string[]): string {
  return `Você é um agendador de campeonato de basquete. Gere um calendário válido como JSON estrito.

# Contrato de saída
Responda APENAS com um JSON com a estrutura:
{
  "games": [
    {
      "categoryId": "string",
      "homeTeamId": "string",
      "awayTeamId": "string",
      "venueId": "string|null",
      "dateTime": "ISO8601 UTC",
      "court": "string|null",
      "rationale": "explicação curta"
    }
  ],
  "rationale": "resumo da estratégia"
}

# Restrições DURAS (qualquer violação invalida o calendário)
- Dias da semana permitidos: ${JSON.stringify(briefing.championship.schedulingConfig.allowedWeekdays)} (0=dom..6=sáb)
- Janelas de horário permitidas: ${JSON.stringify(briefing.championship.schedulingConfig.timeSlots)}
- Datas bloqueadas: ${JSON.stringify(briefing.championship.schedulingConfig.blackoutDates)}
- Descanso mínimo entre jogos da mesma equipe: ${briefing.championship.schedulingConfig.minRestHoursBetweenGames}h
- Máximo de jogos por equipe por dia: ${briefing.championship.schedulingConfig.maxGamesPerTeamPerDay}
- Máximo de jogos por equipe por semana: ${briefing.championship.schedulingConfig.maxGamesPerTeamPerWeek}
- Padrão de mando: ${briefing.preferences.homePattern}
- Modo de otimização: ${briefing.preferences.optimizationMode}

# Estrutura
- Formato: ${briefing.championship.format}
- Turnos: ${briefing.championship.turns}
- Em todos contra todos com N turnos, cada par de equipes joga N vezes
- ${briefing.championship.hasPlayoffs ? `Top ${briefing.championship.playoffTeams} avançam para playoff (${briefing.championship.playoffFormat})` : 'Sem playoff'}

# Categorias e equipes confirmadas
${briefing.categories.map((c) => `- ${c.name} (id: ${c.id}): ${c.registeredTeamIds.length} equipes [${c.registeredTeamIds.join(', ')}]`).join('\n')}

# Equipes
${briefing.teams.map((t) => `- ${t.name} (${t.id}) — ${t.city ?? '?'}/${t.state ?? '?'} ${t.homeVenue ? `· sede: ${t.homeVenue.name}` : '· sem sede'}${t.blockedDates.length > 0 ? ` · BLOQUEIA ${t.blockedDates.length} datas` : ''}`).join('\n')}

# Datas bloqueadas por equipe
${briefing.teams.flatMap((t) => t.blockedDates.map((b) => `- ${t.name}: ${b.start.slice(0, 10)} → ${b.end.slice(0, 10)} (${b.reason ?? 'sem motivo'})`)).join('\n') || '(nenhuma)'}

# Atletas bloqueadas (NÃO escalar essas atletas neste campeonato)
${briefing.teams.flatMap((t) => t.blockedAthleteIds.map((aid) => `- ${t.name}: atleta ${aid}`)).join('\n') || '(nenhuma)'}

# Período
- Início: ${briefing.championship.startDate ?? 'imediato'}
- Fim: ${briefing.championship.endDate ?? 'aberto'}

${previousErrors.length > 0 ? `\n# Tentativa anterior FALHOU\nErros que você precisa corrigir:\n${previousErrors.map((e) => `- ${e}`).join('\n')}\n` : ''}

Gere agora o JSON com TODOS os jogos do round-robin completo. Não invente IDs — use apenas os fornecidos acima. Responda apenas o JSON, sem markdown.`
}

async function callClaude(
  prompt: string,
  apiKey: string,
): Promise<{ games: ProposedGame[]; rationale?: string } | null> {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 8000,
      messages: [{ role: 'user', content: prompt }],
    }),
  })
  if (!res.ok) return null
  const data = await res.json()
  const text = data.content?.[0]?.text
  return parseJsonResponse(text)
}

async function callOpenAI(
  prompt: string,
  apiKey: string,
): Promise<{ games: ProposedGame[]; rationale?: string } | null> {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      max_tokens: 8000,
    }),
  })
  if (!res.ok) return null
  const data = await res.json()
  const text = data.choices?.[0]?.message?.content
  return parseJsonResponse(text)
}

async function callGemini(
  prompt: string,
  apiKey: string,
): Promise<{ games: ProposedGame[]; rationale?: string } | null> {
  const { GoogleGenerativeAI } = await import('@google/generative-ai')
  const genAI = new GoogleGenerativeAI(apiKey)
  const model = genAI.getGenerativeModel({
    model: 'gemini-1.5-pro',
    generationConfig: { responseMimeType: 'application/json' },
  })
  const result = await model.generateContent(prompt)
  return parseJsonResponse(result.response.text())
}

function parseJsonResponse(
  text: string | null | undefined,
): { games: ProposedGame[]; rationale?: string } | null {
  if (!text) return null
  try {
    const cleaned = text.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim()
    const parsed = JSON.parse(cleaned)
    if (Array.isArray(parsed.games)) {
      return { games: parsed.games, rationale: parsed.rationale }
    }
    return null
  } catch {
    return null
  }
}
