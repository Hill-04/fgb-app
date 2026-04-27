'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Save, Send } from 'lucide-react'
import { toast } from 'sonner'

type AthleteRequestFormData = {
  id?: string
  fullName: string
  birthDate: string
  documentNumber: string
  motherName?: string | null
  phone?: string | null
  email?: string | null
  requestedCategoryLabel?: string | null
  cbbRegistrationNumber?: string | null
  status?: string
}

type TeamAthleteRequestFormProps = {
  initialData?: AthleteRequestFormData
}

const inputClassName =
  'h-11 rounded-xl border border-[var(--border)] bg-white px-4 text-sm text-[var(--black)] outline-none transition-all focus:border-[var(--verde)]'

const labelClassName =
  'text-[10px] font-black uppercase tracking-[0.22em] text-[var(--gray)]'

export function TeamAthleteRequestForm({ initialData }: TeamAthleteRequestFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')
  const [pendingIntent, setPendingIntent] = useState<'draft' | 'submit' | null>(null)
  const [form, setForm] = useState<AthleteRequestFormData>({
    fullName: initialData?.fullName || '',
    birthDate: initialData?.birthDate || '',
    documentNumber: initialData?.documentNumber || '',
    motherName: initialData?.motherName || '',
    phone: initialData?.phone || '',
    email: initialData?.email || '',
    requestedCategoryLabel: initialData?.requestedCategoryLabel || '',
    cbbRegistrationNumber: initialData?.cbbRegistrationNumber || '',
    status: initialData?.status || 'DRAFT',
  })

  const isEditing = Boolean(initialData?.id)

  const validate = () => {
    if (!form.fullName.trim()) return 'Informe o nome completo do atleta.'
    if (!form.birthDate) return 'Informe a data de nascimento.'
    if (!form.documentNumber.trim()) return 'Informe CPF ou RG.'
    return ''
  }

  const submit = (intent: 'draft' | 'submit') => {
    const validationError = validate()
    if (validationError) {
      setError(validationError)
      toast.error(validationError)
      return
    }

    setError('')
    setPendingIntent(intent)
    startTransition(async () => {
      try {
        const isDraft = intent === 'draft'
        const body = {
          ...form,
          status: 'DRAFT',
        }

        let requestId = initialData?.id || null

        if (isEditing) {
          const update = await fetch(`/api/team/athletes/requests/${initialData?.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          })
          const updateData = await update.json()
          if (!update.ok) throw new Error(updateData.error || 'Erro ao salvar solicitação.')
          requestId = updateData.id
        } else {
          const create = await fetch('/api/team/athletes/requests', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          })
          const createData = await create.json()
          if (!create.ok) throw new Error(createData.error || 'Erro ao criar solicitação.')
          requestId = createData.id
        }

        if (!isDraft && requestId) {
          const submitResponse = await fetch(`/api/team/athletes/requests/${requestId}/submit`, {
            method: 'POST',
          })
          const submitData = await submitResponse.json()
          if (!submitResponse.ok) throw new Error(submitData.error || 'Erro ao enviar solicitação.')
          toast.success('Solicitação enviada para análise da federação.')
        } else {
          toast.success('Rascunho salvo com sucesso.')
        }

        router.push(requestId ? `/team/athletes/requests/${requestId}` : '/team/athletes/requests')
        router.refresh()
      } catch (submissionError: any) {
        const message = submissionError.message || 'Erro ao salvar solicitação.'
        setError(message)
        toast.error(message)
      } finally {
        setPendingIntent(null)
      }
    })
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-[var(--yellow)]/20 bg-[var(--yellow)]/10 px-4 py-4 text-sm text-[var(--black)]">
        Revise os dados com cuidado. O envio cria a fila oficial de análise da federação.
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2">
          <span className={labelClassName}>Nome completo</span>
          <input
            className={inputClassName}
            placeholder="Nome completo do atleta"
            value={form.fullName}
            onChange={(event) => setForm((current) => ({ ...current, fullName: event.target.value }))}
          />
        </label>
        <label className="space-y-2">
          <span className={labelClassName}>Data de nascimento</span>
          <input
            className={inputClassName}
            type="date"
            value={form.birthDate}
            onChange={(event) => setForm((current) => ({ ...current, birthDate: event.target.value }))}
          />
        </label>
        <label className="space-y-2">
          <span className={labelClassName}>CPF ou RG</span>
          <input
            className={inputClassName}
            placeholder="CPF / RG"
            value={form.documentNumber}
            onChange={(event) => setForm((current) => ({ ...current, documentNumber: event.target.value }))}
          />
        </label>
        <label className="space-y-2">
          <span className={labelClassName}>Nome da mãe</span>
          <input
            className={inputClassName}
            placeholder="Nome da mãe"
            value={form.motherName || ''}
            onChange={(event) => setForm((current) => ({ ...current, motherName: event.target.value }))}
          />
        </label>
        <label className="space-y-2">
          <span className={labelClassName}>Telefone</span>
          <input
            className={inputClassName}
            placeholder="Telefone"
            value={form.phone || ''}
            onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
          />
        </label>
        <label className="space-y-2">
          <span className={labelClassName}>E-mail</span>
          <input
            className={inputClassName}
            placeholder="E-mail"
            type="email"
            value={form.email || ''}
            onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
          />
        </label>
        <label className="space-y-2">
          <span className={labelClassName}>Categoria pretendida</span>
          <input
            className={inputClassName}
            placeholder="Categoria pretendida"
            value={form.requestedCategoryLabel || ''}
            onChange={(event) => setForm((current) => ({ ...current, requestedCategoryLabel: event.target.value }))}
          />
        </label>
        <label className="space-y-2">
          <span className={labelClassName}>Registro CBB</span>
          <input
            className={inputClassName}
            placeholder="Registro CBB (opcional)"
            value={form.cbbRegistrationNumber || ''}
            onChange={(event) => setForm((current) => ({ ...current, cbbRegistrationNumber: event.target.value }))}
          />
        </label>
      </div>

      {error ? (
        <div className="rounded-2xl border border-[var(--red)]/20 bg-[var(--red)]/10 px-4 py-3 text-sm font-bold text-[var(--red)]">
          {error}
        </div>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={() => submit('draft')}
          disabled={isPending}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[var(--border)] bg-white px-5 text-[10px] font-black uppercase tracking-widest text-[var(--gray)] transition-all hover:text-[var(--black)] disabled:opacity-60"
        >
          {isPending && pendingIntent === 'draft' ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {isPending && pendingIntent === 'draft' ? 'Salvando...' : 'Salvar rascunho'}
        </button>
        <button
          type="button"
          onClick={() => submit('submit')}
          disabled={isPending}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[var(--verde)] px-5 text-[10px] font-black uppercase tracking-widest text-white transition-all hover:bg-[#0f4627] disabled:opacity-60"
        >
          {isPending && pendingIntent === 'submit' ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
          {isPending && pendingIntent === 'submit' ? 'Enviando...' : 'Enviar solicitação'}
        </button>
      </div>
    </div>
  )
}
