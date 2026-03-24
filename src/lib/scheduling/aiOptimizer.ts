export type OptimizationResult = {
  optimized: boolean
  provider: 'groq' | 'gemini' | 'openai' | 'mistral' | 'claude' | 'none'
  suggestion: string | null
  error?: string
}

async function tryGroq(prompt: string): Promise<string | null> {
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) return null
  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 500
      })
    })
    if (!res.ok) return null
    const data = await res.json()
    return data.choices?.[0]?.message?.content || null
  } catch (e: any) {
    console.warn('[AI Fallback] Groq failed:', e.message)
    return null
  }
}

async function tryGemini(prompt: string): Promise<string | null> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) return null
  try {
    const { GoogleGenerativeAI } = await import('@google/generative-ai')
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
    const result = await model.generateContent(prompt)
    return result.response.text()
  } catch (e: any) {
    console.warn('[AI Fallback] Gemini failed:', e.message)
    return null
  }
}

async function tryOpenAI(prompt: string): Promise<string | null> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) return null
  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 500
      })
    })
    if (!res.ok) return null
    const data = await res.json()
    return data.choices?.[0]?.message?.content || null
  } catch (e: any) {
    console.warn('[AI Fallback] OpenAI failed:', e.message)
    return null
  }
}

async function tryMistral(prompt: string): Promise<string | null> {
  const apiKey = process.env.MISTRAL_API_KEY
  if (!apiKey) return null
  try {
    const res = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'mistral-small-latest',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 500
      })
    })
    if (!res.ok) return null
    const data = await res.json()
    return data.choices?.[0]?.message?.content || null
  } catch (e: any) {
    console.warn('[AI Fallback] Mistral failed:', e.message)
    return null
  }
}

async function tryClaude(prompt: string): Promise<string | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return null
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-20240307',
        max_tokens: 500,
        messages: [{ role: 'user', content: prompt }]
      })
    })
    if (!res.ok) return null
    const data = await res.json()
    return data.content?.[0]?.text || null
  } catch (e: any) {
    console.warn('[AI Fallback] Claude failed:', e.message)
    return null
  }
}

export async function optimizeSchedule(data: {
  name: string
  categories: { name: string; teams: number; games: number }[]
  totalGames: number
  startDate: string
}): Promise<OptimizationResult> {
  const prompt = `Você é especialista em organização de campeonatos de basquete.
Analise este calendário e forneça sugestões de otimização logística em 2-3 frases diretas:

Campeonato: ${data.name}
Total de jogos: ${data.totalGames}
Início: ${data.startDate}
Categorias:
${data.categories.map(c => `- ${c.name}: ${c.teams} equipes, ${c.games} jogos`).join('\n')}

Foque em: distribuição de datas, viagens das equipes e organização por blocos.`

  const providers: [string, (p: string) => Promise<string | null>][] = [
    ['groq', tryGroq],
    ['gemini', tryGemini],
    ['openai', tryOpenAI],
    ['mistral', tryMistral],
    ['claude', tryClaude],
  ]

  for (const [name, fn] of providers) {
    const result = await fn(prompt)
    if (result) {
      return {
        optimized: true,
        provider: name as OptimizationResult['provider'],
        suggestion: result
      }
    }
  }

  return {
    optimized: false,
    provider: 'none',
    suggestion: null,
    error: 'Nenhum provedor de IA disponível. Calendário gerado via round-robin padrão.'
  }
}
