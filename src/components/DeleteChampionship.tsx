"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Trash2, Archive } from 'lucide-react'
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

  const handleArchive = async () => {
    if (!confirm(`Deseja arquivar o campeonato "${championshipName}"? Ele não aparecerá mais como ativo.`)) {
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`/api/championships/${championshipId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'ARCHIVED' })
      })

      if (res.ok) {
        router.push('/admin/championships')
        router.refresh()
      } else {
        const data = await res.json()
        alert(data.error || 'Erro ao arquivar campeonato')
      }
    } catch (err) {
      alert('Erro de conexão ao tentar arquivar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={handleArchive}
        disabled={loading}
        className="h-9 px-3 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition-all border border-white/5"
      >
        <Archive className="w-4 h-4 mr-2" />
        {loading ? 'Processando...' : 'Arquivar'}
      </Button>

      <Button 
        variant="ghost" 
        size="sm" 
        onClick={handleDelete}
        disabled={loading}
        className="h-9 px-3 rounded-xl hover:bg-red-500/10 text-slate-500 hover:text-red-500 transition-all border border-white/5"
      >
        <Trash2 className="w-4 h-4 mr-2" />
        {loading ? 'Excluindo...' : 'Excluir'}
      </Button>
    </div>
  )
}
