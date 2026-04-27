'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, Loader2, ShieldCheck, XCircle } from 'lucide-react'

type AdminAthleteRequestActionsProps = {
  requestId: string
  initialCbbCheckStatus: string
  currentStatus: string
}

const inputClassName =
  'w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm text-[var(--black)] outline-none transition-all focus:border-[var(--verde)]'

export function AdminAthleteRequestActions({
  requestId,
  initialCbbCheckStatus,
  currentStatus,
}: AdminAthleteRequestActionsProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [rejectionReason, setRejectionReason] = useState('')
  const [cbbNotes, setCbbNotes] = useState('')
  const [cbbReference, setCbbReference] = useState('')
  const [cbbDocumentMatch, setCbbDocumentMatch] = useState(false)
  const [cbbNameMatch, setCbbNameMatch] = useState(false)
  const [cbbBirthDateMatch, setCbbBirthDateMatch] = useState(false)
  const [cbbCheckStatus, setCbbCheckStatus] = useState(initialCbbCheckStatus)
  const decisionEnabled = ['SUBMITTED', 'UNDER_REVIEW', 'CBB_CHECK_PENDING', 'CBB_CHECKED'].includes(currentStatus)
  const cbbEnabled = !['APPROVED', 'REJECTED', 'CANCELLED'].includes(currentStatus)

  const submitAction = async (url: string, body?: Record<string, unknown>) => {
    const response = await fetch(url, {
      method: 'POST',
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    })
    const data = await response.json()
    if (!response.ok) {
      throw new Error(data.error || 'Erro ao executar acao.')
    }
    return data
  }

  const handle = (kind: 'cbb' | 'approve' | 'reject') => {
    setError('')
    setSuccess('')
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
          setSuccess('Conferencia CBB atualizada com sucesso.')
        }

        if (kind === 'approve') {
          await submitAction(`/api/admin/athletes/requests/${requestId}/approve`)
          setSuccess('Solicitacao aprovada e atleta federativo criado.')
        }

        if (kind === 'reject') {
          await submitAction(`/api/admin/athletes/requests/${requestId}/reject`, { rejectionReason })
          setSuccess('Solicitacao rejeitada com sucesso.')
        }

        router.refresh()
      } catch (actionError: any) {
        setError(actionError.message || 'Erro ao executar acao.')
      }
    })
  }

  return (
    <div className="space-y-5">
      <div className="rounded-[24px] border border-[var(--border)] bg-[var(--gray-l)] p-5">
        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[var(--gray)]">Conferencia CBB</p>
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
            placeholder="Referencia da conferencia"
            value={cbbReference}
            onChange={(event) => setCbbReference(event.target.value)}
          />
          <input
            className={`${inputClassName} md:col-span-2`}
            placeholder="Observacoes da CBB"
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
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
          Salvar conferencia CBB
        </button>
      </div>

      <div className="rounded-[24px] border border-[var(--border)] bg-white p-5">
        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[var(--gray)]">Decisao da federacao</p>
        <textarea
          rows={4}
          className="mt-4 w-full rounded-2xl border border-[var(--border)] bg-[var(--gray-l)] px-4 py-3 text-sm text-[var(--black)] outline-none transition-all focus:border-[var(--red)]"
          placeholder="Motivo da rejeicao, se necessario"
          value={rejectionReason}
          onChange={(event) => setRejectionReason(event.target.value)}
        />

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

        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => handle('approve')}
            disabled={isPending || !decisionEnabled}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[var(--verde)] px-5 text-[10px] font-black uppercase tracking-widest text-white transition-all hover:bg-[#0f4627] disabled:opacity-60"
          >
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
            Aprovar e criar atleta
          </button>
          <button
            type="button"
            onClick={() => handle('reject')}
            disabled={isPending || !decisionEnabled}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[var(--red)] px-5 text-[10px] font-black uppercase tracking-widest text-white transition-all hover:bg-[#a90d12] disabled:opacity-60"
          >
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
            Rejeitar solicitacao
          </button>
        </div>
      </div>
    </div>
  )
}
