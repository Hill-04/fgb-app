'use client'

import { useState, useTransition } from 'react'
import { Lock, Unlock } from 'lucide-react'
import { useRouter } from 'next/navigation'

type Props = {
  gameId: string
  isLocked: boolean
  canLock: boolean
  canUnlock: boolean
}

export function LockGameButton({ gameId, isLocked, canLock, canUnlock }: Props) {
  const [isPending, startTransition] = useTransition()
  const [showModal, setShowModal] = useState(false)
  const [reason, setReason] = useState('')
  const router = useRouter()

  if (!canLock && !canUnlock) return null

  const handleSubmit = () => {
    if (reason.trim().length < 5) {
      alert('Motivo precisa ter ao menos 5 caracteres')
      return
    }

    startTransition(async () => {
      const res = await fetch(`/api/admin/games/${gameId}/lock`, {
        method: isLocked ? 'DELETE' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Erro desconhecido' }))
        alert(err.error)
        return
      }
      setShowModal(false)
      setReason('')
      router.refresh()
    })
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium ${
          isLocked
            ? 'bg-red-100 text-red-700 hover:bg-red-200'
            : 'bg-fgb-ink-100 text-fgb-ink-700 hover:bg-fgb-ink-200'
        }`}
      >
        {isLocked ? <Unlock size={16} /> : <Lock size={16} />}
        {isLocked ? 'Destravar' : 'Travar definitivamente'}
      </button>

      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => !isPending && setShowModal(false)}
        >
          <div
            className="w-full max-w-md rounded-xl bg-white p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="mb-2 text-lg font-bold text-fgb-ink-900">
              {isLocked ? 'Destravar jogo' : 'Travar jogo definitivamente'}
            </h3>
            <p className="mb-4 text-sm text-fgb-ink-600">
              {isLocked
                ? 'Ao destravar, o jogo volta a permitir modificações com motivo registrado.'
                : 'Ao travar, o jogo se torna imutável. Apenas super-admins podem alterar dados após esse ponto, e cada modificação será auditada.'}
            </p>
            <label className="mb-2 block text-sm font-medium text-fgb-ink-700">
              Motivo (obrigatório, mín. 5 caracteres):
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              className="mb-4 w-full rounded-lg border border-fgb-ink-300 p-2 text-sm"
              placeholder={
                isLocked
                  ? 'Ex: Correção de erro detectado pós-publicação'
                  : 'Ex: Súmula ratificada após congresso técnico'
              }
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowModal(false)}
                disabled={isPending}
                className="rounded-lg border border-fgb-ink-300 px-4 py-2 text-sm text-fgb-ink-700 hover:bg-fgb-ink-50 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleSubmit}
                disabled={isPending || reason.trim().length < 5}
                className={`rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-50 ${
                  isLocked ? 'bg-red-600 hover:bg-red-700' : 'bg-fgb-green-700 hover:bg-fgb-green-800'
                }`}
              >
                {isPending ? 'Processando...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
