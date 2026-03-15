'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

export function RegistrationActions({ registrationId, currentStatus }: { registrationId: string, currentStatus: string }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleUpdateStatus = async (status: 'CONFIRMED' | 'REJECTED') => {
    setLoading(true)
    try {
      const res = await fetch(`/api/registrations/${registrationId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      })

      if (res.ok) {
        router.refresh()
      } else {
        const errorData = await res.json()
        alert(`Erro: ${errorData.error}`)
      }
    } catch (error) {
      alert('Erro inesperado')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex gap-3">
      {currentStatus !== 'CONFIRMED' && (
        <Button 
          size="sm" 
          onClick={() => handleUpdateStatus('CONFIRMED')}
          disabled={loading}
          className="bg-green-600 hover:bg-green-700 text-white"
        >
          {loading ? '...' : 'Aprovar'}
        </Button>
      )}
      {currentStatus !== 'REJECTED' && (
        <Button 
          size="sm" 
          onClick={() => handleUpdateStatus('REJECTED')}
          disabled={loading}
          variant="destructive"
        >
          {loading ? '...' : 'Rejeitar'}
        </Button>
      )}
    </div>
  )
}
