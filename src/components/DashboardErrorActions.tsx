'use client'

import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

export function DashboardErrorActions({ championshipId }: { championshipId: string }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleDelete = async () => {
    if (!confirm('!!! ALERTA CRÍTICO !!!\nDeseja realmente EXCLUIR este campeonato mesmo estando com erro? Esta ação apagará todos os dados e não pode ser desfeita.')) return

    setLoading(true)
    try {
      const res = await fetch(`/api/championships/${championshipId}`, { method: 'DELETE' })
      if (res.ok) {
        router.push('/admin/championships')
      } else {
        setError('Erro ao excluir')
      }
    } catch (e) {
      setError('Erro de conexão')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 mt-8">
      <div className="flex flex-wrap justify-center gap-4">
        <button
          onClick={handleDelete}
          disabled={loading}
          className="flex items-center gap-2 px-6 h-12 rounded-2xl bg-[var(--red-light)] border border-red-200 text-[var(--red)] font-black text-[10px] uppercase tracking-widest hover:bg-[var(--red)] hover:text-white transition-all shadow-sm"
        >
          <Trash2 className="w-4 h-4" />
          Excluir Campeonato (Emergência)
        </button>
      </div>

      {error && (
        <p className="text-[var(--red)] text-[10px] font-black uppercase tracking-widest bg-[var(--red-light)] p-4 rounded-2xl border border-red-200 max-w-md mx-auto">
          {error}
        </p>
      )}
    </div>
  )
}
