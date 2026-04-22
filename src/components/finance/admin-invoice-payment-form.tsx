'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, Loader2, Ban, Send } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { centsFromCurrencyInput, formatCurrencyCentsBRL } from '@/lib/finance'

type AdminInvoicePaymentFormProps = {
  invoiceId: string
  status: string
  balanceCents: number
}

export function AdminInvoicePaymentForm({ invoiceId, status, balanceCents }: AdminInvoicePaymentFormProps) {
  const router = useRouter()
  const [amount, setAmount] = useState((balanceCents / 100).toFixed(2))
  const [reference, setReference] = useState('')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [actionLoading, setActionLoading] = useState<'issue' | 'void' | null>(null)

  const canPay = !['DRAFT', 'PAID', 'VOID'].includes(status) && balanceCents > 0
  const canIssue = status === 'DRAFT'
  const canVoid = status !== 'PAID' && status !== 'VOID'

  async function submitPayment() {
    const amountCents = centsFromCurrencyInput(amount)
    if (amountCents <= 0) {
      toast.error('Informe um valor valido.')
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch(`/api/admin/financeiro/invoices/${invoiceId}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amountCents, reference, notes, method: 'MANUAL' }),
      })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.error || 'Erro ao registrar baixa.')

      toast.success('Baixa registrada com sucesso.')
      router.refresh()
    } catch (error: any) {
      toast.error(error.message || 'Erro ao registrar baixa.')
    } finally {
      setSubmitting(false)
    }
  }

  async function runAction(action: 'issue' | 'void') {
    setActionLoading(action)
    try {
      const response = await fetch(`/api/admin/financeiro/invoices/${invoiceId}/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: action === 'void' ? JSON.stringify({ reason: 'Cancelamento manual pelo painel financeiro.' }) : undefined,
      })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.error || 'Erro ao atualizar fatura.')

      toast.success(action === 'issue' ? 'Fatura emitida.' : 'Fatura cancelada.')
      router.refresh()
    } catch (error: any) {
      toast.error(error.message || 'Erro ao atualizar fatura.')
    } finally {
      setActionLoading(null)
    }
  }

  return (
    <div className="space-y-4 rounded-[30px] border border-[var(--border)] bg-white p-5 shadow-sm">
      <div className="rounded-[24px] border border-red-100 bg-gradient-to-br from-red-50 to-white p-4">
        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[var(--red)]">Operacao financeira</p>
        <h2 className="fgb-display mt-2 text-2xl leading-none text-[var(--black)]">Baixa manual</h2>
        <p className="mt-2 text-xs font-semibold leading-5 text-[var(--gray)]">
          Saldo em aberto: <strong className="text-[var(--black)]">{formatCurrencyCentsBRL(balanceCents)}</strong>
        </p>
      </div>

      {canPay ? (
        <div className="grid gap-3">
          <div className="space-y-2">
            <Label>Valor pago</Label>
            <Input value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="0,00" />
          </div>
          <div className="space-y-2">
            <Label>Referencia</Label>
            <Input value={reference} onChange={(event) => setReference(event.target.value)} placeholder="Pix, recibo, comprovante..." />
          </div>
          <div className="space-y-2">
            <Label>Observacoes</Label>
            <Textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={3} />
          </div>
          <Button onClick={submitPayment} disabled={submitting} className="h-11 rounded-xl bg-[var(--verde)] text-white hover:bg-[var(--verde)]/90">
            {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
            Registrar baixa
          </Button>
        </div>
      ) : (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--gray-l)] p-4 text-sm font-semibold text-[var(--gray)]">
          Esta fatura nao possui saldo disponivel para baixa manual no status atual.
        </div>
      )}

      <div className="grid gap-2 sm:grid-cols-2">
        <Button variant="outline" disabled={!canIssue || actionLoading === 'issue'} onClick={() => runAction('issue')} className="rounded-xl bg-white">
          {actionLoading === 'issue' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
          Emitir
        </Button>
        <Button variant="outline" disabled={!canVoid || actionLoading === 'void'} onClick={() => runAction('void')} className="rounded-xl bg-white text-red-700 hover:bg-red-50">
          {actionLoading === 'void' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Ban className="mr-2 h-4 w-4" />}
          Cancelar
        </Button>
      </div>
    </div>
  )
}
