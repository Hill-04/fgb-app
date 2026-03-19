"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface DeleteChampionshipProps {
  championshipId: string
  championshipName: string
}

export function DeleteChampionship({ championshipId, championshipName }: DeleteChampionshipProps) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleDelete = async () => {
    if (!confirm(`TEM CERTEZA? Isso excluirá permanentemente o campeonato "${championshipName}" e TODOS os jogos, inscrições e classificações vinculadas.`)) {
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`/api/championships/${championshipId}`, {
        method: 'DELETE'
      })

      if (res.ok) {
        router.push('/admin/championships')
        router.refresh()
      } else {
        const data = await res.json()
        alert(data.error || 'Erro ao excluir campeonato')
      }
    } catch (err) {
      alert('Erro de conexão ao tentar excluir')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button 
      variant="ghost" 
      size="sm" 
      onClick={handleDelete}
      disabled={loading}
      className="h-9 px-3 rounded-xl hover:bg-red-500/10 text-slate-500 hover:text-red-500 transition-all border border-white/5"
    >
      <Trash2 className="w-4 h-4 mr-2" />
      {loading ? 'Excluindo...' : 'Excluir Campeonato'}
    </Button>
  )
}
