import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { message, context, championshipId } = await request.json()

    const prompt = `Você é um consultor especialista em organização de campeonatos de basquete juvenil no Brasil.

${context}

Responda de forma clara, prática e em português. Máximo 3 frases.
Se sugerir juntar categorias, explique quais e por quê.
Se sugerir datas, seja específico.`

    // Tentar Groq primeiro
    if (process.env.GROQ_API_KEY) {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
        },
        body: JSON.stringify({
          model: 'llama-3.1-8b-instant',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 300
        })
      })
      if (res.ok) {
        const data = await res.json()
        const response = data.choices?.[0]?.message?.content
        if (response) return NextResponse.json({ response, provider: 'groq' })
      }
    }

    // Fallback Gemini
    if (process.env.GEMINI_API_KEY) {
      try {
        const { GoogleGenerativeAI } = await import('@google/generative-ai')
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
        const result = await model.generateContent(prompt)
        const response = result.response.text()
        if (response) return NextResponse.json({ response, provider: 'gemini' })
      } catch {}
    }

    // Fallback Mistral
    if (process.env.MISTRAL_API_KEY) {
      const res = await fetch('https://api.mistral.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.MISTRAL_API_KEY}`
        },
        body: JSON.stringify({
          model: 'mistral-small-latest',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 300
        })
      })
      if (res.ok) {
        const data = await res.json()
        const response = data.choices?.[0]?.message?.content
        if (response) return NextResponse.json({ response, provider: 'mistral' })
      }
    }

    return NextResponse.json({
      response: 'Nenhum provedor de IA disponível no momento.',
      provider: 'none'
    })

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
