'use client'

import { useState } from 'react'
import { Database, Trash2, Loader2, RefreshCw } from 'lucide-react'
import { useRouter } from 'next/navigation'

export function DashboardErrorActions({ championshipId }: { championshipId: string }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const router = useRouter()

  const handleFixDb = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/db-patch', { method: 'POST' })
      if (res.ok) {
        setSuccess(true)
        setTimeout(() => router.refresh(), 1500)
      } else {
        const d = await res.json()
        setError(d.error || 'Erro ao aplicar correção')
      }
    } catch (e) {
      setError('Erro de conexão')
    } finally {
      setLoading(false)
    }
  }

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
          onClick={handleFixDb}
          disabled={loading || success}
          className={`flex items-center gap-2 px-6 h-12 rounded-xl border font-black text-[10px] uppercase tracking-widest transition-all ${
            success 
              ? 'bg-green-500/20 border-green-500/40 text-green-400' 
              : 'bg-[var(--amarelo)]/10 border-[var(--amarelo)]/40 text-[var(--amarelo)] hover:bg-[var(--amarelo)] hover:text-white'
          }`}
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4" />}
          {success ? 'Banco Corrigido!' : 'Auto-Corrigir Banco de Dados'}
        </button>

        <button
          onClick={handleDelete}
          disabled={loading}
          className="flex items-center gap-2 px-6 h-12 rounded-xl bg-red-600/10 border border-red-500/40 text-red-500 font-black text-[10px] uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all shadow-lg shadow-red-900/10"
        >
          <Trash2 className="w-4 h-4" />
          Excluir Campeonato (Emergência)
        </button>
      </div>

      {error && (
        <p className="text-red-400 text-[10px] font-black uppercase tracking-widest bg-red-500/10 p-4 rounded-xl border border-red-500/20 max-w-md mx-auto">
          {error}
        </p>
      )}

      {success && (
        <p className="text-green-400 text-[10px] font-black uppercase tracking-widest animate-pulse">
          Recarregando dashboard...
        </p>
      )}
    </div>
  )
}
