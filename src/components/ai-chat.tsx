'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Sparkles, User, Bot, Loader2, CheckCircle2, AlertCircle, Info } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface Message {
  role: 'user' | 'ai'
  content: string
  timestamp: Date
  actions?: any[]
}

interface AIChatProps {
  initialChampionshipId?: string
}

const SUGGESTIONS = [
  "Gerar tabela de confrontos do Sub 15",
  "Sugerir agrupamento em blocos",
  "Quais equipes estão inscritas no Sub 12?",
  "Simular: se Dunk desistir do Sub 15",
  "Resumo das inscrições atual",
  "Quais fins de semana estão livres?"
]

export function AIChat({ initialChampionshipId }: AIChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'ai',
      content: `Olá! Sou o assistente de organização da FGB. Tenho acesso a todos os dados do campeonato ativo.

Como posso ajudar? Posso gerar confrontos, sugerir datas, criar blocos de categorias, simular cenários e muito mais.`,
      timestamp: new Date()
    }
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [championshipId, setChampionshipId] = useState(initialChampionshipId)
  const [championships, setChampionships] = useState<any[]>([])
  
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch('/api/championships')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setChampionships(data)
          if (!championshipId && data.length > 0) {
            setChampionshipId(data[0].id)
          }
        }
      })
  }, [])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return

    const userMessage: Message = {
      role: 'user',
      content: text,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          history: messages.map(m => ({ role: m.role === 'ai' ? 'assistant' : 'user', content: m.content })),
          championshipId
        })
      })

      const data = await response.json()

      if (data.error) throw new Error(data.error)

      const aiMessage: Message = {
        role: 'ai',
        content: data.response,
        timestamp: new Date(),
        actions: data.actions
      }

      setMessages(prev => [...prev, aiMessage])
      
      if (data.actions?.length > 0) {
        data.actions.forEach((action: any) => {
          if (action.status === 'success') {
            toast.success(action.message)
          } else if (action.status === 'error') {
            toast.error(action.message)
          }
        })
      }
    } catch (error: any) {
      toast.error(error.message || "Erro ao conversar com a IA")
      setMessages(prev => [...prev, {
        role: 'ai',
        content: "Desculpe, tive um problema técnico para processar sua mensagem. Poderia tentar novamente?",
        timestamp: new Date()
      }])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] bg-[#0B0F1E] rounded-2xl border border-slate-800/50 shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-slate-800/50 bg-slate-900/20 backdrop-blur-md flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-600 to-blue-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
            <Sparkles className="w-5 h-5 text-white animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-100 tracking-tight">Assistente FGB</h3>
              <span className="px-2 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-[10px] uppercase font-bold text-purple-400">Powered by Gemini</span>
            </div>
            <p className="text-xs text-slate-500 flex items-center gap-1">
              {championshipId ? (
                <>Agente pronto para ajudar no {championships.find(c => c.id === championshipId)?.name || 'campeonato'}</>
              ) : (
                'Selecione um campeonato para começar'
              )}
            </p>
          </div>
        </div>

        <select 
          value={championshipId} 
          onChange={(e) => setChampionshipId(e.target.value)}
          className="bg-slate-800/50 border border-slate-700 text-xs text-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-orange-500/50 transition-all cursor-pointer"
        >
          <option value="">Trocar Campeonato</option>
          {championships.map(c => (
            <option key={c.id} value={c.id}>{c.name} ({c.year})</option>
          ))}
        </select>
      </div>

      {/* Messages Area */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-6 scroll-smooth custom-scrollbar bg-[radial-gradient(circle_at_center,rgba(15,23,42,0.8),#0B0F1E)]"
      >
        {messages.map((msg, i) => (
          <div key={i} className={cn("flex flex-col", msg.role === 'user' ? "items-end" : "items-start")}>
            <div className="flex items-center gap-2 mb-1 px-1">
               <span className={cn(
                 "text-[9px] uppercase font-bold tracking-widest",
                 msg.role === 'user' ? "text-orange-500 order-2" : "text-purple-500"
               )}>
                 {msg.role === 'user' ? 'Administrador' : 'Assistente IA'}
               </span>
            </div>
            
            <div className={cn(
              "max-w-[85%] px-4 py-3 rounded-2xl shadow-sm border",
              msg.role === 'user' 
                ? "bg-orange-500/10 border-orange-500/20 rounded-tr-none text-slate-200" 
                : "bg-slate-900/80 border-slate-700/50 rounded-tl-none text-slate-300"
            )}>
              <div className="prose prose-invert prose-sm max-w-none prose-table:border prose-table:border-slate-700 prose-th:bg-slate-800/50 prose-th:px-2 prose-td:px-2">
                <ReactMarkdown>{msg.content}</ReactMarkdown>
              </div>

              {msg.actions && msg.actions.length > 0 && (
                <div className="mt-4 space-y-2 border-t border-slate-700/50 pt-3">
                  {msg.actions.map((action, idx) => (
                    <div 
                      key={idx} 
                      className={cn(
                        "flex items-center gap-2 p-2 rounded-lg text-xs font-medium border",
                        action.status === 'success' ? "bg-green-500/10 border-green-500/20 text-green-400" :
                        action.status === 'error' ? "bg-red-500/10 border-red-500/20 text-red-400" :
                        "bg-blue-500/10 border-blue-500/20 text-blue-400"
                      )}
                    >
                      {action.status === 'success' ? <CheckCircle2 className="w-4 h-4" /> :
                       action.status === 'error' ? <AlertCircle className="w-4 h-4" /> :
                       <Info className="w-4 h-4" />}
                      {action.message}
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <span className="text-[10px] text-slate-500 mt-1 px-1">
              {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        ))}

        {isLoading && (
          <div className="flex items-start gap-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
             <div className="w-8 h-8 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center">
                <Loader2 className="w-4 h-4 text-purple-500 animate-spin" />
             </div>
             <div className="bg-slate-900/80 border border-slate-700/50 px-4 py-3 rounded-2xl rounded-tl-none flex gap-1">
                <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce"></span>
             </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-slate-800/50 bg-slate-900/40 space-y-3">
        {/* Suggestion Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {SUGGESTIONS.map((suggestion, i) => (
            <button
              key={i}
              onClick={() => handleSendMessage(suggestion)}
              disabled={isLoading}
              className="whitespace-nowrap px-3 py-1.5 rounded-full bg-purple-500/5 border border-purple-500/10 text-[11px] text-purple-400 hover:bg-purple-500/10 hover:border-purple-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {suggestion}
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage(input)}
            placeholder="Pergunte sobre o campeonato ou peça para organizar..."
            disabled={isLoading}
            className="flex-1 bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 transition-all placeholder:text-slate-600 disabled:opacity-50"
          />
          <button
            onClick={() => handleSendMessage(input)}
            disabled={isLoading || !input.trim()}
            className="px-4 py-3 rounded-xl bg-gradient-to-tr from-purple-600 to-purple-800 text-white font-bold text-sm shadow-lg shadow-purple-600/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:scale-100 flex items-center gap-2"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Enviar
          </button>
        </div>
      </div>
    </div>
  )
}
