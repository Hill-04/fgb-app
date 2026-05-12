'use client'

import { useState } from 'react'
import { Upload, Loader2, CheckCircle, AlertCircle } from 'lucide-react'

export function SeedDataButton() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [result, setResult] = useState<{ message?: string; stats?: any; error?: string } | null>(null)

  const handleSeed = async () => {
    if (!confirm(
      'ATENÇÃO: Esta ação irá:\n\n' +
      '• Excluir TODOS os atletas existentes\n' +
      '• Excluir TODOS os treinadores existentes\n' +
      '• Importar 676 atletas reais da FGB\n' +
      '• Importar 48 treinadores reais da FGB\n' +
      '• Criar/atualizar os 18 clubes reais\n\n' +
      'Tem certeza que deseja continuar?'
    )) return

    setStatus('loading')
    setResult(null)
    try {
      const res = await fetch('/api/admin/seed-real-data', { method: 'POST' })
      const data = await res.json()
      if (res.ok && data.success) {
        setStatus('success')
        setResult(data)
      } else {
        setStatus('error')
        setResult({ error: data.error || 'Erro ao importar dados' })
      }
    } catch (e) {
      setStatus('error')
      setResult({ error: 'Erro de conexão' })
    }
  }

  return (
    <div className="space-y-4">
      <button
        onClick={handleSeed}
        disabled={status === 'loading' || status === 'success'}
        className={`flex items-center gap-2 px-6 h-12 rounded-2xl border font-black text-[10px] uppercase tracking-widest transition-all shadow-sm ${
          status === 'success'
            ? 'bg-[var(--verde-light)] border-green-200 text-[var(--verde)] cursor-default'
            : status === 'loading'
            ? 'bg-fgb-ink-100 border-fgb-ink-200 text-fgb-ink-400 cursor-not-allowed'
            : 'bg-[#E8F4FF] border-[#B3D9FF] text-[#0066CC] hover:bg-[#0066CC] hover:text-white hover:border-[#0066CC]'
        }`}
      >
        {status === 'loading'
          ? <Loader2 className="w-4 h-4 animate-spin" />
          : status === 'success'
          ? <CheckCircle className="w-4 h-4" />
          : <Upload className="w-4 h-4" />}
        {status === 'loading'
          ? 'Importando dados...'
          : status === 'success'
          ? 'Importação Concluída!'
          : 'Importar Dados Reais FGB'}
      </button>

      {status === 'success' && result && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-2xl text-sm text-green-800">
          <p className="font-bold mb-1">{result.message}</p>
          {result.stats && (
            <ul className="text-xs space-y-0.5 text-green-700">
              <li>• {result.stats.teams} times importados/atualizados</li>
              <li>• {result.stats.athletes} atletas importados</li>
              <li>• {result.stats.coaches} treinadores importados</li>
              {result.stats.errors?.length > 0 && (
                <li className="text-fgb-yellow-600">• {result.stats.errors.length} avisos (ver console)</li>
              )}
            </ul>
          )}
        </div>
      )}

      {status === 'error' && result?.error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl">
          <div className="flex items-center gap-2 text-red-700">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <p className="text-xs font-bold">{result.error}</p>
          </div>
        </div>
      )}
    </div>
  )
}
