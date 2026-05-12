/**
 * AI optimizer — Gemini 2.5 Flash com responseMimeType: application/json.
 *
 * Substitui o legacy que tinha 5 providers + comentario livre.
 * Agora retorna moves estruturados que sao aplicados no schedule do /simulate.
 */

export type OptimizationInput = {
  championship: {
    name: string
    startDate: string  // YYYY-MM-DD
    endDate: string    // YYYY-MM-DD
    format: string
    turns: number
    hasPlayoffs: boolean
  }
  config: {
    allowedWeekdays: number[]
    timeSlots: { start: string; end: string }[]
    blackoutDates: { date: string; reason?: string }[]
    minRestHoursBetweenGames: number
    maxGamesPerTeamPerWeek: number
    homePattern: string
    optimizationMode: string
  }
  generatedSchedule: {
    gameId: string
    categoryName: string
    homeTeamName: string
    awayTeamName: string
    date: string   // ISO YYYY-MM-DD
    time: string   // HH:MM
    round: number
  }[]
  capacityPercent: number
}

export type OptimizationMove = {
  gameId: string
  newDate: string  // YYYY-MM-DD
  newTime: string  // HH:MM
  reason: string
}

export type OptimizationResult = {
  optimized: boolean
  provider: 'gemini' | 'none'
  moves: OptimizationMove[]
  warnings: string[]
  insights: string[]
  error?: string
}

const SYSTEM_PROMPT = `Voce e um especialista em organizacao de campeonatos de basquete brasileiros (CBB/FGB).

Sua tarefa: analisar um calendario JA GERADO por um motor deterministico e propor pequenos ajustes ESTRUTURADOS que melhorem viabilidade pratica (descanso de equipes, distribuicao equilibrada, evitar conflitos com feriados regionais brasileiros).

REGRAS:
1. NAO altere mais de 15% dos jogos. O motor ja gerou um calendario valido.
2. Cada move precisa de justificativa clara em "reason".
3. Respeite todas as restricoes em "config" — nao mova para weekday/data bloqueada.
4. Se o calendario esta apertado (capacityPercent > 85), priorize distribuicao uniforme.
5. NUNCA mova mais de 1 jogo da mesma equipe na mesma semana.
6. Retorne APENAS JSON valido, sem comentarios ou markdown.
7. Datas no formato YYYY-MM-DD. Horarios no formato HH:MM.`

function buildUserPrompt(input: OptimizationInput): string {
  return `CAMPEONATO: ${input.championship.name}
PERIODO: ${input.championship.startDate} ate ${input.championship.endDate}
FORMATO: ${input.championship.format} (${input.championship.turns} turno${input.championship.turns > 1 ? 's' : ''})
PLAYOFFS: ${input.championship.hasPlayoffs ? 'Sim' : 'Nao'}
CAPACIDADE: ${input.capacityPercent}% dos slots disponiveis serao usados

CONFIG:
${JSON.stringify(input.config, null, 2)}

CALENDARIO GERADO (${input.generatedSchedule.length} jogos):
${JSON.stringify(input.generatedSchedule, null, 2)}

Retorne JSON com a estrutura:
{
  "moves": [
    { "gameId": "...", "newDate": "YYYY-MM-DD", "newTime": "HH:MM", "reason": "..." }
  ],
  "warnings": ["..."],
  "insights": ["..."]
}`
}

function isWithinAllowedDay(dateISO: string, allowedWeekdays: number[]): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateISO)) return false
  const d = new Date(`${dateISO}T12:00:00Z`)
  if (Number.isNaN(d.getTime())) return false
  return allowedWeekdays.includes(d.getUTCDay())
}

function isInBlackout(dateISO: string, blackouts: { date: string }[]): boolean {
  return blackouts.some(b => b.date === dateISO)
}

export async function optimizeSchedule(input: OptimizationInput): Promise<OptimizationResult> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return {
      optimized: false,
      provider: 'none',
      moves: [],
      warnings: [],
      insights: [],
      error: 'GEMINI_API_KEY nao configurada',
    }
  }

  if (input.generatedSchedule.length === 0) {
    return {
      optimized: false,
      provider: 'none',
      moves: [],
      warnings: [],
      insights: [],
      error: 'Schedule vazio — nada a otimizar',
    }
  }

  try {
    const { GoogleGenerativeAI } = await import('@google/generative-ai')
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.2,
      },
      systemInstruction: SYSTEM_PROMPT,
    })

    const result = await model.generateContent(buildUserPrompt(input))
    const text = result.response.text()

    let parsed: { moves?: OptimizationMove[]; warnings?: string[]; insights?: string[] }
    try {
      parsed = JSON.parse(text)
    } catch (parseErr: unknown) {
      const msg = parseErr instanceof Error ? parseErr.message : String(parseErr)
      return {
        optimized: false,
        provider: 'none',
        moves: [],
        warnings: [],
        insights: [],
        error: `JSON invalido da IA: ${msg}`,
      }
    }

    // Validacao: filtra moves invalidos (gameId desconhecido, weekday/blackout violado, formato ruim)
    const validGameIds = new Set(input.generatedSchedule.map(g => g.gameId))
    const rawMoves = Array.isArray(parsed.moves) ? parsed.moves : []
    const validMoves: OptimizationMove[] = []
    const rejected: string[] = []

    for (const m of rawMoves) {
      if (!m || typeof m !== 'object') { rejected.push('move nao-objeto'); continue }
      if (!validGameIds.has(m.gameId)) { rejected.push(`gameId ${m.gameId} desconhecido`); continue }
      if (!/^\d{4}-\d{2}-\d{2}$/.test(m.newDate)) { rejected.push(`newDate invalida: ${m.newDate}`); continue }
      if (!/^\d{2}:\d{2}$/.test(m.newTime)) { rejected.push(`newTime invalido: ${m.newTime}`); continue }
      if (!isWithinAllowedDay(m.newDate, input.config.allowedWeekdays)) {
        rejected.push(`${m.newDate} fora de allowedWeekdays`)
        continue
      }
      if (isInBlackout(m.newDate, input.config.blackoutDates)) {
        rejected.push(`${m.newDate} esta em blackoutDates`)
        continue
      }
      validMoves.push({
        gameId: m.gameId,
        newDate: m.newDate,
        newTime: m.newTime,
        reason: typeof m.reason === 'string' ? m.reason : 'sem motivo',
      })
    }

    const warnings = Array.isArray(parsed.warnings) ? parsed.warnings.filter((w): w is string => typeof w === 'string') : []
    const insights = Array.isArray(parsed.insights) ? parsed.insights.filter((s): s is string => typeof s === 'string') : []

    if (rejected.length > 0) {
      warnings.push(`${rejected.length} move(s) rejeitado(s) por validacao: ${rejected.slice(0, 3).join('; ')}`)
    }

    return {
      optimized: true,
      provider: 'gemini',
      moves: validMoves,
      warnings,
      insights,
    }
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    return {
      optimized: false,
      provider: 'none',
      moves: [],
      warnings: [],
      insights: [],
      error: msg,
    }
  }
}
