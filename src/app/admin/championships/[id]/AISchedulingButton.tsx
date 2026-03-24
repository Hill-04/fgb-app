'use client'

import { useState } from 'react'
import { Sparkles } from 'lucide-react'
import { AISchedulingModal } from '@/components/AISchedulingModal'

export function AISchedulingButton({
  championshipId,
  championshipName,
  variant = 'default'
}: {
  championshipId: string
  championshipName: string
  variant?: 'default' | 'outline'
}) {
  const [showModal, setShowModal] = useState(false)

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className={
          variant === 'default' 
            ? "text-[9px] font-black uppercase tracking-[0.2em] text-white bg-[#FF6B00] px-6 h-10 rounded-xl hover:bg-[#E66000] transition-all inline-flex items-center justify-center gap-2 shadow-lg shadow-orange-600/20 active:scale-95"
            : "text-[9px] font-black uppercase tracking-[0.2em] text-[#FF6B00] bg-[#FF6B00]/5 border border-[#FF6B00]/20 px-4 h-10 rounded-xl hover:bg-[#FF6B00]/10 transition-all inline-flex items-center justify-center gap-2 active:scale-95"
        }
      >
        <Sparkles className="w-3.5 h-3.5" />
        Organizar com IA →
      </button>

      {showModal && (
        <AISchedulingModal
          championshipId={championshipId}
          championshipName={championshipName}
          onClose={() => setShowModal(false)}
          onApplied={() => window.location.reload()}
        />
      )}
    </>
  )
}
