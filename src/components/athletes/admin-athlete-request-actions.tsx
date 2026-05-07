'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, Loader2, ShieldCheck, XCircle } from 'lucide-react'
import { toast } from 'sonner'

type AdminAthleteRequestActionsProps = {
  requestId: string
  initialCbbCheckStatus: string
  initialCbbNotes: string | null
  initialCbbReference: string | null
  initialCbbDocumentMatch: boolean
  initialCbbNameMatch: boolean
  initialCbbBirthDateMatch: boolean
  currentStatus: string
}

const inputClassName =
  'w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm text-[var(--black)] outline-none transition-all focus:border-[var(--verde)]'

export function AdminAthleteRequestActions({
  requestId,
  initialCbbCheckStatus,
  initialCbbNotes,
  initialCbbReference,
  initialCbbDocumentMatch,
  initialCbbNameMatch,
  initialCbbBirthDateMatch,
  currentStatus,
}: AdminAthleteRequestActionsProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isActioned, setIsActioned] = useState(false)
  const [pendingAction, setPendingAction] = useState<'cbb' | 'approve' | 'reject' | null>(null)
  const [rejectionReason, setRejectionReason] = useState('')
  const [cbbNotes, setCbbNotes] = useState(initialCbbNotes ?? '')
  const [cbbReference, setCbbReference] = useState(initialCbbReference ?? '')
  const [cbbDocumentMatch, setCbbDocumentMatch] = useState(initialCbbDocumentMatch)
  const [cbbNameMatch, setCbbNameMatch] = useState(initialCbbNameMatch)
  const [cbbBirthDateMatch, setCbbBirthDateMatch] = useState(initialCbbBirthDateMatch)
  const [cbbCheckStatus, setCbbCheckStatus] = useState(initialCbbCheckStatus)
  const decisionEnabled =
    !isActioned && ['SUBMITTED', 'UNDER_REVIEW', 'CBB_CHECK_PENDING', 'CBB_CHECKED'].includes(currentStatus)
  const cbbEnabled = !['APPROVED', 'REJECTED', 'CANCELLED'].includes(currentStatus)

  const submitAction = async (url: string, body?: Record<string, unknown>) => {
    const response = await fetch(url, {
      method: 'POST',
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    })
    const data = await response.json()
    if (!response.ok) {
      throw new Error(data.error || 'Erro ao executar ação.')
    }
    return data
  }

  const handle = (kind: 'cbb' | 'approve' | 'reject') => {
    if (kind === 'reject' && !rejectionReason.trim()) {
      const message = 'Informe o motivo obrigatório para rejeitar a solicitação.'
      setError(message)
      setSuccess('')
      toast.error(message)
      return
    }

    setError('')
    setSuccess('')
    setPendingAction(kind)
    startTransition(async () => {
      try {
        if (kind === 'cbb') {
          await submitAction(`/api/admin/athletes/requests/${requestId}/cbb-check`, {
            cbbCheckStatus,
            cbbNotes,
            cbbReference,
            cbbDocumentMatch,
            cbbNameMatch,
            cbbBirthDateMatch,
          })
          const message = 'Conferência CBB atualizada com sucesso.'
          setSuccess(message)
          toast.success(message)
        }

        if (kind === 'approve') {
          await submitAction(`/api/admin/athletes/requests/${requestId}/approve`)
          const message = 'Solicitação aprovada e atleta federativo criado.'
          setSuccess(message)
          setIsActioned(true)
          toast.success(message)
        }

        if (kind === 'reject') {
          await submitAction(`/api/admin/athletes/requests/${requestId}/reject`, {
            rejectionReason: rejectionReason.trim(),
          })
          const message = 'Solicitação rejeitada com sucesso.'
          setSuccess(message)
          setIsActioned(true)
          toast.success(message)
        }

        router.refresh()
      } catch (actionError: any) {
        const message = actionError.message || 'Erro ao executar ação.'
        setError(message)
        toast.error(message)
      } finally {
        setPendingAction(null)
      }
    })
  }

  return (
    <div className="space-y-5">
      <div className="rounded-[24px] border border-[var(--border)] bg-[var(--gray-l)] p-5">
        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[var(--gray)]">Conferência CBB</p>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <select
            value={cbbCheckStatus}
            onChange={(event) => setCbbCheckStatus(event.target.value)}
            className={inputClassName}
          >
            <option value="PENDING">Pendente</option>
            <option value="CHECKED">Conferida</option>
          </select>
          <input
            className={inputClassName}
            placeholder="Referência da conferência"
            value={cbbReference}
            onChange={(event) => setCbbReference(event.target.value)}
          />
          <input
            className={`${inputClassName} md:col-span-2`}
            placeholder="Observações da CBB"
            value={cbbNotes}
            onChange={(event) => setCbbNotes(event.target.value)}
          />
        </div>
        <div className="mt-4 grid gap-2 md:grid-cols-3">
          {[
            ['Documento confere', cbbDocumentMatch, setCbbDocumentMatch],
            ['Nome confere', cbbNameMatch, setCbbNameMatch],
            ['Nascimento confere', cbbBirthDateMatch, setCbbBirthDateMatch],
          ].map(([label, value, setValue]) => (
            <label
              key={label as string}
              className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm text-[var(--gray)]"
            >
              <input
                type="checkbox"
                checked={Boolean(value)}
                onChange={(event) => (setValue as (value: boolean) => void)(event.target.checked)}
              />
              {label as string}
            </label>
          ))}
        </div>
        <button
          type="button"
          onClick={() => handle('cbb')}
          disabled={isPending || !cbbEnabled}
          className="mt-4 inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[var(--border)] bg-white px-5 text-[10px] font-black uppercase tracking-widest text-[var(--black)] transition-all hover:border-[var(--yellow)] disabled:opacity-60"
        >
          {isPending && pendingAction === 'cbb' ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ShieldCheck className="h-4 w-4" />
          )}
          {isPending && pendingAction === 'cbb' ? 'Salvando...' : 'Salvar conferência CBB'}
        </button>
      </div>

      <div className="rounded-[24px] border border-[var(--border)] bg-white p-5">
        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[var(--gray)]">Decisão da federação</p>
        <div className="mt-1">
          <textarea
            rows={4}
            className="mt-3 w-full rounded-2xl border border-[var(--border)] bg-[var(--gray-l)] px-4 py-3 text-sm text-[var(--black)] outline-none transition-all focus:border-[var(--red)]"
            placeholder="Motivo da rejeição *obrigatório para rejeitar"
            value={rejectionReason}
            onChange={(event) => setRejectionReason(event.target.value)}
          />
          <p className="mt-1 text-[10px] text-[var(--gray)]">
            * Obrigatório ao rejeitar. Não é necessário para aprovar.
          </p>
        </div>

        {error ? (
          <div className="mt-4 rounded-2xl border border-[var(--red)]/20 bg-[var(--red)]/10 px-4 py-3 text-sm font-bold text-[var(--red)]">
            {error}
          </div>
        ) : null}

        {success ? (
          <div className="mt-4 rounded-2xl border border-[var(--verde)]/20 bg-[var(--verde)]/10 px-4 py-3 text-sm font-bold text-[var(--verde)]">
            {success}
          </div>
        ) : null}

        {isActioned ? (
          <p className="mt-4 text-[10px] font-bold uppercase tracking-widest text-[var(--gray)]">
            Ação concluída. Atualize a página para ver o estado final.
          </p>
        ) : (
          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => handle('approve')}
              disabled={isPending || !decisionEnabled}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[var(--verde)] px-5 text-[10px] font-black uppercase tracking-widest text-white transition-all hover:bg-[#0f4627] disabled:opacity-60"
            >
              {isPending && pendingAction === 'approve' ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4" />
              )}
              {isPending && pendingAction === 'approve' ? 'Aprovando...' : 'Aprovar e criar atleta'}
            </button>
            <button
              type="button"
              onClick={() => handle('reject')}
              disabled={isPending || !decisionEnabled}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[var(--red)] px-5 text-[10px] font-black uppercase tracking-widest text-white transition-all hover:bg-[#a90d12] disabled:opacity-60"
            >
              {isPending && pendingAction === 'reject' ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <XCircle className="h-4 w-4" />
              )}
              {isPending && pendingAction === 'reject' ? 'Rejeitando...' : 'Rejeitar solicitação'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
