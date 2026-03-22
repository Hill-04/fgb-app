'use client'

import { useState } from 'react'
import { Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SimulationModal } from '@/components/SimulationModal'
import { useRouter } from 'next/navigation'

export function SimulationModalWrapper() {
  const [showSimModal, setShowSimModal] = useState(false)
  const router = useRouter()

  const handleComplete = () => {
    setShowSimModal(false)
    router.refresh()
  }

  return (
    <>
      <Button 
        onClick={() => setShowSimModal(true)} 
        variant="outline" 
        className="border-purple-500/30 bg-purple-500/5 hover:bg-purple-500/10 text-purple-400 font-bold px-6 h-12 rounded-xl transition-all hover:scale-105 active:scale-95 text-[10px] uppercase tracking-widest"
      >
        <Sparkles className="w-4 h-4 mr-2" /> Simular com IA
      </Button>

      <SimulationModal 
        isOpen={showSimModal} 
        onClose={() => setShowSimModal(false)} 
        onComplete={handleComplete}
      />
    </>
  )
}
