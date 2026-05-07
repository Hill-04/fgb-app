'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Ban, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export function TeamAthleteRequestCancelButton({ requestId }: { requestId: string }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [confirming, setConfirming] = useState(false)

  const handleCancel = () => {
    startTransition(async () => {
      const response = await fetch(`/api/team/athletes/requests/${requestId}/cancel`, {
        method: 'POST',
      })
      if (response.ok) {
        toast.success('Solicitação cancelada com sucesso.')
        router.refresh()
        return
      }

      const data = await response.json().catch(() => null)
      toast.error(data?.error || 'Não foi possível cancelar a solicitação.')
      setConfirming(false)
    })
  }

  if (confirming) {
    return (
      <div className="space-y-2">
        <p className="text-[11px] font-bold text-[var(--red)]">Confirmar cancelamento desta solicitação?</p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleCancel}
            disabled={isPending}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[var(--red)] px-4 text-[10px] font-black uppercase tracking-widest text-white transition-all hover:bg-[#a90d12] disabled:opacity-60"
          >
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {isPending ? 'Cancelando...' : 'Sim, cancelar'}
          </button>
          <button
            type="button"
            onClick={() => setConfirming(false)}
            disabled={isPending}
            className="inline-flex h-10 items-center justify-center rounded-xl border border-[var(--border)] bg-white px-4 text-[10px] font-black uppercase tracking-widest text-[var(--gray)] transition-all hover:text-[var(--black)] disabled:opacity-60"
          >
            Não, voltar
          </button>
        </div>
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={() => setConfirming(true)}
      disabled={isPending}
      className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[var(--red)]/20 bg-[var(--red)]/10 px-5 text-[10px] font-black uppercase tracking-widest text-[var(--red)] transition-all hover:bg-[var(--red)]/15 disabled:opacity-60"
    >
      <Ban className="h-4 w-4" />
      Cancelar solicitação
    </button>
  )
}
