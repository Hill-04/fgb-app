"use client"

import { useState } from 'react'
import { Sparkles, X, MessageSquare, Maximize2, Minimize2 } from 'lucide-react'
import { AIChat } from './ai-chat'
import { cn } from '@/lib/utils'

export function AIAssistantBubble() {
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end pointer-events-none">
      {/* Chat Window */}
      {isOpen && (
        <div className={cn(
          "mb-4 w-96 rounded-[2.5rem] bg-[#0A0A0A] border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.8)] overflow-hidden transition-all duration-500 transform origin-bottom-right pointer-events-auto",
          isMinimized ? "h-16 opacity-0 scale-95 pointer-events-none" : "h-[600px] opacity-100 scale-100"
        )}>
           <div className="h-full relative">
              <AIChat />
              <button 
                onClick={() => setIsOpen(false)}
                className="absolute top-4 right-4 p-2 rounded-full bg-black/50 hover:bg-white/10 text-white/50 hover:text-white transition-all z-20"
              >
                <X className="w-4 h-4" />
              </button>
           </div>
        </div>
      )}

      {/* Bubble Toggle */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500 shadow-2xl hover:scale-110 active:scale-90 pointer-events-auto relative group overflow-hidden",
          isOpen ? "bg-white/10 rotate-90" : "bg-gradient-to-tr from-[var(--amarelo)] to-[var(--orange-dark)]"
        )}
      >
        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
        {isOpen ? (
          <X className="w-4 h-4 text-white relative z-10" />
        ) : (
          <div className="relative z-10">
            <Sparkles className="w-4 h-4 text-white animate-pulse" />
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-white rounded-full animate-ping" />
          </div>
        )}
      </button>
    </div>
  )
}
