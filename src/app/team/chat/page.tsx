"use client"

import { useState, useEffect, useRef } from 'react'
import { MessageSquare, Send, Shield } from 'lucide-react'
import { Badge } from '@/components/Badge'

type Message = {
  id: string
  content: string
  fromAdmin: boolean
  createdAt: string
}

export default function TeamChatPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [newMsg, setNewMsg] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  const fetchMessages = () => {
    fetch('/api/team/messages')
      .then(r => r.json())
      .then(data => { setMessages(Array.isArray(data) ? data : []); setLoading(false) })
      .catch(() => setLoading(false))
  }

  useEffect(() => { fetchMessages() }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMsg.trim() || sending) return
    setSending(true)
    try {
      const res = await fetch('/api/team/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newMsg.trim() }),
      })
      if (res.ok) { setNewMsg(''); fetchMessages() }
    } finally { setSending(false) }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] max-w-4xl mx-auto font-sans">
      <div className="animate-fade-in border-b border-[var(--border)] pb-8 mb-6">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center">
            <MessageSquare className="w-4 h-4 text-orange-600" />
          </div>
          <span className="text-[var(--gray)] font-bold uppercase tracking-widest text-[10px]">Canal Oficial</span>
        </div>
        <h1 className="text-4xl font-display font-black text-[var(--black)] tracking-tight uppercase italic">Chat FGB</h1>
        <p className="text-[var(--gray)] mt-2 font-medium">Comunicação direta com a Administração da Federação.</p>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 pr-1 custom-scrollbar">
        {loading ? (
          <div className="space-y-3 animate-pulse">
            {[1,2,3].map(i => <div key={i} className={`h-16 w-2/3 bg-gray-50 border border-[var(--border)] rounded-2xl ${i % 2 === 0 ? 'ml-auto' : ''}`} />)}
          </div>
        ) : messages.length === 0 ? (
          <div className="flex-1 flex items-center justify-center py-20 text-center">
            <div>
              <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-[var(--gray)] font-bold text-sm uppercase tracking-widest">Nenhuma mensagem ainda</p>
              <p className="text-gray-400 text-xs mt-2 font-medium">Inicie uma conversa com a Administração.</p>
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.fromAdmin ? 'justify-start' : 'justify-end'}`}>
              <div className={`max-w-[75%] ${msg.fromAdmin ? 'bg-white border border-[var(--border)] shadow-sm' : 'bg-orange-50 border border-orange-200'} rounded-2xl px-4 py-3`}>
                {msg.fromAdmin && (
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <Shield className="w-3 h-3 text-orange-600" />
                    <span className="text-[9px] font-black text-orange-600 uppercase tracking-widest">FGB Admin</span>
                  </div>
                )}
                <p className={`text-sm font-medium ${msg.fromAdmin ? 'text-[var(--black)]' : 'text-orange-900'}`}>{msg.content}</p>
                <p className={`text-[10px] mt-1 font-bold tracking-wider ${msg.fromAdmin ? 'text-gray-400' : 'text-orange-400'}`}>{new Date(msg.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
              </div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={sendMessage} className="mt-4 flex gap-3">
        <input
          type="text"
          value={newMsg}
          onChange={e => setNewMsg(e.target.value)}
          placeholder="Digite sua mensagem para a FGB..."
          className="flex-1 bg-white border border-[var(--border)] rounded-xl px-4 py-3 text-sm text-[var(--black)] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 shadow-sm transition-all"
        />
        <button
          type="submit"
          disabled={!newMsg.trim() || sending}
          className="w-12 h-12 bg-orange-500 hover:bg-orange-600 disabled:opacity-40 rounded-xl flex items-center justify-center transition-all shadow-sm"
        >
          <Send className="w-4 h-4 text-white" />
        </button>
      </form>
    </div>
  )
}
