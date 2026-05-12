'use client'

import { useState } from 'react'
import { Sparkles } from 'lucide-react'
import { AISchedulingModal } from '@/components/AISchedulingModal'

export function AISchedulingButton({
  championshipId,
  championshipName,
  variant = 'default',
  disabled = false
}: {
  championshipId: string
  championshipName: string
  variant?: 'default' | 'outline'
  disabled?: boolean
}) {
  const [showModal, setShowModal] = useState(false)

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        disabled={disabled}
        className={
          variant === 'default' 
            ? "text-[9px] font-black uppercase tracking-[0.2em] text-white bg-[var(--fgb-yellow-500)] px-6 h-10 rounded-xl hover:bg-[var(--fgb-yellow-700)] transition-all inline-flex items-center justify-center gap-2 shadow-lg shadow-fgb-yellow-600/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            : "text-[9px] font-black uppercase tracking-[0.2em] text-[var(--fgb-yellow-500)] bg-[var(--fgb-yellow-500)]/5 border border-[var(--fgb-yellow-500)]/20 px-4 h-10 rounded-xl hover:bg-[var(--fgb-yellow-500)]/10 transition-all inline-flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
        }
      >
        <Sparkles className="w-3.5 h-3.5" />
        Organizar com IA
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
