"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { RefreshCw } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface RecalculateStandingsButtonProps {
  categoryId: string
}

export function RecalculateStandingsButton({ categoryId }: RecalculateStandingsButtonProps) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleRecalculate = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/standings/recalculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categoryId })
      })

      if (res.ok) {
        router.refresh()
      } else {
        const data = await res.json()
        alert(data.error || 'Erro ao recalcular')
      }
    } catch (err) {
      alert('Erro de conexão')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button 
      variant="ghost" 
      size="sm" 
      onClick={handleRecalculate}
      disabled={loading}
      className="h-8 px-2 text-[8px] font-black uppercase tracking-widest text-slate-500 hover:text-orange-500"
    >
      <RefreshCw className={`w-3 h-3 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
      {loading ? 'Recalculando...' : 'Recalcular'}
    </Button>
  )
}
