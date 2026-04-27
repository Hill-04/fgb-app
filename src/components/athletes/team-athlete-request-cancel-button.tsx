'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Ban, Loader2 } from 'lucide-react'

export function TeamAthleteRequestCancelButton({ requestId }: { requestId: string }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  return (
    <button
      type="button"
      onClick={() =>
        startTransition(async () => {
          const response = await fetch(`/api/team/athletes/requests/${requestId}/cancel`, {
            method: 'POST',
          })
          if (response.ok) {
            router.refresh()
          }
        })
      }
      disabled={isPending}
      className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[var(--red)]/20 bg-[var(--red)]/10 px-5 text-[10px] font-black uppercase tracking-widest text-[var(--red)] transition-all hover:bg-[var(--red)]/15 disabled:opacity-60"
    >
      {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Ban className="h-4 w-4" />}
      Cancelar solicitacao
    </button>
  )
}
