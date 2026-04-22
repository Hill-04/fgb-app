'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CalendarClock, Loader2, Save } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

type AdminInvoiceEditFormProps = {
  invoiceId: string
  dueDate: string
  notes: string
  canEditDueDate: boolean
  canEditNotes: boolean
  lockedReason?: string
}

export function AdminInvoiceEditForm({
  invoiceId,
  dueDate,
  notes,
  canEditDueDate,
  canEditNotes,
  lockedReason,
}: AdminInvoiceEditFormProps) {
  const router = useRouter()
  const [nextDueDate, setNextDueDate] = useState(dueDate)
  const [nextNotes, setNextNotes] = useState(notes)
  const [submitting, setSubmitting] = useState(false)
  const canSubmit = canEditDueDate || canEditNotes

  async function submit() {
    setSubmitting(true)
    try {
      const response = await fetch(`/api/admin/financeiro/invoices/${invoiceId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...(canEditDueDate ? { dueDate: nextDueDate || null } : {}),
          ...(canEditNotes ? { notes: nextNotes } : {}),
        }),
      })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.error || 'Erro ao atualizar fatura.')

      toast.success('Fatura atualizada com auditoria.')
      router.refresh()
    } catch (error: any) {
      toast.error(error.message || 'Erro ao atualizar fatura.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="rounded-[30px] border border-[var(--border)] bg-white p-5 shadow-sm">
      <div className="mb-5 rounded-[24px] border border-yellow-100 bg-gradient-to-br from-yellow-50 to-white p-4">
        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-yellow-700">Controle administrativo</p>
        <h2 className="fgb-display mt-2 text-2xl leading-none text-[var(--black)]">Dados da fatura</h2>
        <p className="mt-2 text-xs font-semibold leading-5 text-[var(--gray)]">
          Edicao limitada pelo status atual, sempre registrada no historico oficial.
        </p>
      </div>

      {!canSubmit ? (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--gray-l)] p-4 text-sm font-semibold text-[var(--gray)]">
          {lockedReason || 'Esta fatura esta bloqueada para edicao administrativa.'}
        </div>
      ) : (
        <div className="grid gap-4">
          <div className="space-y-2">
            <Label>Vencimento</Label>
            <div className="relative">
              <CalendarClock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--gray)]" />
              <Input
                type="date"
                value={nextDueDate}
                disabled={!canEditDueDate}
                onChange={(event) => setNextDueDate(event.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Observacoes</Label>
            <Textarea
              value={nextNotes}
              disabled={!canEditNotes}
              onChange={(event) => setNextNotes(event.target.value)}
              rows={4}
              placeholder="Observacoes administrativas da fatura..."
            />
          </div>

          <Button onClick={submit} disabled={submitting} className="h-11 rounded-xl bg-[var(--black)] text-white hover:bg-black/85">
            {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Salvar alteracoes
          </Button>
        </div>
      )}
    </div>
  )
}
